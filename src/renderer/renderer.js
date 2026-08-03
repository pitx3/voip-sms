import { showNewConversationDialog } from './ui/newConversationDialog.js';
import { formatPhoneNumber, formatMessageTime } from './utils/format.js';
import {
  getMockStatus,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage
} from './api/ipc.js';

// State
let selectedConversationId = null;
let currentMessages = [];

// --- Render Functions ---

async function renderConversationList() {
  const listEl = document.getElementById('conversation-list');
  listEl.innerHTML = '';

  const conversations = await getConversations();

  conversations.forEach(conv => {
    const itemEl = document.createElement('div');
    itemEl.className = `conversation-item ${conv.id === selectedConversationId ? 'selected' : ''}`;
    itemEl.dataset.id = conv.id;

    const displayName = conv.contact_name || formatPhoneNumber(conv.contact_number);

    itemEl.innerHTML = `
      <div class="contact-name">${displayName}</div>
      <div class="last-message">${conv.last_message_text || ''}</div>
    `;

    itemEl.addEventListener('click', () => selectConversation(conv.id));
    listEl.appendChild(itemEl);
  });
}

async function renderMessages(conversationId) {
  const listEl = document.getElementById('message-list');
  const headerEl = document.getElementById('message-thread-header');

  const conversations = await getConversations();
  const conv = conversations.find(c => c.id === conversationId);
  if (!conv) return;

  const displayName = conv.contact_name || formatPhoneNumber(conv.contact_number);
  const displayNumber = formatPhoneNumber(conv.contact_number);

  if (conv.contact_name) {
    headerEl.querySelector('.contact-name').textContent = `${displayName} - ${displayNumber}`;
  } else {
    headerEl.querySelector('.contact-name').textContent = displayNumber;
  }

  listEl.innerHTML = '';

  currentMessages = await getMessages(conversationId);

  currentMessages.forEach(msg => {
    const msgEl = document.createElement('div');
    msgEl.className = `message-item ${msg.direction}`;
    msgEl.innerHTML = `
      <div class="message-content">${msg.content}</div>
      <div class="message-time">${formatMessageTime(msg.timestamp)}</div>
    `;
    listEl.appendChild(msgEl);
  });

  // Scroll to bottom
  listEl.scrollTop = listEl.scrollHeight;
}

async function selectConversation(id) {
  selectedConversationId = id;
  await renderConversationList();
  await renderMessages(id);
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

  const conversations = await getConversations();
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
  document.getElementById('unread-count').textContent = `${totalUnread} unread`;
}

// --- Compose Box ---

async function handleSend() {
  const inputEl = document.getElementById('message-input');
  const content = inputEl.value.trim();

  if (!content || !selectedConversationId) return;

  await sendMessage(selectedConversationId, content);
  inputEl.value = '';
  await renderMessages(selectedConversationId);
  await renderConversationList(); // Refresh to update last_message_text
}

document.getElementById('send-button').addEventListener('click', handleSend);

document.getElementById('message-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// --- Initialize ---

document.addEventListener('DOMContentLoaded', async () => {
  const mockStatus = await getMockStatus();
  if (mockStatus.isMock) {
    document.getElementById('mock-banner').style.display = 'block';
  }
  await renderConversationList();
  await updateStatusBar();

  // Select first conversation by default
  const conversations = await getConversations();
  if (conversations.length > 0) {
    await selectConversation(conversations[0].id);
  }
});

// New Conversation Button
const newConversationBtn = document.getElementById('new-conversation-btn');
if (newConversationBtn) {
  newConversationBtn.addEventListener('click', async () => {
    try {
      // Fast path: Read DIDs from local database
      const result = await window.electronAPI.getDidsDb();

      if (!result.dids || result.dids.length === 0) {
        alert('No DIDs available. Click menu to refresh from Voip.ms.');
        return;
      }

      showNewConversationDialog({
        dids: result.dids,
        onConfirm: (did, phoneNumber) => {
          console.log('New conversation:', { did, phoneNumber });
          // TODO: Check if conversation exists, open or create
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

// Logout Button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const confirmed = confirm('Are you sure you want to logout? You will need to re-enter your credentials.');

    if (confirmed) {
      try {
        await window.electronAPI.deleteCredentials();
        // Reload the app to show credentials window
        window.location.reload();
      } catch (error) {
        console.error('Logout failed:', error);
        alert('Failed to logout. Please try again.');
      }
    }
  });
}