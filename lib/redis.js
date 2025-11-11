import Redis from 'ioredis';
import config from '../config.js';

const redisConfig = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  // Add other ioredis options as needed
  // For example, connectionName, db, family, enableOfflineQueue, etc.
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('✅ Redis client connected successfully!');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err);
  // Depending on your application's needs, you might want to
  // implement a more robust error handling strategy here,
  // such as attempting to reconnect or gracefully degrading functionality.
});

export default redisClient;
