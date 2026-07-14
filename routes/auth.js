/**
 * Auth Routes
 */
const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile, updatePassword, updateSettings } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { signupValidation, loginValidation, profileValidation } = require('../middleware/validation');

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, profileValidation, updateProfile);
router.put('/password', auth, updatePassword);
router.put('/settings', auth, updateSettings);

module.exports = router;
