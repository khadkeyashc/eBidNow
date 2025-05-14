import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Register = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // For multi-step registration
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { 
    username, 
    email, 
    password, 
    password2, 
    firstName, 
    lastName, 
    phoneNumber,
    address
  } = formData;
  
  const onChange = e => {
    if (e.target.name.startsWith('address.')) {
      const addressField = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: e.target.value
        }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };
  
  const nextStep = () => {
    setStep(step + 1);
  };
  
  const prevStep = () => {
    setStep(step - 1);
  };
  
  const validateStep1 = () => {
    if (!username || !email || !password || !password2) {
      showAlert('Please fill in all required fields', 'danger');
      return false;
    }
    
    if (password !== password2) {
      showAlert('Passwords do not match', 'danger');
      return false;
    }
    
    if (password.length < 6) {
      showAlert('Password must be at least 6 characters', 'danger');
      return false;
    }
    
    return true;
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    setLoading(true);
    
    const result = await register({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address
    });
    
    setLoading(false);
    
    if (result.success) {
      showAlert('Registration successful! Welcome to Auction Platform.', 'success');
      navigate('/dashboard');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow border-0 rounded-3">
            <div className="card-header bg-gradient-primary-to-secondary p-4">
              <h2 className="text-center text-white mb-0 fw-bold">Create Your Account</h2>
            </div>
            <div className="card-body p-5">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className={`fw-bold ${step >= 1 ? 'text-primary' : 'text-muted'}`}>Account Details</span>
                  <span className={`fw-bold ${step >= 2 ? 'text-primary' : 'text-muted'}`}>Personal Information</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-primary" 
                    role="progressbar" 
                    style={{ width: step === 1 ? '50%' : '100%' }} 
                    aria-valuenow={step === 1 ? 50 : 100} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
              
              <form onSubmit={onSubmit}>
                {/* Step 1: Account Details */}
                {step === 1 && (
                  <>
                    <h4 className="mb-4 text-primary">Account Details</h4>
                    <div className="mb-4">
                      <label htmlFor="username" className="form-label fw-bold">Username*</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-user"></i></span>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          id="username"
                          name="username"
                          value={username}
                          onChange={onChange}
                          placeholder="Choose a unique username"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="form-label fw-bold">Email Address*</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-envelope"></i></span>
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          id="email"
                          name="email"
                          value={email}
                          onChange={onChange}
                          placeholder="Your email address"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="password" className="form-label fw-bold">Password*</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-lock"></i></span>
                        <input
                          type="password"
                          className="form-control form-control-lg"
                          id="password"
                          name="password"
                          value={password}
                          onChange={onChange}
                          placeholder="Create a secure password"
                          required
                          minLength="6"
                        />
                      </div>
                      <div className="form-text">
                        Password must be at least 6 characters long
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="password2" className="form-label fw-bold">Confirm Password*</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-lock"></i></span>
                        <input
                          type="password"
                          className="form-control form-control-lg"
                          id="password2"
                          name="password2"
                          value={password2}
                          onChange={onChange}
                          placeholder="Confirm your password"
                          required
                          minLength="6"
                        />
                      </div>
                    </div>
                    
                    <div className="d-grid">
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={() => {
                          if (validateStep1()) nextStep();
                        }}
                      >
                        Continue <i className="fas fa-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </>
                )}
                
                {/* Step 2: Personal Information */}
                {step === 2 && (
                  <>
                    <h4 className="mb-4 text-primary">Personal Information</h4>
                    <div className="row mb-4">
                      <div className="col-md-6 mb-3 mb-md-0">
                        <label htmlFor="firstName" className="form-label fw-bold">First Name</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          id="firstName"
                          name="firstName"
                          value={firstName}
                          onChange={onChange}
                          placeholder="Your first name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="lastName" className="form-label fw-bold">Last Name</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          id="lastName"
                          name="lastName"
                          value={lastName}
                          onChange={onChange}
                          placeholder="Your last name"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="phoneNumber" className="form-label fw-bold">Phone Number</label>
                      <div className="input-group">
                        <span className="input-group-text"><i className="fas fa-phone"></i></span>
                        <input
                          type="tel"
                          className="form-control form-control-lg"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={phoneNumber}
                          onChange={onChange}
                          placeholder="Your phone number"
                        />
                      </div>
                    </div>
                    
                    <h5 className="mb-3 mt-4">Address Information (Optional)</h5>
                    
                    <div className="mb-3">
                      <label htmlFor="street" className="form-label">Street Address</label>
                      <input
                        type="text"
                        className="form-control"
                        id="street"
                        name="address.street"
                        value={address.street}
                        onChange={onChange}
                        placeholder="Street address"
                      />
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6 mb-3 mb-md-0">
                        <label htmlFor="city" className="form-label">City</label>
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          name="address.city"
                          value={address.city}
                          onChange={onChange}
                          placeholder="City"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="state" className="form-label">State/Province</label>
                        <input
                          type="text"
                          className="form-control"
                          id="state"
                          name="address.state"
                          value={address.state}
                          onChange={onChange}
                          placeholder="State/Province"
                        />
                      </div>
                    </div>
                    
                    <div className="row mb-4">
                      <div className="col-md-6 mb-3 mb-md-0">
                        <label htmlFor="zip" className="form-label">ZIP/Postal Code</label>
                        <input
                          type="text"
                          className="form-control"
                          id="zip"
                          name="address.zip"
                          value={address.zip}
                          onChange={onChange}
                          placeholder="ZIP/Postal code"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="country" className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          id="country"
                          name="address.country"
                          value={address.country}
                          onChange={onChange}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-lg flex-grow-1"
                        onClick={prevStep}
                      >
                        <i className="fas fa-arrow-left me-2"></i> Back
                      </button>
                      
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg flex-grow-1"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Complete Registration <i className="fas fa-check ms-2"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
              
              <div className="text-center mt-4">
                <p className="mb-0">
                  Already have an account? <Link to="/login" className="fw-bold text-primary">Login</Link>
                </p>
              </div>
            </div>
          </div>
          
          <div className="card mt-4 border-0 bg-light">
            <div className="card-body p-4">
              <div className="d-flex">
                <div className="me-3">
                  <i className="fas fa-shield-alt text-primary fa-2x"></i>
                </div>
                <div>
                  <h5>Your information is secure</h5>
                  <p className="mb-0 text-muted">
                    We're committed to protecting your personal data. Read our <a href="#" className="text-decoration-none">Privacy Policy</a> to learn more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 