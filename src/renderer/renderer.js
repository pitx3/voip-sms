// const { formatPhoneNumber, formatMessageTime } = require('./utils/format.js');
import { formatPhoneNumber, formatMessageTime } from './utils/format.js';

// State
let selectedConversationId = null;
let currentMessages = [];

// --- IPC Helpers ---

async function getMockStatus() {
  const status = await window.electronAPI.getMockStatus();
  if (status.isMock) {
    document.getElementById('mock-banner').style.display = 'block';
  }
  return status;
}

async function getConversations() {
  return await window.electronAPI.getConversations();
}

async function getMessages(conversationId, options = {}) {
  return await window.electronAPI.getMessages(conversationId, options);
}

async function sendMessage(conversationId, content) {
  return await window.electronAPI.sendMessage(conversationId, content);
}

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
  await getMockStatus();
  await renderConversationList();
  await updateStatusBar();
  
  // Select first conversation by default
  const conversations = await getConversations();
  if (conversations.length > 0) {
    await selectConversation(conversations[0].id);
  }
});