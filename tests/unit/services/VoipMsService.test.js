// tests/unit/voipms/VoipMsService.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoipMsService } from '../../../src/main/services/VoipMsService.js';
import MockVoipMsClient from '../../../src/main/voipms/MockVoipMsClient.js';

describe('VoipMsService', () => {
  let mockClient;
  let service;

  beforeEach(() => {
    mockClient = new MockVoipMsClient();
    service = new VoipMsService(mockClient);
  });

  describe('testConnection()', () => {
    it('delegates to client and returns result', async () => {
      const result = await service.testConnection();
      expect(result.success).toBe(true);
    });
  });

  describe('getDids()', () => {
    it('delegates to client and returns DIDs', async () => {
      const result = await service.getDids();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('syncs DIDs to database when database is present', async () => {
      const mockDatabase = {
        syncDids: vi.fn(),
        init: vi.fn(),
        close: vi.fn(),
        getDids: vi.fn(),
        addDid: vi.fn(),
        updateDid: vi.fn(),
        deleteDid: vi.fn()
      };

      const serviceWithDb = new VoipMsService(mockClient, mockDatabase);
      const result = await serviceWithDb.getDids();

      expect(mockDatabase.syncDids).toHaveBeenCalledWith(result);
    });

    it('works without database (mock mode)', async () => {
      const serviceWithoutDb = new VoipMsService(mockClient, null);
      const result = await serviceWithoutDb.getDids();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getMessages()', () => {
    it('delegates to client and returns messages', async () => {
      const result = await service.getMessages({});
      expect(result.status).toBe('success');
      expect(result.sms).toBeInstanceOf(Array);
    });

    it('passes options to client for filtering', async () => {
      const result = await service.getMessages({ type: '1' });
      result.sms.forEach(msg => {
        expect(msg.type).toBe('1');
      });
    });
  });

  describe('sendMessage()', () => {
    it('delegates to client and returns result', async () => {
      const result = await service.sendMessage({
        did: '7195555309',
        dst: '7205558675',
        message: 'Test'
      });
      expect(result.status).toBe('success');
      expect(result.mms).toBeDefined();
    });

    it('handles validation errors from client', async () => {
      const result = await service.sendMessage({});
      expect(result.status).toBe('error');
    });
  });
});