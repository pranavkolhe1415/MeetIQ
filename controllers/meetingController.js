/**
 * Meeting Controller - Upload, analyze, list, delete meetings
 */
const path = require('path');
const fs = require('fs');
const Meeting = require('../models/Meeting');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { analyzeMeeting, getMediaDuration } = require('../services/aiService');
const { generatePDF } = require('../services/pdfService');

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const file = req.file;
    const isVideo = file.mimetype.startsWith('video/');
    let duration = 0;
    try { duration = await getMediaDuration(file.path); } catch {}

    const meeting = await Meeting.create({
      user: req.user._id,
      title: req.body.title || file.originalname.replace(/\.[^.]+$/, ''),
      originalFileName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      fileType: isVideo ? 'video' : 'audio',
      mimeType: file.mimetype,
      duration,
      status: 'uploaded',
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { meetingsCount: 1 } });
    await Notification.create({
      user: req.user._id, type: 'meeting_uploaded', title: 'Meeting Uploaded',
      message: `"${meeting.title}" has been uploaded successfully.`, meetingId: meeting._id, icon: 'upload',
    });

    res.status(201).json({ success: true, message: 'Meeting uploaded', data: { meeting } });
  } catch (error) { next(error); }
};

exports.analyze = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.status === 'completed') return res.json({ success: true, message: 'Already analyzed', data: { meeting } });

    meeting.status = 'processing';
    meeting.processingProgress = 5;
    await meeting.save();

    // Send immediate response
    res.json({ success: true, message: 'Analysis started', data: { meetingId: meeting._id } });

    // Run analysis in background
    const updateProgress = async (status, progress, step) => {
      meeting.status = status;
      meeting.processingProgress = progress;
      meeting.processingStep = step;
      await meeting.save();
    };

    try {
      const results = await analyzeMeeting(meeting, updateProgress);
      Object.assign(meeting, results);
      meeting.status = 'completed';
      meeting.processingProgress = 100;
      meeting.processingStep = 'Completed';

      // Generate PDF
      try {
        const pdfPath = await generatePDF(meeting);
        meeting.pdfPath = pdfPath;
        meeting.pdfGenerated = true;
        await Report.create({
          user: req.user._id, meeting: meeting._id,
          title: `Report - ${meeting.title}`, pdfPath,
          pdfSize: fs.statSync(pdfPath).size, status: 'ready',
        });
      } catch (e) { console.error('PDF generation error:', e.message); }

      await meeting.save();
      await User.findByIdAndUpdate(req.user._id, { $inc: { totalAnalysisTime: Math.round(meeting.duration / 60) } });
      await Notification.create({
        user: req.user._id, type: 'report_ready', title: 'Report Ready',
        message: `Analysis complete for "${meeting.title}".`, meetingId: meeting._id, icon: 'check-circle',
      });
    } catch (error) {
      meeting.status = 'failed';
      meeting.errorMessage = error.message;
      await meeting.save();
      await Notification.create({
        user: req.user._id, type: 'error', title: 'Analysis Failed',
        message: `Failed to analyze "${meeting.title}": ${error.message}`, meetingId: meeting._id, icon: 'alert-circle',
      });
    }
  } catch (error) { next(error); }
};

exports.getMeetings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, sort = '-createdAt' } = req.query;
    const query = { user: req.user._id };
    if (search) query.$text = { $search: search };
    if (status) query.status = status;

    const meetings = await Meeting.find(query)
      .select('-transcript -fullTranscript')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Meeting.countDocuments(query);
    res.json({ success: true, data: { meetings, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, data: { meeting } });
  } catch (error) { next(error); }
};

exports.deleteMeeting = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    // Delete files
    if (meeting.filePath && fs.existsSync(meeting.filePath)) fs.unlinkSync(meeting.filePath);
    if (meeting.pdfPath && fs.existsSync(meeting.pdfPath)) fs.unlinkSync(meeting.pdfPath);

    await Report.deleteMany({ meeting: meeting._id });
    await Meeting.findByIdAndDelete(meeting._id);
    await User.findByIdAndUpdate(req.user._id, { $inc: { meetingsCount: -1 } });

    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) { next(error); }
};

exports.getProgress = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id })
      .select('status processingProgress processingStep errorMessage');
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    res.json({ success: true, data: { meeting } });
  } catch (error) { next(error); }
};

exports.getReport = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    if (meeting.status !== 'completed') return res.status(400).json({ success: false, message: 'Report not ready' });
    res.json({ success: true, data: { meeting } });
  } catch (error) { next(error); }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, user: req.user._id });
    if (!meeting || !meeting.pdfPath) return res.status(404).json({ success: false, message: 'PDF not found' });
    if (!fs.existsSync(meeting.pdfPath)) {
      // Regenerate PDF
      try {
        const pdfPath = await generatePDF(meeting);
        meeting.pdfPath = pdfPath;
        meeting.pdfGenerated = true;
        await meeting.save();
      } catch { return res.status(404).json({ success: false, message: 'PDF not available' }); }
    }

    await Report.findOneAndUpdate({ meeting: meeting._id }, { $inc: { downloadCount: 1 } });
    await Notification.create({
      user: req.user._id, type: 'pdf_downloaded', title: 'PDF Downloaded',
      message: `Report for "${meeting.title}" downloaded.`, meetingId: meeting._id, icon: 'download',
    });

    res.download(meeting.pdfPath, `MeetIQ_Report_${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  } catch (error) { next(error); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const totalMeetings = await Meeting.countDocuments({ user: userId });
    const completedMeetings = await Meeting.countDocuments({ user: userId, status: 'completed' });
    const processingMeetings = await Meeting.countDocuments({ user: userId, status: { $in: ['processing','extracting_audio','transcribing','diarizing','analyzing','summarizing','generating_report'] } });
    const recentMeetings = await Meeting.find({ user: userId }).select('-transcript -fullTranscript').sort('-createdAt').limit(5);
    const user = await User.findById(userId);

    res.json({
      success: true, data: {
        stats: { totalMeetings, completedMeetings, processingMeetings, totalAnalysisTime: user.totalAnalysisTime || 0, },
        recentMeetings,
      },
    });
  } catch (error) { next(error); }
};
