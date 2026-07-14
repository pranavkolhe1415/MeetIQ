/**
 * Notification Model
 * Real-time notifications for user activities
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['report_ready', 'pdf_downloaded', 'meeting_uploaded', 'analysis_complete', 'error', 'info'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
  },
  read: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: 'bell',
  },
}, {
  timestamps: true,
});

// Auto-delete old notifications (30 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
