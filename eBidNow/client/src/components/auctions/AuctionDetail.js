import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const AuctionDetail = ({ showAlert }) => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const timerRef = useRef(null);
  const bidListRef = useRef(null);
  
  // Fetch auction details and bids
  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        setLoading(true);
        
        // Fetch auction details
        const auctionRes = await axios.get(`http://localhost:5000/api/auctions/${id}`);
        setAuction(auctionRes.data);
        
        // Set initial bid amount to current bid + minimum increment
        setBidAmount(auctionRes.data.currentBid + auctionRes.data.minBidIncrement);
        
        // Fetch bids for this auction
        const bidsRes = await axios.get(`http://localhost:5000/api/bids/auction/${id}`);
        setBids(bidsRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching auction data:', err);
        showAlert('Error loading auction data', 'danger');
        setLoading(false);
        navigate('/auctions');
      }
    };
    
    fetchAuctionData();
  }, [id, showAlert, navigate]);
  
  // Join auction room on component mount
  useEffect(() => {
    if (auction && socket && socket.socket) {
      console.log(`Joining auction room: ${id}`);
      socket.joinAuction(id);
    }
    
    // Leave auction room on component unmount
    return () => {
      if (auction && socket && socket.socket) {
        console.log(`Leaving auction room: ${id}`);
        socket.leaveAuction(id);
      }
    };
  }, [auction, id, socket]);
  
  // Listen for new bids
  useEffect(() => {
    if (socket && socket.socket) {
      console.log('Setting up bid listener');
      
      // Listen for new bids
      const handleBidPlaced = (newBid) => {
        console.log('New bid received:', newBid);
        
        // Update auction with new bid
        setAuction(prevAuction => {
          if (prevAuction && newBid.auction === prevAuction._id) {
            return {
              ...prevAuction,
              currentBid: newBid.amount,
              currentHighestBidder: newBid.bidder
            };
          }
          return prevAuction;
        });
        
        // Update bid amount input
        setBidAmount(newBid.amount + (auction?.minBidIncrement || 1));
        
        // Add new bid to bids list
        setBids(prevBids => {
          // Check if bid already exists
          const exists = prevBids.some(bid => bid._id === newBid._id);
          if (!exists) {
            return [newBid, ...prevBids];
          }
          return prevBids;
        });
        
        // Show alert if someone else placed the bid
        if (isAuthenticated && user && newBid.bidder._id !== user.id) {
          showAlert(`New bid placed: ₹${newBid.amount} by ${newBid.bidder.username}`, 'info');
        } else if (isAuthenticated && user && newBid.bidder._id === user.id) {
          showAlert('Your bid was placed successfully!', 'success');
        }
      };
      
      // Listen for auction updates
      const handleAuctionUpdated = (updatedAuction) => {
        console.log('Auction updated:', updatedAuction);
        if (updatedAuction._id === id) {
          setAuction(updatedAuction);
        }
      };
      
      // Set up the listeners
      socket.socket.on('bidPlaced', handleBidPlaced);
      socket.socket.on('auctionUpdated', handleAuctionUpdated);
      
      return () => {
        // Remove the listeners when component unmounts
        socket.socket.off('bidPlaced', handleBidPlaced);
        socket.socket.off('auctionUpdated', handleAuctionUpdated);
      };
    }
  }, [auction, id, isAuthenticated, user, socket, showAlert]);
  
  // Scroll to bottom of bid list when new bids come in
  useEffect(() => {
    if (bidListRef.current) {
      bidListRef.current.scrollTop = bidListRef.current.scrollHeight;
    }
  }, [bids]);
  
  // Update time remaining 
  useEffect(() => {
    const updateTimeRemaining = () => {
      if (!auction) return;
      
      const now = new Date();
      const endTime = new Date(auction.endTime);
      const remainingTime = endTime - now;
      
      if (remainingTime <= 0) {
        setTimeRemaining('Auction ended');
        setAuction(prev => ({...prev, status: 'completed'}));
        clearInterval(timerRef.current);
        return;
      }
      
      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };
    
    // Initial update
    updateTimeRemaining();
    
    // Set up interval for updates
    timerRef.current = setInterval(updateTimeRemaining, 1000);
    
    // Clean up interval on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [auction]);
  
  // Handle bid submission
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showAlert('Please log in to place a bid', 'warning');
      return;
    }
    
    if (!auction) {
      showAlert('Auction data not available', 'danger');
      return;
    }
    
    if (auction.status !== 'active') {
      showAlert('Cannot place bid on inactive auction', 'warning');
      return;
    }
    
    if (auction.createdBy._id === user.id) {
      showAlert('You cannot bid on your own auction', 'warning');
      return;
    }
    
    if (parseFloat(bidAmount) <= auction.currentBid) {
      showAlert(`Bid must be higher than current bid of ₹${auction.currentBid}`, 'warning');
      return;
    }
    
    if (parseFloat(bidAmount) < auction.currentBid + auction.minBidIncrement) {
      showAlert(`Minimum bid increment is ₹${auction.minBidIncrement}. Minimum bid is ₹${auction.currentBid + auction.minBidIncrement}`, 'warning');
      return;
    }
    
    setBidLoading(true);
    
    try {
      // Place bid via API
      const res = await axios.post('http://localhost:5000/api/bids', {
        auction: id,
        amount: parseFloat(bidAmount)
      });
      
      // Emit bid via socket - this is now redundant as the server will broadcast the bid
      // but keeping it as a fallback
      if (socket && socket.socket) {
        socket.placeBid({
          auction: id,
          amount: parseFloat(bidAmount),
          bidder: {
            _id: user.id,
            username: user.username
          }
        });
      }
      
      // Update auction with new bid
      setAuction(res.data.auction);
      
      // Add the new bid to the bids list
      setBids(prevBids => [res.data.bid, ...prevBids]);
      
      // Update bid amount input
      setBidAmount(parseFloat(bidAmount) + auction.minBidIncrement);
      
      setBidLoading(false);
    } catch (err) {
      console.error('Error placing bid:', err);
      showAlert(err.response?.data?.message || 'Error placing bid', 'danger');
      setBidLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  // Format date with time
  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('en-US', options);
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!auction) {
    return (
      <div className="container my-5">
        <div className="alert alert-danger">Auction not found</div>
        <Link to="/auctions" className="btn btn-primary">
          Back to Auctions
        </Link>
      </div>
    );
  }
  
  const isOwner = isAuthenticated && user && auction.createdBy._id === user.id;
  const isHighestBidder = isAuthenticated && user && auction.currentHighestBidder && auction.currentHighestBidder._id === user.id;
  
  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="text-primary">{auction.product.name}</h1>
          <p className="text-muted">
            Listed by <span className="fw-bold">{auction.createdBy.username}</span> | Category: {auction.product.category}
          </p>
        </div>
        <div className="col-md-4 text-md-end">
          <Link to="/auctions" className="btn btn-outline-primary">
            <i className="fas fa-arrow-left me-2"></i> Back to Auctions
          </Link>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8 mb-4">
          <div className="card shadow border-0 rounded-3">
            <div className="card-body p-4">
              {/* Auction Status Banner */}
              <div className={`alert ${
                auction.status === 'active' ? 'alert-success' : 
                auction.status === 'pending' ? 'alert-warning' : 
                auction.status === 'completed' ? 'alert-info' : 'alert-danger'
              }`}>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <i className={`fa-2x ${
                      auction.status === 'active' ? 'fas fa-gavel' : 
                      auction.status === 'pending' ? 'fas fa-clock' : 
                      auction.status === 'completed' ? 'fas fa-check-circle' : 'fas fa-times-circle'
                    }`}></i>
                  </div>
                  <div>
                    <h5 className="mb-1">
                      {auction.status === 'active' ? 'Auction is Active' : 
                       auction.status === 'pending' ? 'Auction is Upcoming' : 
                       auction.status === 'completed' ? 'Auction has Ended' : 'Auction was Cancelled'}
                    </h5>
                    <p className="mb-0">
                      {auction.status === 'active' ? (
                        <>Time Remaining: <strong>{timeRemaining}</strong></>
                      ) : auction.status === 'pending' ? (
                        <>Starts on: <strong>{formatDateTime(auction.startTime)}</strong></>
                      ) : (
                        <>Ended on: <strong>{formatDateTime(auction.endTime)}</strong></>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Product Details */}
              <div className="row mt-4">
                <div className="col-md-6 mb-4">
                  <div className="position-relative">
                    <img
                      src={auction.product.images && auction.product.images.length > 0
                        ? auction.product.images[0].startsWith('http')
                          ? auction.product.images[0]
                          : `http://localhost:5000${auction.product.images[0]}`
                        : `https://via.placeholder.com/400x300?text=${auction.product.name}`}
                      alt={auction.product.name}
                      className="img-fluid rounded"
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
                  
                  {/* Additional Images */}
                  {auction.product.images && auction.product.images.length > 1 && (
                    <div className="row mt-2">
                      {auction.product.images.slice(1).map((image, index) => (
                        <div className="col-3" key={index}>
                          <img
                            src={image.startsWith('http')
                              ? image
                              : `http://localhost:5000${image}`}
                            alt={`${auction.product.name} ${index + 2}`}
                            className="img-thumbnail"
                            style={{height: '60px', objectFit: 'cover'}}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <h5 className="mb-3">Product Details</h5>
                  <p>{auction.product.description}</p>
                  <div className="d-flex gap-2 mb-3">
                    <span className="badge bg-secondary">{auction.product.category}</span>
                    <span className="badge bg-info">{auction.product.condition}</span>
                  </div>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th>Starting Bid</th>
                        <td>{formatCurrency(auction.startingBid)}</td>
                      </tr>
                      <tr>
                        <th>Current Bid</th>
                        <td className="text-success fw-bold">{formatCurrency(auction.currentBid)}</td>
                      </tr>
                      <tr>
                        <th>Bid Increment</th>
                        <td>{formatCurrency(auction.minBidIncrement)}</td>
                      </tr>
                      <tr>
                        <th>Start Time</th>
                        <td>{formatDateTime(auction.startTime)}</td>
                      </tr>
                      <tr>
                        <th>End Time</th>
                        <td>{formatDateTime(auction.endTime)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <hr className="my-4" />
              
              {/* Bidding Section */}
              {auction.status === 'active' && (
                <div className="bid-form">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h4 className="mb-0">Place Your Bid</h4>
                      <div>
                        <span className="badge bg-primary">Minimum Bid: {formatCurrency(auction.currentBid + auction.minBidIncrement)}</span>
                      </div>
                    </div>
                    
                    {isAuthenticated ? (
                      isOwner ? (
                        <div className="alert alert-warning">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          You cannot bid on your own auction.
                        </div>
                      ) : (
                        <form onSubmit={handleBidSubmit}>
                          <div className="input-group mb-3">
                          <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control form-control-lg"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              min={auction.currentBid + auction.minBidIncrement}
                              step="0.01"
                              required
                            />
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={bidLoading}
                            >
                              {bidLoading ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  Placing Bid...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-gavel me-2"></i>
                                  Place Bid
                                </>
                              )}
                            </button>
                          </div>
                          <div className="form-text">
                            You are about to bid {formatCurrency(bidAmount)}. This action cannot be undone.
                          </div>
                          
                          {isHighestBidder && (
                            <div className="alert alert-success mt-3">
                              <i className="fas fa-check-circle me-2"></i>
                              You are currently the highest bidder!
                            </div>
                          )}
                        </form>
                      )
                    ) : (
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        Please <Link to="/login" className="alert-link">login</Link> to place a bid.
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Auction Ended Message */}
              {auction.status === 'completed' && (
                <div className="alert alert-info mt-3">
                  <div className="d-flex">
                    <div className="me-3">
                      <i className="fas fa-info-circle fa-2x"></i>
                    </div>
                    <div>
                      <h5 className="mb-1">Auction has ended</h5>
                      <p className="mb-0">
                        {auction.currentHighestBidder ? (
                          <>
                            Final bid was {formatCurrency(auction.currentBid)} by 
                            <strong> {isHighestBidder ? 'you' : auction.currentHighestBidder.username}</strong>.
                          </>
                        ) : (
                          <>This auction ended without any bids.</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upcoming Auction Message */}
              {auction.status === 'pending' && (
                <div className="alert alert-warning mt-3">
                  <div className="d-flex">
                    <div className="me-3">
                      <i className="fas fa-clock fa-2x"></i>
                    </div>
                    <div>
                      <h5 className="mb-1">Auction has not started yet</h5>
                      <p className="mb-0">
                        This auction will begin on {formatDateTime(auction.startTime)}.
                        Come back then to place your bids!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Current Highest Bid Card */}
          <div className="card shadow border-0 rounded-3 mb-4">
            <div className="card-header bg-primary text-white p-3">
              <h5 className="mb-0">Current Highest Bid</h5>
            </div>
            <div className="card-body text-center">
              <h2 className="display-4 text-primary mb-3">{formatCurrency(auction.currentBid)}</h2>
              <p className="mb-0">
                {auction.currentHighestBidder ? (
                  <>
                    Bidder: <strong>{isHighestBidder ? 'You' : auction.currentHighestBidder.username}</strong>
                  </>
                ) : (
                  <>No bids yet. Be the first to bid!</>
                )}
              </p>
              {auction.status === 'active' && !isOwner && isAuthenticated && (
                <button 
                  onClick={() => document.querySelector('.bid-form input').focus()} 
                  className="btn btn-primary btn-lg w-100 mt-3"
                >
                  Place Your Bid
                </button>
              )}
            </div>
          </div>
          
          {/* Bid History Card */}
          <div className="card shadow border-0 rounded-3">
            <div className="card-header bg-light p-3">
              <h5 className="mb-0">Bid History</h5>
            </div>
            <div 
              className="card-body p-0"
              style={{ maxHeight: '400px', overflowY: 'auto' }}
              ref={bidListRef}
            >
              {bids.length > 0 ? (
                <ul className="list-group list-group-flush">
                  {bids.map(bid => (
                    <li key={bid._id} className="list-group-item px-3 py-3 bid-history-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-0 text-primary">{formatCurrency(bid.amount)}</h6>
                          <small className="text-muted">
                            {bid.bidder._id === user?.id ? (
                              <span className="text-success">You</span>
                            ) : (
                              bid.bidder.username
                            )}
                          </small>
                        </div>
                        <div className="text-end">
                          <small className="text-muted d-block">
                            {new Date(bid.timestamp).toLocaleTimeString()}
                          </small>
                          <small className="text-muted d-block">
                            {new Date(bid.timestamp).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="fas fa-gavel fa-3x mb-3"></i>
                  <p>No bids have been placed yet. Be the first to bid!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail; 