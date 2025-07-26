import React, { useState } from 'react';

// Mock data for performers
const mockPerformers = [
  {
    id: 1,
    name: "Vivian_MaxxX",
    image: "https://images.unsplash.com/photo-1672794444732-e007954a177c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "us",
    isLive: true,
    viewers: 1234,
    isNew: false,
    isHD: true,
    hasTicketShow: true
  },
  {
    id: 2,
    name: "American_Dream",
    image: "https://images.unsplash.com/photo-1699746277651-3b1438122eaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "us",
    isLive: true,
    viewers: 856,
    isNew: false,
    isHD: false
  },
  {
    id: 3,
    name: "girlfriendmissy",
    image: "https://images.unsplash.com/photo-1561740303-a0fd9fabc646?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ca",
    isLive: true,
    viewers: 654,
    isNew: false,
    isHD: true
  },
  {
    id: 4,
    name: "Tikalein",
    image: "https://images.unsplash.com/photo-1644224010199-407a662c9228?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "us",
    isLive: true,
    viewers: 432,
    isNew: false,
    isHD: true
  },
  {
    id: 5,
    name: "violetaupgrade9",
    image: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "co",
    isLive: true,
    viewers: 765,
    isNew: false,
    isHD: true
  },
  {
    id: 6,
    name: "FitCougar",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "us",
    isLive: true,
    viewers: 543,
    isNew: false,
    isHD: true
  },
  {
    id: 7,
    name: "HOTWIFEVenessaGo",
    image: "https://images.unsplash.com/photo-1701615004837-40d8573b6652?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "ca",
    isLive: true,
    viewers: 298,
    isNew: false,
    isHD: false
  },
  {
    id: 8,
    name: "MILFxExpecting",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHw0fHx1c2VyJTIwYXZhdGFyfGVufDB8fHx8MTc1MzU1ODc2OHww&ixlib=rb-4.1.0&q=85",
    country: "us",
    isLive: true,
    viewers: 678,
    isNew: false,
    isHD: true
  }
];

const mockCouples = [
  {
    id: 9,
    name: "tannyaandwinson",
    image: "https://images.unsplash.com/photo-1672794444732-e007954a177c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "co",
    isLive: true,
    viewers: 1543,
    isNew: false,
    isHD: true
  },
  {
    id: 10,
    name: "twohornyco",
    image: "https://images.unsplash.com/photo-1699746277651-3b1438122eaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "co",
    isLive: true,
    viewers: 876,
    isNew: false,
    isHD: true
  },
  {
    id: 11,
    name: "PamelaInMia",
    image: "https://images.unsplash.com/photo-1561740303-a0fd9fabc646?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "co",
    isLive: true,
    viewers: 432,
    isNew: false,
    isHD: true
  },
  {
    id: 12,
    name: "MagicEyess",
    image: "https://images.unsplash.com/photo-1644224010199-407a662c9228?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMHBlb3BsZXxlbnwwfHx8fDE3NTM1NTg3NTd8MA&ixlib=rb-4.1.0&q=85",
    country: "ua",
    isLive: true,
    viewers: 765,
    isNew: false,
    isHD: true
  }
];

const countryFlags = {
  us: "🇺🇸",
  ca: "🇨🇦", 
  co: "🇨🇴",
  ua: "🇺🇦",
  gb: "🇬🇧"
};

// Age Verification Modal Component
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
          <div className="bg-white rounded-full p-2 mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V4.5C15 3.1 13.9 2 12.5 2S10 3.1 10 4.5V7.5L4 7V9L10 8.5V15L8 16V21H10V17L12 15.5L14 17V21H16V16L14 15V8.5L21 9Z" fill="currentColor"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold">STRIPCHAT</h1>
        </div>
        
        <p className="text-lg mb-2">We are creating a better experience for 18+ LIVE entertainment. Join our open-minded</p>
        <p className="text-lg mb-8">community & start interacting now for FREE.</p>
        
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
            onClick={() => setSelectedCategory('trans')}
            className={`px-8 py-4 rounded-xl border-2 transition-all ${
              selectedCategory === 'trans' 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'border-gray-600 text-gray-300 hover:border-purple-400'
            }`}
          >
            <div className="text-2xl mb-1">⚧</div>
            <div>TRANS</div>
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
            By entering and using this website, you confirm you're over 18 years old and agree to be bound by the{' '}
            <span className="underline">Terms of Use</span> and <span className="underline">Privacy Policy</span>.{' '}
            <span className="underline">18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement</span>.
          </p>
          <p>
            If you provide sensitive personal data, by entering the website, you give your explicit consent to process 
            this data to tailor the website to your preferences. If you're looking for a way to restrict access for a 
            minor, see our <span className="underline">Parental Control Guide</span>.
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

