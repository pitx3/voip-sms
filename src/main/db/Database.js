// src/main/db/Database.js

/**
 * Abstract database interface defining the contract for database implementations.
 */
export class Database {
  /**
   * Initialize the database (run migrations, create tables, etc.)
   * @returns {Promise<this>}
   */
  async init() {
    throw new Error('init() must be implemented');
  }

  /**
   * Close the database connection
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() must be implemented');
  }

  // =========================================
  // DIDs
  // =========================================

  /**
   * Get all DIDs (phone numbers)
   * @returns {Promise<Array>} Array of DID objects
   */
  getDids() {
    throw new Error('getDids() must be implemented');
  }

  /**
   * Add a new DID
   * @param {Object} did - DID data
   * @returns {Promise<Object>} Created DID with ID
   */
  addDid(did) {
    throw new Error('addDid() must be implemented');
  }

  /**
   * Sync DIDs with Voip.ms API
   * @param {Array} didsFromVoipms - Array of DID objects from Voip.ms API
   * @returns {Promise<void>}
   */
  syncDids(didsFromVoipms) {
    throw new Error('syncDids() must be implemented');
  }

  // =========================================
  // Settings
  // =========================================

  /**
   * Get a setting value by key
   * @param {string} key - Setting key
   * @returns {Promise<string|null>} Setting value or null if not found
   */
  getSetting(key) {
    throw new Error('getSetting() must be implemented');
  }

  /**
   * Set a setting value (insert or update)
   * @param {string} key - Setting key
   * @param {string} value - Setting value
   * @returns {Promise<void>}
   */
  setSetting(key, value) {
    throw new Error('setSetting() must be implemented');
  }

  // =========================================
  // Messages
  // =========================================

  // Database.js - Add this to the Messages section

  /**
   * Get messages from database with optional filtering
   * @param {Object} [options] - Filter options
   * @param {number} [options.did_id] - Filter by DID ID
   * @param {string} [options.contact_number] - Filter by contact number
   * @param {number} [options.limit] - Max messages to return
   * @param {string} [options.orderBy] - Sort order ('ASC' or 'DESC', default 'DESC')
   * @returns {Array} Array of message objects
   */
  getMessages(options = {}) {
    throw new Error('getMessages() must be implemented');
  }

  /**
   * Sync messages to database (upsert by message_id + did_id)
   * @param {Array} messages - Array of message objects with did_id
   * @returns {{synced: number, new: number}} Sync statistics
   */
  syncMessages(messages) {
    throw new Error('syncMessages() must be implemented');
  }

  // =========================================
  // Contacts
  // =========================================

  /**
   * Get a contact by phone number
   * @param {string} phoneNumber - Contact phone number
   * @returns {Object|null} Contact object or null if not found
   */
  async getContact(phoneNumber) {
    throw new Error('getContact() must be implemented');
  }
}