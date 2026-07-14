/**
 * Chat Routes
 */
const express = require('express');
const router = express.Router();

const { auth } = require('../middleware/auth');
const { chatValidation } = require('../middleware/validation');

const {
    sendMessage,
    getChatHistory,
    aiChat
} = require('../controllers/chatController');

// Send Chat Message
router.post('/', auth, chatValidation, sendMessage);

// Get Chat History
router.get('/:meetingId', auth, getChatHistory);

// AI Chat Streaming
// router.post('/stream', auth, aiChat);

module.exports = router;