// src/renderer/ui/newConversationDialog.js

export function showNewConversationDialog({ dids, onConfirm, onCancel }) {
  const dialog = document.createElement('div');
  dialog.className = 'modal-overlay';
  dialog.innerHTML = `
    <div class="modal">
      <h3>New Conversation</h3>
      <div id="dialog-status-message"></div>
      
      <label class="modal-label">
        DID (From):
        <div class="did-picker-row">
          <button id="refresh-dids-btn" class="icon-btn" title="Refresh DIDs from Voip.ms">
            <img src="assets/refresh-24.png" alt="Refresh" />
          </button>
          <select id="dialog-did-select">
            ${dids.map(d => `<option value="${d.did}">${d.did} - ${d.description || ''}</option>`).join('')}
          </select>
        </div>
      </label>
      
      <label class="modal-label">
        Phone Number (To):
        <input type="tel" id="dialog-phone-input" placeholder="+1234567890" />
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

  const refreshBtn = dialog.querySelector('#refresh-dids-btn');
  const didSelect = dialog.querySelector('#dialog-did-select');
  const statusMessage = dialog.querySelector('#dialog-status-message');
  const okBtn = dialog.querySelector('.btn-ok');
  const cancelBtn = dialog.querySelector('.btn-cancel');
  const phoneInput = dialog.querySelector('#dialog-phone-input');

  function showLoading() {
    refreshBtn.disabled = true;
    statusMessage.textContent = 'Fetching DIDs...';
    statusMessage.className = 'status-loading';
  }

  function hideLoading() {
    refreshBtn.disabled = false;
    statusMessage.textContent = '';
    statusMessage.className = '';
  }

  function showError(message) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-error';
  }

  refreshBtn.addEventListener('click', async () => {
    showLoading();
    
    try {
      const result = await window.electronAPI.getDidsVoipms();
      
      if (result.dids && result.dids.length > 0) {
        // Clear and repopulate dropdown
        didSelect.innerHTML = '';
        result.dids.forEach(d => {
          const option = document.createElement('option');
          option.value = d.did;
          option.textContent = `${d.did} - ${d.description || ''}`;
          didSelect.appendChild(option);
        });
        hideLoading();
      } else {
        showError('No DIDs found.');
      }
    } catch (error) {
      showError('Couldn\'t refresh DIDs.');
    }
  });

  okBtn.addEventListener('click', () => {
    const selectedDid = didSelect.value;
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
      alert('Please enter a phone number.');
      return;
    }
    
    dialog.remove();
    onConfirm(selectedDid, phoneNumber);
  });

  cancelBtn.addEventListener('click', () => {
    dialog.remove();
    onCancel();
  });

  phoneInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      okBtn.click();
    }
  });

  // Focus the phone input
  phoneInput.focus();
}