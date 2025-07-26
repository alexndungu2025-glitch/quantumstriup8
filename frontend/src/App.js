import React, { useState } from 'react';
import './App.css';
import {
  AgeVerificationModal,
  Header,
  Sidebar,
  Section,
  NavigationTabs,
  BottomCTA,
  mockPerformers,
  mockCouples
} from './components';

function App() {
  const [showAgeVerification, setShowAgeVerification] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('girls');
  const [activeTab, setActiveTab] = useState('girls');

  const handleAgeVerificationConfirm = (category) => {
    setSelectedCategory(category);
    setShowAgeVerification(false);
  };

  const handleAgeVerificationClose = () => {
    // In a real app, this would redirect away from the site
    setShowAgeVerification(false);
  };

  return (
    <div className="App min-h-screen bg-black">
      <AgeVerificationModal 
        isOpen={showAgeVerification}
        onClose={handleAgeVerificationClose}
        onConfirm={handleAgeVerificationConfirm}
      />
      
      {!showAgeVerification && (
        <>
          <Header />
          
          <div className="flex">
            <Sidebar />
            
            <main className="flex-1 p-6 pb-20">
              <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              
              {activeTab === 'girls' && (
                <>
                  <Section 
                    title="🇺🇸 American Sex Cams" 
                    performers={mockPerformers.slice(0, 6)} 
                  />
                  
                  <Section 
                    title="Top Free Live Sex Cams" 
                    performers={mockPerformers.slice(2, 8)} 
                  />
                  
                  <Section 
                    title="Mobile Live Sex Cams" 
                    performers={mockPerformers.slice(1, 7)} 
                  />
                </>
              )}
              
              {activeTab === 'couples' && (
                <>
                  <Section 
                    title="Couples Live Sex Cams" 
                    performers={mockCouples} 
                  />
                  
                  <Section 
                    title="Top Couples Cams" 
                    performers={mockCouples.slice(1, 5)} 
                  />
                </>
              )}
              
              {activeTab === 'guys' && (
                <>
                  <Section 
                    title="Guys Live Sex Cams" 
                    performers={mockPerformers.slice(3, 8).map(p => ({...p, name: p.name.replace('girl', 'guy')}))} 
                  />
                </>
              )}
              
              {activeTab === 'trans' && (
                <>
                  <Section 
                    title="Trans Live Sex Cams" 
                    performers={mockPerformers.slice(0, 5).map(p => ({...p, name: p.name + '_Trans'}))} 
                  />
                </>
              )}
            </main>
          </div>
          
          <BottomCTA />
        </>
      )}
    </div>
  );
}

export default App;