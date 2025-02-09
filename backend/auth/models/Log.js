const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  // User who made the rental
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Details of the rented item
  item: {
    type: Number,
    refPath: 'Ware', // Dynamic reference to different item types
    required: true
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['Desk', 'Ware'] // Add more item types as needed
  },
  
  // Rental details
  rentalDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date,
    default: null
  },
  
  // Status of the rental
  status: {
    type: String,
    enum: ['ACTIVE', 'RETURNED', 'OVERDUE'],
    default: 'ACTIVE'
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to check if the rental is overdue
LogSchema.virtual('isOverdue').get(function() {
  if (this.actualReturnDate) return false;
  return new Date() > this.expectedReturnDate;
});

// Method to mark as returned
LogSchema.methods.markAsReturned = async function() {
  this.actualReturnDate = new Date();
  this.status = 'RETURNED';
  
  // Calculate penalty if applicable
  if (this.isOverdue) {
    // Example penalty calculation (customize as needed)
    // const overduedays = Math.ceil((new Date() - this.expectedReturnDate) / (1000 * 60 * 60 * 24));
    // this.penalty = overduedays * 1000; // 1000 won per overdue day
  }
  
  return this.save();
};

// Pre-save hook to update status
LogSchema.pre('save', function(next) {
  if (this.actualReturnDate) {
    this.status = 'RETURNED';
  } else if (new Date() > this.expectedReturnDate) {
    this.status = 'OVERDUE';
  }
  next();
});

// Static method to find active rentals for a user
LogSchema.statics.findActiveRentals = function(userId) {
  return this.find({ 
    user: userId, 
    status: { $in: ['ACTIVE', 'OVERDUE'] } 
  }).populate('user').populate('item');
};

// Create the model
const Log = mongoose.model('Log', LogSchema);

module.exports = Log;