/**
 * Get mock status (for banner display)
 * @returns {Promise<{isMock: boolean, useMockDb: boolean, useMockVoipms: boolean}>}
 */
export async function getMockStatus() {
  return await window.electronAPI.getMockStatus();
}

/**
 * Get all conversations
 * @param {Object} filters - Optional filters (e.g., { account_id: 1 })
 * @returns {Promise<Array>}
 */
export async function getConversations(filters = {}) {
  return await window.electronAPI.getConversations(filters);
}

/**
 * Get single conversation by ID
 * @param {number} id - Conversation ID
 * @returns {Promise<Object|null>}
 */
export async function getConversationById(id) {
  return await window.electronAPI.getConversationById(id);
}

/**
 * Get messages for a conversation
 * @param {number} conversationId - Conversation ID
 * @param {Object} options - Optional { limit, offset }
 * @returns {Promise<Array>}
 */
export async function getMessages(conversationId, options = {}) {
  return await window.electronAPI.getMessages(conversationId, options);
}

/**
 * Send a message
 * @param {number} conversationId - Conversation ID
 * @param {string} content - Message text
 * @returns {Promise<Object>}
 */
export async function sendMessage(conversationId, content) {
  return await window.electronAPI.sendMessage(conversationId, content);
}