// tests/integration/voipms-getdids.test.js

import { describe, it, expect } from 'vitest';
import RealVoipMsClient from '../../src/main/voipms/RealVoipMsClient.js';

const API_TEST_TIMEOUT = 20000; // 20 seconds as voip.ms api can be slow
const hasCredentials = process.env.VOIPMS_API_USERNAME && process.env.VOIPMS_API_PASSWORD;

describe('RealVoipMsClient.getDids()', () => {
  it.skipIf(!hasCredentials)('should return array of DIDs for valid credentials', async () => {
    const username = process.env.VOIPMS_API_USERNAME;
    const password = process.env.VOIPMS_API_PASSWORD;

    const client = new RealVoipMsClient();
    const dids = await client.getDids({ username, password });

    expect(Array.isArray(dids)).toBe(true);
    console.log(`✅ getDids() returned ${dids.length} DID(s)`);
  }, API_TEST_TIMEOUT);

  it.skipIf(!hasCredentials)('should return DIDs with expected fields', async () => {
    const username = process.env.VOIPMS_API_USERNAME;
    const password = process.env.VOIPMS_API_PASSWORD;

    const client = new RealVoipMsClient();
    const dids = await client.getDids({ username, password });

    if (dids.length > 0) {
      const firstDid = dids[0];

      expect(firstDid).toHaveProperty('did');
      expect(firstDid).toHaveProperty('sms_enabled');
      expect(firstDid).toHaveProperty('mms_available');
      console.log('✅ DID fields validated:', Object.keys(firstDid).join(', '));
    }
  }, API_TEST_TIMEOUT);
});