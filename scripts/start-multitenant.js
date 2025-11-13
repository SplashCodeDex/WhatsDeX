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

// Start the backend API server (nodemon for auto-reload, quiet output)
console.log('🔧 Starting Backend API...');
const backendProcess = spawn('npm', ['run', 'start:dev'], {
  cwd: __dirname + '/..',
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true
});

backendProcess.stdout.on('data', (data) => {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    // Filter nodemon chatter
    if (line.startsWith('[nodemon]')) continue;
    console.log(`[Backend] ${line}`);
  }
});

backendProcess.stderr.on('data', (data) => {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('[nodemon]')) continue;
    console.log(`[Backend Error] ${line}`);
  }
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