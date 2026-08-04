// src/main/voipms/VoipMsService.js

/**
 * VoipMsService - Orchestrates Voip.ms API calls and database synchronization
 * 
 * This service layer handles all communication with the Voip.ms API through
 * the VoipMsClient, transforms responses to our internal format, and syncs
 * data to the local database for fast UI access.
 * 
 * @class
 */
export class VoipMsService {

  /**
   * Create a VoipMsService instance
   * @param {VoipMsClient} voipMsClient - Client for Voip.ms API calls
   * @param {Database} database - Database instance for local storage
   */
  constructor(voipMsClient, database) {
    this.client = voipMsClient;
    this.database = database;
  }

  /**
   * Test connection to Voip.ms API with provided credentials
   * @param {Object} [credentials] - Optional credentials override
   * @param {string} credentials.username - Voip.ms API username
   * @param {string} credentials.password - Voip.ms API password
   * @returns {Promise<{success: boolean, message: string}>} Connection test result
   */
  async testConnection(credentials = null) {
    return this.client.testConnection(credentials);
  }

  // =========================================
  // DIDs
  // =========================================

  /**
   * Get DIDs from Voip.ms API and sync to local database
   * @param {Object} [credentials] - Optional credentials override
   * @param {string} credentials.username - Voip.ms API username
   * @param {string} credentials.password - Voip.ms API password
   * @returns {Promise<Array>} Array of DID objects from API
   */
  async getDids(credentials = null) {
    // Fetch from API
    const dids = await this.client.getDids(credentials);

    // Sync to database
    if (this.database) {
      this.database.syncDids(dids);
    }

    // Return for UI
    return dids;
  }

  // =========================================
  // Messages
  // =========================================

  /**
   * Get messages from Voip.ms API with smart date range and sync to local database
   * 
   * Date range logic:
   * - Initial sync (no prior sync): Fetch last 90 days
   * - Subsequent sync: Fetch from (last sync time - 1 hour buffer) to now
   * 
   * The 1-hour buffer accounts for API call duration and ensures no messages
   * are missed between syncs. Duplicate messages are prevented by the database's
   * UNIQUE constraint on (message_id, did_id).
   * 
   * @param {Object} [options] - Optional query parameters
   * @param {string} [options.from] - Start date (YYYY-MM-DD). Auto-calculated if omitted.
   * @param {string} [options.to] - End date (YYYY-MM-DD). Defaults to today.
   * @param {string} [options.timezone] - Timezone offset (e.g., '-5'). Auto-calculated if omitted.
   * @param {string} [options.limit] - Max messages to fetch. Defaults to '100000'.
   * @returns {Promise<Array>} Array of transformed message objects
   */
  async getMessages(options = {}) {
    // Capture sync timestamp BEFORE API call (accounts for API delay)
    const currentSyncTimestamp = Date.now();

    // Calculate date range
    const lastSyncTimestamp = this.database.getSetting('last_message_sync');
    const { from, to } = this._calculateDateRange(lastSyncTimestamp);

    // Get timezone offset (e.g., -5 for EST, -8 for PST)
    const timezone = this._getTimezoneOffset();

    // Fetch from API
    const messages = await this.client.getMessages({
      from,
      to,
      timezone,
      limit: '100000',
      ...options
    });

    // Transform API response to our format
    const transformed = this._transformMessages(messages);

    // Resolve DIDs (lookup existing or auto-add missing)
    const allDids = this.database.getDids();
    const didMap = {};
    allDids.forEach(d => {
      didMap[d.did] = d.id;
    });

    const messagesWithDidId = transformed.map(msg => {
      let didId = didMap[msg.did];

      if (!didId) {
        // DID not in DB, add it automatically
        const newDid = this.database.addDid({
          did: msg.did,
          sms_enabled: 1,
          mms_available: 1
        });
        didId = newDid.id;
        didMap[msg.did] = didId;
      }

      return {
        ...msg,
        did_id: didId
      };
    });

    // Sync to database
    if (this.database) {
      this.database.saveMessages(messagesWithDidId);
      this.database.setSetting('last_message_sync', currentSyncTimestamp);
    }

    // Return for UI
    return messagesWithDidId;
  }

