import MultiTenantApp from './server/multiTenantApp.js';
import { ConfigService } from './services/ConfigService.js';

/**
 * Start the server application
 * @returns {Promise<Object>} - { server, io } - Started server instances
 */
async function startServer() {
  const config = ConfigService.getInstance();
  
  if (!config.get('USE_SERVER')) {
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
