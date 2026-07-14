/**
 * Chat Controller - AI meeting Q&A
 */
const Chat = require('../models/Chat');
const Meeting = require('../models/Meeting');
const { answerQuestion } = require('../services/chatService');

exports.sendMessage = async (req, res, next) => {
  try {
    const { message, meetingId } = req.body;
    const meeting = await Meeting.findOne({ _id: meetingId, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    let chat = await Chat.findOne({ user: req.user._id, meeting: meetingId });
    if (!chat) chat = await Chat.create({ user: req.user._id, meeting: meetingId, messages: [] });

    chat.messages.push({ role: 'user', content: message });

    const answer = await answerQuestion(message, meeting.fullTranscript, meeting.participants);
    chat.messages.push({ role: 'assistant', content: answer });
    await chat.save();

    res.json({ success: true, data: { answer, chatId: chat._id } });
  } catch (error) { next(error); }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ user: req.user._id, meeting: req.params.meetingId });
    res.json({ success: true, data: { messages: chat?.messages || [] } });
  } catch (error) { next(error); }
};
