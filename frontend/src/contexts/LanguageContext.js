import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isLoading, setIsLoading] = useState(false);

  const supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' }
  ];

  const changeLanguage = async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setIsLoading(true);
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      localStorage.setItem('quantumstrip_language', languageCode);
      
      // Update user language preference in backend if user is logged in
      const token = localStorage.getItem('quantumstrip_token');
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/update-language`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ language: languageCode })
          });
          
          if (!response.ok) {
            console.warn('Failed to update language preference in backend');
          }
        } catch (error) {
          console.warn('Error updating language preference:', error);
        }
      }
      
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLanguage = () => {
    return supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];
  };

  const getOppositeLanguage = () => {
    return currentLanguage === 'en' ? 'sw' : 'en';
  };

  useEffect(() => {
    const handleLanguageChange = (language) => {
      setCurrentLanguage(language);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const value = {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    getCurrentLanguage,
    getOppositeLanguage,
    isLoading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;