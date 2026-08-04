// src/renderer/renderer.js

import { showNewConversationDialog } from './ui/newConversationDialog.js';
import { formatPhoneNumber, formatMessageTime } from './utils/format.js';
import { getMockStatus, getMessagesDb, getContactDb } from './api/ipc.js';

// State
let selectedContact = null;  // { did_id, contact_number }
let currentMessages = [];
let conversations = [];  // Derived from messages

// --- Helper Functions ---

/**
 * Build conversation list from unique (did_id, contact_number) pairs
 */
function buildConversationsFromMessages(messages) {
  const map = new Map();

  messages.forEach(msg => {
    const key = `${msg.did_id}-${msg.contact_number}`;

    if (!map.has(key)) {
      map.set(key, {
        did_id: msg.did_id,
        contact_number: msg.contact_number,
        last_message_date: msg.timestamp,
        message_count: 1,
        unread_count: msg.is_read ? 0 : 1
      });
    } else {
      const conv = map.get(key);
      conv.message_count++;
      if (!msg.is_read) conv.unread_count++;
      if (msg.timestamp > conv.last_message_date) {
        conv.last_message_date = msg.timestamp;
      }
    }
  });

  // Sort by last message date (newest first)
  return Array.from(map.values()).sort((a, b) => b.last_message_date - a.last_message_date);
}

// --- Render Functions ---

async function renderConversationList() {
  const listEl = document.getElementById('conversation-list');
  listEl.innerHTML = '';

  // Fetch all messages to build conversation list
  const result = await getMessagesDb();
  const allMessages = result.messages || [];

  // Build conversations from messages
  conversations = buildConversationsFromMessages(allMessages);

  for (const conv of conversations) {
    // Try to get contact name
    let displayName = formatPhoneNumber(conv.contact_number);
    try {
      const contactResult = await getContactDb(conv.contact_number);
      console.log('[renderer.js] contactResult', contactResult);
      if (contactResult.contact) {
        displayName = contactResult.contact.name;
      }
    } catch (e) {
      // Contact not found, use phone number
    }

    const itemEl = document.createElement('div');
    itemEl.className = `conversation-item ${selectedContact &&
        selectedContact.did_id === conv.did_id &&
        selectedContact.contact_number === conv.contact_number
        ? 'selected'
        : ''
      }`;

    // Get last message preview for this conversation
    const lastMessage = allMessages
      .filter(m => m.did_id === conv.did_id && m.contact_number === conv.contact_number)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    const preview = lastMessage ? lastMessage.message_body.substring(0, 50) + (lastMessage.message_body.length > 50 ? '...' : '') : '';

    itemEl.innerHTML = `
      <div class="conversation-name">${displayName}</div>
      <div class="conversation-preview">${preview}</div>
    `;

    itemEl.addEventListener('click', () => {
      selectConversation(conv.did_id, conv.contact_number);
    });

    listEl.appendChild(itemEl);
  }
}

async function renderMessages(did_id, contact_number) {
  const listEl = document.getElementById('message-list');
  const headerEl = document.getElementById('message-thread-header');

  // Get contact name for header
  let displayName = formatPhoneNumber(contact_number);
  try {
    const contactResult = await getContactDb(contact_number);
    if (contactResult.contact) {
      displayName = contactResult.contact.name;
    }
  } catch (e) {
    // Contact not found, use phone number
  }

  const displayNumber = formatPhoneNumber(contact_number);
  headerEl.querySelector('.contact-name').textContent = 
    displayName !== displayNumber ? `${displayName} - ${displayNumber}` : displayName;

  listEl.innerHTML = '';

  // Fetch messages for this conversation
  const result = await getMessagesDb({
    did_id,
    contact_number,
    orderBy: 'ASC'  // Oldest first for display
  });

  currentMessages = result.messages || [];

  currentMessages.forEach(msg => {
    const msgEl = document.createElement('div');
    msgEl.className = `message-item ${msg.direction}`;
    msgEl.innerHTML = `
      <div class="message-content">${msg.message_body}</div>
      <div class="message-time">${formatMessageTime(msg.timestamp)}</div>
    `;
    listEl.appendChild(msgEl);
  });

  // Scroll to bottom
  listEl.scrollTop = listEl.scrollHeight;
}

async function selectConversation(did_id, contact_number) {
  selectedContact = { did_id, contact_number };
  await renderConversationList();
  await renderMessages(did_id, contact_number);
  await updateStatusBar();
}

async function updateStatusBar() {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  document.getElementById('status-text').textContent = `Last checked: ${timestamp}`;

  // Count unread messages
  const unreadCount = currentMessages.filter(m => !m.is_read).length;
  document.getElementById('unread-count').textContent = `${unreadCount} unread`;
}

// --- Sync Button ---

const syncMessagesBtn = document.getElementById('sync-messages-btn');
if (syncMessagesBtn) {
  syncMessagesBtn.addEventListener('click', async () => {
    syncMessagesBtn.disabled = true;

    try {
      const result = await window.electronAPI.syncMessagesVoipms();

      if (result.success) {
        console.log(`Synced ${result.count} messages`);
        await renderConversationList();
        if (selectedContact) {
          await renderMessages(selectedContact.did_id, selectedContact.contact_number);
        }
      } else {
        alert('Failed to sync messages: ' + result.error);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync messages');
    } finally {
      syncMessagesBtn.disabled = false;
    }
  });
}

// --- New Conversation Button ---

const newConversationBtn = document.getElementById('new-conversation-btn');
if (newConversationBtn) {
  newConversationBtn.addEventListener('click', async () => {
    try {
      const result = await window.electronAPI.getDidsDb();

      if (!result.dids || result.dids.length === 0) {
        alert('No DIDs available. Click refresh to sync from Voip.ms.');
        return;
      }

      showNewConversationDialog({
        dids: result.dids,
        onConfirm: (did, phoneNumber) => {
          console.log('New conversation:', { did, phoneNumber });
          // TODO: Send initial message to start conversation
          // For now, just refresh the list
          renderConversationList();
        },
        onCancel: () => {
          console.log('New conversation cancelled');
        }
      });
    } catch (error) {
      console.error('Failed to load DIDs:', error);
      alert('Failed to load DIDs. Please check your connection.');
    }
  });
}

// --- Logout Button ---

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to logout? You will need to re-enter your credentials.');

    if (confirmed) {
      try {
        await window.electronAPI.deleteCredentials();
        window.location.reload();
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  });
}

// --- Initialize ---

document.addEventListener('DOMContentLoaded', async () => {
  const mockStatus = await getMockStatus();
  if (mockStatus.isMock) {
    document.getElementById('mock-banner').style.display = 'block';
  }

  await renderConversationList();
  await updateStatusBar();

  // Select first conversation by default
  if (conversations.length > 0) {
    const first = conversations[0];
    await selectConversation(first.did_id, first.contact_number);
  }
});