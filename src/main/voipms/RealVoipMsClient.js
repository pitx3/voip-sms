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
      const response = await fetch(
        `${API_BASE_URL}?method=getIP&api_username=${encodeURIComponent(creds.username)}&api_password=${encodeURIComponent(creds.password)}`,
        { signal: controller.signal }
      );

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




  async getDIDs() {
    // TODO: Implement
    throw new Error('Method getDIDs() not yet implemented');
  }

  async getMessages(options = {}) {
    // TODO: Implement
    throw new Error('Method getMessages() not yet implemented');
  }

  async sendMessage(params) {
    // TODO: Implement
    throw new Error('Method sendMessage() not yet implemented');
  }
}