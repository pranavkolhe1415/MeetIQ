/**
 * Meeting Routes
 */
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../config/multer');
const {
  upload: uploadMeeting, analyze, getMeetings, getMeeting,
  deleteMeeting, getProgress, getReport, downloadPDF, getDashboardStats,
} = require('../controllers/meetingController');

router.get('/dashboard', auth, getDashboardStats);
router.post('/upload', auth, upload.single('file'), uploadMeeting);
router.post('/:id/analyze', auth, analyze);
router.get('/:id/progress', auth, getProgress);
router.get('/:id/report', auth, getReport);
router.get('/:id/pdf', auth, downloadPDF);
router.get('/', auth, getMeetings);
router.get('/:id', auth, getMeeting);
router.delete('/:id', auth, deleteMeeting);

module.exports = router;
