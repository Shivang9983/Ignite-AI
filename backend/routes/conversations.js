const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

// @route   GET api/conversations
// @desc    Get user conversations
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const list = await Conversation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Fetch conversations error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/conversations
// @desc    Save (create or update) a conversation
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { conversation } = req.body;
    if (!conversation || !conversation.id) {
      return res.status(400).json({ error: 'Invalid conversation data' });
    }

    const { id, title, model, systemInstruction, messages } = conversation;

    // Find if conversation already exists for this user
    let existing = await Conversation.findOne({ id, userId: req.user.id });

    if (existing) {
      existing.title = title || existing.title;
      existing.model = model || existing.model;
      existing.systemInstruction = systemInstruction !== undefined ? systemInstruction : existing.systemInstruction;
      existing.messages = messages || existing.messages;
      await existing.save();
      res.json(existing);
    } else {
      const newConv = new Conversation({
        id,
        userId: req.user.id,
        title: title || 'New Chat',
        model: model || 'gemini-2.5-flash',
        systemInstruction: systemInstruction || '',
        messages: messages || []
      });
      await newConv.save();
      res.json(newConv);
    }
  } catch (err) {
    console.error("Save conversation error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE api/conversations/:id
// @desc    Delete a conversation
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await Conversation.deleteOne({ id: req.params.id, userId: req.user.id });
    if (result.deletedCount > 0) {
      res.json({ success: true, message: 'Conversation deleted' });
    } else {
      res.status(404).json({ error: 'Conversation not found' });
    }
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
