// firstRun.js - Initial sync on first app run

const statusText = document.getElementById('status-text');
const errorMessage = document.getElementById('error-message');
const errorButtons = document.getElementById('error-buttons');
const progressText = document.getElementById('progress-text');
const retryBtn = document.getElementById('retry-btn');
const abortBtn = document.getElementById('abort-btn');

// Track current step for retry
let currentStep = 'dids';

// Start the sync process
async function runFirstRunSync() {
  try {
    // Step 1: Sync DIDs (getDids() auto-syncs to DB)
    currentStep = 'dids';
    statusText.textContent = 'Syncing DIDs...';
    progressText.textContent = '';
    
    const didResult = await window.electronAPI.getDidsVoipms();
    
    if (!didResult.dids) {
      throw new Error('DID sync failed: no DIDs returned');
    }
    
    console.log(`✅ Synced ${didResult.dids.length} DIDs`);
    
    // Step 2: Sync Messages
    currentStep = 'messages';
    statusText.textContent = 'Syncing messages...';
    
    const msgResult = await window.electronAPI.syncMessagesVoipms();
    
    if (!msgResult.success) {
      throw new Error(`Message sync failed: ${msgResult.error}`);
    }
    
    console.log(`✅ Synced ${msgResult.count} messages`);
    
    // Step 3: Mark first run complete
    await window.electronAPI.setSetting('first_run_complete', 'true');
    
    // Step 4: Notify main process to open main app
    window.electronAPI.firstRunComplete();
    
  } catch (error) {
    showSyncError(error.message);
  }
}

// Show error with retry/abort options
function showSyncError(message) {
  statusText.textContent = 'Sync Failed';
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  errorButtons.style.display = 'flex';
  progressText.textContent = '';
  
  document.querySelector('.spinner').style.display = 'none';
}

// Retry sync
retryBtn.addEventListener('click', () => {
  errorMessage.style.display = 'none';
  errorButtons.style.display = 'none';
  document.querySelector('.spinner').style.display = 'block';
  runFirstRunSync();
});

// Abort - return to credentials screen
abortBtn.addEventListener('click', () => {
  window.electronAPI.firstRunAborted();
});

// Start sync when page loads
runFirstRunSync();