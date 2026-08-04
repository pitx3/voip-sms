// src/main/db/MockDatabase.js

import { Database } from './Database.js';

/**
 * In-memory mock database for testing and development.
 */
export default class MockDatabase extends Database {
  constructor() {
    super();

    // Mock DIDs
    this.mockDids = [
      { id: 1, did: '4145551234', sms_enabled: 1, mms_available: 1 },
      { id: 2, did: '7205551984', sms_enabled: 1, mms_available: 1 }
    ];

    // Mock Messages (uses did_id to match our schema)
    this.mockMessages = [
      {
        id: 1,
        did_id: 1,
        message_id: '10001',
        direction: 'inbound',
        contact_number: '2145559876',
        message_body: 'Thanks for your payment! We posted it to your account.',
        timestamp: Math.floor(Date.now() / 1000) - 86400,  // 1 day ago
        carrier_status: 'received',
        media_urls: '[]',
        is_read: 0
      },
      {
        id: 2,
        did_id: 1,
        message_id: '10002',
        direction: 'outbound',
        contact_number: '2145559876',
        message_body: 'STOP',
        timestamp: Math.floor(Date.now() / 1000) - 86000,
        carrier_status: 'Message delivered to handset.',
        media_urls: '[]',
        is_read: 1
      },
      {
        id: 3,
        did_id: 2,
        message_id: '10003',
        direction: 'inbound',
        contact_number: '7655558524',
        message_body: 'Saturday should work for everyone.',
        timestamp: Math.floor(Date.now() / 1000) - 3600,  // 1 hour ago
        carrier_status: 'received',
        media_urls: '[]',
        is_read: 0
      }
    ];

    this.contacts = [
      {
        id: 1,
        name: 'Mom',
        phone_number: '2145559876',
        notes: ''
      },
      {
        id: 2,
        name: 'John Doe',
        phone_number: '7655558524',
        notes: 'Work contact'
      },
      {
        id: 3,
        name: 'Rocket Mortgage',
        phone_number: '21493',
        notes: 'Automated alerts'
      }
    ];

    // Settings
    this.settings = {};
  }

  async init() {
    // No-op for mock
    return this;
  }

  async close() {
    // No-op for mock
  }

  // =========================================
  // DIDs
  // =========================================

  getDids() {
    return [...this.mockDids];
  }

  addDid(did) {
    const newDid = {
      id: this.mockDids.length + 1,
      ...did
    };
    this.mockDids.push(newDid);
    return newDid;
  }

  syncDids(didsFromVoipms) {
    this.mockDids = didsFromVoipms.map((did, index) => ({
      id: index + 1,
      ...did
    }));
  }

  // =========================================
  // Settings
  // =========================================

  getSetting(key) {
    return this.settings[key] || null;
  }

  setSetting(key, value) {
    this.settings[key] = value;
  }

  // =========================================
  // Messages
  // =========================================

  /**
   * Sync messages to mock database (upsert by message_id + did_id)
   * @param {Array} messages - Array of message objects with did_id
   * @returns {{synced: number, new: number}} Sync statistics
   */
  syncMessages(messages) {
    let newCount = 0;

    for (const msg of messages) {
      const existingIndex = this.mockMessages.findIndex(
        m => m.message_id === msg.message_id && m.did_id === msg.did_id
      );

      if (existingIndex === -1) {
        this.mockMessages.push(msg);
        newCount++;
      } else {
        this.mockMessages[existingIndex] = msg;
      }
    }

    return {
      synced: messages.length,
      new: newCount
    };
  }

  // MockDatabase.js
  getMessages(options = {}) {
    let results = [...this.mockMessages];

    if (options.did_id) {
      results = results.filter(m => m.did_id === options.did_id);
    }

    if (options.contact_number) {
      results = results.filter(m => m.contact_number === options.contact_number);
    }

    const orderBy = options.orderBy === 'ASC' ? 1 : -1;
    results.sort((a, b) => orderBy * (a.timestamp - b.timestamp));

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  // =========================================
  // Contacts
  // =========================================
  /**
   * Get a contact by phone number
   * @param {string} phoneNumber - Contact phone number
   * @returns {Object|null} Contact object or null if not found
   */
  getContact(phoneNumber) {
    return this.contacts.find(c => c.phone_number === phoneNumber) || null;
  }
}