const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Auction = require('../models/Auction');
const Product = require('../models/Product');
let io; // Will be set below

// Get Socket.io instance from server.js after it's exported
try {
  io = require('../server').io;
  console.log('Socket.io instance retrieved successfully in auctions routes');
} catch (err) {
  console.log('Socket.io not yet initialized, auctions will not be broadcast in real-time');
}

// @route   POST api/auctions
// @desc    Create a new auction
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('Auction creation request received:', req.body);
    const { product, startTime, endTime, startingBid, minBidIncrement } = req.body;

    // Validate required fields
    if (!product || !startTime || !endTime || !startingBid) {
      return res.status(400).json({ message: 'Missing required auction fields' });
    }
    
    console.log('Authenticated user ID:', req.user.id);

    // Check if product exists and belongs to user
    const productData = await Product.findById(product);
    if (!productData) {
      console.log('Product not found:', product);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product seller:', productData.seller.toString(), 'User ID:', req.user.id);
    if (productData.seller.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to create an auction for this product' });
    }

    // Check if product already has an active auction
    const existingAuction = await Auction.findOne({
      product,
      status: { $in: ['pending', 'active'] }
    });

    if (existingAuction) {
      return res.status(400).json({ message: 'This product already has an active or pending auction' });
    }

    // Create new auction with explicit string conversion for ObjectId
    const auction = new Auction({
      product,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      startingBid: parseFloat(startingBid),
      currentBid: parseFloat(startingBid),
      minBidIncrement: parseFloat(minBidIncrement || 1),
      createdBy: req.user.id
    });

    console.log('Saving new auction:', {
      product,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      startingBid: parseFloat(startingBid),
      minBidIncrement: parseFloat(minBidIncrement || 1),
      createdBy: req.user.id
    });

    await auction.save();
    console.log('Auction saved successfully, ID:', auction._id);
    
    // Populate related data before sending response
    const populatedAuction = await Auction.findById(auction._id)
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username');

    // Broadcast the new auction to all connected clients if Socket.io is available
    if (io) {
      io.emit('newAuction', populatedAuction);
      console.log('New auction broadcast to all clients');
    } else {
      console.log('Socket.io not available, auction not broadcast');
    }

    res.json(populatedAuction);
  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/auctions
// @desc    Get all auctions with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Get auctions with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;
    
    let query = {};
    
    // Add filters if provided
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.seller) {
      query.createdBy = req.query.seller;
    }
    
    const auctions = await Auction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex)
      .populate('product')
      .populate('createdBy', 'username')
      .populate('currentHighestBidder', 'username');
    
    // Update auction statuses
    for (let auction of auctions) {
      await auction.updateStatus();
    }
    
    const total = await Auction.countDocuments(query);
    
    res.json({
      auctions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auctions/active
// @desc    Get all active auctions
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const auctions = await Auction.find({ status: 'active' })
      .sort({ endTime: 1 })
      .populate('product')
      .populate('createdBy', 'username')
      .populate('currentHighestBidder', 'username');
    
    res.json(auctions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auctions/:id
// @desc    Get auction by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('product')
      .populate('createdBy', 'username email')
      .populate('currentHighestBidder', 'username');
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Update auction status
    await auction.updateStatus();
    
    res.json(auction);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/auctions/:id
// @desc    Update auction details (only if status is pending)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { startTime, endTime, startingBid, minBidIncrement } = req.body;
    
    // Find auction
    let auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Check if user created the auction
    if (auction.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Check if auction is still pending
    if (auction.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update an auction that has already started or ended' });
    }
    
    // Update fields
    if (startTime) auction.startTime = startTime;
    if (endTime) auction.endTime = endTime;
    if (startingBid) {
      auction.startingBid = startingBid;
      auction.currentBid = startingBid;
    }
    if (minBidIncrement) auction.minBidIncrement = minBidIncrement;
    
    await auction.save();
    
    // Update auction status
    await auction.updateStatus();
    
    res.json(auction);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/auctions/:id
// @desc    Cancel an auction (only if status is pending or no bids placed)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Find auction
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Check if user created the auction
    if (auction.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Check if auction can be cancelled
    if (auction.status === 'active' && auction.currentHighestBidder) {
      return res.status(400).json({ message: 'Cannot cancel an active auction with bids' });
    }
    
    if (auction.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed auction' });
    }
    
    // Mark as cancelled instead of removing
    auction.status = 'cancelled';
    await auction.save();
    
    res.json({ message: 'Auction cancelled' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET api/auctions/user/me
// @desc    Get all auctions created by current user
// @access  Private
router.get('/user/me', auth, async (req, res) => {
  try {
    const auctions = await Auction.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('product')
      .populate('currentHighestBidder', 'username');
    
    // Update auction statuses
    for (let auction of auctions) {
      await auction.updateStatus();
    }
    
    res.json(auctions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 