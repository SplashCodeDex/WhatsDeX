/**
 * OpenClaw Import Utility
 *
 * tsx resolves workspace packages through TypeScript source files via the
 * "types"/"development" conditions in openclaw's exports map. This causes
 * ERR_PACKAGE_PATH_NOT_EXPORTED when a transitive dependency
 * (@mariozechner/pi-coding-agent) cannot be resolved by tsx's CJS interop.
 *
 * This utility bypasses tsx's module resolution entirely by importing directly
 * from openclaw's pre-built dist/ directory via file:// URLs — the same
 * pattern used by WhatsappAdapter.
 */

import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import logger from './logger.js';

function findPackageRoot(startDir: string, packageName: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, 'node_modules', packageName, 'package.json');
    if (fs.existsSync(candidate)) return path.dirname(candidate);
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const _thisDir = path.dirname(fileURLToPath(import.meta.url));
const _openclawRoot = findPackageRoot(_thisDir, 'openclaw');

function distUrl(subpath: string): string | null {
  if (!_openclawRoot) return null;
  return pathToFileURL(path.join(_openclawRoot, 'dist', subpath)).href;
}

// ── Module Cache ──────────────────────────────────────────────────────

const _cache: Record<string, any> = {};

async function loadDist(subpath: string): Promise<any> {
  if (_cache[subpath]) return _cache[subpath];
  const url = distUrl(subpath);
  if (!url) {
    logger.error(`[openclawImports] openclaw package root not found — cannot load ${subpath}`);
    throw new Error(`openclaw not found for subpath: ${subpath}`);
  }
  try {
    const mod = await import(/* @vite-ignore */ url);
    _cache[subpath] = mod;
    return mod;
  } catch (e) {
    logger.error(`[openclawImports] Failed to load openclaw dist module: ${subpath}`, e);
    throw e;
  }
}

// ── Public API ────────────────────────────────────────────────────────

export async function getTelegramSend() {
  return await loadDist('telegram/send.js');
}

export async function getSignalSend() {
  return await loadDist('signal/send.js');
}

export async function getSlackSend() {
  return await loadDist('slack/send.js');
}

export async function getIMessageSend() {
  return await loadDist('imessage/send.js');
}

export async function getDiscordSend() {
  return await loadDist('discord/send.js');
}

export async function getOpenClawRoot() {
  return await loadDist('index.js');
}

export async function getWorkspaceSkills() {
  return await loadDist('agents/skills/workspace.js');
}

export async function getWebOutbound() {
  return await loadDist('web/outbound.js');
}

export async function getWebActiveListener() {
  return await loadDist('web/active-listener.js');
}

export async function getFacebookWebhook() {
  return await loadDist('facebook/webhook.js');
}
