const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, user ID:', decoded.id);
    
    // Find user by id
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('User not found with ID:', decoded.id);
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Store the full user object in req.fullUser for any methods that need it
    req.fullUser = user;
    
    // Set user in request - use the string version of _id
    req.user = {
      id: user._id.toString(), // Convert ObjectId to string
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    console.log('User authenticated:', req.user.username, 'with ID:', req.user.id);
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

// Middleware to check if user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};

module.exports = { auth, admin }; 