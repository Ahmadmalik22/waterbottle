const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Helper config values
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'dropx123';

// @route   POST /api/auth/login
// @desc    Login user / Return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate email & password
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Since we only need one admin, we'll auto-seed the database if no user exists.
    let user = await User.findOne({ username }).select('+password');

    // Seed logic for simple setup
    if (!user && username === adminUsername && password === adminPassword) {
        user = await User.create({
            username: adminUsername,
            password: adminPassword,
            role: 'admin'
        });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
