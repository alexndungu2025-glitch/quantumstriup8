import React, { useState, useEffect } from 'react';

// Mock data for performers (existing)
const mockPerformers = [
  {
    id: 1,
    name: "Vivian_MaxxX",
    image: "https://images.unsplash.com/photo-1672794444732-e007954a177c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 1234,
    isNew: false,
    isHD: true,
    hasTicketShow: true,
    tokensEarned: 45600,
    rating: 4.8
  },
  {
    id: 2,
    name: "African_Dream",
    image: "https://images.unsplash.com/photo-1699746277651-3b1438122eaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 856,
    isNew: false,
    isHD: false,
    tokensEarned: 32100,
    rating: 4.6
  },
  {
    id: 3,
    name: "NairobiBabe",
    image: "https://images.unsplash.com/photo-1561740303-a0fd9fabc646?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 654,
    isNew: false,
    isHD: true,
    tokensEarned: 67800,
    rating: 4.9
  },
  {
    id: 4,
    name: "SwahiliQueen",
    image: "https://images.unsplash.com/photo-1644224010199-407a662c9228?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 432,
    isNew: false,
    isHD: true,
    tokensEarned: 23400,
    rating: 4.7
  },
  {
    id: 5,
    name: "KampalaGirl",
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ug",
    isLive: true,
    viewers: 765,
    isNew: false,
    isHD: true,
    tokensEarned: 54300,
    rating: 4.8
  },
  {
    id: 6,
    name: "DarEsSalaamBaby",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "tz",
    isLive: true,
    viewers: 543,
    isNew: false,
    isHD: true,
    tokensEarned: 78900,
    rating: 4.9
  }
];

const mockCouples = [
  {
    id: 7,
    name: "NairobiLovers",
    image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 1543,
    isNew: false,
    isHD: true,
    tokensEarned: 89600,
    rating: 4.8
  },
  {
    id: 8,
    name: "EastAfricaCouple",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ke",
    isLive: true,
    viewers: 876,
    isNew: false,
    isHD: true,
    tokensEarned: 65400,
    rating: 4.7
  }
];

const countryFlags = {
  ke: "🇰🇪",
  ug: "🇺🇬", 
  tz: "🇹🇿",
  rw: "🇷🇼"
};

// Token packages
const tokenPackages = [
  { tokens: 50, price: 500, popular: false },
  { tokens: 100, price: 1000, popular: true },
  { tokens: 200, price: 1900, popular: false },
  { tokens: 500, price: 4500, popular: false },
  { tokens: 1000, price: 8500, popular: false }
];

// Age Verification Modal Component (Updated for QuantumStrip)
export const AgeVerificationModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedCategory, setSelectedCategory] = useState('girls');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(selectedCategory);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="text-center text-white px-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full mr-3">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            QUANTUMSTRIP
          </h1>
        </div>
        
        <p className="text-lg mb-2">Welcome to Kenya's Premier Live Entertainment Platform</p>
        <p className="text-lg mb-8">Join our community & start interacting now for FREE.</p>
        
        <p className="text-white mb-6">I'm interested in:</p>
        
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedCategory('girls')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'girls' 
                ? 'bg-pink-600 border-pink-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-pink-400'
            }`}
          >
            <div className="text-2xl mb-1">♀</div>
            <div>GIRLS</div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('guys')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'guys' 
                ? 'bg-blue-600 border-blue-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-blue-400'
            }`}
          >
            <div className="text-2xl mb-1">♂</div>
            <div>GUYS</div>
          </button>
          
          <button
            onClick={() => setSelectedCategory('couples')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'couples' 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-purple-400'
            }`}
          >
            <div className="text-2xl mb-1">💕</div>
            <div>COUPLES</div>
          </button>
        </div>
        
        <button
          onClick={handleConfirm}
          className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 rounded-full text-lg font-semibold transition-colors mb-6"
        >
          I'm Over 18
        </button>
        
        <div className="text-xs text-gray-400 max-w-2xl mx-auto">
          <p className="mb-2">
            By entering QuantumStrip, you confirm you're over 18 years old and agree to our Terms of Service.
            All models are 18+ years old. This site is for adults only.
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 text-gray-400 hover:text-white underline"
        >
          Exit Here
        </button>
      </div>
    </div>
  );
};

// Login Page Component
export const LoginPage = ({ onLogin, navigateTo }) => {
  const [loginType, setLoginType] = useState('viewer');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock login - in real app, this would validate credentials
    onLogin(loginType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            QUANTUMSTRIP
          </h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>
        
        {/* Login Type Selector */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setLoginType('viewer')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              loginType === 'viewer' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Viewer
          </button>
          <button
            onClick={() => setLoginType('model')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              loginType === 'model' 
                ? 'bg-pink-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Model
          </button>
          <button
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              loginType === 'admin' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Sign In as {loginType.charAt(0).toUpperCase() + loginType.slice(1)}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={() => navigateTo('register')}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign up
            </button>
          </p>
          
          <button
            onClick={() => navigateTo('home')}
            className="mt-4 text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Register Page Component
export const RegisterPage = ({ navigateTo }) => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock registration - in real app, this would create account
    alert('Registration successful! Please check your email to verify your account.');
    navigateTo('login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
            QUANTUMSTRIP
          </h1>
          <p className="text-gray-300">Create your account</p>
        </div>
        
        {/* User Type Selector */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setUserType('viewer')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'viewer' 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Viewer
          </button>
          <button
            onClick={() => setUserType('model')}
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
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Choose a username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="254712345678"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Age
            </label>
            <input
              type="number"
              min="18"
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Must be 18+"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Create a password"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms}
              onChange={(e) => setFormData({...formData, terms: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              required
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Create {userType.charAt(0).toUpperCase() + userType.slice(1)} Account
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={() => navigateTo('login')}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Sign in
            </button>
          </p>
          
          <button
            onClick={() => navigateTo('home')}
            className="mt-4 text-gray-500 hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// Header Component (Updated for QuantumStrip)
export const Header = ({ navigateTo, userType, isAuthenticated, onLogout, userTokens = 0 }) => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button className="text-white mr-4 hover:text-purple-400">
            <svg width="24" height="24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          
          <div className="flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full mr-3">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">QUANTUMSTRIP</h1>
          </div>
          
          <div className="flex items-center ml-6 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="font-semibold">2,847 LIVE</span>
          </div>
          
          <button className="flex items-center ml-6 text-yellow-400 hover:text-yellow-300">
            <svg width="16" height="16" className="mr-1" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Top Models</span>
          </button>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-4">
            <input
              type="text"
              placeholder="Search models, categories..."
              className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none w-80"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          
          {isAuthenticated ? (
            <>
              {userType === 'viewer' && (
                <div className="flex items-center mr-4">
                  <button
                    onClick={() => navigateTo('token-purchase')}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg mr-2 flex items-center hover:from-green-700 hover:to-green-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {userTokens} Tokens
                  </button>
                </div>
              )}
              
              <button
                onClick={() => navigateTo(userType === 'admin' ? 'admin-dashboard' : 
                                        userType === 'model' ? 'model-dashboard' : 'viewer-dashboard')}
                className="text-gray-300 hover:text-white mr-4"
              >
                Dashboard
              </button>
              
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigateTo('register')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mr-2 border border-gray-600"
              >
                Create Free Account
              </button>
              
              <button
                onClick={() => navigateTo('login')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// Export all components and data
export { mockPerformers, mockCouples, tokenPackages, countryFlags };