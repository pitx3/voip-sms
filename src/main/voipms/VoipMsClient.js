// src/main/voipms/VoipMsClient.js

/**
 * VoipMsClient Interface
 * Defines the contract for Voip.ms API clients.
 */

export class VoipMsClient {
  async testConnection() {
    throw new Error('Method testConnection() must be implemented');
  }

  async getDIDs() {
    throw new Error('Method getDIDs() must be implemented');
  }

  async getMessages(options = {}) {
    throw new Error('Method getMessages() must be implemented');
  }

  async sendMessage(params) {
    throw new Error('Method sendMessage() must be implemented');
  }
}