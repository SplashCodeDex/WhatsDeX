#!/usr/bin/env node

/**
 * Multi-tenant WhatsDeX Startup Script
 * Starts both the Next.js frontend and the multi-tenant backend
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Multi-tenant WhatsDeX SaaS Platform...\n');

// Start the Next.js development server
console.log('📱 Starting Frontend (Next.js)...');
const frontendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '../web'),
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

frontendProcess.stdout.on('data', (data) => {
  console.log(`[Frontend] ${data.toString().trim()}`);
});

frontendProcess.stderr.on('data', (data) => {
  console.log(`[Frontend Error] ${data.toString().trim()}`);
});

// Start the backend API server
console.log('🔧 Starting Backend API...');
const backendProcess = spawn('node', ['server.js'], {
  cwd: __dirname + '/..',
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

backendProcess.stdout.on('data', (data) => {
  console.log(`[Backend] ${data.toString().trim()}`);
});

backendProcess.stderr.on('data', (data) => {
  console.log(`[Backend Error] ${data.toString().trim()}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Multi-tenant WhatsDeX...');
  
  frontendProcess.kill('SIGTERM');
  backendProcess.kill('SIGTERM');
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

// Keep the script running
process.stdin.resume();