/**
 * Get mock status (for banner display)
 * @returns {Promise<{isMock: boolean, useMockDb: boolean, useMockVoipms: boolean}>}
 */
export async function getMockStatus() {
  return await window.electronAPI.getMockStatus();
}

/**
 * Get contact by phone number from database
 * @param {string} phoneNumber - Contact phone number
 * @returns {Promise<Object|null>}
 */
export async function getContactDb(phoneNumber) {
  return await window.electronAPI.getContactDb(phoneNumber);
}

/**
 * Get messages from database with optional filtering
 * @param {Object} options - Filter { did_id, contact_number, limit, orderBy }
 * @returns {Promise<Array>}
 */
export async function getMessagesDb(options = {}) {
  return await window.electronAPI.getMessagesDb(options);
}