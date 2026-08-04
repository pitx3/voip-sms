import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getMockStatus, getContactDb, getMessagesDb } from '../../../../src/renderer/api/ipc.js';

describe('IPC API', () => {
  beforeEach(() => {
    // Mock window.electronAPI
    window.electronAPI = {
      getMockStatus: vi.fn(),
      getContactDb: vi.fn(),
      getMessagesDb: vi.fn()
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


  describe('getMessagesDb', () => {
    it('calls electronAPI.getMessagesDb with conversationId and options', async () => {
      const mockMessages = [{ id: 1, content: 'Hello' }];
      window.electronAPI.getMessagesDb.mockResolvedValue(mockMessages);

      const result = await getMessagesDb({ limit: 20 });

      expect(window.electronAPI.getMessagesDb).toHaveBeenCalledWith({ limit: 20 });
      expect(result).toEqual(mockMessages);
    });

    it('defaults to empty options', async () => {
      await getMessagesDb();
      expect(window.electronAPI.getMessagesDb).toHaveBeenCalledWith({});
    });
  });

});