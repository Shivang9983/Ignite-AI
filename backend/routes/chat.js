const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { GoogleGenAI } = require('@google/genai');

// @route   POST api/chat
// @desc    Generate content stream from Gemini API
// @access  Private
router.post('/', auth, async (req, res) => {
  const { model, contents, systemInstruction } = req.body;

  if (!contents || !Array.isArray(contents)) {
    return res.status(400).json({ error: 'Contents history is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Set response headers for server-sent events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

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
