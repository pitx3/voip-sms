// tests/integration/voipms-getmessages.test.js

import { describe, it, expect } from 'vitest';
import RealVoipMsClient from '../../src/main/voipms/RealVoipMsClient.js';

const API_TEST_TIMEOUT = 20000; // 20 seconds as voip.ms api can be slow
const hasCredentials = process.env.VOIPMS_API_USERNAME && process.env.VOIPMS_API_PASSWORD;
const MESSAGE_LIMIT = '100';  // default limit for number of messages to retrieve

describe('RealVoipMsClient.getMessages()', () => {
    it.skipIf(!hasCredentials)('should return array of messages for valid credentials', async () => {
        const username = process.env.VOIPMS_API_USERNAME;
        const password = process.env.VOIPMS_API_PASSWORD;

        const client = new RealVoipMsClient();
        const messages = await client.getMessages({
            credentials: { username, password },
            limit: MESSAGE_LIMIT
        });

        expect(Array.isArray(messages)).toBe(true);
        console.log(`✅ getMessages() returned ${messages.length} message(s)`);
    }, API_TEST_TIMEOUT);

    it.skipIf(!hasCredentials)('should return messages with expected fields', async () => {
        const username = process.env.VOIPMS_API_USERNAME;
        const password = process.env.VOIPMS_API_PASSWORD;

        const client = new RealVoipMsClient();
        const messages = await client.getMessages({
            credentials: { username, password },
            limit: MESSAGE_LIMIT
        });

        if (messages.length > 0) {
            const firstMessage = messages[0];

            expect(firstMessage).toHaveProperty('id');
            expect(firstMessage).toHaveProperty('date');
            expect(firstMessage).toHaveProperty('type');
            expect(firstMessage).toHaveProperty('did');
            expect(firstMessage).toHaveProperty('contact');
            expect(firstMessage).toHaveProperty('message');
            expect(firstMessage).toHaveProperty('carrier_status');
            expect(firstMessage).toHaveProperty('media');
            console.log('✅ Message fields validated:', Object.keys(firstMessage).join(', '));
        }
    }, API_TEST_TIMEOUT);

    it.skipIf(!hasCredentials)('should handle date range filtering', async () => {
        const username = process.env.VOIPMS_API_USERNAME;
        const password = process.env.VOIPMS_API_PASSWORD;

        // Calculate dynamic date range (last 7 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        // Format as YYYY-MM-DD (Voip.ms API format)
        const from = startDate.toISOString().split('T')[0];
        const to = endDate.toISOString().split('T')[0];

        console.log(`Testing date range: ${from} to ${to}`);

        const client = new RealVoipMsClient();
        const messages = await client.getMessages({
            credentials: { username, password },
            from: from,
            to: to,
            limit: MESSAGE_LIMIT
        });

        expect(Array.isArray(messages)).toBe(true);

        if (messages.length > 0) {
            // Verify all messages are within the date range
            messages.forEach(msg => {
                const msgDate = msg.date.split(' ')[0]; // Extract YYYY-MM-DD
                expect(msgDate >= from && msgDate <= to).toBe(true);
            });
            console.log(`✅ Date range filtering validated (${messages.length} messages in range)`);
        }
    }, API_TEST_TIMEOUT);

    it.skipIf(!hasCredentials)('should throw on invalid credentials', async () => {
        const client = new RealVoipMsClient();

        await expect(
            client.getMessages({
                credentials: { username: 'invalid', password: 'invalid' },
                limit: MESSAGE_LIMIT
            })
        ).rejects.toThrow();

        console.log('✅ Invalid credentials properly rejected');
    }, API_TEST_TIMEOUT);
});