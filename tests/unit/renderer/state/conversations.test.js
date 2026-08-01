import { describe, it, expect } from 'vitest';
import {
  getSelectedConversationId,
  setSelectedConversationId,
  getCurrentMessages,
  setCurrentMessages,
  getTotalUnreadCount,
  getContactDisplayName,
  getContactDisplayString
} from '../../../../src/renderer/state/conversations.js';

// Mock formatPhoneNumber utility
const mockFormatPhoneNumber = (number) => `(${number.slice(-10, -7)}) ${number.slice(-7, -4)}-${number.slice(-4)}`;

describe('Conversation State', () => {
  describe('getSelectedConversationId / setSelectedConversationId', () => {
    it('returns null by default', () => {
      expect(getSelectedConversationId()).toBe(null);
    });

    it('stores and retrieves selected ID', () => {
      setSelectedConversationId(37);
      expect(getSelectedConversationId()).toBe(37);
      
      setSelectedConversationId(null);
      expect(getSelectedConversationId()).toBe(null);
    });
  });

  describe('getCurrentMessages / setCurrentMessages', () => {
    it('returns empty array by default', () => {
      expect(getCurrentMessages()).toEqual([]);
    });

    it('stores and retrieves messages array', () => {
      const messages = [{ id: 1, content: 'Hello' }];
      setCurrentMessages(messages);
      expect(getCurrentMessages()).toEqual(messages);
    });
  });

  describe('getTotalUnreadCount', () => {
    it('returns 0 for empty array', () => {
      expect(getTotalUnreadCount([])).toBe(0);
    });

    it('sums unread_count from all conversations', () => {
      const conversations = [
        { unread_count: 2 },
        { unread_count: 0 },
        { unread_count: 5 }
      ];
      expect(getTotalUnreadCount(conversations)).toBe(7);
    });

    it('handles missing unread_count as 0', () => {
      const conversations = [
        { unread_count: 2 },
        { },
        { unread_count: null }
      ];
      expect(getTotalUnreadCount(conversations)).toBe(2);
    });
  });

  describe('getContactDisplayName', () => {
    it('returns contact_name if present', () => {
      const conversation = { contact_name: 'John Doe', contact_number: '+15551234567' };
      expect(getContactDisplayName(conversation, mockFormatPhoneNumber)).toBe('John Doe');
    });

    it('returns formatted phone number if no name', () => {
      const conversation = { contact_name: null, contact_number: '+15551234567' };
      expect(getContactDisplayName(conversation, mockFormatPhoneNumber)).toBe('(555) 123-4567');
    });
  });

  describe('getContactDisplayString', () => {
    it('returns "Name - Number" format when name exists', () => {
      const conversation = { contact_name: 'John Doe', contact_number: '+15551234567' };
      expect(getContactDisplayString(conversation, mockFormatPhoneNumber)).toBe('John Doe - (555) 123-4567');
    });

    it('returns just number when no name', () => {
      const conversation = { contact_name: null, contact_number: '+15551234567' };
      expect(getContactDisplayString(conversation, mockFormatPhoneNumber)).toBe('(555) 123-4567');
    });
  });
});