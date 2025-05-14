const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first
dotenv.config();

// Import models
const Auction = require('./models/Auction');

// Define socket.io module exports before requiring routes
const socketModule = {};

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store io instance in socketModule, so we can export it
socketModule.io = io;

// Now import routes (after socketModule is set up)
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const auctionRoutes = require('./routes/auctions');
const bidRoutes = require('./routes/bids');
const uploadsRoutes = require('./routes/uploads');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/uploads', uploadsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('../client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
} else {
  // In development mode, handle API calls and ensure 404s are sent to React Router
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      // If it's an API route that wasn't handled above, it should 404
      return res.status(404).json({ message: 'API endpoint not found' });
    } else {
      // For all other routes, return a 200 and let React Router handle it
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send('Auction Platform API - Use client application to view this content');
    }
  });
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join auction room
  socket.on('joinAuction', (auctionId) => {
    socket.join(auctionId);
    console.log(`Socket ${socket.id} joined auction room: ${auctionId}`);
  });
  
  // Leave auction room
  socket.on('leaveAuction', (auctionId) => {
    socket.leave(auctionId);
    console.log(`Socket ${socket.id} left auction room: ${auctionId}`);
  });
  
  // New bid placed
  socket.on('newBid', (bid) => {
    console.log('New bid received from client:', bid);
    // This will be handled by the bids route
  });
  
  // Test connection - for debugging
  socket.on('testConnection', (message) => {
    console.log('Test connection message:', message);
    socket.emit('testResponse', { message: 'Connection successful!' });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Set up periodic task to update auction statuses
const updateAuctionStatuses = async () => {
  try {
    console.log('Running automatic auction status update...');
    const result = await Auction.updateAllStatuses();
    
    // Broadcast status changes if any auctions were updated
    if (result && result.updated > 0) {
      console.log(`Updated status for ${result.updated} auctions`);
      
      // Emit updates for each changed auction
      for (const auction of result.auctions) {
        const populatedAuction = await Auction.findById(auction._id)
          .populate('product')
          .populate('createdBy', 'name avatar')
          .populate('currentHighestBidder', 'name avatar');
          
        if (populatedAuction) {
          io.emit('auctionStatusChanged', populatedAuction);
          console.log(`Broadcast status change for auction ${auction._id}`);
        }
      }
    }
  } catch (err) {
    console.error('Error updating auction statuses:', err);
  }
};

// Function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port in use, try next port
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      // Found an available port, close the server and return the port
      server.close(() => {
        resolve(startPort);
      });
    });
    
    server.listen(startPort);
  });
};

// Start the server with port detection
const startServer = async () => {
  try {
    // Run auction status update when server starts
    await updateAuctionStatuses();
    
    // Schedule periodic status updates (every minute)
    setInterval(updateAuctionStatuses, 60000);
    
    // Set port and start server (with fallback)
    const preferredPort = process.env.PORT || 5000;
    const PORT = await findAvailablePort(preferredPort);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Socket.io initialized and ready to use');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export Socket.io instance for use in routes
module.exports = socketModule; 