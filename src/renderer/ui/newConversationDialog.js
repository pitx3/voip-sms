// src/renderer/ui/newConversationDialog.js

export function showNewConversationDialog({ dids, onConfirm, onCancel }) {
  const dialog = document.createElement('div');
  dialog.className = 'modal-overlay';
  dialog.innerHTML = `
    <div class="modal">
      <h3>New Conversation</h3>
      
      <label class="modal-label">
        DID (From):
        <select id="dialog-did-select">
          ${dids.map(d => `<option value="${d.did}">${d.did} - ${d.description || ''}</option>`).join('')}
        </select>
      </label>
      
      <label class="modal-label">
        Phone Number (To):
        <input type="tel" id="dialog-phone-input" placeholder="5551234567" />
      </label>
      
      <div class="contact-list">
        <em>Contacts coming soon...</em>
      </div>
      
      <div class="modal-buttons">
        <button class="btn btn-cancel">Cancel</button>
        <button class="btn btn-ok">OK</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  const didSelect = dialog.querySelector('#dialog-did-select');
  const phoneInput = dialog.querySelector('#dialog-phone-input');
  const okBtn = dialog.querySelector('.btn-ok');
  const cancelBtn = dialog.querySelector('.btn-cancel');
  
  function cleanup() {
    dialog.remove();
  }
  
  cancelBtn.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });
  
  okBtn.addEventListener('click', () => {
    const did = didSelect.value;
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
      phoneInput.focus();
      return;
    }
    
    cleanup();
    if (onConfirm) onConfirm(did, phoneNumber);
  });
  
  // Close on Escape key
  function handleEscape(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', handleEscape);
      cleanup();
      if (onCancel) onCancel();
    }
  }
  document.addEventListener('keydown', handleEscape);
  
  // Focus phone input
  phoneInput.focus();
}