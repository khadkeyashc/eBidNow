import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const CreateProduct = ({ showAlert }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    condition: '',
    startingPrice: '',
    images: []
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { name, description, category, condition, startingPrice } = formData;
  
  // List of 10 most popular auction categories
  const categories = [
    { value: 'Electronics', label: 'Electronics & Gadgets' },
    { value: 'Collectibles', label: 'Collectibles & Art' },
    { value: 'Jewelry', label: 'Jewelry & Watches' },
    { value: 'Vehicles', label: 'Vehicles & Automotive' },
    { value: 'RealEstate', label: 'Real Estate & Property' },
    { value: 'Fashion', label: 'Fashion & Apparel' },
    { value: 'Antiques', label: 'Antiques & Vintage' },
    { value: 'Sports', label: 'Sports Memorabilia' },
    { value: 'Business', label: 'Business Equipment' },
    { value: 'Other', label: 'Other Items' }
  ];
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleImageUpload = e => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      showAlert('Maximum 5 images allowed', 'warning');
      return;
    }
    
    setImageFiles(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };
  
  const removeImage = (index) => {
    const updatedFiles = [...imageFiles];
    const updatedPreviews = [...imagePreview];
    
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    setImageFiles(updatedFiles);
    setImagePreview(updatedPreviews);
  };
  
  const uploadImages = async () => {
    try {
      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('images', file);
      });

      const response = await axios.post('http://localhost:5000/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-auth-token': localStorage.getItem('token')
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(Math.min(Math.round(progress), 100));
        }
      });

      return response.data.imageUrls;
    } catch (err) {
      console.error('Error uploading images:', err);
      throw new Error('Error uploading images');
    }
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (startingPrice <= 0) {
      showAlert('Starting price must be greater than 0', 'danger');
      return;
    }
    
    if (imageFiles.length === 0 && formData.images.length === 0) {
      showAlert('Please add at least one product image', 'warning');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Handle image upload
      let productImages = formData.images;
      
      if (imageFiles.length > 0) {
        const uploadedImageUrls = await uploadImages();
        productImages = uploadedImageUrls;
      }
      
      // Create product
      const res = await axios.post('http://localhost:5000/api/products', {
        name,
        description,
        category,
        condition,
        images: productImages,
        startingPrice: parseFloat(startingPrice)
      });
      
      showAlert('Product created successfully!', 'success');
      
      // Redirect to either create auction page or product details
      const confirmAuction = window.confirm('Would you like to create an auction for this product now?');
      
      if (confirmAuction) {
        navigate(`/create-auction/${res.data._id}`);
      } else {
        navigate(`/products/${res.data._id}`);
      }
    } catch (err) {
      console.error('Error creating product:', err);
      showAlert(err.response?.data?.message || 'Error creating product', 'danger');
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-8">
          <h1 className="my-4 text-primary">Add New Product</h1>
          <p className="lead text-muted">Create a new product to sell through auction.</p>
        </div>
        <div className="col-md-4 text-md-end">
          <Link to="/dashboard" className="btn btn-outline-primary mt-4">
            <i className="fas fa-arrow-left me-2"></i>Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow border-0 rounded-3 mb-4">
            <div className="card-header bg-gradient-primary-to-secondary p-4">
              <h5 className="mb-0 text-white fw-bold">Product Information</h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={onSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="form-label fw-bold">Product Name*</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="name"
                    name="name"
                    value={name}
                    onChange={onChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="form-label fw-bold">Description*</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={description}
                    onChange={onChange}
                    rows="5"
                    placeholder="Provide a detailed description of your product"
                    required
                  ></textarea>
                  <div className="form-text">
                    Include details like brand, model, dimensions, features, and condition notes.
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label fw-bold">Category*</label>
                    <select
                      className="form-select form-select-lg"
                      id="category"
                      name="category"
                      value={category}
                      onChange={onChange}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="condition" className="form-label fw-bold">Condition*</label>
                    <select
                      className="form-select form-select-lg"
                      id="condition"
                      name="condition"
                      value={condition}
                      onChange={onChange}
                      required
                    >
                      <option value="">Select Condition</option>
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="startingPrice" className="form-label fw-bold">Starting Price (₹)*</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      id="startingPrice"
                      name="startingPrice"
                      value={startingPrice}
                      onChange={onChange}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="form-text">
                    This will be the starting price for your auction.
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label fw-bold">Product Images*</label>
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="mb-3">
                        <input
                          type="file"
                          className="form-control"
                          id="images"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                        <div className="form-text">
                          Upload up to 5 high-quality images of your product. First image will be the main display image.
                        </div>
                      </div>
                      
                      {imagePreview.length > 0 && (
                        <div className="mb-3">
                          <label className="form-label">Image Previews:</label>
                          <div className="d-flex flex-wrap gap-2">
                            {imagePreview.map((src, index) => (
                              <div key={index} className="position-relative">
                                <img 
                                  src={src} 
                                  alt={`Preview ${index}`} 
                                  className="img-thumbnail" 
                                  style={{width: '120px', height: '120px', objectFit: 'cover'}} 
                                />
                                <button 
                                  type="button" 
                                  className="btn btn-danger btn-sm position-absolute top-0 end-0" 
                                  onClick={() => removeImage(index)}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                      {uploadProgress > 0 ? (
                        <>
                          <div className="progress" style={{height: '20px'}}>
                            <div 
                              className="progress-bar progress-bar-striped progress-bar-animated" 
                              role="progressbar" 
                              style={{width: `${uploadProgress}%`}} 
                              aria-valuenow={uploadProgress} 
                              aria-valuemin="0" 
                              aria-valuemax="100"
                            >
                              {uploadProgress}%
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Creating Product...
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus-circle me-2"></i>
                      Create Product
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card shadow border-0 rounded-3">
            <div className="card-header bg-gradient-primary-to-secondary p-4">
              <h5 className="mb-0 text-white fw-bold">Tips for Success</h5>
            </div>
            <div className="card-body p-4">
              <ul className="list-group list-group-flush">
                <li className="list-group-item px-0 d-flex align-items-center border-0">
                  <div className="badge bg-primary rounded-pill me-3">1</div>
                  <div>
                    <strong>Quality Photos</strong>
                    <p className="mb-0 text-muted small">Use clear, well-lit photos from multiple angles</p>
                  </div>
                </li>
                <li className="list-group-item px-0 d-flex align-items-center border-0">
                  <div className="badge bg-primary rounded-pill me-3">2</div>
                  <div>
                    <strong>Detailed Description</strong>
                    <p className="mb-0 text-muted small">Be thorough and honest about condition</p>
                  </div>
                </li>
                <li className="list-group-item px-0 d-flex align-items-center border-0">
                  <div className="badge bg-primary rounded-pill me-3">3</div>
                  <div>
                    <strong>Competitive Pricing</strong>
                    <p className="mb-0 text-muted small">Research similar items to set a fair starting price</p>
                  </div>
                </li>
                <li className="list-group-item px-0 d-flex align-items-center border-0">
                  <div className="badge bg-primary rounded-pill me-3">4</div>
                  <div>
                    <strong>Correct Category</strong>
                    <p className="mb-0 text-muted small">Choose the most specific category for better visibility</p>
                  </div>
                </li>
                <li className="list-group-item px-0 d-flex align-items-center border-0">
                  <div className="badge bg-primary rounded-pill me-3">5</div>
                  <div>
                    <strong>Quick Responses</strong>
                    <p className="mb-0 text-muted small">Be ready to answer questions about your item</p>
                  </div>
                </li>
              </ul>
              
              <div className="alert alert-info mt-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="fas fa-info-circle fa-2x"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Next Steps</h6>
                    <p className="mb-0 small">After creating your product, you can immediately set up an auction or do it later from your dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct; 