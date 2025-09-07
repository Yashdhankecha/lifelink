const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for hospital requests
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false // Not required for user requests
  },
  patientName: {
    type: String,
    required: false, // For hospital requests
    trim: true,
    maxlength: [100, 'Patient name cannot be more than 100 characters']
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  unitsNeeded: {
    type: Number,
    required: [true, 'Units needed is required'],
    min: [1, 'At least 1 unit is required'],
    max: [10, 'Maximum 10 units allowed per request']
  },
  urgency: {
    type: String,
    required: [true, 'Urgency level is required'],
    enum: ['low', 'medium', 'high', 'normal', 'critical'],
    default: 'medium'
  },
  hospitalName: {
    type: String,
    required: false, // Not required for hospital requests
    trim: true,
    maxlength: [100, 'Hospital name cannot be more than 100 characters']
  },
  hospitalAddress: {
    type: String,
    required: false, // Not required for hospital requests
    trim: true,
    maxlength: [200, 'Hospital address cannot be more than 200 characters']
  },
  location: {
    latitude: {
      type: Number,
      required: false, // Not required for hospital requests
      min: [-90, 'Invalid latitude'],
      max: [90, 'Invalid latitude']
    },
    longitude: {
      type: Number,
      required: false, // Not required for hospital requests
      min: [-180, 'Invalid longitude'],
      max: [180, 'Invalid longitude']
    }
  },
  requiredDate: {
    type: Date,
    required: false,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  acceptedDonors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  acceptedAt: {
    type: Date,
    default: null
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Validation to ensure either requesterId or hospital is provided
bloodRequestSchema.pre('validate', function(next) {
  if (!this.requesterId && !this.hospital) {
    return next(new Error('Either requesterId or hospital must be provided'));
  }
  if (this.requesterId && this.hospital) {
    return next(new Error('Cannot have both requesterId and hospital'));
  }
  next();
});

// Index for efficient queries
bloodRequestSchema.index({ location: '2dsphere' });
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ requesterId: 1 });
bloodRequestSchema.index({ hospital: 1 });
bloodRequestSchema.index({ donorId: 1 });
bloodRequestSchema.index({ acceptedBy: 1 });

// Virtual for distance calculation (will be used in queries)
bloodRequestSchema.virtual('distance').get(function() {
  return this._distance;
});

// Method to calculate distance from a point
bloodRequestSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (this.location.latitude - lat) * Math.PI / 180;
  const dLng = (this.location.longitude - lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat * Math.PI / 180) * Math.cos(this.location.latitude * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
