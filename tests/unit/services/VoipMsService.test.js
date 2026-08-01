// tests/unit/voipms/VoipMsService.test.js

import { describe, it, expect, beforeEach } from 'vitest';
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
      expect(result.status).toBe('success');
    });
  });

  describe('getDIDs()', () => {
    it('delegates to client and returns DIDs', async () => {
      const result = await service.getDIDs();
      expect(result.status).toBe('success');
      expect(result.dids).toBeInstanceOf(Array);
      expect(result.dids.length).toBeGreaterThan(0);
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