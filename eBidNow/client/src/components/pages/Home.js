import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedAuctions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auctions/active');
        setFeaturedAuctions(res.data.slice(0, 4)); // Get first 4 active auctions
        setLoading(false);
      } catch (err) {
        console.error('Error fetching featured auctions:', err);
        setLoading(false);
      }
    };

    fetchFeaturedAuctions();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5 mb-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="display-4 fw-bold">Online Auction Platform</h1>
              <p className="lead">
                Buy and sell items through real-time auctions. Find unique items or sell your valuables to the highest bidder.
              </p>
              <div className="mt-4">
                <Link to="/auctions" className="btn btn-light btn-lg me-2">
                  Browse Auctions
                </Link>
                <Link to="/register" className="btn btn-outline-light btn-lg">
                  Join Now
                </Link>
              </div>
            </div>
            <div className="col-md-6 d-none d-md-block">
              <img
                src="https://via.placeholder.com/600x400?text=Auction+Platform"
                alt="Auction Platform"
                className="img-fluid rounded shadow"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Auctions */}
      <div className="container mb-5">
        <h2 className="text-center mb-4">Featured Auctions</h2>
        
        {loading ? (
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : featuredAuctions.length > 0 ? (
          <div className="row">
            {featuredAuctions.map(auction => (
              <div className="col-md-6 col-lg-3 mb-4" key={auction._id}>
                <div className="card h-100 shadow-sm">
                  <img
                    src={auction.product.images && auction.product.images.length > 0
                      ? auction.product.images[0].startsWith('http')
                        ? auction.product.images[0]
                        : `http://localhost:5000${auction.product.images[0]}`
                      : `https://via.placeholder.com/300x200?text=${auction.product.name}`}
                    className="card-img-top"
                    alt={auction.product.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{auction.product.name}</h5>
                    <p className="card-text text-truncate">{auction.product.description}</p>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge bg-success">Current Bid: ₹{auction.currentBid}</span>
                      <small className="text-muted">Ends: {new Date(auction.endTime).toLocaleDateString()}</small>
                    </div>
                  </div>
                  <div className="card-footer bg-white">
                    <Link to={`/auctions/${auction._id}`} className="btn btn-primary w-100">
                      View Auction
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info text-center">
            No active auctions found. Check back later or <Link to="/create-product">create your own</Link>!
          </div>
        )}
        
        <div className="text-center mt-3">
          <Link to="/auctions" className="btn btn-outline-primary">
            View All Auctions
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-light py-5 mb-5">
        <div className="container">
          <h2 className="text-center mb-4">How It Works</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 text-primary mb-3">
                    <i className="fas fa-user-plus"></i>
                  </div>
                  <h4 className="card-title">1. Create an Account</h4>
                  <p className="card-text">
                    Sign up for free and create your profile to start buying or selling items.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 text-primary mb-3">
                    <i className="fas fa-box"></i>
                  </div>
                  <h4 className="card-title">2. List or Bid</h4>
                  <p className="card-text">
                    List your items for auction or browse and bid on items that interest you.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center">
                  <div className="display-4 text-primary mb-3">
                    <i className="fas fa-handshake"></i>
                  </div>
                  <h4 className="card-title">3. Win & Complete</h4>
                  <p className="card-text">
                    Win auctions with the highest bid and complete the transaction securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="container mb-5 text-center">
        <h2>Ready to Start?</h2>
        <p className="lead mb-4">
          Join thousands of users buying and selling through our platform.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create an Account
        </Link>
      </div>
    </div>
  );
};

export default Home; 