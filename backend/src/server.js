import MultiTenantApp from './server/multiTenantApp.js';
import context from './lib/context.js';

/**
 * Start the server application
 * @param {Object} config - Configuration object (optional, defaults to context.config)
 * @returns {Promise<Object>} - { server, io } - Started server instances
 */
async function startServer(config = context.config) {
  if (!config.system.useServer) {
    console.log('🔕 Server disabled in configuration');
    return null;
  }

  try {
    const app = new MultiTenantApp();
    await app.initialize();
    await app.start();
    return { server: app.server, io: null };
  } catch (error) {
    console.error('❌ Error creating server:', error);
    throw error;
  }
}

export { startServer };
