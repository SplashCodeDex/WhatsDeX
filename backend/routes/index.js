/**
 * @fileoverview Routes Barrel Export
 * Centralized exports for all API routes
 *
 * Usage: import { analyticsRouter, usersRouter } from './routes/index.js';
 */

export { default as analyticsRouter } from './analytics.js';
export { default as auditRouter } from './audit.js';
export { default as authRouter } from './auth.js';
export { default as moderationRouter } from './moderation.js';
export { default as multiTenantRouter } from './multiTenant.js';
export { default as settingsRouter } from './settings.js';
export { default as usersRouter } from './users.js';
