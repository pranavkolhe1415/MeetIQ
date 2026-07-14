/**
 * Chat Routes
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { chatValidation } = require('../middleware/validation');
const { sendMessage, getChatHistory } = require('../controllers/chatController');

router.post('/', auth, chatValidation, sendMessage);
router.get('/:meetingId', auth, getChatHistory);

module.exports = router;
