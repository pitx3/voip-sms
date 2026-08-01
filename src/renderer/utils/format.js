// src/renderer/utils/format.js

/**
 * Format phone number for display
 * @param {string} number - Phone number (e.g., '+15551234567')
 * @returns {string} Formatted number (e.g., '(555) 123-4567')
 */
export function formatPhoneNumber(number) {
  const cleaned = number.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return number;
}

/**
 * Format message timestamp for display
 * @param {string} timestamp - ISO timestamp (e.g., '2026-07-31 14:30:00')
 * @returns {string} Formatted time (e.g., '2:30 PM')
 */
export function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
