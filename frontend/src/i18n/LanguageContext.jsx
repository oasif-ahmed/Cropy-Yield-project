import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setActiveLang } from '../components/utils.js';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'cy_lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'en' ? 'en' : 'bn';
    } catch {
      return 'bn';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    setActiveLang(lang);
    document.documentElement.lang = lang === 'en' ? 'en' : 'bn';
  }, [lang]);

  const t = useCallback((bn, en) => (lang === 'en' ? en ?? bn : bn), [lang]);

  const toggle = useCallback(() => setLang((l) => (l === 'bn' ? 'en' : 'bn')), []);
  const setLangSafe = useCallback((l) => setLang(l === 'en' ? 'en' : 'bn'), []);

  const value = useMemo(() => ({ lang, toggle, setLang: setLangSafe, t }), [lang, toggle, setLangSafe, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}