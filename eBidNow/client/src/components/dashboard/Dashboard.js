import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const Dashboard = ({ showAlert }) => {
  const { user } = useContext(AuthContext);
  
  const [myProducts, setMyProducts] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's products
        const productsRes = await axios.get('http://localhost:5000/api/products/user/me');
        setMyProducts(productsRes.data);
        
        // Fetch user's auctions
        const auctionsRes = await axios.get('http://localhost:5000/api/auctions/user/me');
        setMyAuctions(auctionsRes.data);
        
        // Fetch user's bids
        const bidsRes = await axios.get('http://localhost:5000/api/bids/user/me');
        setMyBids(bidsRes.data);
        
        // Fetch user's won auctions
        const wonRes = await axios.get('http://localhost:5000/api/bids/won');
        setWonAuctions(wonRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showAlert('Error loading dashboard data', 'danger');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [showAlert]);
  
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/products/${id}`);
        setMyProducts(myProducts.filter(product => product._id !== id));
        showAlert('Product deleted successfully', 'success');
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error deleting product', 'danger');
      }
    }
  };
  
  const handleCancelAuction = async (id) => {
    if (window.confirm('Are you sure you want to cancel this auction?')) {
      try {
        await axios.delete(`http://localhost:5000/api/auctions/${id}`);
        setMyAuctions(myAuctions.map(auction => 
          auction._id === id ? { ...auction, status: 'cancelled' } : auction
        ));
        showAlert('Auction cancelled successfully', 'success');
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error cancelling auction', 'danger');
      }
    }
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
  
  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>Dashboard</h1>
          <p className="lead">Welcome back, {user && user.username}!</p>
        </div>
        <div className="col-md-4 text-md-end">
          <Link to="/create-product" className="btn btn-primary me-2">
            <i className="fas fa-plus me-1"></i> Add Product
          </Link>
        </div>
      </div>
      
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                My Products
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'auctions' ? 'active' : ''}`}
                onClick={() => setActiveTab('auctions')}
              >
                My Auctions
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'bids' ? 'active' : ''}`}
                onClick={() => setActiveTab('bids')}
              >
                My Bids
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'won' ? 'active' : ''}`}
                onClick={() => setActiveTab('won')}
              >
                Won Auctions
              </button>
            </li>
          </ul>
        </div>
        <div className="card-body">
          {/* My Products Tab */}
          {activeTab === 'products' && (
            <>
              {myProducts.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Condition</th>
                        <th>Starting Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myProducts.map(product => (
                        <tr key={product._id}>
                          <td>
                            <Link to={`/products/${product._id}`} className="text-decoration-none">
                              {product.name}
                            </Link>
                          </td>
                          <td>{product.category}</td>
                          <td>{product.condition}</td>
                          <td>₹{product.startingPrice}</td>
                          <td>
                            <Link to={`/create-auction/${product._id}`} className="btn btn-sm btn-outline-primary me-2">
                              Create Auction
                            </Link>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>You haven't added any products yet.</p>
                  <Link to="/create-product" className="btn btn-primary">
                    Add Your First Product
                  </Link>
                </div>
              )}
            </>
          )}
          
          {/* My Auctions Tab */}
          {activeTab === 'auctions' && (
            <>
              {myAuctions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Start Time</th>
                        <th>End Time</th>
                        <th>Current Bid</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myAuctions.map(auction => (
                        <tr key={auction._id}>
                          <td>
                            <Link to={`/auctions/${auction._id}`} className="text-decoration-none">
                              {auction.product.name}
                            </Link>
                          </td>
                          <td>{new Date(auction.startTime).toLocaleString()}</td>
                          <td>{new Date(auction.endTime).toLocaleString()}</td>
                          <td>₹{auction.currentBid}</td>
                          <td>
                            <span className={`badge bg-${
                              auction.status === 'active' ? 'success' : 
                              auction.status === 'pending' ? 'warning' : 
                              auction.status === 'completed' ? 'info' : 'danger'
                            }`}>
                              {auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            {auction.status === 'pending' && (
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleCancelAuction(auction._id)}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>You haven't created any auctions yet.</p>
                  <Link to="/create-product" className="btn btn-primary">
                    Add a Product to Auction
                  </Link>
                </div>
              )}
            </>
          )}
          
          {/* My Bids Tab */}
          {activeTab === 'bids' && (
            <>
              {myBids.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Auction</th>
                        <th>Bid Amount</th>
                        <th>Bid Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myBids.map(bid => (
                        <tr key={bid._id}>
                          <td>
                            <Link to={`/auctions/${bid.auction._id}`} className="text-decoration-none">
                              {bid.auction.product.name}
                            </Link>
                          </td>
                          <td>₹{bid.amount}</td>
                          <td>{new Date(bid.timestamp).toLocaleString()}</td>
                          <td>
                            <span className={`badge bg-${
                              bid.status === 'active' ? 'success' : 
                              bid.status === 'outbid' ? 'warning' : 
                              bid.status === 'won' ? 'info' : 'secondary'
                            }`}>
                              {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <Link to={`/auctions/${bid.auction._id}`} className="btn btn-sm btn-outline-primary">
                              View Auction
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>You haven't placed any bids yet.</p>
                  <Link to="/auctions" className="btn btn-primary">
                    Browse Auctions
                  </Link>
                </div>
              )}
            </>
          )}
          
          {/* Won Auctions Tab */}
          {activeTab === 'won' && (
            <>
              {wonAuctions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Final Price</th>
                        <th>End Time</th>
                        <th>Seller</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wonAuctions.map(auction => (
                        <tr key={auction._id}>
                          <td>
                            <Link to={`/auctions/${auction._id}`} className="text-decoration-none">
                              {auction.product.name}
                            </Link>
                          </td>
                          <td>₹{auction.currentBid}</td>
                          <td>{new Date(auction.endTime).toLocaleString()}</td>
                          <td>{auction.createdBy.username}</td>
                          <td>
                            <Link to={`/auctions/${auction._id}`} className="btn btn-sm btn-outline-primary">
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p>You haven't won any auctions yet.</p>
                  <Link to="/auctions" className="btn btn-primary">
                    Browse Auctions
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 