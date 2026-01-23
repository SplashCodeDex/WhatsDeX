import { test, describe } from 'node:test';
import assert from 'node:assert';
import { serialize } from './simple.js';

describe('Message Wrapper Serialization', () => {
  const mockBot = {
    user: { id: 'bot@s.whatsapp.net' },
    decodeJid: (jid: string) => jid.split(':')[0] + '@s.whatsapp.net'
  };

  test('should normalize sender JID from LID', async () => {
    const rawMsg = {
      key: {
        remoteJid: '12345@lid',
        fromMe: false,
        id: 'msg_123'
      },
      message: {
        conversation: 'hello'
      }
    };

    const m = serialize(mockBot, rawMsg);
    // Initially this will fail because serialize uses decodeJid which doesn't handle @lid specifically
    // and we want to ensure it passes through our new identity mapping in the future
    assert.strictEqual(m.sender, '12345@lid');
    assert.strictEqual(m.chat, '12345@lid');
  });

  test('should normalize quoted sender JID from LID', async () => {
    const rawMsg = {
      key: {
        remoteJid: 'group@g.us',
        fromMe: false,
        id: 'msg_123',
        participant: 'sender@s.whatsapp.net'
      },
      message: {
        extendedTextMessage: {
          text: 'reply',
          contextInfo: {
            stanzaId: 'parent_123',
            participant: 'quoted_123@lid',
            quotedMessage: {
              conversation: 'parent'
            }
          }
        }
      }
    };

    const m = serialize(mockBot, rawMsg);
    assert.strictEqual(m.quoted?.sender, 'quoted_123@lid');
  });
});
