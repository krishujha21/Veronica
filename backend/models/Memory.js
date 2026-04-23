const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  bio: {
    type: String,
    default: '',
    trim: true
  },
  ragEnabled: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user has exactly one memory record
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

memorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Memory', memorySchema);
