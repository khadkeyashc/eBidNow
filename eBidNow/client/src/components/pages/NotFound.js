import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="container text-center py-5">
      <div className="card shadow-lg border-0 rounded-lg p-5 my-5">
        <h1 className="display-1 text-danger mb-3">404</h1>
        <h2 className="mb-4">Page Not Found</h2>
        
        <p className="lead mb-4">
          The page <span className="fw-bold text-primary">{currentPath}</span> you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="mb-4">
          <h5 className="text-muted">Here are some helpful links:</h5>
          <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
            <Link to="/" className="btn btn-outline-primary">
              <i className="fas fa-home me-2"></i>Home
            </Link>
            <Link to="/auctions" className="btn btn-outline-secondary">
              <i className="fas fa-gavel me-2"></i>Browse Auctions
            </Link>
            <Link to="/products" className="btn btn-outline-secondary">
              <i className="fas fa-box me-2"></i>Browse Products
            </Link>
            <Link to="/dashboard" className="btn btn-outline-secondary">
              <i className="fas fa-user me-2"></i>My Dashboard
            </Link>
          </div>
        </div>
        
        <div className="alert alert-info">
          <h6 className="mb-2">Common Reasons for 404 Errors:</h6>
          <ul className="text-start mb-0">
            <li>The URL might be misspelled or incorrect</li>
            <li>You might need to log in to access this page</li>
            <li>The resource might have been moved or deleted</li>
            <li>The server might be experiencing issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 