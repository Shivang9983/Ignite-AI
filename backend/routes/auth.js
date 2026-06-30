const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check for existing user (case-insensitive)
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp('^' + trimmedUsername + '$', 'i') } 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User Document
    const newUser = new User({
      username: trimmedUsername,
      passwordHash
    });

    // Save to Database
    await newUser.save();

    // Return JWT token
    const payload = {
      user: {
        id: newUser._id,
        username: newUser.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'ignite_ai_secret_key_2026_xyz',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: newUser._id,
            username: newUser.username
          }
        });
      }
    );
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter all fields' });
  }

  const trimmedUsername = username.trim();

  try {
    // Check for user (case-insensitive query)
    const user = await User.findOne({ 
      username: { $regex: new RegExp('^' + trimmedUsername + '$', 'i') } 
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid Credentials' });
    }

    // Return JWT token
    const payload = {
      user: {
        id: user._id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'ignite_ai_secret_key_2026_xyz',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user._id,
            username: user.username
          }
        });
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', auth, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username
  });
});

module.exports = router;
