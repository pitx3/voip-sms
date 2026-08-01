// src/main/services/CredentialStorageService.js

import { safeStorage, app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

const CREDENTIALS_FILE = 'credentials.enc';

async function getCredentialPath() {
  return path.join(app.getPath('userData'), CREDENTIALS_FILE);
}

export async function saveCredentials(username, password) {
  const credentials = JSON.stringify({ username, password });
  const encrypted = safeStorage.encryptString(credentials);
  
  // Write encrypted buffer to file
  const filePath = await getCredentialPath();
  await fs.writeFile(filePath, encrypted);
}

export async function getCredentials() {
  const filePath = await getCredentialPath();
  
  try {
    const encrypted = await fs.readFile(filePath);
    const decrypted = safeStorage.decryptString(encrypted);
    return JSON.parse(decrypted);
  } catch (error) {
    return null; // No credentials stored
  }
}

export async function hasCredentials() {
  const filePath = await getCredentialPath();
  
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function deleteCredentials() {
  const filePath = await getCredentialPath();
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File doesn't exist, that's fine
  }
}