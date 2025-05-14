import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CreateAuction = ({ showAlert }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [formData, setFormData] = useState({
    product: productId || '',
    startTime: new Date(), // Default to now (immediate start)
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 1 day from now
    startingBid: '',
    minBidIncrement: 1
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Fetch product details if productId is provided
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If productId is provided, fetch that specific product
        if (productId) {
          const res = await axios.get(`http://localhost:5000/api/products/${productId}`);
          setProduct(res.data);
          
          // Set starting bid to product's starting price by default
          setFormData(prevState => ({
            ...prevState,
            startingBid: res.data.startingPrice,
            product: res.data._id
          }));
        }
        
        // Always fetch user's products for the dropdown
        const userProductsRes = await axios.get('http://localhost:5000/api/products/user/me');
        
        if (userProductsRes.data.length === 0) {
          showAlert('You need to create a product first before creating an auction', 'info');
          navigate('/create-product');
          return;
        }
        
        setUserProducts(userProductsRes.data);
        
        // If no specific product was selected, use the first one as default
        if (!productId && userProductsRes.data.length > 0) {
          const defaultProduct = userProductsRes.data[0];
          setProduct(defaultProduct);
          setFormData(prevState => ({
            ...prevState,
            product: defaultProduct._id,
            startingBid: defaultProduct.startingPrice
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        showAlert('Error loading product details', 'danger');
        setLoading(false);
        navigate('/dashboard');
      }
    };
    
    fetchData();
  }, [productId, navigate, showAlert]);
  
  const { product: selectedProductId, startTime, endTime, startingBid, minBidIncrement } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleProductChange = async (e) => {
    const newProductId = e.target.value;
    setFormData({ ...formData, product: newProductId });
    
    try {
      // Find the product in already loaded products
      const selectedProduct = userProducts.find(p => p._id === newProductId);
      if (selectedProduct) {
        setProduct(selectedProduct);
        setFormData(prevState => ({
          ...prevState,
          product: selectedProduct._id,
          startingBid: selectedProduct.startingPrice
        }));
      } else {
        // If not found (shouldn't happen), fetch it
        const res = await axios.get(`http://localhost:5000/api/products/${newProductId}`);
        setProduct(res.data);
        setFormData(prevState => ({
          ...prevState,
          startingBid: res.data.startingPrice
        }));
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      showAlert('Error loading product details', 'danger');
    }
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    // Form validation
    if (!selectedProductId) {
      showAlert('Please select a product', 'danger');
      return;
    }
    
    // Only check if start time is in the future if it's a scheduled auction
    if (isScheduled && new Date(startTime) < new Date()) {
      showAlert('Start time must be in the future', 'danger');
      return;
    }
    
    if (new Date(endTime) <= new Date(startTime)) {
      showAlert('End time must be after start time', 'danger');
      return;
    }
    
    if (startingBid <= 0) {
      showAlert('Starting bid must be greater than 0', 'danger');
      return;
    }
    
    if (minBidIncrement <= 0) {
      showAlert('Minimum bid increment must be greater than 0', 'danger');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        showAlert('You need to be logged in to create an auction', 'danger');
        setSubmitting(false);
        return;
      }
      
      // Set Authorization header
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      // If not scheduled, use current time as start time
      const actualStartTime = isScheduled ? startTime : new Date();
      
      // Format dates as ISO strings for consistent handling
      const auctionData = {
        product: selectedProductId,
        startTime: actualStartTime.toISOString(),
        endTime: endTime.toISOString(),
        startingBid: parseFloat(startingBid),
        minBidIncrement: parseFloat(minBidIncrement)
      };
      
      console.log('Submitting auction data:', auctionData);
      
      const res = await axios.post('http://localhost:5000/api/auctions', auctionData, config);
      
      console.log('Auction created:', res.data);
      showAlert('Auction created successfully!', 'success');
      navigate(`/auctions/${res.data._id}`);
    } catch (err) {
      console.error('Error creating auction:', err);
      let errorMessage = 'Error creating auction';
      
      if (err.response) {
        console.error('Server response:', err.response.data);
        errorMessage = err.response.data.message || errorMessage;
      }
      
      showAlert(errorMessage, 'danger');
      setSubmitting(false);
    }
  };
  
  // Calculate suggested end times
  const getSuggestedEndTimes = () => {
    const now = new Date();
    return [
      { label: '1 Day', value: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      { label: '3 Days', value: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
      { label: '7 Days', value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      { label: '14 Days', value: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
    ];
  };
  
  const handleQuickEndTime = (date) => {
    setFormData({ ...formData, endTime: date });
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
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="text-primary">Create Auction</h1>
          <p className="lead text-muted">Set up an auction for your product.</p>
        </div>
        <div className="col-md-4 text-md-end">
          <Link to="/dashboard" className="btn btn-outline-primary">
            <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow border-0 rounded-3 mb-4">
            <div className="card-header bg-gradient-primary-to-secondary p-4">
              <h5 className="mb-0 text-white fw-bold">Auction Details</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={onSubmit}>
                {/* Product Selection */}
                <div className="mb-4">
                  <label htmlFor="product" className="form-label fw-bold">Select Product*</label>
                  <select
                    className="form-select form-select-lg"
                    id="product"
                    name="product"
                    value={selectedProductId}
                    onChange={handleProductChange}
                    required
                  >
                    <option value="">Select a product to auction</option>
                    {userProducts.map(prod => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} - ₹{prod.startingPrice}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Selected Product Preview */}
                {product && (
                  <div className="card mb-4 bg-light">
                    <div className="card-body">
                      <h6 className="fw-bold mb-3">Selected Product</h6>
                      <div className="row">
                        <div className="col-md-4 mb-3 mb-md-0">
                          <img
                            src={product.images && product.images.length > 0
                              ? product.images[0].startsWith('http')
                                ? product.images[0]
                                : `http://localhost:5000${product.images[0]}`
                              : `https://via.placeholder.com/200x150?text=${product.name}`}
                            alt={product.name}
                            className="img-fluid rounded"
                            style={{ maxHeight: '150px', objectFit: 'cover' }}
                          />
                        </div>
                        <div className="col-md-8">
                          <h5 className="card-title">{product.name}</h5>
                          <p className="card-text text-truncate">{product.description}</p>
                          <div className="d-flex justify-content-between">
                            <span className="badge bg-secondary">{product.category}</span>
                            <span className="badge bg-primary">{product.condition}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Schedule Auction Toggle */}
                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="scheduleAuction"
                    checked={isScheduled}
                    onChange={() => setIsScheduled(!isScheduled)}
                  />
                  <label className="form-check-label" htmlFor="scheduleAuction">
                    Schedule auction for later
                  </label>
                </div>
                
                {/* Auction Timing */}
                <h5 className="text-primary mb-3">Auction Timing</h5>
                
                {isScheduled ? (
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3 mb-md-0">
                      <label htmlFor="startTime" className="form-label fw-bold">Start Time*</label>
                      <DatePicker
                        id="startTime"
                        selected={startTime}
                        onChange={date => setFormData({ ...formData, startTime: date })}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="form-control form-control-lg"
                        minDate={new Date()}
                        required
                        placeholderText="Select start date and time"
                      />
                      <div className="form-text">
                        When the auction will become active
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="endTime" className="form-label fw-bold">End Time*</label>
                      <DatePicker
                        id="endTime"
                        selected={endTime}
                        onChange={date => setFormData({ ...formData, endTime: date })}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="form-control form-control-lg"
                        minDate={startTime}
                        required
                        placeholderText="Select end date and time"
                      />
                      <div className="form-text">
                        When the auction will close
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="alert alert-info d-flex align-items-center">
                      <i className="fas fa-info-circle me-3 fs-4"></i>
                      <div>
                        <strong>Immediate Auction:</strong> Your auction will start as soon as you submit this form and will end after the duration you select below.
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="endTime" className="form-label fw-bold">Auction Duration*</label>
                      <DatePicker
                        id="endTime"
                        selected={endTime}
                        onChange={date => setFormData({ ...formData, endTime: date })}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="form-control form-control-lg"
                        minDate={new Date(Date.now() + 60 * 60 * 1000)} // At least 1 hour from now
                        required
                        placeholderText="Select end date and time"
                      />
                      <div className="form-text">
                        When the auction will close
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Quick Duration Buttons */}
                <div className="mb-4">
                  <label className="form-label">Quick Duration:</label>
                  <div className="d-flex flex-wrap gap-2">
                    {getSuggestedEndTimes().map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => handleQuickEndTime(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Pricing */}
                <h5 className="text-primary mt-4 mb-3">Pricing</h5>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <label htmlFor="startingBid" className="form-label fw-bold">Starting Bid (₹)*</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        id="startingBid"
                        name="startingBid"
                        value={startingBid}
                        onChange={onChange}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-text">
                      Initial bid amount
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="minBidIncrement" className="form-label fw-bold">Minimum Bid Increment (₹)*</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        id="minBidIncrement"
                        name="minBidIncrement"
                        value={minBidIncrement}
                        onChange={onChange}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-text">
                      Minimum amount a new bid must exceed the current bid
                    </div>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating Auction...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-gavel me-2"></i>
                      {isScheduled ? 'Schedule Auction' : 'Start Auction Now'}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          
          {/* Auction Guidelines */}
          <div className="card shadow border-0 rounded-3">
            <div className="card-header bg-light p-3">
              <h5 className="mb-0 fw-bold">Auction Guidelines</h5>
            </div>
            <div className="card-body p-4">
              <ul className="mb-0">
                <li className="mb-2">Be accurate in your product description and condition</li>
                <li className="mb-2">Set a fair starting price to attract initial bids</li>
                <li className="mb-2">Respond promptly to questions from potential bidders</li>
                <li className="mb-2">Choose an appropriate auction duration based on item value and demand</li>
                <li className="mb-2">Be prepared to ship or deliver the item after the auction ends</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4 mt-4 mt-lg-0">
          <div className="card shadow border-0 rounded-3 mb-4">
            <div className="card-header bg-light p-3">
              <h5 className="mb-0 fw-bold">Auction Summary</h5>
            </div>
            <div className="card-body p-4">
              {product ? (
                <>
                  <div className="mb-3">
                    <span className="text-muted">Product:</span>
                    <p className="fw-bold mb-0">{product.name}</p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-muted">Start:</span>
                    <p className="fw-bold mb-0">
                      {isScheduled 
                        ? startTime.toLocaleString() 
                        : 'Immediately upon creation'}
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-muted">End:</span>
                    <p className="fw-bold mb-0">{endTime.toLocaleString()}</p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-muted">Duration:</span>
                    <p className="fw-bold mb-0">
                      {Math.ceil((endTime - (isScheduled ? startTime : new Date())) / (1000 * 60 * 60 * 24))} day(s)
                    </p>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-muted">Starting Bid:</span>
                    <p className="fw-bold mb-0">₹{parseFloat(startingBid || 0).toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <span className="text-muted">Minimum Increment:</span>
                    <p className="fw-bold mb-0">₹{parseFloat(minBidIncrement).toFixed(2)}</p>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted">Please select a product to see auction summary</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction; 