// src/renderer/credentials.js

// State tracking
let lastTestedUsername = null;
let lastTestedPassword = null;
let lastTestPassed = false;

// DOM Elements
const form = document.getElementById('credentials-form');
const testConnectionBtn = document.getElementById('test-connection-btn');
const saveBtn = document.getElementById('save-btn');
const testResult = document.getElementById('test-result');
const usernameInput = document.getElementById('api-username');
const passwordInput = document.getElementById('api-password');

// DEBUG: Verify elements are found
console.log('Form element:', form);
console.log('Test button:', testConnectionBtn);
console.log('Save button:', saveBtn);

// ===========================================
// Test Connection Button Handler
// ===========================================
testConnectionBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  // Validate not empty
  if (!username || !password) {
    showTestResult('Please enter both username and password', 'error');
    return;
  }
  
  setButtonsState(true, 'Testing...');
  
  try {
    const result = await window.electronAPI.testCredentials({ username, password });
    
    if (result.success) {
      showTestResult('✓ Connection successful!', 'success');
      lastTestPassed = true;
      lastTestedUsername = username;
      lastTestedPassword = password;
    } else {
      showTestResult('✗ ' + result.message, 'error');
      lastTestPassed = false;
      lastTestedUsername = username;
      lastTestedPassword = password;
    }
  } catch (error) {
    showTestResult('✗ ' + error.message, 'error');
    lastTestPassed = false;
  } finally {
    setButtonsState(false, 'Test Connection');
  }
});

// ===========================================
// Form Submit (Save & Continue) Handler
// ===========================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  // Validate not empty
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  // Determine if we need to test
  let needToTest = true;
  
  if (
    lastTestPassed === true &&
    lastTestedUsername === username &&
    lastTestedPassword === password
  ) {
    needToTest = false;
  }
  
  // Test if needed
  if (needToTest) {
    setButtonsState(true, 'Testing...');
    
    try {
      const testResult = await window.electronAPI.testCredentials({ username, password });
      
      if (!testResult.success) {
        showTestResult('✗ ' + testResult.message, 'error');
        lastTestPassed = false;
        setButtonsState(false, 'Save & Continue');
        return;
      }
      
      // Test passed
      lastTestPassed = true;
      lastTestedUsername = username;
      lastTestedPassword = password;
    } catch (error) {
      showTestResult('✗ ' + error.message, 'error');
      lastTestPassed = false;
      setButtonsState(false, 'Save & Continue');
      return;
    }
  }
  
  // Save credentials
  setButtonsState(true, 'Saving...');
  
  try {
    const saveResult = await window.electronAPI.saveCredentials({ username, password });
    
    if (saveResult.success) {
      // Credentials saved — main process will close this window and open main app
      showTestResult('✓ Credentials saved! Opening app...', 'success');
      // Don't call window.close() - main process handles it
    } else {
      showTestResult('✗ ' + saveResult.message, 'error');
      setButtonsState(false, 'Save & Continue');
    }
  } catch (error) {
    showTestResult('✗ ' + error.message, 'error');
    setButtonsState(false, 'Save & Continue');
  }
});

// ===========================================
// Helper Functions
// ===========================================
function showTestResult(message, type) {
  testResult.textContent = message;
  testResult.className = 'test-result ' + type;
}

function setButtonsState(disabled, testBtnText) {
  testConnectionBtn.disabled = disabled;
  saveBtn.disabled = disabled;
  testConnectionBtn.textContent = testBtnText;
}