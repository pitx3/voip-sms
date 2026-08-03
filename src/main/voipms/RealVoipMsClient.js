// src/main/voipms/RealVoipMsClient.js

import { VoipMsClient } from './VoipMsClient.js';
import { getCredentials } from '../services/CredentialStorageService.js';

const API_BASE_URL = 'https://voip.ms/api/v1/rest.php';
const API_TIMEOUT_MS = 30000; // 30 seconds

export default class RealVoipMsClient extends VoipMsClient {

  async testConnection(credentials = null) {
    const creds = credentials || await getCredentials();

    if (!creds) {
      return {
        success: false,
        message: 'No credentials found'
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('method', 'getIP');
      formData.append('api_username', creds.username);
      formData.append('api_password', creds.password);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.status === 'success') {
        return {
          success: true,
          message: 'Connection successful'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Authentication failed'
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timed out (30s)'
        };
      }
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  async getDids(credentials = null) {
    const creds = credentials || await getCredentials();

    if (!creds) {
      throw new Error('No credentials found');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('method', 'getDIDsInfo');
      formData.append('api_username', creds.username);
      formData.append('api_password', creds.password);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.status === 'success') {
        return result.dids;
      } else {
        console.log('API error: ', result);
        throw new Error(result.message || 'Failed to get DIDs');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out (30s)');
      }
      throw error;
    }
  }

  async getMessages(options = {}) {
    const creds = options.credentials || await getCredentials();

    if (!creds) {
      throw new Error('No credentials found');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const formData = new FormData();
      formData.append('method', 'getMMS');
      formData.append('api_username', creds.username);
      formData.append('api_password', creds.password);
      formData.append('all_messages', '1');

      // Optional parameters
      if (options.from) {
        formData.append('from', options.from);
      }
      if (options.to) {
        formData.append('to', options.to);
      }
      if (options.timezone) {
        formData.append('timezone', options.timezone);
      }
      if (options.limit) {
        formData.append('limit', options.limit);
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.status === 'success') {
        return result.sms || [];
      } else {
        console.log('API error: ', result);
        throw new Error(result.message || 'Failed to get messages');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out (30s)');
      }
      throw error;
    }
  }

  async sendMessage(params) {
    // TODO: Implement
    throw new Error('Method sendMessage() not yet implemented');
  }
}