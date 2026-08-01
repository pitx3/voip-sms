/**
 * Conversation state management
 * Pure logic, no DOM manipulation
 */

// State
let selectedConversationId = null;
let currentMessages = [];

/**
 * Get currently selected conversation ID
 * @returns {number|null}
 */
export function getSelectedConversationId() {
  return selectedConversationId;
}

/**
 * Set selected conversation ID
 * @param {number|null} id
 */
export function setSelectedConversationId(id) {
  selectedConversationId = id;
}

/**
 * Get current messages array
 * @returns {Array}
 */
export function getCurrentMessages() {
  return currentMessages;
}

/**
 * Set current messages array
 * @param {Array} messages
 */
export function setCurrentMessages(messages) {
  currentMessages = messages;
}

/**
 * Calculate total unread count from conversations
 * @param {Array} conversations
 * @returns {number}
 */
export function getTotalUnreadCount(conversations) {
  return conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
}

/**
 * Format contact display name (name or phone number)
 * @param {Object} conversation
 * @param {Function} formatPhoneNumber - utility function
 * @returns {string}
 */
export function getContactDisplayName(conversation, formatPhoneNumber) {
  return conversation.contact_name || formatPhoneNumber(conversation.contact_number);
}

/**
 * Format contact display with both name and number
 * @param {Object} conversation
 * @param {Function} formatPhoneNumber
 * @returns {string} e.g., "John Doe - (555) 123-4567"
 */
export function getContactDisplayString(conversation, formatPhoneNumber) {
  const name = conversation.contact_name;
  const number = formatPhoneNumber(conversation.contact_number);
  
  if (name) {
    return `${name} - ${number}`;
  }
  return number;
}