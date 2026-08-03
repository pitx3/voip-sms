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

    // In MockVoipMsClient constructor or class property
    this._mockMessages = [
      {
        id: '10001',
        date: '2026-08-03 11:29:41',
        type: '1',
        did: '4145551234',
        contact: '2145559876',
        message: 'RMTextAlerts: Thanks for your payment! We posted it to your account on 08/01/2026.',
        carrier_status: 'received',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      },
      {
        id: '10002',
        date: '2026-08-03 11:30:00',
        type: '0',
        did: '4145551234',
        contact: '2145559876',
        message: 'STOP',
        carrier_status: 'Message delivered to handset.',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      },
      {
        id: '10003',
        date: '2026-08-03 10:15:22',
        type: '1',
        did: '7205551984',
        contact: '7655558524',
        message: 'Yes, that works great. Saturday should work for everyone.',
        carrier_status: 'received',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      },
      {
        id: '10004',
        date: '2026-08-02 14:22:10',
        type: '0',
        did: '7205551984',
        contact: '7655558524',
        message: 'Want to grab lunch this weekend?',
        carrier_status: 'Message delivered to handset.',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      },
      {
        id: '10005',
        date: '2026-08-01 09:45:00',
        type: '1',
        did: '9835551024',
        contact: '7205552554',
        message: 'I\'ll be heading to Montana probably Thursday.',
        carrier_status: 'received',
        col_media1: '',
        col_media2: '',
        col_media3: '',
        media: []
      }
    ];

    this._nextMmsId = 109131500;
  }

  async testConnection() {
    return { success: true, message: 'Connection successful' };
  }

  async getDids() {
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