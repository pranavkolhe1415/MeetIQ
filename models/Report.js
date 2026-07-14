/**
 * Report Model
 * Stores generated report metadata and PDF references
 */
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
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
  },
  title: {
    type: String,
    required: true,
  },
  pdfPath: {
    type: String,
    default: '',
  },
  pdfSize: {
    type: Number,
    default: 0,
  },
  sections: {
    executiveSummary: { type: Boolean, default: true },
    meetingOverview: { type: Boolean, default: true },
    participants: { type: Boolean, default: true },
    transcript: { type: Boolean, default: true },
    actionItems: { type: Boolean, default: true },
    decisions: { type: Boolean, default: true },
    quotes: { type: Boolean, default: true },
    metrics: { type: Boolean, default: true },
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'failed'],
    default: 'generating',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', reportSchema);
