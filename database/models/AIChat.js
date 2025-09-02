const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['system', 'user', 'assistant', 'tool']
    },
    content: {
        type: String,
        required: true
    },
    tool_call_id: {
        type: String
    },
    name: {
        type: String
    }
}, { _id: false });


const aiChatSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    history: {
        type: [messageSchema],
        default: []
    },
    summary: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('AIChat', aiChatSchema);
