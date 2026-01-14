
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onThemeToggle, isDarkMode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 gradient-bg overflow-hidden relative transition-colors duration-500">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#CFE1BB] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#88976C] rounded-full blur-[120px] opacity-30"></div>
      
      {/* Theme Toggle Button for Landing */}
      <div className="absolute top-8 right-8 z-20">
        <button 
          onClick={onThemeToggle}
          className="p-4 rounded-2xl glass-card text-[#728156] dark:text-[#B6C99C] transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          {isDarkMode ? '🌞 Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="max-w-4xl w-full glass-card rounded-[2.5rem] p-12 shadow-2xl z-10 text-center animate-in fade-in zoom-in duration-700">
        <div className="inline-block px-4 py-1.5 mb-6 bg-[#E8F4DC]/60 dark:bg-[#1A1C18]/60 border border-[#B6C99C]/30 rounded-full text-[#728156] dark:text-[#B6C99C] text-sm font-semibold tracking-wide uppercase transition-colors">
          AI-Powered Intelligence
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-tight transition-colors">
          Master the <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#728156] to-[#88976C] dark:from-[#B6C99C] dark:to-[#88976C]">
            Camden Matrix
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed transition-colors">
          Camden Intelligence decodes the hidden layers of human emotion within text. Deploy high-fidelity sentiment analysis and extract precision drivers with one click.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onEnter}
            className="w-full sm:w-auto px-10 py-4 bg-[#728156] dark:bg-[#B6C99C] hover:bg-[#88976C] dark:hover:bg-[#CFE1BB] text-white dark:text-[#1A1C18] rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Launch Camden Console
          </button>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-10 py-4 bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-black/60 border border-white/40 dark:border-white/10 text-gray-900 dark:text-gray-100 rounded-full font-bold text-lg backdrop-blur-md transition-all"
          >
            GitHub Repo
          </a>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#B6C99C]/30">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-[#728156] dark:text-[#B6C99C] mb-1 transition-colors">98.4%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider transition-colors">Model Accuracy</div>
          </div>
          <div className="flex flex-col items-center border-y md:border-y-0 md:border-x border-[#B6C99C]/30 py-4 md:py-0 transition-colors">
            <div className="text-3xl font-bold text-[#88976C] dark:text-[#CFE1BB] mb-1 transition-colors">Instant</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider transition-colors">Batch Processing</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-bold text-[#98A77C] dark:text-[#B6C99C] mb-1 transition-colors">Enterprise</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider transition-colors">Export Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
