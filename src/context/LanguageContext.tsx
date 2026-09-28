import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('syncura_app_language');
    return (saved === 'ml' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('syncura_app_language', lang);
  };

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    if (language === 'ml') {
      document.body.classList.add('lang-ml');
    } else {
      document.body.classList.remove('lang-ml');
    }
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    if (!key) return fallback || '';

    const langDict = translations[language] as Record<string, string>;
    const enDict = translations.en as Record<string, string>;

    // 1. Direct key match
    if (langDict && key in langDict) {
      return langDict[key];
    }
    if (enDict && key in enDict) {
      return enDict[key];
    }

    // 2. Case-insensitive key match
    const lowerKey = key.toLowerCase();
    if (langDict && lowerKey in langDict) {
      return langDict[lowerKey];
    }
    if (enDict && lowerKey in enDict) {
      return enDict[lowerKey];
    }

    // 3. Fallback parameter if provided
    if (fallback) {
      return fallback;
    }

    // 4. Smart formatting for dotted keys
    if (key.includes('.')) {
      const parts = key.split('.');
      const last = parts[parts.length - 1];
      // Format LASTVISIT or lastVisit -> "Last Visit"
      const spaced = last.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
      const lower = spaced.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
