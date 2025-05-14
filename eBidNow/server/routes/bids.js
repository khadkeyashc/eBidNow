const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
let io; // Will be set below

// Get Socket.io instance from server.js after it's exported
try {
  io = require('../server').io;
} catch (err) {
  console.log('Socket.io not yet initialized, bids will not be broadcast in real-time');
}

// @route   POST api/bids
// @desc    Place a new bid
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { auction, amount } = req.body;

    // Check if auction exists and is active
    const auctionData = await Auction.findById(auction);
    if (!auctionData) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    // Update auction status to make sure it's current
    await auctionData.updateStatus();

    if (auctionData.status !== 'active') {
      return res.status(400).json({ message: 'Cannot place bid on inactive auction' });
    }

    // Check if user is the auction creator (seller cannot bid on own auction)
    if (auctionData.createdBy.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot bid on your own auction' });
    }

    // Check if bid amount is valid
    if (amount <= auctionData.currentBid) {
      return res.status(400).json({ message: `Bid must be higher than current bid of ${auctionData.currentBid}` });
    }

    // Check if bid meets minimum increment
    if (amount < auctionData.currentBid + auctionData.minBidIncrement) {
      return res.status(400).json({ 
        message: `Bid increment must be at least ${auctionData.minBidIncrement}. Minimum bid is ${auctionData.currentBid + auctionData.minBidIncrement}` 
      });
    }

    // Create new bid
    const bid = new Bid({
      auction,
      bidder: req.user.id,
      amount,
      status: 'active'
    });

    await bid.save();

    // Mark previous active bids as outbid
    await Bid.updateMany(
      { auction, status: 'active', bidder: { $ne: req.user.id } },
      { status: 'outbid' }
    );

    // Update auction with new highest bid
    auctionData.currentBid = amount;
    auctionData.currentHighestBidder = req.user.id;
    await auctionData.save();

    // Populate bidder info for socket broadcast and response
    const populatedBid = await Bid.findById(bid._id)
      .populate('bidder', 'username email');

    // Get updated auction with populated fields
    const updatedAuction = await Auction.findById(auction)
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username');

    // Broadcast the new bid to the auction room via Socket.io
    if (io) {
      // Broadcast bid to all users in the auction room
      io.to(auction).emit('bidPlaced', populatedBid);
      
      // Also broadcast the updated auction
      io.to(auction).emit('auctionUpdated', updatedAuction);
      
      console.log(`New bid of $${amount} broadcast to auction room: ${auction}`);
    } else {
      console.log('Socket.io not available, bid not broadcast in real-time');
    }

    res.json({
      bid: populatedBid,
      auction: updatedAuction
    });
  } catch (error) {
    console.error('Error placing bid:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/bids/auction/:auctionId
// @desc    Get all bids for a specific auction
// @access  Public
router.get('/auction/:auctionId', async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .sort({ amount: -1 })
      .populate('bidder', 'username');
    res.json(bids);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/bids/user/me
// @desc    Get all bids made by current user
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.id })
      .sort({ timestamp: -1 })
      .populate({
        path: 'auction',
        populate: {
          path: 'product',
          select: 'name images'
        }
      });
    res.json(bids);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/bids/active
// @desc    Get all active bids by current user
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const bids = await Bid.find({ 
      bidder: req.user.id,
      status: 'active'
    })
      .sort({ timestamp: -1 })
      .populate({
        path: 'auction',
        populate: {
          path: 'product',
          select: 'name images'
        }
      });
    res.json(bids);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/bids/won
// @desc    Get all auctions won by current user
// @access  Private
router.get('/won', auth, async (req, res) => {
  try {
    // Find completed auctions where user is highest bidder
    const wonAuctions = await Auction.find({
      status: 'completed',
      currentHighestBidder: req.user.id
    })
      .populate('product')
      .populate('createdBy', 'username email');
    
    res.json(wonAuctions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 