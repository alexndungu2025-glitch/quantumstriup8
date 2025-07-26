import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTokens, useModelEarnings, useAdminStats } from './hooks';
import { useResponsive, getResponsiveSpacing, getResponsiveText, getResponsiveGrid } from './responsive';
import { apiUtils } from './api';

// Updated Register Page Component (Backend Integrated)
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const spacing = getResponsiveSpacing(isMobile, isTablet);
  const textSizes = getResponsiveText(isMobile, isTablet);
  
  const [userType, setUserType] = useState('viewer');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    setPasswordMatch(
      formData.password === formData.confirmPassword || formData.confirmPassword === ''
    );
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (!passwordMatch) {
      return;
    }
    
    if (!formData.terms) {
      return;
    }
    
    const registrationData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      age: parseInt(formData.age),
      role: userType,
      country: 'ke' // Default to Kenya
    };
    
    const result = await register(registrationData);
    
    if (result.success) {
      alert('Registration successful! Please check your email to verify your account.');
      navigate('/login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className={`max-w-md w-full bg-gray-800 rounded-xl shadow-2xl ${spacing.card} border border-gray-700`}>
        <div className="text-center mb-8">
          <h1 className={`${textSizes.h1} bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2`}>
            QUANTUMSTRIP
          </h1>
          <p className="text-gray-300">Create your account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {/* User Type Selector */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setUserType('viewer')}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'viewer' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Viewer
          </button>
          <button
            type="button"
            onClick={() => setUserType('model')}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'model' 
                ? 'bg-pink-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Model
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Choose a username"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="254712345678"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Age
            </label>
            <input
              type="number"
              name="age"
              min="18"
              value={formData.age}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Must be 18+"
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none pr-12"
                placeholder="Create a password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg text-white focus:outline-none ${
                passwordMatch 
                  ? 'bg-gray-700 border-gray-600 focus:border-purple-500' 
                  : 'bg-red-900/30 border-red-500'
              }`}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
            {!passwordMatch && (
              <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
            )}
          </div>
          
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleInputChange}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 mt-1"
              required
              disabled={isLoading}
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
              I agree to the{' '}
              <button type="button" className="text-purple-400 hover:text-purple-300">
                Terms of Service
              </button>
              {' '}and{' '}
              <button type="button" className="text-purple-400 hover:text-purple-300">
                Privacy Policy
              </button>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !formData.terms || !passwordMatch || !formData.email || !formData.password}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isLoading || !formData.terms || !passwordMatch || !formData.email || !formData.password
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </div>
            ) : (
              `Create ${userType.charAt(0).toUpperCase() + userType.slice(1)} Account`
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              disabled={isLoading}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign in
            </button>
          </p>
          
          <button
            onClick={() => navigate('/')}
            disabled={isLoading}
            className="mt-4 text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Updated Token Purchase Page Component (Backend Integrated)
export const TokenPurchasePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    packages, 
    balance, 
    isLoading, 
    error, 
    purchaseTokens, 
    checkPaymentStatus,
    fetchBalance 
  } = useTokens();
  const { isMobile, isTablet } = useResponsive();
  const spacing = getResponsiveSpacing(isMobile, isTablet);
  const textSizes = getResponsiveText(isMobile, isTablet);
  const grid = getResponsiveGrid(isMobile, isTablet);
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Convert packages object to array and set default selection
  useEffect(() => {
    if (packages && Object.keys(packages).length > 0 && !selectedPackage) {
      const packageArray = Object.entries(packages).map(([tokens, price]) => ({
        tokens: parseInt(tokens),
        price: parseFloat(price),
        popular: parseInt(tokens) === 100 // Mark 100 tokens as popular
      }));
      setSelectedPackage(packageArray[1] || packageArray[0]); // Default to second package or first
    }
  }, [packages, selectedPackage]);

  // Handle purchase
  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedPackage || !phoneNumber) return;
    
    setIsProcessing(true);
    setPaymentStatus(null);
    
    const result = await purchaseTokens(selectedPackage.tokens, phoneNumber);
    
    if (result.success) {
      setCheckoutRequestId(result.data.checkout_request_id);
      setPaymentStatus({
        success: true,
        message: result.data.message || 'STK push sent to your phone!'
      });
      
      // Start polling for payment status
      if (result.data.checkout_request_id) {
        startPaymentStatusPolling(result.data.checkout_request_id);
      }
    } else {
      setPaymentStatus({
        success: false,
        message: result.error || 'Payment failed'
      });
    }
    
    setIsProcessing(false);
  };

  // Poll payment status
  const startPaymentStatusPolling = (requestId) => {
    const pollInterval = setInterval(async () => {
      const status = await checkPaymentStatus(requestId);
      
      if (status && status.transaction_id) {
        clearInterval(pollInterval);
        
        if (status.status === 'completed') {
          setPaymentStatus({
            success: true,
            message: 'Payment successful! Your tokens have been added to your account.'
          });
          // Refresh balance
          setTimeout(() => {
            fetchBalance();
          }, 2000);
        } else if (status.status === 'failed') {
          setPaymentStatus({
            success: false,
            message: 'Payment failed. Please try again.'
          });
        }
      }
    }, 3000);
    
    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  if (!packages || Object.keys(packages).length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading token packages...</p>
        </div>
      </div>
    );
  }

  const packageArray = Object.entries(packages).map(([tokens, price]) => ({
    tokens: parseInt(tokens),
    price: parseFloat(price),
    popular: parseInt(tokens) === 100
  })).sort((a, b) => a.tokens - b.tokens);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black">
      {/* Header can be added here */}
      
      <div className={`max-w-4xl mx-auto ${spacing.container} pt-8`}>
        <div className="text-center mb-8">
          <h1 className={`${textSizes.h1} text-white mb-2`}>Purchase Tokens</h1>
          <p className="text-gray-300">Choose your token package and pay securely with M-Pesa</p>
          {balance !== undefined && (
            <div className="mt-4 text-green-400">
              Current Balance: {apiUtils.formatTokenAmount(balance)} tokens
            </div>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {paymentStatus && (
          <div className={`mb-6 p-4 border rounded-lg text-center ${
            paymentStatus.success 
              ? 'bg-green-900/30 border-green-700 text-green-300' 
              : 'bg-red-900/30 border-red-700 text-red-300'
          }`}>
            <p>{paymentStatus.message}</p>
            {paymentStatus.success && checkoutRequestId && (
              <p className="text-sm mt-2">
                Transaction ID: {checkoutRequestId}
              </p>
            )}
          </div>
        )}
        
        <div className={`${grid.forms} gap-8`}>
          {/* Token Packages */}
          <div className="bg-gray-800 rounded-xl border border-gray-700" style={{ padding: spacing.card.replace('p-', '').split(' ').map(p => `${p.replace(/\d+/, match => `${parseInt(match) * 4}px`)}`).join(' ') }}>
            <h2 className={`${textSizes.h2} text-white mb-4`}>Select Package</h2>
            
            <div className="space-y-3">
              {packageArray.map((pkg) => (
                <div
                  key={pkg.tokens}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPackage?.tokens === pkg.tokens
                      ? 'border-purple-500 bg-purple-900/30'
                      : 'border-gray-600 hover:border-gray-500'
                  } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-white mr-2">{pkg.tokens}</span>
                        <span className="text-gray-300">Tokens</span>
                        {pkg.popular && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {apiUtils.formatCurrency(pkg.price / pkg.tokens)} per token
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-400">
                        {apiUtils.formatCurrency(pkg.price)}
                      </div>
                      {pkg.tokens >= 200 && (
                        <div className="text-xs text-green-400">Save 5%</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700">
              <h3 className="text-blue-300 font-semibold mb-2">What can you do with tokens?</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Private shows: 20 tokens/minute</li>
                <li>• Tip models: Starting from 1 token</li>
                <li>• Send messages and requests</li>
                <li>• Access exclusive content</li>
              </ul>
            </div>
          </div>
          
          {/* Payment Form */}
          <div className="bg-gray-800 rounded-xl border border-gray-700" style={{ padding: spacing.card.replace('p-', '').split(' ').map(p => `${p.replace(/\d+/, match => `${parseInt(match) * 4}px`)}`).join(' ') }}>
            <h2 className={`${textSizes.h2} text-white mb-4`}>Payment Details</h2>
            
            <form onSubmit={handlePurchase} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="p-4 rounded-lg border-2 border-green-500 bg-green-900/30">
                  <div className="flex items-center">
                    <div className="bg-green-600 text-white px-3 py-1 rounded font-bold text-sm mr-3">
                      M-PESA
                    </div>
                    <span className="text-white">Pay with M-Pesa</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="254712345678"
                  required
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter your M-Pesa registered phone number
                </p>
              </div>
              
              {selectedPackage && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-2">Order Summary</h3>
                  <div className="flex justify-between text-gray-300 mb-2">
                    <span>{selectedPackage.tokens} Tokens</span>
                    <span>{apiUtils.formatCurrency(selectedPackage.price)}</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <div className="flex justify-between text-white font-semibold">
                      <span>Total</span>
                      <span>{apiUtils.formatCurrency(selectedPackage.price)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isProcessing || !selectedPackage || !phoneNumber}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isProcessing || !selectedPackage || !phoneNumber
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : selectedPackage ? (
                  `Pay ${apiUtils.formatCurrency(selectedPackage.price)} with M-Pesa`
                ) : (
                  'Select a package'
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/viewer-dashboard')}
                disabled={isProcessing}
                className="text-gray-400 hover:text-white text-sm"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};