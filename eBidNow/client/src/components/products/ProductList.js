import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProductList = ({ showAlert }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    seller: ''
  });
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Build query string for filters
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage);
        
        if (filters.category) {
          queryParams.append('category', filters.category);
        }
        
        if (filters.condition) {
          queryParams.append('condition', filters.condition);
        }
        
        if (filters.seller) {
          queryParams.append('seller', filters.seller);
        }
        
        const res = await axios.get(`http://localhost:5000/api/products?${queryParams.toString()}`);
        
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        showAlert('Error loading products', 'danger');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentPage, filters, showAlert]);
  
  const handleFilterChange = e => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };
  
  return (
    <div className="container">
      <div className="row mb-4">
        <div className="col-md-6">
          <h1>Products</h1>
          <p className="lead">Browse all available products.</p>
        </div>
        <div className="col-md-6 text-md-end">
          <Link to="/create-product" className="btn btn-primary">
            Add New Product
          </Link>
        </div>
      </div>
      
      {/* Filter Options */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <label htmlFor="categoryFilter" className="form-label">Filter by Category</label>
              <select
                id="categoryFilter"
                name="category"
                className="form-select"
                value={filters.category}
                onChange={handleFilterChange}
              >
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Home">Home & Garden</option>
                <option value="Collectibles">Collectibles</option>
                <option value="Art">Art</option>
                <option value="Sports">Sports</option>
                <option value="Toys">Toys & Games</option>
                <option value="Books">Books & Media</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <label htmlFor="conditionFilter" className="form-label">Filter by Condition</label>
              <select
                id="conditionFilter"
                name="condition"
                className="form-select"
                value={filters.condition}
                onChange={handleFilterChange}
              >
                <option value="">All Conditions</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="sellerFilter" className="form-label">Filter by Seller</label>
              <input
                type="text"
                id="sellerFilter"
                name="seller"
                className="form-control"
                value={filters.seller}
                onChange={handleFilterChange}
                placeholder="Enter seller ID"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Products List */}
      {loading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : products.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {products.map(product => (
            <div className="col" key={product._id}>
              <div className="card h-100 shadow-sm">
                <img
                  src={product.images && product.images.length > 0
                    ? product.images[0].startsWith('http')
                      ? product.images[0]
                      : `http://localhost:5000${product.images[0]}`
                    : `https://via.placeholder.com/300x200?text=${product.name}`}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>
                  <p className="card-text text-truncate">{product.description}</p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-secondary">{product.category}</span>
                    <span className="badge bg-info">{product.condition}</span>
                  </div>
                  <p className="fw-bold text-primary">Starting Price: ₹{product.startingPrice}</p>
                  <p className="text-muted mb-0">
                    <small>Seller: {product.seller.username}</small>
                  </p>
                </div>
                <div className="card-footer bg-white d-flex justify-content-between">
                  <Link to={`/products/${product._id}`} className="btn btn-outline-primary">
                    View Details
                  </Link>
                  <Link to={`/create-auction/${product._id}`} className="btn btn-primary">
                    Create Auction
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center">
          No products found with the selected filters.
        </div>
      )}
      
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

export default ProductList; 