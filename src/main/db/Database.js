// src/main/db/Database.js

/**
 * Abstract database interface defining the contract for database implementations.
 * 
 * NOT CURRENTLY USED/ENFORCED (August 2, 2026)
 * 
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
  // Accounts (DIDs)
  // =========================================

  /**
   * Get all accounts (DIDs)
   * @returns {Promise<Array>} Array of account objects
   */
  getAccounts() {
    throw new Error('getAccounts() must be implemented');
  }

  /**
   * Add a new account
   * @param {Object} account - Account data
   * @returns {Promise<Object>} Created account with ID
   */
  addAccount(account) {
    throw new Error('addAccount() must be implemented');
  }

  /**
   * Update an existing account
   * @param {number} id - Account ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated account or null if not found
   */
  updateAccount(id, updates) {
    throw new Error('updateAccount() must be implemented');
  }

  /**
   * Delete an account
   * @param {number} id - Account ID
   * @returns {Promise<void>}
   */
  deleteAccount(id) {
    throw new Error('deleteAccount() must be implemented');
  }

  /**
   * Sync accounts with Voip.ms DIDs
   * - Add new DIDs that don't exist locally
   * - Update existing DIDs
   * - Delete DIDs that no longer exist on Voip.ms
   * @param {Array} didsFromVoipms - Array of DID objects from Voip.ms API
   * @returns {Promise<void>}
   */
  syncAccounts(didsFromVoipms) {
    throw new Error('syncAccounts() must be implemented');
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

  getOrCreateConversation(did, contact) {
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

  getSentCountToday(did) {
    throw new Error('getSentCountToday() must be implemented');
  }
}