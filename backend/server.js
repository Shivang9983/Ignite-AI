require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/env');

const app = express();
const env = loadEnv();

app.disable('x-powered-by');
app.set('trust proxy', 1);

mongoose.connect(env.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB database');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

const allowedOrigins = new Set(env.allowedOrigins);
const localOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin) || localOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin is not allowed'));
  },
}));
app.use(express.json({ limit: '1mb' }));

// Import Routes
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');
const chatRoutes = require('./routes/chat');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/chat', chatRoutes);

// Health Check / Test Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ignite AI Chat backend is running smoothly' });
});

app.use((err, req, res, next) => {
  if (err.message === 'CORS origin is not allowed') {
    return res.status(403).json({ error: err.message });
  }

  return next(err);
});

// Serve static assets in production if needed (optional hook)
// app.use(express.static(path.join(__dirname, '../dist')));

app.listen(env.port, () => {
  console.log(`Backend server started on port ${env.port}`);
});
