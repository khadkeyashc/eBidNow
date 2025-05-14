import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';

const ProductDetail = ({ showAlert }) => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAuctions, setActiveAuctions] = useState([]);
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        
        // Fetch product details
        const productRes = await axios.get(`http://localhost:5000/api/products/${id}`);
        setProduct(productRes.data);
        
        // Fetch active auctions for this product
        const auctionsRes = await axios.get(`http://localhost:5000/api/auctions?product=${id}&status=active`);
        
        if (auctionsRes.data.auctions) {
          setActiveAuctions(auctionsRes.data.auctions);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product data:', err);
        showAlert('Error loading product data', 'danger');
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [id, showAlert]);
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="container">
        <div className="alert alert-danger">Product not found</div>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }
  
  const isOwner = isAuthenticated && user && product.seller._id === user.id;
  
  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1>{product.name}</h1>
          <p className="text-muted">
            Listed by {product.seller.username} | Category: {product.category}
          </p>
        </div>
        <div className="col-md-4 text-md-end">
          <Link to="/products" className="btn btn-outline-primary">
            Back to Products
          </Link>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-8 mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <img
                    src={product.images && product.images.length > 0
                      ? product.images[0].startsWith('http')
                        ? product.images[0]
                        : `http://localhost:5000${product.images[0]}`
                      : `https://via.placeholder.com/400x300?text=${product.name}`}
                    alt={product.name}
                    className="img-fluid rounded"
                  />
                  
                  {product.images && product.images.length > 1 && (
                    <div className="row mt-2">
                      {product.images.slice(1).map((image, index) => (
                        <div className="col-3" key={index}>
                          <img
                            src={image.startsWith('http')
                              ? image
                              : `http://localhost:5000${image}`}
                            alt={`${product.name} ${index + 2}`}
                            className="img-thumbnail"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <h5>Product Details</h5>
                  <p>{product.description}</p>
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <th>Condition</th>
                        <td>{product.condition}</td>
                      </tr>
                      <tr>
                        <th>Category</th>
                        <td>{product.category}</td>
                      </tr>
                      <tr>
                        <th>Starting Price</th>
                        <td>₹{product.startingPrice}</td>
                      </tr>
                      <tr>
                        <th>Listed By</th>
                        <td>{product.seller.username}</td>
                      </tr>
                      <tr>
                        <th>Listed On</th>
                        <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <hr className="my-4" />
              
              {isOwner ? (
                <div className="d-flex justify-content-center">
                  {activeAuctions.length === 0 ? (
                    <Link to={`/create-auction/${product._id}`} className="btn btn-primary">
                      Create Auction for this Product
                    </Link>
                  ) : (
                    <div className="alert alert-info w-100 text-center">
                      This product already has an active auction.
                      <div className="mt-2">
                        <Link to={`/auctions/${activeAuctions[0]._id}`} className="btn btn-sm btn-primary">
                          View Auction
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                activeAuctions.length > 0 ? (
                  <div className="alert alert-success text-center">
                    <h5>This product is currently up for auction!</h5>
                    <p>Current bid: ₹{activeAuctions[0].currentBid}</p>
                    <Link to={`/auctions/${activeAuctions[0]._id}`} className="btn btn-primary">
                      View Auction & Bid
                    </Link>
                  </div>
                ) : (
                  <div className="alert alert-warning text-center">
                    This product is not currently up for auction.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Seller Information</h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <span className="display-6">{product.seller.username.charAt(0).toUpperCase()}</span>
                </div>
                <h5 className="mt-3">{product.seller.username}</h5>
              </div>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-primary" disabled>
                  Contact Seller
                </button>
                <Link to={`/products?seller=${product.seller._id}`} className="btn btn-outline-secondary">
                  See Other Products
                </Link>
              </div>
            </div>
          </div>
          
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {activeAuctions.length > 0 ? (
                  <Link to={`/auctions/${activeAuctions[0]._id}`} className="btn btn-primary">
                    View Active Auction
                  </Link>
                ) : isOwner ? (
                  <Link to={`/create-auction/${product._id}`} className="btn btn-primary">
                    Create Auction
                  </Link>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    No Active Auction
                  </button>
                )}
                
                {isOwner && (
                  <>
                    <Link to={`/edit-product/${product._id}`} className="btn btn-outline-primary">
                      Edit Product
                    </Link>
                    <button className="btn btn-outline-danger">
                      Delete Product
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 