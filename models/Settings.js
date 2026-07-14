/**
 * Settings Model
 * User-specific application settings
 */
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  theme: {
    type: String,
    enum: ['dark', 'light', 'system'],
    default: 'dark',
  },
  language: {
    type: String,
    default: 'en',
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    reportReady: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
  },
  privacy: {
    shareAnalytics: { type: Boolean, default: false },
    publicProfile: { type: Boolean, default: false },
  },
  meeting: {
    autoAnalyze: { type: Boolean, default: true },
    defaultTitle: { type: String, default: '' },
    keepOriginalFile: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Settings', settingsSchema);
