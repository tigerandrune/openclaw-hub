import { createContext, useContext, useState, useCallback } from 'react';
import { getString, detectLanguage } from '../i18n';

const I18nContext = createContext();

export function I18nProvider({ children, initialLang }) {
  const [lang, setLang] = useState(initialLang ?? detectLanguage());

  const t = useCallback((key) => getString(lang, key), [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
