import React, { useState } from 'react';
import './App.css';
import {
  AgeVerificationModal,
  LoginPage,
  RegisterPage,
  ViewerDashboard,
  ModelDashboard,
  AdminDashboard,
  StreamingInterface,
  TokenPurchasePage,
  PrivateShowInterface,
  mockPerformers,
  mockCouples
} from './components';

function App() {
  const [currentPage, setCurrentPage] = useState('age-verification');
  const [userType, setUserType] = useState(null); // 'viewer', 'model', 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('girls');

  const handleAgeVerificationConfirm = (category) => {
    setSelectedCategory(category);
    setCurrentPage('home');
  };

  const handleAgeVerificationClose = () => {
    setCurrentPage('home');
  };

  const handleLogin = (type) => {
    setUserType(type);
    setIsAuthenticated(true);
    setCurrentPage(type === 'admin' ? 'admin-dashboard' : 
                  type === 'model' ? 'model-dashboard' : 'viewer-dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentPage('home');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="App min-h-screen bg-black">
      {currentPage === 'age-verification' && (
        <AgeVerificationModal 
          isOpen={true}
          onClose={handleAgeVerificationClose}
          onConfirm={handleAgeVerificationConfirm}
        />
      )}
      
      {currentPage === 'home' && (
        <StreamingInterface 
          activeTab={selectedCategory}
          navigateTo={navigateTo}
          userType={userType}
          isAuthenticated={isAuthenticated}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'login' && (
        <LoginPage 
          onLogin={handleLogin}
          navigateTo={navigateTo}
        />
      )}
      
      {currentPage === 'register' && (
        <RegisterPage 
          navigateTo={navigateTo}
        />
      )}
      
      {currentPage === 'viewer-dashboard' && (
        <ViewerDashboard 
          navigateTo={navigateTo}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'model-dashboard' && (
        <ModelDashboard 
          navigateTo={navigateTo}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'admin-dashboard' && (
        <AdminDashboard 
          navigateTo={navigateTo}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'token-purchase' && (
        <TokenPurchasePage 
          navigateTo={navigateTo}
          userType={userType}
        />
      )}
      
      {currentPage === 'private-show' && (
        <PrivateShowInterface 
          navigateTo={navigateTo}
          userType={userType}
        />
      )}
    </div>
  );
}

export default App;