const Bull = require('bull');
const { createClient } = require('redis');
import path from 'path';

const redisClient = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || '',
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

const messageQueue = new Bull('message-queue', { redis: redisClient });

messageQueue.process(async (job) => {
    console.log('worker.js: Processing job:', job.id);
    const processor = require(path.join(__dirname, 'message-processor.js'));
    await processor(job);
});

module.exports = messageQueue;
