// src/main/voipms/VoipMsService.js

export class VoipMsService {
  constructor(voipMsClient) {
    this.client = voipMsClient;
  }

  async testConnection(credentials = null) {
    return this.client.testConnection(credentials);
  }

  async getDIDs() {
    return this.client.getDIDs();
  }

  async getMessages(options = {}) {
    return this.client.getMessages(options);
  }

  async sendMessage(params) {
    return this.client.sendMessage(params);
  }
}