// Header Component
export const Header = () => {
  return (
    <header className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button className="text-white mr-4 hover:text-red-400">
            <svg width="24" height="24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          
          <div className="flex items-center">
            <div className="bg-white rounded-full p-1 mr-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-500">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V4.5C15 3.1 13.9 2 12.5 2S10 3.1 10 4.5V7.5L4 7V9L10 8.5V15L8 16V21H10V17L12 15.5L14 17V21H16V16L14 15V8.5L21 9Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">STRIPCHAT</h1>
          </div>
          
          <div className="flex items-center ml-6 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
            <span className="font-semibold">8828 LIVE</span>
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
              placeholder="Models, categories, countries, tip menu"
              className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none w-80"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="currentColor">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          
          <button className="text-gray-300 hover:text-white mr-4">
            <svg width="24" height="24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
          
          <span className="text-gray-300 mr-4">About Stripchat</span>
          
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg mr-2 border border-gray-600">
            Create Free Account
          </button>
          
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
            Log In
          </button>
        </div>
      </div>
    </header>
  );
};

// Sidebar Component
export const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState('home');
  
  return (
    <aside className="w-64 bg-gray-900 h-full border-r border-gray-700">
      {/* Token Giveaway Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 m-4 rounded-lg">
        <div className="flex items-center text-white">
          <div className="text-2xl font-bold mr-2">50</div>
          <div>
            <div className="font-semibold">Tokens</div>
            <div className="text-sm">Giveaway</div>
          </div>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="px-4">
        <div className="space-y-1">
          <button 
            onClick={() => setActiveMenu('home')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'home' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </button>
          
          <button 
            onClick={() => setActiveMenu('feed')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'feed' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Feed
          </button>
          
          <button 
            onClick={() => setActiveMenu('recommended')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'recommended' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
            Recommended
          </button>
          
          <button 
            onClick={() => setActiveMenu('favorites')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'favorites' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            My Favorites
          </button>
          
          <button 
            onClick={() => setActiveMenu('privates')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'privates' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            Best for Privates
          </button>
          
          <button 
            onClick={() => setActiveMenu('history')}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeMenu === 'history' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            Watch History
          </button>
        </div>
        
        <div className="mt-8">
          <h3 className="text-gray-400 text-sm font-semibold mb-3">SPECIALS</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-pink-500" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Stripchat Cosplay Contest
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">47</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">🇺🇸</span>
                American
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">120</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">🇺🇦</span>
                Ukrainian
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">134</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-blue-500" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                New Models
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">701</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <span className="w-5 h-5 mr-3 text-center">🥽</span>
                VR Cams
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">149</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                BDSM
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">74</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-gray-300 hover:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3 text-purple-500" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Ticket Shows
              </div>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">129</span>
            </button>
          </div>
        </div>
        
        <button className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600">
          ALL CATEGORIES
        </button>
      </nav>
    </aside>
  );
};

// Performer Card Component
export const PerformerCard = ({ performer }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative bg-gray-800 rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-105"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-w-16 aspect-h-9">
        <img 
          src={performer.image} 
          alt={performer.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Overlay indicators */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {performer.hasTicketShow && (
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">In Ticket Show</span>
          )}
          {performer.isNew && (
            <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-semibold">NEW</span>
          )}
        </div>
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {performer.isHD && (
            <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">HD</span>
          )}
          <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            VR
          </span>
        </div>

        <div className="absolute bottom-2 right-2">
          <span className="text-white text-xs">{countryFlags[performer.country]}</span>
        </div>
        
        {/* Live indicator */}
        {performer.isLive && (
          <div className="absolute bottom-2 left-2 flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
            <span className="text-white text-xs font-semibold">LIVE</span>
          </div>
        )}
        
        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg mb-2">
                Watch Live
              </button>
              <div className="text-white text-sm">
                {performer.viewers} viewers
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate">{performer.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-400 text-xs">{performer.viewers} viewers</span>
          <div className="flex items-center space-x-1">
            <button className="text-gray-400 hover:text-red-400">
              <svg className="w-4 h-4" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-yellow-400">
              <svg className="w-4 h-4" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Section Component
export const Section = ({ title, performers, showMore = true }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {title.includes('American') && <span className="text-2xl mr-2">🇺🇸</span>}
          <h2 className="text-white text-xl font-semibold">{title}</h2>
        </div>
        {showMore && (
          <button className="text-red-400 hover:text-red-300 font-semibold">
            See All
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {performers.map(performer => (
          <PerformerCard key={performer.id} performer={performer} />
        ))}
      </div>
    </div>
  );
};

// Navigation Tabs Component
export const NavigationTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'girls', label: 'Girls', count: 4567 },
    { id: 'couples', label: 'Couples', count: 892 },
    { id: 'guys', label: 'Guys', count: 234 },
    { id: 'trans', label: 'Trans', count: 156 }
  ];
  
  return (
    <div className="border-b border-gray-700 mb-6">
      <nav className="flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs">({tab.count})</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Bottom Call to Action Component
export const BottomCTA = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 z-40">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center">
          <div className="bg-white rounded-full p-1 mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-500">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V4.5C15 3.1 13.9 2 12.5 2S10 3.1 10 4.5V7.5L4 7V9L10 8.5V15L8 16V21H10V17L12 15.5L14 17V21H16V16L14 15V8.5L21 9Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="font-semibold">Join Stripchat to interact with models!</span>
        </div>
        
        <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Join FREE
        </button>
      </div>
    </div>
  );
};

export { mockPerformers, mockCouples };