  async sendMessage(params) {
    return this.client.sendMessage(params);
  }


  // =========================================
  // Helpers (Private methods)
  // =========================================

  /**
   * Calculate date range for message sync
   * 
   * - Initial sync (no prior sync): Fetch last 90 days
   * - Subsequent sync: Fetch from (last sync time - 1 hour buffer) to now
   * 
   * The 1-hour buffer accounts for API call duration and ensures no messages
   * are missed between syncs.
   * 
   * @private
   * @param {number|null} lastSyncTimestamp - Unix timestamp of last successful sync, or null for initial sync
   * @returns {{from: string, to: string}} Date range in YYYY-MM-DD format (Voip.ms API format)
   */
  _calculateDateRange(lastSyncTimestamp) {
    const now = new Date();
    let fromDate;

    if (!lastSyncTimestamp) {
      // Initial sync: 90 days ago
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 90);
    } else {
      // Subsequent sync: Last sync minus 1 hour buffer
      fromDate = new Date(lastSyncTimestamp);
      fromDate.setHours(fromDate.getHours() - 1);
    }

    const toDate = now;

    // Format as YYYY-MM-DD (Voip.ms API format)
    const from = fromDate.toISOString().split('T')[0];
    const to = toDate.toISOString().split('T')[0];

    return { from, to };
  }

  /**
   * Get user's timezone offset in hours
   * 
   * Calculates the offset from UTC based on the system's local timezone.
   * For example: -5 for EST, -8 for PST, +1 for CET.
   * 
   * @private
   * @returns {string} Timezone offset as string (e.g., '-5', '-8', '+1')
   */
  _getTimezoneOffset() {
    // getTimezoneOffset() returns minutes opposite of what we want
    // e.g., EST returns +300, but Voip.ms expects -5
    const offsetMinutes = new Date().getTimezoneOffset();
    const offsetHours = -offsetMinutes / 60;

    // Format as string (e.g., -5 → '-5', 5.5 → '5.5')
    return String(offsetHours);
  }

  /**
 * Transform Voip.ms API message format to our internal format
 * 
 * Converts API response fields to match our database schema:
 * - type ('0'/'1') → direction ('outbound'/'inbound')
 * - date ('YYYY-MM-DD HH:MM:SS') → timestamp (Unix epoch)
 * - media array → JSON string for storage
 * - Preserves: id, contact, message, carrier_status
 * 
 * Note: This method does NOT resolve did_id from the database.
 * The caller must add did_id before syncing to the database.
 * 
 * @private
 * @param {Array} messages - Raw message array from Voip.ms API
 * @returns {Array} Transformed message objects ready for database sync
 */
  _transformMessages(messages) {
    return messages.map(msg => ({
      message_id: msg.id,
      did: msg.did,  // DID number as string; resolved to did_id by caller
      direction: msg.type === '1' ? 'inbound' : 'outbound',
      contact_number: msg.contact,
      message_body: msg.message,
      timestamp: this._parseDateToTimestamp(msg.date),
      carrier_status: msg.carrier_status,
      media_urls: JSON.stringify(msg.media || []),
      is_read: 0
    }));
  }

  /**
   * Parse Voip.ms date string to Unix timestamp
   * 
   * Converts 'YYYY-MM-DD HH:MM:SS' format to Unix epoch (seconds since 1970).
   * The date string is treated as local time (not UTC).
   * 
   * @private
   * @param {string} dateString - Date in 'YYYY-MM-DD HH:MM:SS' format
   * @returns {number} Unix timestamp in seconds
   */
  _parseDateToTimestamp(dateString) {
    // Parse 'YYYY-MM-DD HH:MM:SS' as local time
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Create Date object (local time)
    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    // Return Unix timestamp in seconds (not milliseconds)
    return Math.floor(date.getTime() / 1000);
  }
}