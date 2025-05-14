import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const AuctionList = ({ showAlert }) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const socket = useSocket();
  
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: 'active',  // Default to show active auctions
    category: '',
    seller: ''
  });
  
  // Subscribe to real-time auction updates
  useEffect(() => {
    if (socket && socket.socket) {
      console.log('Setting up socket listeners for auction updates');
      
      // Listen for new auctions
      socket.socket.on('newAuction', (auction) => {
        console.log('New auction received via socket:', auction);
        setAuctions(prevAuctions => {
          // Check if auction already exists in the list
          const exists = prevAuctions.some(a => a._id === auction._id);
          if (!exists && auction.status === filters.status) {
            console.log('Adding new auction to list');
            return [auction, ...prevAuctions];
          }
          return prevAuctions;
        });
      });
      
      // Listen for auction updates
      socket.socket.on('auctionUpdated', (updatedAuction) => {
        console.log('Auction update received via socket:', updatedAuction);
        setAuctions(prevAuctions => 
          prevAuctions.map(auction => 
            auction._id === updatedAuction._id ? updatedAuction : auction
          )
        );
      });
      
      // Listen for auction status changes
      socket.socket.on('auctionStatusChanged', (updatedAuction) => {
        console.log('Auction status change received via socket:', updatedAuction);
        setAuctions(prevAuctions => {
          // If the auction's status no longer matches our filter, remove it
          if (filters.status && updatedAuction.status !== filters.status) {
            return prevAuctions.filter(auction => auction._id !== updatedAuction._id);
          }
          
          // Otherwise update it
          return prevAuctions.map(auction => 
            auction._id === updatedAuction._id ? updatedAuction : auction
          );
        });
      });
      
      return () => {
        console.log('Cleaning up socket listeners for auction updates');
        socket.socket.off('newAuction');
        socket.socket.off('auctionUpdated');
        socket.socket.off('auctionStatusChanged');
      };
    }
  }, [socket, filters.status]);
  
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        setLoading(true);
        console.log('Fetching auctions with filters:', filters);
        
        // Build query string for filters
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage);
        
        if (filters.status) {
          queryParams.append('status', filters.status);
        }
        
        if (filters.category) {
          queryParams.append('category', filters.category);
        }
        
        if (filters.seller) {
          queryParams.append('seller', filters.seller);
        }
        
        const res = await axios.get(`http://localhost:5000/api/auctions?${queryParams.toString()}`);
        
        if (res.data && res.data.auctions) {
          setAuctions(res.data.auctions);
          setTotalPages(res.data.totalPages || 1);
        } else {
          console.error('Unexpected API response format:', res.data);
          setAuctions([]);
          setTotalPages(1);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        showAlert('Error loading auctions', 'danger');
        setLoading(false);
        setAuctions([]);
      }
    };
    
    fetchAuctions();
    // Debug information
    console.log('Fetching auctions with filters:', filters);
  }, [currentPage, filters, showAlert]);
  
  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    setCurrentPage(1); // Reset to first page when filter changes
    
    // Debug information
    console.log(`Filter changed: ${name} = ${value}`);
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };
  
  // Calculate time remaining
  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const timeRemaining = end - now;
    
    if (timeRemaining <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${Math.floor((timeRemaining % (1000 * 60)) / 1000)}s`;
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="text-primary">Auctions</h1>
          <p className="lead text-muted">Browse and bid on available auctions.</p>
        </div>
        <div className="col-md-4 text-md-end">
          {isAuthenticated && (
            <Link to="/create-product" className="btn btn-primary">
              <i className="fas fa-plus-circle me-2"></i>Create Auction
            </Link>
          )}
        </div>
      </div>
      
      {/* Filter Options */}
      <div className="card shadow border-0 rounded-3 mb-4">
        <div className="card-header bg-light p-3">
          <h5 className="mb-0">
            <i className="fas fa-filter me-2"></i> Filter Auctions
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <label htmlFor="statusFilter" className="form-label">Auction Status</label>
              <select
                id="statusFilter"
                name="status"
                className="form-select"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="active">Active Auctions</option>
                <option value="pending">Upcoming Auctions</option>
                <option value="completed">Completed Auctions</option>
                <option value="cancelled">Cancelled Auctions</option>
              </select>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <label htmlFor="categoryFilter" className="form-label">Product Category</label>
              <select
                id="categoryFilter"
                name="category"
                className="form-select"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Computers">Computers & Accessories</option>
                <option value="MobilePhones">Mobile Phones & Tablets</option>
                <option value="Clothing">Clothing & Fashion</option>
                <option value="Home">Home & Garden</option>
                <option value="Collectibles">Collectibles & Art</option>
                <option value="Sports">Sports Equipment</option>
                <option value="Toys">Toys & Games</option>
                <option value="Books">Books & Media</option>
                <option value="Jewelry">Jewelry & Watches</option>
                <option value="Automotive">Automotive</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="sellerFilter" className="form-label">Seller</label>
              <input
                type="text"
                id="sellerFilter"
                name="seller"
                className="form-control"
                value={filters.seller}
                onChange={handleFilterChange}
                placeholder="Enter seller name or ID"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Auctions List */}
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : auctions && auctions.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {auctions.map(auction => (
            <div className="col" key={auction._id}>
              <div className="card h-100 shadow-sm auction-card fade-in">
                <div className="position-relative">
                  <img
                    src={auction.product && auction.product.images && auction.product.images.length > 0
                      ? auction.product.images[0].startsWith('http')
                        ? auction.product.images[0]
                        : `http://localhost:5000${auction.product.images[0]}`
                      : `https://via.placeholder.com/300x200?text=${auction.product ? auction.product.name : 'Auction Item'}`}
                    className="card-img-top"
                    alt={auction.product ? auction.product.name : 'Auction Item'}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="position-absolute top-0 end-0 p-2">
                    <span className={`badge ${
                      auction.status === 'active' ? 'bg-success' : 
                      auction.status === 'pending' ? 'bg-warning' : 
                      auction.status === 'completed' ? 'bg-info' : 'bg-danger'
                    }`}>
                      {auction.status === 'active' ? 'Active' : 
                       auction.status === 'pending' ? 'Upcoming' : 
                       auction.status === 'completed' ? 'Completed' : 'Cancelled'}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{auction.product ? auction.product.name : 'Unknown Item'}</h5>
                  <p className="card-text text-truncate-2">
                    {auction.product ? auction.product.description : 'No description available'}
                  </p>
                  
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary">
                      {auction.product ? auction.product.category : 'Unknown Category'}
                    </span>
                    <span className="badge bg-info">
                      {auction.product ? auction.product.condition : 'Unknown Condition'}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="fw-bold text-success mb-0">Current Bid: ₹{auction.currentBid}</p>
                      <small className="text-muted">
                        {auction.currentHighestBidder ? 
                          `Highest Bidder: ${auction.currentHighestBidder.username || 'Unknown'}` : 
                          'No bids yet'}
                      </small>
                    </div>
                    <div className="text-end">
                      <p className="mb-0">
                        <small className="text-muted">
                          {auction.status === 'active' ? (
                            <>Ends in: {getTimeRemaining(auction.endTime)}</>
                          ) : auction.status === 'pending' ? (
                            <>Starts: {new Date(auction.startTime).toLocaleDateString()}</>
                          ) : (
                            <>Ended: {new Date(auction.endTime).toLocaleDateString()}</>
                          )}
                        </small>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-white">
                  <Link to={`/auctions/${auction._id}`} className="btn btn-primary w-100">
                    {auction.status === 'active' ? 'View & Bid' : 'View Details'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center p-5">
          <i className="fas fa-info-circle fa-3x mb-3"></i>
          <h4>No auctions found</h4>
          <p>No auctions match your current filters. Try adjusting your search criteria or check back later.</p>
          {isAuthenticated && (
            <Link to="/create-product" className="btn btn-primary mt-3">
              Create Your First Auction
            </Link>
          )}
        </div>
      )}
      
      {/* Debug Info - Remove in production */}
      <div className="mt-3 p-3 bg-light rounded small">
        <h6>Debug Information:</h6>
        <p>Current Filters: Status={filters.status || 'none'}, Category={filters.category || 'none'}, Seller={filters.seller || 'none'}</p>
        <p>Auctions Found: {auctions ? auctions.length : 0}</p>
        <p>Current Page: {currentPage} of {totalPages}</p>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            
            {[...Array(totalPages).keys()].map(page => (
              <li
                key={page + 1}
                className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default AuctionList; 