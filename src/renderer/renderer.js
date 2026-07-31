// Hard-coded test data (will be replaced with real data later)
const mockConversations = [
  {
    id: 1,
    contact_number: '+15551234567',
    contact_name: 'John Doe',
    last_message_text: 'Hey, are we still on for lunch?',
    last_message_date: '2026-07-31 14:30:00',
    unread_count: 2
  },
  {
    id: 2,
    contact_number: '+15559876543',
    contact_name: 'Jane Smith',
    last_message_text: 'Thanks for the info!',
    last_message_date: '2026-07-31 12:15:00',
    unread_count: 0
  },
  {
    id: 3,
    contact_number: '+15555555555',
    contact_name: null,
    last_message_text: 'Your verification code is 123456',
    last_message_date: '2026-07-30 09:00:00',
    unread_count: 1
  }
];

const mockMessages = {
  1: [
    { id: 1, direction: 'inbound', content: 'Hey!', timestamp: '2026-07-31 14:28:00' },
    { id: 2, direction: 'inbound', content: 'Are we still on for lunch?', timestamp: '2026-07-31 14:29:00' },
    { id: 3, direction: 'outbound', content: 'Yeah, definitely!', timestamp: '2026-07-31 14:30:00' },
    { id: 4, direction: 'inbound', content: 'Hey, are we still on for lunch?', timestamp: '2026-07-31 14:30:00' }
  ],
  2: [
    { id: 5, direction: 'outbound', content: 'Here is the info you requested', timestamp: '2026-07-31 12:10:00' },
    { id: 6, direction: 'inbound', content: 'Thanks for the info!', timestamp: '2026-07-31 12:15:00' }
  ],
  3: [
    { id: 7, direction: 'inbound', content: 'Your verification code is 123456', timestamp: '2026-07-30 09:00:00' }
  ]
};

let selectedConversationId = null;

// Render conversation list
function renderConversationList() {
  const listEl = document.getElementById('conversation-list');
  listEl.innerHTML = '';

  mockConversations.forEach(conv => {
    const itemEl = document.createElement('div');
    itemEl.className = `conversation-item ${conv.id === selectedConversationId ? 'selected' : ''}`;
    itemEl.dataset.id = conv.id;
    
    const displayName = conv.contact_name || formatPhoneNumber(conv.contact_number);
    
    itemEl.innerHTML = `
      <div class="contact-name">${displayName}</div>
      <div class="last-message">${conv.last_message_text}</div>
    `;
    
    itemEl.addEventListener('click', () => selectConversation(conv.id));
    listEl.appendChild(itemEl);
  });
}

// Render message thread
function renderMessages(conversationId) {
  const listEl = document.getElementById('message-list');
  const headerEl = document.getElementById('message-thread-header');
  
  const conv = mockConversations.find(c => c.id === conversationId);
  if (!conv) return;
  
  const displayName = conv.contact_name || formatPhoneNumber(conv.contact_number);
  const displayNumber = formatPhoneNumber(conv.contact_number);
  
  // Show both name and number if name exists, otherwise just number
  if (conv.contact_name) {
    headerEl.querySelector('.contact-name').textContent = `${displayName} - ${displayNumber}`;
  } else {
    headerEl.querySelector('.contact-name').textContent = displayNumber;
  }
  
  listEl.innerHTML = '';
  
  const messages = mockMessages[conversationId] || [];
  messages.forEach(msg => {
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

// Select a conversation
function selectConversation(id) {
  selectedConversationId = id;
  renderConversationList();
  renderMessages(id);
}

// Format phone number for display
function formatPhoneNumber(number) {
  // Remove all non-digits
  const cleaned = number.replace(/\D/g, '');
  
  // Handle US/Canada numbers (11 digits with leading 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Handle 10-digit numbers
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  // Return as-is if we can't format it
  return number;
}

// Format message timestamp
function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Update status bar
function updateStatusBar() {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  document.getElementById('status-text').textContent = `Last checked: ${timestamp}`;
  
  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unread_count, 0);
  document.getElementById('unread-count').textContent = `${totalUnread} unread`;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderConversationList();
  updateStatusBar();
  
  // Select first conversation by default
  if (mockConversations.length > 0) {
    selectConversation(mockConversations[0].id);
  }
});