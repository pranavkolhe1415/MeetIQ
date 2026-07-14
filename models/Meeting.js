/**
 * Meeting Model
 * Stores meeting recordings, transcripts, and analysis results
 */
const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  name: { type: String, default: 'Unknown Speaker' },
  speakerId: { type: String },
  avatar: { type: String, default: '' },
  speakingTime: { type: Number, default: 0 }, // seconds
  speakingPercentage: { type: Number, default: 0 },
  speechCount: { type: Number, default: 0 },
}, { _id: false });

const transcriptSegmentSchema = new mongoose.Schema({
  speaker: { type: String, default: 'Speaker' },
  speakerId: { type: String },
  text: { type: String, required: true },
  startTime: { type: Number, required: true }, // seconds
  endTime: { type: Number, required: true },
}, { _id: true });

const actionItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  assignee: { type: String, default: 'Unassigned' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  dueDate: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { _id: true });

const decisionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  madeBy: { type: String, default: '' },
  timestamp: { type: Number, default: 0 },
}, { _id: true });

const quoteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  speaker: { type: String, default: '' },
  timestamp: { type: Number, default: 0 },
  context: { type: String, default: '' },
}, { _id: true });

const meetingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    default: 'Untitled Meeting',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  // File info
  originalFileName: { type: String },
  fileName: { type: String },
  filePath: { type: String },
  fileSize: { type: Number, default: 0 },
  fileType: { type: String }, // video or audio
  mimeType: { type: String },
  duration: { type: Number, default: 0 }, // seconds
  thumbnail: { type: String, default: '' },

  // Processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'extracting_audio', 'transcribing', 'diarizing', 'analyzing', 'summarizing', 'generating_report', 'completed', 'failed'],
    default: 'uploaded',
  },
  processingProgress: { type: Number, default: 0, min: 0, max: 100 },
  processingStep: { type: String, default: '' },
  errorMessage: { type: String, default: '' },

  // AI Analysis Results
  transcript: [transcriptSegmentSchema],
  fullTranscript: { type: String, default: '' },
  
  // Summary sections
  executiveSummary: { type: String, default: '' },
  meetingOverview: { type: String, default: '' },
  
  // Participants
  participants: [participantSchema],
  
  // Key items
  actionItems: [actionItemSchema],
  decisions: [decisionSchema],
  importantQuotes: [quoteSchema],
  
  // Metrics
  metrics: {
    totalSpeakers: { type: Number, default: 0 },
    totalWords: { type: Number, default: 0 },
    averageSentiment: { type: String, default: 'neutral' },
    engagementScore: { type: Number, default: 0 },
    topicsDiscussed: [{ type: String }],
    meetingEfficiency: { type: Number, default: 0 },
  },

  // PDF
  pdfPath: { type: String, default: '' },
  pdfGenerated: { type: Boolean, default: false },

  // Tags
  tags: [{ type: String }],
  
  // Meeting date (user can override)
  meetingDate: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Index for searching
meetingSchema.index({ title: 'text', fullTranscript: 'text' });
meetingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);
