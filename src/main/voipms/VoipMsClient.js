// src/main/voipms/VoipMsClient.js

/**
 * VoipMsClient Interface
 * Defines the contract for Voip.ms API clients.
 * 
 */
export class VoipMsClient {
  /**
   * Test connection to Voip.ms API
   * @param {Object} [credentials] - Optional credentials for testing
   * @param {string} credentials.username - Voip.ms API username
   * @param {string} credentials.password - Voip.ms API password
   * @returns {Promise<{ success: boolean, message: string }>} Connection result
   */
  async testConnection() {
    throw new Error('Method testConnection() must be implemented');
  }

  /**
   * Get all DIDs (phone numbers)
   * @param {Object} [credentials] - Optional credentials (uses stored if not provided)
   * @returns {Promise<Array>} Array of DID objects
   * @property {string} did - Phone number
   * @property {string} description - DID description/location
   * @property {string} sms_enabled - Whether SMS is enabled ("1" or "0")
   * @property {number} mms_available - Whether MMS is available (1 or 0)
   */
  async getDIDs() {
    throw new Error('Method getDIDs() must be implemented');
  }

  /**
   * Get messages from Voip.ms
   * @param {Object} [options] - Query options (date range, DID filter, etc.)
   * @returns {Promise<Array>} Array of message objects
   */
  async getMessages(options = {}) {
    throw new Error('Method getMessages() must be implemented');
  }

  /**
   * Send a message via Voip.ms
   * @param {Object} params - Send parameters
   * @param {string} params.did - DID to send from
   * @param {string} params.to - Recipient phone number
   * @param {string} params.message - Message content
   * @returns {Promise<Object>} Send result
   */
  async sendMessage(params) {
    throw new Error('Method sendMessage() must be implemented');
  }
}