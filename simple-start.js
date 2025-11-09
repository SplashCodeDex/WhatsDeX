#!/usr/bin/env node
/**
 * Simplified WhatsDeX Startup
 * Bypasses complex loading issues for quick testing
 */

import CFonts from 'cfonts';

// Display banner
CFonts.say('WhatsDeX', {
  font: 'block',
  align: 'center',
  gradient: ['cyan', 'magenta']
});

console.log('🚀 WhatsDeX Simple Startup');
console.log('==========================\n');

async function simpleStart() {
  try {
    console.log('📋 Step 1: Testing imports...');
    
    // Test database connection
    try {
      const dbManager = (await import('./src/utils/DatabaseManager.js')).default;
      const health = await dbManager.healthCheck();
      console.log(`✅ Database: ${health.status}`);
    } catch (dbError) {
      console.log(`⚠️  Database: ${dbError.message}`);
    }
    
    // Test basic WhatsApp connection
    console.log('\n📱 Step 2: Starting basic WhatsApp connection...');
    
    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = await import('@whiskeysockets/baileys');
    
    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    
    const sock = makeWASocket({
      auth: state,
      // Remove printQRInTerminal as it's deprecated
      logger: { 
        level: 'silent',
        child: () => ({ level: 'silent', debug: () => {}, info: () => {}, warn: () => {}, error: () => {} })
      }, 
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('📱 QR Code generated! Scan with WhatsApp');
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('🔄 Connection closed, reconnecting...', shouldReconnect);
        
        if (shouldReconnect) {
          setTimeout(() => simpleStart(), 3000); // Simple reconnect after 3s
        }
      } else if (connection === 'open') {
        console.log('✅ Connected to WhatsApp successfully!');
        console.log('🎉 Bot is ready! Try sending a message');
      }
    });
    
    // Basic message handler
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;
      
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
      
      if (text === '.ping') {
        await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! 🏓 WhatsDeX is working!' });
        console.log('✅ Responded to ping command');
      }
    });
    
    console.log('📱 WhatsApp socket created, waiting for QR or connection...');
    
  } catch (error) {
    console.error('❌ Startup error:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  process.exit(0);
});

// Start the simple version
simpleStart();