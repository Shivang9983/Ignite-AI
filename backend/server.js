require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB Atlas (with local fallback if user URI is default/empty)
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-chat';
const isPlaceholder = mongoURI.includes('<username>') || mongoURI.includes('<password>');
const connectionString = isPlaceholder ? 'mongodb://localhost:27017/ai-chat' : mongoURI;

mongoose.connect(connectionString)
  .then(() => {
    console.log(`Connected to MongoDB database${isPlaceholder ? ' (Local fallback since MONGO_URI is placeholder)' : ''}`);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    console.log('Ensure MongoDB service is running locally or specify your Atlas MONGO_URI in backend/.env');
  });

// Middlewares
app.use(cors());
app.use(express.json());

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

// Serve static assets in production if needed (optional hook)
// app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server started on port ${PORT}`);
});
