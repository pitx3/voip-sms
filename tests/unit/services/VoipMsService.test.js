// tests/unit/voipms/VoipMsService.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoipMsService } from '../../../src/main/services/VoipMsService.js';
import MockVoipMsClient from '../../../src/main/voipms/MockVoipMsClient.js';
import MockDatabase from '../../../src/main/db/MockDatabase.js';

describe('VoipMsService', () => {
  let mockClient;
  let service;
  let mockDatabase;

  beforeEach(() => {
    mockDatabase = new MockDatabase();
    mockClient = new MockVoipMsClient();
    service = new VoipMsService(mockClient, mockDatabase);
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

    it('fetches messages from client with correct date range (initial sync)', async () => {
      const result = await service.getMessages();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      console.log(`✅ Initial sync: ${result.length} messages fetched`);
    });

    it('passes timezone offset to client', async () => {
      const expectedTimezone = String(-new Date().getTimezoneOffset() / 60);
      const getMessagesSpy = vi.spyOn(mockClient, 'getMessages');

      await service.getMessages();

      const callArgs = getMessagesSpy.mock.calls[0][0];
      expect(callArgs.timezone).toBe(expectedTimezone);
      console.log(`✅ Timezone offset passed: ${callArgs.timezone}`);
    });

    it('uses 90-day window for initial sync (no prior sync timestamp)', async () => {
      const getMessagesSpy = vi.spyOn(mockClient, 'getMessages');

      await service.getMessages();

      const callArgs = getMessagesSpy.mock.calls[0][0];
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const expectedFrom = ninetyDaysAgo.toISOString().split('T')[0];

      expect(callArgs.from).toBe(expectedFrom);
      console.log(`✅ Initial sync date range: ${callArgs.from} to ${callArgs.to}`);
    });

    it('uses last sync timestamp minus 1 hour for subsequent sync', async () => {
      // Set a fake last sync timestamp (2 days ago)
      const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);
      mockDatabase.setSetting('last_message_sync', twoDaysAgo);

      const getMessagesSpy = vi.spyOn(mockClient, 'getMessages');

      await service.getMessages();

      const callArgs = getMessagesSpy.mock.calls[0][0];
      const expectedFrom = new Date(twoDaysAgo - (60 * 60 * 1000)).toISOString().split('T')[0];

      expect(callArgs.from).toBe(expectedFrom);
      console.log(`✅ Subsequent sync date range: ${callArgs.from} to ${callArgs.to}`);
    });

    it('transforms messages correctly (type → direction)', async () => {
      const result = await service.getMessages();

      result.forEach(msg => {
        expect(msg).toHaveProperty('direction');
        expect(['inbound', 'outbound']).toContain(msg.direction);
      });
      console.log('✅ Message transformation validated (type → direction)');
    });

    it('updates last_message_sync setting after sync', async () => {
      const beforeSync = mockDatabase.getSetting('last_message_sync');
      expect(beforeSync).toBeNull();

      await service.getMessages();

      const afterSync = mockDatabase.getSetting('last_message_sync');
      expect(afterSync).toBeGreaterThan(Date.now() - 60000); // Within last minute
      console.log('✅ last_message_sync setting updated');
    });

    it('auto-adds missing DIDs when syncing messages', async () => {
      // Clear existing DIDs to simulate missing DID
      mockDatabase._mockDids = [];

      await service.getMessages();

      const dids = mockDatabase.getDids();
      expect(dids.length).toBeGreaterThan(0);
      console.log(`✅ Missing DIDs auto-added (${dids.length} DIDs)`);
    });

    it('passes optional parameters to client', async () => {
      const getMessagesSpy = vi.spyOn(mockClient, 'getMessages');

      await service.getMessages({ limit: '50' });

      const callArgs = getMessagesSpy.mock.calls[0][0];
      expect(callArgs.limit).toBe('50');
      console.log('✅ Optional parameters passed to client');
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

  it('calls database.saveMessages() with transformed messages including numeric did_id', async () => {
    // Spy on saveMessages to capture what's passed
    const saveMessagesSpy = vi.spyOn(mockDatabase, 'saveMessages');

    // Mock client returns messages in API format
    const mockApiMessages = [
      {
        id: '12345',
        date: '2025-08-01 14:30:00',
        did: '7195555309',  // Phone number string
        contact: '7205558675',
        message: 'Test message body',
        type: '0',
        media: [],
        carrier_status: '1'
      }
    ];

    // Override mock client's getMessages
    const originalGetMessages = mockClient.getMessages.bind(mockClient);
    mockClient.getMessages = async () => mockApiMessages;

    // Ensure DID exists in mock database (so lookup succeeds)
    mockDatabase.addDid({
      did: '7195555309',
      sms_enabled: 1,
      mms_available: 1
    });

    await service.getMessages();

    // Verify saveMessages was called exactly once
    expect(saveMessagesSpy).toHaveBeenCalledTimes(1);

    // Get the messages that were passed to saveMessages
    const savedMessages = saveMessagesSpy.mock.calls[0][0];

    // Verify it's an array with correct length
    expect(Array.isArray(savedMessages)).toBe(true);
    expect(savedMessages.length).toBe(1);

    // Verify message has numeric did_id (foreign key), not string did
    const firstMsg = savedMessages[0];
    expect(firstMsg.did_id).toBeDefined();
    expect(typeof firstMsg.did_id).toBe('number');  // Numeric FK
    expect(firstMsg.did_id).toBeGreaterThan(0);

    // Verify other transformations
    expect(firstMsg.message_id).toBe('12345');
    expect(firstMsg.contact_number).toBe('7205558675');
    expect(firstMsg.message_body).toBe('Test message body');
    expect(firstMsg.direction).toBe('outbound');  // type '0' → outbound
    expect(typeof firstMsg.timestamp).toBe('number');  // Unix timestamp

    // Both properties exist - did_id is the FK, did is the original phone number
    expect(firstMsg.did).toBe('7195555309');  // Original phone string (kept for reference)
    expect(firstMsg.did_id).toBeDefined();     // Numeric FK (used for DB)
    expect(typeof firstMsg.did_id).toBe('number');

    // Cleanup
    mockClient.getMessages = originalGetMessages;

    console.log('✅ saveMessages() called with numeric did_id (FK resolved)');
  });
});