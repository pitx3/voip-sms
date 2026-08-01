import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMockStatus,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage
} from '../../../../src/renderer/api/ipc.js';

describe('IPC API', () => {
  beforeEach(() => {
    // Mock window.electronAPI
    window.electronAPI = {
      getMockStatus: vi.fn(),
      getConversations: vi.fn(),
      getConversationById: vi.fn(),
      getMessages: vi.fn(),
      sendMessage: vi.fn()
    };
  });

  describe('getMockStatus', () => {
    it('calls electronAPI.getMockStatus', async () => {
      const mockStatus = { isMock: true, useMockDb: true, useMockVoipms: false };
      window.electronAPI.getMockStatus.mockResolvedValue(mockStatus);

      const result = await getMockStatus();

      expect(window.electronAPI.getMockStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getConversations', () => {
    it('calls electronAPI.getConversations with filters', async () => {
      const mockConversations = [{ id: 1, contact_name: 'Test' }];
      window.electronAPI.getConversations.mockResolvedValue(mockConversations);

      const result = await getConversations({ account_id: 1 });

      expect(window.electronAPI.getConversations).toHaveBeenCalledWith({ account_id: 1 });
      expect(result).toEqual(mockConversations);
    });

    it('defaults to empty filters', async () => {
      await getConversations();
      expect(window.electronAPI.getConversations).toHaveBeenCalledWith({});
    });
  });

  describe('getConversationById', () => {
    it('calls electronAPI.getConversationById with id', async () => {
      const mockConversation = { id: 1, contact_name: 'Test' };
      window.electronAPI.getConversationById.mockResolvedValue(mockConversation);

      const result = await getConversationById(1);

      expect(window.electronAPI.getConversationById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockConversation);
    });
  });

  describe('getMessages', () => {
    it('calls electronAPI.getMessages with conversationId and options', async () => {
      const mockMessages = [{ id: 1, content: 'Hello' }];
      window.electronAPI.getMessages.mockResolvedValue(mockMessages);

      const result = await getMessages(1, { limit: 20 });

      expect(window.electronAPI.getMessages).toHaveBeenCalledWith(1, { limit: 20 });
      expect(result).toEqual(mockMessages);
    });

    it('defaults to empty options', async () => {
      await getMessages(1);
      expect(window.electronAPI.getMessages).toHaveBeenCalledWith(1, {});
    });
  });

  describe('sendMessage', () => {
    it('calls electronAPI.sendMessage with conversationId and content', async () => {
      const mockMessage = { id: 1, content: 'Hello', direction: 'outbound' };
      window.electronAPI.sendMessage.mockResolvedValue(mockMessage);

      const result = await sendMessage(1, 'Hello');

      expect(window.electronAPI.sendMessage).toHaveBeenCalledWith(1, 'Hello');
      expect(result).toEqual(mockMessage);
    });
  });
});