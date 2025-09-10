const Bull = require('bull');
const path = require('path');

const messageQueue = new Bull('message-queue');


messageQueue.process(async (job) => {
    console.log('worker.js: Processing job:', job.id);
    const processor = require(path.join(__dirname, 'message-processor.js'));
    await processor(job);
});

module.exports = messageQueue;
