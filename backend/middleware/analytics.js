let redisClient = null;

// Try to import Redis client, but don't fail if Redis is not available
try {
  const redisModule = await import('../lib/redis.js');
  redisClient = redisModule.default;
} catch (error) {
  console.warn('⚠️ Redis not available for analytics tracking:', error.message);
}

/**
 * Middleware to track command usage analytics in Redis.
 * This should be called after a command has been successfully identified and is about to be executed.
 * @param {string} commandName - The name of the command being executed.
 */
const trackCommandUsage = async (commandName) => {
  if (!commandName || !redisClient) return;

  try {
    const pipeline = redisClient.pipeline();
    const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format

    // Increment total usage for the specific command
    pipeline.hincrby('analytics:commands', commandName, 1);

    // Increment total commands processed
    pipeline.incr('analytics:totalCommands');

    // Increment daily total for the specific command
    pipeline.hincrby(`analytics:daily:${today}`, commandName, 1);

    // Increment daily total for all commands
    pipeline.incr(`analytics:daily:${today}:total`);

    await pipeline.exec();
    console.log(`📊 Tracked usage for command: ${commandName}`);
  } catch (error) {
    console.error('❌ Failed to track command analytics:', error);
  }
};

export default trackCommandUsage;
