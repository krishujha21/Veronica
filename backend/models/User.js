const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,  // null for Google OAuth users
    minlength: 6,
    default: null
  },
  username: {
    type: String,
    trim: true
  },
  // ─── Google OAuth fields ─────────────────────────────────────────────────────
  googleId: {
    type: String,
    default: null,
    sparse: true  // allows multiple null values on unique-like index
  },
  avatar: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving — only if it was modified and is not null
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method — safe for passwordless accounts
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
