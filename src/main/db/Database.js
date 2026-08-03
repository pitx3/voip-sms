// src/main/db/Database.js

/**
 * Abstract database interface defining the contract for database implementations.
 *  
 * NOT CURRENTLY ENFORCED (August 2, 2026)
 * Classes extend this but TypeScript would be better for true interface enforcement.
 */
export class Database {
  /**
   * Initialize the database (run migrations, create tables, etc.)
   * @returns {Promise<Database>} this
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
   * Update an existing DID
   * @param {number} id - DID ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated DID or null if not found
   */
  updateDid(id, updates) {
    throw new Error('updateDid() must be implemented');
  }

  /**
   * Delete a DID
   * @param {number} id - DID ID
   * @returns {Promise<void>}
   */
  deleteDid(id) {
    throw new Error('deleteDid() must be implemented');
  }

  /**
   * Sync DIDs with Voip.ms API
   * - Add new DIDs that don't exist locally
   * - Update existing DIDs
   * - Delete DIDs that no longer exist on Voip.ms
   * @param {Array} didsFromVoipms - Array of DID objects from Voip.ms API
   * @returns {Promise<void>}
   */
  syncDids(didsFromVoipms) {
    throw new Error('syncDids() must be implemented');
  }

  // =========================================
  // Conversations
  // =========================================

  getConversations(filters) {
    throw new Error('getConversations() must be implemented');
  }

  getConversationById(id) {
    throw new Error('getConversationById() must be implemented');
  }

  getOrCreateConversation(didId, contact) {
    throw new Error('getOrCreateConversation() must be implemented');
  }

  updateConversation(id, updates) {
    throw new Error('updateConversation() must be implemented');
  }

  deleteConversation(id) {
    throw new Error('deleteConversation() must be implemented');
  }

  // =========================================
  // Messages
  // =========================================

  getMessages(conversationId, options) {
    throw new Error('getMessages() must be implemented');
  }

  addMessage(message) {
    throw new Error('addMessage() must be implemented');
  }

  markMessagesRead(conversationId) {
    throw new Error('markMessagesRead() must be implemented');
  }

  // =========================================
  // Attachments
  // =========================================

  addAttachment(attachment) {
    throw new Error('addAttachment() must be implemented');
  }

  getAttachmentsForMessage(messageId) {
    throw new Error('getAttachmentsForMessage() must be implemented');
  }

  // =========================================
  // Sent Messages Log
  // =========================================

  logSentMessage(sentMessage) {
    throw new Error('logSentMessage() must be implemented');
  }

  getSentCountToday(didId) {
    throw new Error('getSentCountToday() must be implemented');
  }
}