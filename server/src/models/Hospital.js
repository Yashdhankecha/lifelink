const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Contact person name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['hospital'],
    default: 'hospital'
  },
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    maxlength: [100, 'Hospital name cannot be more than 100 characters']
  },
  address: {
    type: String,
    required: [true, 'Hospital address is required'],
    trim: true,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedStatus: {
    type: Boolean,
    default: false
  },
  licenseNumber: {
    type: String,
    required: [true, 'Hospital license number is required'],
    unique: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  state: {
    type: String,
    trim: true,
    default: ''
  },
  pincode: {
    type: String,
    trim: true,
    default: ''
  },
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    newRequestAlerts: {
      type: Boolean,
      default: true
    },
    donorResponseAlerts: {
      type: Boolean,
      default: true
    },
    completionAlerts: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  donorList: [{
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    donorName: {
      type: String,
      required: true
    },
    donorEmail: {
      type: String,
      required: true
    },
    donorPhone: {
      type: String,
      required: true
    },
    bloodGroup: {
      type: String,
      required: true
    },
    lastDonationDate: {
      type: Date,
      default: Date.now
    },
    totalDonations: {
      type: Number,
      default: 1
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  emailVerificationOTP: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Encrypt password using bcrypt
hospitalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match hospital entered password to hashed password in database
hospitalSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare password method (alias for matchPassword)
hospitalSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Hospital', hospitalSchema);
