const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
  isError: { type: Boolean }
});

const ConversationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat'
  },
  model: {
    type: String,
    default: 'gemini-2.5-flash'
  },
  systemInstruction: {
    type: String,
    default: ''
  },
  messages: [MessageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updatedAt timestamp
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
