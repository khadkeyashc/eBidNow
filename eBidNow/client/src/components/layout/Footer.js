import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-3 mb-md-0">
            <h5>Auction Platform</h5>
            <p className="text-muted">
              A platform for buying and selling items through online auctions.
            </p>
          </div>
          <div className="col-md-2 mb-3 mb-md-0">
            <h5>Links</h5>
            <ul className="list-unstyled">
              <li><Link className="text-decoration-none text-muted" to="/">Home</Link></li>
              <li><Link className="text-decoration-none text-muted" to="/auctions">Auctions</Link></li>
              <li><Link className="text-decoration-none text-muted" to="/products">Products</Link></li>
            </ul>
          </div>
          <div className="col-md-2 mb-3 mb-md-0">
            <h5>Account</h5>
            <ul className="list-unstyled">
              <li><Link className="text-decoration-none text-muted" to="/login">Login</Link></li>
              <li><Link className="text-decoration-none text-muted" to="/register">Register</Link></li>
              <li><Link className="text-decoration-none text-muted" to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Contact</h5>
            <ul className="list-unstyled text-muted">
              <li>Email: support@auction-platform.com</li>
              <li>Phone: +1 (123) 456-7890</li>
              <li>Address: 123 Auction St, City, Country</li>
            </ul>
          </div>
        </div>
        <hr className="my-3" />
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0 text-muted">
              &copy; {new Date().getFullYear()} Auction Platform. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <ul className="list-inline mb-0">
              <li className="list-inline-item">
                <a href="#!" className="text-muted">
                  <i className="fab fa-facebook-f"></i>
                </a>
              </li>
              <li className="list-inline-item ms-3">
                <a href="#!" className="text-muted">
                  <i className="fab fa-twitter"></i>
                </a>
              </li>
              <li className="list-inline-item ms-3">
                <a href="#!" className="text-muted">
                  <i className="fab fa-instagram"></i>
                </a>
              </li>
              <li className="list-inline-item ms-3">
                <a href="#!" className="text-muted">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 