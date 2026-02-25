const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// @route   POST /api/messages
// @desc    Create a new message
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Simple validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, error: 'Please include all required fields' });
    }

    const newMessage = await Message.create({ name, email, subject, message });

    res.status(201).json({
      success: true,
      data: newMessage
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   GET /api/messages
// @desc    Get all messages
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   PATCH /api/messages/:id
// @desc    Mark message as read
// @access  Private (Admin)
router.patch('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete message
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
