// src/main/voipms/MockVoipMsClient.js

import { VoipMsClient } from './VoipMsClient.js';

export default class MockVoipMsClient extends VoipMsClient {
  constructor() {
    super();
    this._mockDids = [
      {
        did: '7195555309',
        description: 'Business',
        sms_enabled: '1',
        mms_available: 1
      },
      {
        did: '7205552929',
        description: 'Financial',
        sms_enabled: '1',
        mms_available: 1
      }
    ];

    this._mockMessages = [
      {
        id: '109131435',
        date: '2026-07-31 13:09:54',
        type: '0',
        did: '7195555209',
        contact: '7205558675',
        carrier_status: 'Message delivered to handset.',
        message: 'Test from Michael',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      },
      {
        id: '109131337',
        date: '2026-07-31 13:09:01',
        type: '1',
        did: '7195555309',
        contact: '7205558675',
        carrier_status: 'received',
        message: 'Test from Carl',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      }
    ];

    this._nextMmsId = 109131500;
  }

  async testConnection() {
    return { status: 'success' };
  }

  // async getDIDs() {
  //   return { status: 'success', dids: this._mockDids };
  // }

  async getDIDs() {
    return this._mockDids;
  }

  async getMessages(options = {}) {
    let results = [...this._mockMessages];

    if (options.did) {
      results = results.filter(m => m.did === options.did);
    }
    if (options.type) {
      results = results.filter(m => m.type === options.type);
    }
    if (options.limit) {
      results = results.slice(0, parseInt(options.limit, 10));
    }

    return { status: 'success', sms: results };
  }

  async sendMessage(params) {
    if (!params.did || !params.dst || !params.message) {
      return { status: 'error', message: 'Missing required fields' };
    }
    return { status: 'success', mms: String(this._nextMmsId++) };
  }
}