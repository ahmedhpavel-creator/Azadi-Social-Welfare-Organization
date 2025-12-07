import { createContext, useContext } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({ lang: 'bn', setLang: () => {} });

export const useLanguage = () => useContext(LanguageContext);