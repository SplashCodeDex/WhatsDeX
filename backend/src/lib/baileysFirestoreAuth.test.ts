import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { useFirestoreAuthState } from './baileysFirestoreAuth.js';
import { firebaseService } from '../services/FirebaseService.js';

// Mock FirebaseService
const mockFirebase = {
  getDoc: async () => null,
  setDoc: async () => {},
  deleteDoc: async () => {}
};

describe('Firestore Auth Provider', () => {
  const tenantId = 'test-tenant';
  const botId = 'test-bot';

  test('should initialize with new creds if none exist', async () => {
    // Mock getDoc to return null (no creds)
    const originalGetDoc = firebaseService.getDoc;
    (firebaseService as any).getDoc = async () => null;

    const { state } = await useFirestoreAuthState(tenantId, botId);
    assert.ok(state.creds);
    assert.ok(state.creds.noiseKey);

    firebaseService.getDoc = originalGetDoc;
  });

  test('should save creds to Firestore', async () => {
    let savedData: any = null;
    const originalSetDoc = firebaseService.setDoc;
    (firebaseService as any).setDoc = async (col: string, id: string, data: any) => {
      if (id === 'creds') savedData = data;
    };

    const { state, saveCreds } = await useFirestoreAuthState(tenantId, botId);
    await saveCreds();
    
    assert.ok(savedData);
    assert.ok(savedData.value);

    firebaseService.setDoc = originalSetDoc;
  });
});
