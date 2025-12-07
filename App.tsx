import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Language } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import { LanguageContext } from './contexts/LanguageContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages for Performance Optimization
const Home = lazy(() => import('./pages/Home'));
const Leaders = lazy(() => import('./pages/Leaders'));
const Events = lazy(() => import('./pages/Events'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Donation = lazy(() => import('./pages/Donation'));
const About = lazy(() => import('./pages/About'));
const Admin = lazy(() => import('./pages/Admin'));

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Loading Fallback Component
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Loader2 className="animate-spin text-brand-600" size={40} />
  </div>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('bn');
  const [darkMode, setDarkMode] = useState(false);

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <SettingsProvider>
      <LanguageContext.Provider value={{ lang, setLang }}>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col font-sans relative text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Navbar toggleTheme={toggleTheme} darkMode={darkMode} />
            <main className="flex-grow pt-16">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/leaders" element={<Leaders />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/donate" element={<Donation />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/admin/*" element={<Admin />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <ChatBot />
          </div>
        </Router>
      </LanguageContext.Provider>
    </SettingsProvider>
  );
};

export default App;