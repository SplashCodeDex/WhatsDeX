const Bull = require('bull');
const path = require('path');

const messageQueue = new Bull('message-queue');

messageQueue.process(path.join(__dirname, 'message-processor.js'));

module.exports = messageQueue;
