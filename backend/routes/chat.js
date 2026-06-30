const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');
const { loadEnv } = require('../utils/env');
const { createRateLimiter, getClientIp } = require('../middleware/rateLimit');

const { geminiApiKey } = loadEnv();

const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many chat requests. Please slow down for a moment.',
  keyGenerator(req) {
    return req.user?.id || getClientIp(req);
  },
});

function isValidPart(part) {
  return Boolean(part) && typeof part.text === 'string' && part.text.trim().length > 0;
}

function isValidContentItem(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  if (!['user', 'model'].includes(item.role)) {
    return false;
  }

  if (!Array.isArray(item.parts) || item.parts.length === 0) {
    return false;
  }

  return item.parts.every(isValidPart);
}

// @route   POST api/chat
// @desc    Generate content stream from Gemini API
// @access  Private
router.post('/', auth, chatLimiter, async (req, res) => {
  const { model, contents, systemInstruction } = req.body;

  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: 'Contents history is required' });
  }

  if (!contents.every(isValidContentItem)) {
    return res.status(400).json({ error: 'Contents format is invalid' });
  }

  if (model !== undefined && (typeof model !== 'string' || model.trim().length === 0 || model.length > 100)) {
    return res.status(400).json({ error: 'Model is invalid' });
  }

  if (
    systemInstruction !== undefined &&
    (typeof systemInstruction !== 'string' || systemInstruction.length > 4000)
  ) {
    return res.status(400).json({ error: 'System instruction is invalid' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    // Set response headers for server-sent events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const responseStream = await ai.models.generateContentStream({
      model: model || 'gemini-2.5-flash',
      contents,
      config
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        // SSE formatting: data: <json>\n\n
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.end();
  } catch (err) {
    console.error("Gemini API Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Failed to call Gemini API' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream generation error' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
