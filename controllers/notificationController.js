/**
 * Notification Controller
 */
const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort('-createdAt').limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    if (req.params.id === 'all') {
      await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    } else {
      await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
    }
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) { next(error); }
};
