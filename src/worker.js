const Bull = require('bull');
const { createClient } = require('redis');
const path = require('path');

const redisClient = createClient({
    username: 'default',
    password: 'SPdE0FjL1KunTHso2XnXu84daUfuA9YF',
    socket: {
        host: 'redis-18968.c44.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 18968
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
