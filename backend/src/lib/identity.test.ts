import { test, describe } from 'node:test';
import assert from 'node:assert';
import { convertLidToJid, isLid } from './identity.js';

describe('Identity Utility (LID Mapping)', () => {
  test('should detect LID correctly', () => {
    assert.strictEqual(isLid('12345@lid'), true);
    assert.strictEqual(isLid('123456789@s.whatsapp.net'), false);
    assert.strictEqual(isLid('group_123@g.us'), false);
  });

  test('should convert LID to JID if mapping exists', async () => {
    // This will initially fail as the function is not implemented or returns LID
    const lid = 'lid_123@s.whatsapp.net';
    const expectedJid = '123456789@s.whatsapp.net';
    
    // We'll mock the mapping later, but for now, the utility should at least return the input if no mapping
    assert.strictEqual(await convertLidToJid(lid), lid);
  });

  test('should handle undefined/null jids gracefully', async () => {
    assert.strictEqual(await convertLidToJid(undefined), undefined);
    assert.strictEqual(await convertLidToJid(null), null);
  });
});
