/**
 * Validation Middleware
 * Input validation and sanitization using express-validator
 */
const { body, validationResult } = require('express-validator');

// Handle validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Signup validation rules
const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation,
];

// Login validation rules
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidation,
];

// Profile update validation
const profileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Company name too long'),
  body('jobTitle')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Job title too long'),
  handleValidation,
];

// Chat message validation
const chatValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message too long'),
  body('meetingId')
    .notEmpty().withMessage('Meeting ID is required')
    .isMongoId().withMessage('Invalid meeting ID'),
  handleValidation,
];

module.exports = {
  signupValidation,
  loginValidation,
  profileValidation,
  chatValidation,
  handleValidation,
};
