// src/main/db/MockDatabase.js

import { Database } from './Database.js';

export default class MockDatabase extends Database {
  constructor() {
    super();
    this.dids = [
      { id: 1, did: '+15551234567', name: 'My Main DID', description: '', sms_enabled: 1, mms_available: 1, last_sync_date: null, created_at: '2026-07-01 00:00:00', updated_at: '2026-07-01 00:00:00' }
    ];
    this.conversations = [
      { id: 1, did_id: 1, contact_number: '+15559998888', contact_name: 'John Doe', last_message_date: '2026-07-31 14:30:00', last_message_text: 'Hey, are we still on for lunch?', unread_count: 2, is_deleted: 0, is_archived: 0, created_at: '2026-07-15 00:00:00', updated_at: '2026-07-31 14:30:00' },
      { id: 2, did_id: 1, contact_number: '+15557776666', contact_name: 'Jane Smith', last_message_date: '2026-07-31 12:15:00', last_message_text: 'Thanks for the info!', unread_count: 0, is_deleted: 0, is_archived: 0, created_at: '2026-07-10 00:00:00', updated_at: '2026-07-31 12:15:00' },
      { id: 3, did_id: 1, contact_number: '+15555555555', contact_name: null, last_message_date: '2026-07-30 09:00:00', last_message_text: 'Your verification code is 123456', unread_count: 1, is_deleted: 0, is_archived: 0, created_at: '2026-07-30 00:00:00', updated_at: '2026-07-30 09:00:00' }
    ];
    this.messages = [
      { id: 1, conversation_id: 1, voipms_id: 'msg1', direction: 'inbound', type: 'sms', content: 'Hey!', timestamp: '2026-07-31 14:28:00', carrier_status: 'delivered', is_deleted: 0, is_read: 1, created_at: '2026-07-31 14:28:00' },
      { id: 2, conversation_id: 1, voipms_id: 'msg2', direction: 'inbound', type: 'sms', content: 'Are we still on for lunch?', timestamp: '2026-07-31 14:29:00', carrier_status: 'delivered', is_deleted: 0, is_read: 1, created_at: '2026-07-31 14:29:00' },
      { id: 3, conversation_id: 1, voipms_id: 'msg3', direction: 'outbound', type: 'sms', content: 'Yeah, definitely!', timestamp: '2026-07-31 14:30:00', carrier_status: 'delivered', is_deleted: 0, is_read: 1, created_at: '2026-07-31 14:30:00' },
      { id: 4, conversation_id: 1, voipms_id: 'msg4', direction: 'inbound', type: 'sms', content: 'Hey, are we still on for lunch?', timestamp: '2026-07-31 14:30:00', carrier_status: 'delivered', is_deleted: 0, is_read: 0, created_at: '2026-07-31 14:30:00' },
      { id: 5, conversation_id: 2, voipms_id: 'msg5', direction: 'outbound', type: 'sms', content: 'Here is the info you requested', timestamp: '2026-07-31 12:10:00', carrier_status: 'delivered', is_deleted: 0, is_read: 1, created_at: '2026-07-31 12:10:00' },
      { id: 6, conversation_id: 2, voipms_id: 'msg6', direction: 'inbound', type: 'sms', content: 'Thanks for the info!', timestamp: '2026-07-31 12:15:00', carrier_status: 'delivered', is_deleted: 0, is_read: 1, created_at: '2026-07-31 12:15:00' },
      { id: 7, conversation_id: 3, voipms_id: 'msg7', direction: 'inbound', type: 'sms', content: 'Your verification code is 123456', timestamp: '2026-07-30 09:00:00', carrier_status: 'delivered', is_deleted: 0, is_read: 0, created_at: '2026-07-30 09:00:00' }
    ];
    this.attachments = [];
    this.sent_messages_log = [];
  }

  async init() { return this; }
  async close() { }

  // =========================================
  // DIDs
  // =========================================

  getDids() { return [...this.dids]; }

