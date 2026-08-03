// src/main/voipms/VoipMsService.js

export class VoipMsService {
  constructor(voipMsClient, database) {
    this.client = voipMsClient;
    this.database = database;
  }

  async testConnection(credentials = null) {
    return this.client.testConnection(credentials);
  }

  async getDids(credentials = null) {
    // Fetch from API
    const dids = await this.client.getDids(credentials);

    // Sync to database
    if (this.database) {
      this.database.syncDids(dids);
    }

    // Return for UI
    return dids;
  }

  async getMessages(options = {}) {
    return this.client.getMessages(options);
  }

  async sendMessage(params) {
    return this.client.sendMessage(params);
  }
}