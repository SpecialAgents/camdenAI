
import React, { useState, useEffect, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AccuracyReport from './components/AccuracyReport';
import Documentation from './components/Documentation';
import { View, SentimentResult, Sentiment } from './types';

const EMOJI_MAP = {
  [Sentiment.POSITIVE]: ['😊', '😊', '😊', '😊', '😊'],
  [Sentiment.NEUTRAL]: ['😐','😐','😐','😐','😐','😐'],
  [Sentiment.NEGATIVE]: ['☹️','☹️','☹️','☹️','☹️','☹️'],
  MIXED: []
};

const FloatingEmojis: React.FC<{ results: SentimentResult[] }> = ({ results }) => {
  const emojis = useMemo(() => {
    // Show an emoji for every result, up to a limit of 25 for performance
    return results.slice(0, 25).map((res, i) => {
      const char = EMOJI_MAP[res.sentiment];
      // Deterministic randomness based on ID
      const seed = res.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

      return {
        id: res.id,
        char,
        left: `${(seed * 7) % 90 + 5}%`,
        top: `${(seed * 11) % 90 + 5}%`,
        delay: `${(seed % 5)}s`,
        duration: `${10 + (seed % 10)}s`,
        size: i === 0 ? '4.5rem' : '3rem', // Highlight the latest one
      };
    });
  }, [results]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      {emojis.map((e) => (
        <span
          key={e.id}
          className="floating-emoji"
          style={{
            left: e.left,
            top: e.top,
            animationDelay: e.delay,
            animationDuration: e.duration,
            fontSize: e.size,
            zIndex: -1,
          }}
        >
          {e.char}
        </span>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('LANDING');
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      <FloatingEmojis results={results} />
      
      {currentView !== 'LANDING' && (
        <nav className="sticky top-0 z-50 glass-card px-4 md:px-6 py-4 flex justify-between items-center border-b border-[#B6C99C]/30 shadow-sm transition-all">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleNavigate('LANDING')}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 gradient-bg rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg group-hover:scale-105 transition-transform">
              C
            </div>
            <span className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#728156] to-[#88976C]">
              Camden
              <span className="hidden sm:inline"> Intelligence</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-8">
            <div className="hidden md:flex gap-6 text-sm font-medium text-[#728156]/80 dark:text-[#B6C99C]/80">
              <button 
                onClick={() => handleNavigate('DASHBOARD')}
                className={`hover:text-[#728156] dark:hover:text-[#B6C99C] transition-colors ${currentView === 'DASHBOARD' ? 'text-[#728156] dark:text-[#B6C99C] border-b-2 border-[#728156] dark:border-[#B6C99C]' : ''}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigate('REPORT')}
                className={`hover:text-[#728156] dark:hover:text-[#B6C99C] transition-colors ${currentView === 'REPORT' ? 'text-[#728156] dark:text-[#B6C99C] border-b-2 border-[#728156] dark:border-[#B6C99C]' : ''}`}
              >
                Accuracy Report
              </button>
              <button 
                onClick={() => handleNavigate('DOCS')}
                className={`hover:text-[#728156] dark:hover:text-[#B6C99C] transition-colors ${currentView === 'DOCS' ? 'text-[#728156] dark:text-[#B6C99C] border-b-2 border-[#728156] dark:border-[#B6C99C]' : ''}`}
              >
                Documentation
              </button>
            </div>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-[#E8F4DC] dark:bg-[#3A3D36] text-[#728156] dark:text-[#B6C99C] transition-all hover:scale-110 active:scale-95 border border-[#B6C99C]/20"
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-[#728156] dark:text-[#B6C99C] transition-all border border-[#B6C99C]/20"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg>
              )}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 glass-card border-b border-[#B6C99C]/30 flex flex-col p-4 gap-4 md:hidden animate-in slide-in-from-top-4 duration-200">
              <button 
                onClick={() => handleNavigate('DASHBOARD')}
                className={`py-2 px-4 text-left rounded-xl transition-all ${currentView === 'DASHBOARD' ? 'bg-camden-olive/10 text-[#728156] font-bold' : 'text-[#728156]/80'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigate('REPORT')}
                className={`py-2 px-4 text-left rounded-xl transition-all ${currentView === 'REPORT' ? 'bg-camden-olive/10 text-[#728156] font-bold' : 'text-[#728156]/80'}`}
              >
                Accuracy Report
              </button>
              <button 
                onClick={() => handleNavigate('DOCS')}
                className={`py-2 px-4 text-left rounded-xl transition-all ${currentView === 'DOCS' ? 'bg-camden-olive/10 text-[#728156] font-bold' : 'text-[#728156]/80'}`}
              >
                Documentation
              </button>
            </div>
          )}
        </nav>
      )}

      <main className="flex-grow">
        {currentView === 'LANDING' && <LandingPage onEnter={() => handleNavigate('DASHBOARD')} onThemeToggle={() => setDarkMode(!darkMode)} isDarkMode={darkMode} />}
        {currentView === 'DASHBOARD' && (
          <Dashboard 
            results={results} 
            setResults={setResults} 
            isDarkMode={darkMode}
          />
        )}
        {currentView === 'REPORT' && <AccuracyReport currentResults={results} isDarkMode={darkMode} />}
        {currentView === 'DOCS' && <Documentation isDarkMode={darkMode} />}
      </main>

      <footer className="bg-white/50 dark:bg-[#1A1C18]/50 border-t border-[#B6C99C]/20 py-8 px-6 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[#88976C] dark:text-[#B6C99C]/60 text-sm font-medium text-center md:text-left">
            © 2024 Camden Intelligence AI. Built for Precision & Insight.
          </div>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-[#E8F4DC] dark:bg-[#2A2D26] flex items-center justify-center text-[#728156] dark:text-[#B6C99C] hover:scale-110 transition-transform cursor-pointer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#E8F4DC] dark:bg-[#2A2D26] flex items-center justify-center text-[#728156] dark:text-[#B6C99C] hover:scale-110 transition-transform cursor-pointer">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
