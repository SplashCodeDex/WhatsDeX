import { createApp } from './app.js';
import context from '../context.js';

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
    const { server, io } = createApp(config);
    const port = config.system.port;

    return new Promise((resolve, reject) => {
      server.listen(port, (err) => {
        if (err) {
          console.error(`❌ Failed to start server on port ${port}:`, err);
          reject(err);
        } else {
          console.log(`✅ ${config?.bot?.name || 'WhatsDeX'} server running on port ${port}`);
          resolve({ server, io });
        }
      });
    });
  } catch (error) {
    console.error('❌ Error creating server:', error);
    throw error;
  }
}

export { startServer };
