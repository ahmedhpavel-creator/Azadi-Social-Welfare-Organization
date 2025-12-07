import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { TRANSLATIONS } from '../constants';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { ORGANIZATION_INFO } from '../constants';

interface NavbarProps {
  toggleTheme: () => void;
  darkMode: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ toggleTheme, darkMode }) => {
  const { lang, setLang } = useLanguage();
  const { logo } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const toggleLang = () => setLang(lang === 'en' ? 'bn' : 'en');
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: TRANSLATIONS.get('home', lang) },
    { path: '/leaders', label: TRANSLATIONS.get('leaders', lang) },
    { path: '/events', label: TRANSLATIONS.get('events', lang) },
    { path: '/gallery', label: TRANSLATIONS.get('gallery', lang) },
    { path: '/about', label: TRANSLATIONS.get('about', lang) },
    { path: '/donate', label: TRANSLATIONS.get('donate', lang), special: true },
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent no-print
      ${scrolled || isOpen 
        ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border-gray-200 dark:border-gray-800' 
        : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 py-2 flex justify-between items-center">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-3 group" onClick={closeMenu}>
           <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 flex items-center justify-center overflow-hidden bg-white rounded-full shadow-lg ring-2 ring-gray-100 dark:ring-gray-700 p-1 relative z-10 transition-transform group-hover:scale-105">
             <img 
               src={logo} 
               alt="Logo" 
               className="h-full w-full object-contain"
             />
           </div>
          <div className="flex flex-col border-l-2 border-brand-200 dark:border-brand-800 pl-3">
             <span className="font-bold text-sm md:text-lg leading-tight text-gray-900 dark:text-white font-bengali tracking-wide line-clamp-1">
               {ORGANIZATION_INFO.name[lang]}
             </span>
             <span className="text-[10px] md:text-xs text-brand-600 dark:text-brand-400 font-medium tracking-wider hidden sm:block">
               EST. 1988 • SYLHET
             </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200
                ${link.special
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 ml-2'
                  : location.pathname === link.path
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>

          <button 
            onClick={toggleLang} 
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-colors font-bold text-xs uppercase"
            title="Switch Language"
          >
            {lang}
          </button>
          
          <button 
            onClick={toggleTheme} 
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-3">
          <button onClick={toggleLang} className="text-xs font-bold uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
             {lang}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-2xl transition-all duration-300 origin-top overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closeMenu}
              className={`text-base font-semibold block px-4 py-3 rounded-xl transition-all
                 ${link.special 
                   ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white text-center shadow-md' 
                   : location.pathname === link.path
                     ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 pl-6 border-l-4 border-brand-500'
                     : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                 }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex justify-between items-center px-4 py-3 mt-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
             <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Appearance</span>
             <button onClick={toggleTheme} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-full shadow-sm text-xs font-bold">
                {darkMode ? <Sun size={14} className="text-yellow-400" /> : <Moon size={14} className="text-brand-600" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;