  addDid(did) {
    const newDid = { ...did, id: this.dids.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.dids.push(newDid);
    return newDid;
  }

  updateDid(id, updates) {
    const idx = this.dids.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.dids[idx] = { ...this.dids[idx], ...updates, updated_at: new Date().toISOString() };
    return this.dids[idx];
  }

  deleteDid(id) {
    const idx = this.dids.findIndex(d => d.id === id);
    if (idx === -1) return;
    this.dids.splice(idx, 1);
  }

  syncDids(didsFromVoipms) {
    const existingDids = this.getDids();
    const existingDidMap = new Map(existingDids.map(d => [d.did, d]));

    const voipmsDidSet = new Set();

    // Add or update each DID from Voip.ms
    for (const did of didsFromVoipms) {
      voipmsDidSet.add(did.did);

      const existing = existingDidMap.get(did.did);
      if (existing) {
        // Update existing DID
        this.updateDid(existing.id, {
          name: did.name || existing.name,
          description: did.description || existing.description,
          sms_enabled: did.sms_enabled ?? existing.sms_enabled,
          mms_available: did.mms_available ?? existing.mms_available,
          last_sync_date: new Date().toISOString()
        });
      } else {
        // Add new DID
        this.addDid({
          did: did.did,
          name: did.name || null,
          description: did.description || '',
          sms_enabled: did.sms_enabled ?? 1,
          mms_available: did.mms_available ?? 1,
          last_sync_date: new Date().toISOString()
        });
      }
    }

    // Delete DIDs that no longer exist on Voip.ms
    for (const existingDid of existingDids) {
      if (!voipmsDidSet.has(existingDid.did)) {
        this.deleteDid(existingDid.id);
      }
    }
  }

  // =========================================
  // Conversations
  // =========================================

  getConversations(filters = {}) {
    let results = this.conversations.filter(c => !c.is_deleted && !c.is_archived);
    if (filters.did_id) {
      results = results.filter(c => c.did_id === filters.did_id);
    }
    return results.sort((a, b) => new Date(b.last_message_date) - new Date(a.last_message_date));
  }

  getConversationById(id) { return this.conversations.find(c => c.id === id) || null; }

  getOrCreateConversation(didId, contactNumber) {
    let conv = this.conversations.find(c => c.did_id === didId && c.contact_number === contactNumber && !c.is_deleted);
    if (!conv) {
      conv = { id: this.conversations.length + 1, did_id: didId, contact_number: contactNumber, contact_name: null, last_message_date: null, last_message_text: null, unread_count: 0, is_deleted: 0, is_archived: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      this.conversations.push(conv);
    }
    return conv;
  }

  updateConversation(id, updates) {
    const idx = this.conversations.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.conversations[idx] = { ...this.conversations[idx], ...updates, updated_at: new Date().toISOString() };
    return this.conversations[idx];
  }

  deleteConversation(id, hard = false) {
    if (hard) {
      const idx = this.conversations.findIndex(c => c.id === id);
      if (idx === -1) return;
      this.conversations.splice(idx, 1);
    } else {
      return this.updateConversation(id, { is_deleted: 1 });
    }
  }

  // =========================================
  // Messages
  // =========================================

  getMessages(conversationId, options = {}) {
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    return this.messages
      .filter(m => m.conversation_id === conversationId && !m.is_deleted)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);
  }

  addMessage(message) {
    const newMessage = { ...message, id: this.messages.length + 1, is_read: 0, is_deleted: 0, created_at: new Date().toISOString() };
    this.messages.push(newMessage);
    return newMessage;
  }

  markMessagesRead(conversationId) {
    this.messages.forEach(m => { if (m.conversation_id === conversationId) m.is_read = 1; });
  }

  // =========================================
  // Attachments
  // =========================================

  addAttachment(attachment) {
    const newAttachment = { ...attachment, id: this.attachments.length + 1, created_at: new Date().toISOString() };
    this.attachments.push(newAttachment);
    return newAttachment;
  }

  getAttachmentsForMessage(messageId) { return this.attachments.filter(a => a.message_id === messageId); }

  // =========================================
  // Sent Messages Log
  // =========================================

  logSentMessage(logEntry) {
    const newEntry = { ...logEntry, id: this.sent_messages_log.length + 1, timestamp: new Date().toISOString() };
    this.sent_messages_log.push(newEntry);
    return newEntry;
  }

  getSentCountToday(didId) {
    const today = new Date().toDateString();
    return this.sent_messages_log.filter(e => e.did_id === didId && new Date(e.timestamp).toDateString() === today).length;
  }
}