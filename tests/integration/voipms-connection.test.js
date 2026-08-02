// tests/integration/unsafe/voipms-connection.test.js

import { describe, it, expect, skip } from 'vitest';
import RealVoipMsClient from '../../src/main/voipms/RealVoipMsClient.js';

const API_TEST_TIMEOUT = 20000; // 20 seconds as voip.ms api can be slow
const hasCredentials = process.env.VOIPMS_API_USERNAME && process.env.VOIPMS_API_PASSWORD;

describe('RealVoipMsClient - Connection Test (UNSAFE)', ({ skip }) => {
  it.skipIf(!hasCredentials)('should connect with valid credentials', async () => {

    const username = process.env.VOIPMS_API_USERNAME;
    const password = process.env.VOIPMS_API_PASSWORD;

    // Skip if no credentials provided
    if (!username || !password) {
      skip('⚠️  Skipping: No credentials provided. Set VOIPMS_API_USERNAME and VOIPMS_API_PASSWORD environment variables and rerun the test');
      return;
    }

    const client = new RealVoipMsClient();
    const result = await client.testConnection({ username, password });

    console.debug('status.message...');
    console.debug(status.message);
    expect(result.success).toBe(true);
    console.log('✅ Connection test passed:', result.message);
  }, API_TEST_TIMEOUT);

  it('should fail with invalid credentials', async () => {
    const client = new RealVoipMsClient();
    const result = await client.testConnection({
      username: 'invalid_user',
      password: 'wrong_password'
    });

    expect(result.success).toBe(false);
    console.log('✅ Invalid credentials correctly rejected:', result.message);
  }, API_TEST_TIMEOUT);
});