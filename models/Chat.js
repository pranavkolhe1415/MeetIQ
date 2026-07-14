/**
 * Chat Model
 * Stores AI chat messages for meeting conversations
 */
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { _id: true });

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true,
  },
  messages: [messageSchema],
}, {
  timestamps: true,
});

// Compound index for efficient querying
chatSchema.index({ user: 1, meeting: 1 });

module.exports = mongoose.model('Chat', chatSchema);
