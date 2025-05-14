const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  startingBid: {
    type: Number,
    required: true,
    min: 0
  },
  currentBid: {
    type: Number,
    min: 0,
    default: function() {
      return this.startingBid;
    }
  },
  currentHighestBidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  minBidIncrement: {
    type: Number,
    default: 1,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  totalBids: {
    type: Number,
    default: 0
  },
  featuredAuction: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time remaining
AuctionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now > this.endTime) return 0;
  return Math.max(0, this.endTime - now);
});

// Virtual for auction progress percentage
AuctionSchema.virtual('progress').get(function() {
  const now = new Date();
  const total = this.endTime - this.startTime;
  const elapsed = now - this.startTime;
  
  if (now < this.startTime) return 0;
  if (now > this.endTime) return 100;
  
  return Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
});

// Add methods to automatically update auction status based on time
AuctionSchema.methods.updateStatus = function() {
  const now = new Date();
  let statusChanged = false;
  
  if (this.status !== 'cancelled') {
    let newStatus = this.status;
    
    if (now < this.startTime) {
      newStatus = 'pending';
    } else if (now >= this.startTime && now <= this.endTime) {
      newStatus = 'active';
    } else if (now > this.endTime) {
      newStatus = 'completed';
    }
    
    if (newStatus !== this.status) {
      this.status = newStatus;
      statusChanged = true;
    }
  }
  
  return { changed: statusChanged, auction: this };
};

// Pre-save hook to update status automatically
AuctionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('startTime') || this.isModified('endTime')) {
    const { changed } = this.updateStatus();
    // We don't need to save here as this is a pre-save hook
  }
  next();
});

// Static method to get active auctions
AuctionSchema.statics.getActiveAuctions = function() {
  const now = new Date();
  return this.find({
    startTime: { $lte: now },
    endTime: { $gte: now },
    status: 'active'
  }).populate('product').populate('createdBy', 'name avatar');
};

// Static method to update all auction statuses
AuctionSchema.statics.updateAllStatuses = async function() {
  const auctions = await this.find({
    status: { $in: ['pending', 'active'] }
  });
  
  const results = {
    updated: 0,
    auctions: []
  };
  
  for (const auction of auctions) {
    const { changed, auction: updatedAuction } = auction.updateStatus();
    if (changed) {
      await updatedAuction.save();
      results.updated++;
      results.auctions.push(updatedAuction);
    }
  }
  
  return results;
};

module.exports = mongoose.model('Auction', AuctionSchema); 