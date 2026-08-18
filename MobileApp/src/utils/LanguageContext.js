import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { loadStoredLanguage, saveSelectedLanguage } from '../i18n/languageService';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isLanguageSelected, setIsLanguageSelected] = useState(true);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const initLanguage = async () => {
      setLoading(true);
      try {
        const savedLanguage = await loadStoredLanguage();
        await i18n.changeLanguage(savedLanguage);
        setLanguage(savedLanguage);
        setIsLanguageSelected(true);
      } catch (error) {
        console.error('Error initializing language context:', error);
      } finally {
        setLoading(false);
      }
    };
    initLanguage();
  }, []);

  const changeLanguage = async (newLang) => {
    try {
      await i18n.changeLanguage(newLang);
      await saveSelectedLanguage(newLang);
      setLanguage(newLang);
      setIsLanguageSelected(true);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const formatFallback = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const customT = (key, options) => {
    if (typeof key === 'string') {
      const normalized = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (i18n.exists(normalized, options)) {
        return t(normalized, options);
      }
    }
    if (i18n.exists(key, options)) {
      return t(key, options);
    }
    return formatFallback(key);
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isLanguageSelected, t: customT, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

