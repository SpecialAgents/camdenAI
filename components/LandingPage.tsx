
import React from 'react';

interface LandingPageProps {
  onEnter: () => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onThemeToggle, isDarkMode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 gradient-bg overflow-hidden relative transition-colors duration-500">
      {/* Decorative Orbs - Adjusted for mobile */}
      <div className="absolute top-[-5%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-[#CFE1BB] rounded-full blur-[80px] md:blur-[120px] opacity-30 md:opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-5%] right-[-10%] w-[70%] md:w-[50%] h-[50%] bg-[#88976C] rounded-full blur-[80px] md:blur-[120px] opacity-20 md:opacity-30"></div>
      
      {/* Theme Toggle Button for Landing */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20">
        <button 
          onClick={onThemeToggle}
          className="p-3 md:p-4 rounded-xl md:rounded-2xl glass-card text-xs md:text-sm font-bold text-[#728156] dark:text-[#B6C99C] transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          {isDarkMode ? '🌞 Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="max-w-4xl w-full glass-card rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 shadow-2xl z-10 text-center animate-in fade-in zoom-in duration-700">
        <div className="inline-block px-3 py-1 mb-4 md:mb-6 bg-[#E8F4DC]/60 dark:bg-[#1A1C18]/60 border border-[#B6C99C]/30 rounded-full text-[#728156] dark:text-[#B6C99C] text-[10px] md:text-sm font-semibold tracking-wide uppercase transition-colors">
          AI-Powered Intelligence
        </div>
        <h1 className="text-4xl md:text-7xl font-black text-gray-900 dark:text-white mb-4 md:mb-6 leading-tight transition-colors">
          Master the <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#728156] to-[#88976C] dark:from-[#B6C99C] dark:to-[#88976C]">
            Camden Matrix
          </span>
        </h1>
        <p className="text-base md:text-xl text-gray-700 dark:text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed transition-colors px-2">
          Camden Intelligence decodes the hidden layers of human emotion within text. Deploy high-fidelity sentiment analysis and extract precision drivers with one click.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
          <button 
            onClick={onEnter}
            className="w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-4 bg-[#728156] dark:bg-[#B6C99C] hover:bg-[#88976C] dark:hover:bg-[#CFE1BB] text-white dark:text-[#1A1C18] rounded-full font-bold text-base md:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95"
          >
            Launch Console
          </button>
          <a 
            href="https://github.com/SpecialAgents/camdenAI" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 md:px-10 py-3.5 md:py-4 bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-black/60 border border-white/40 dark:border-white/10 text-gray-900 dark:text-gray-100 rounded-full font-bold text-base md:text-lg backdrop-blur-md transition-all"
          >
            GitHub
          </a>
        </div>

        <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 pt-8 border-t border-[#B6C99C]/30">
          <div className="flex flex-col items-center">
            <div className="text-2xl md:text-3xl font-bold text-[#728156] dark:text-[#B6C99C] mb-1 transition-colors">98.4%</div>
            <div className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider transition-colors">Accuracy</div>
          </div>
          <div className="flex flex-col items-center border-y sm:border-y-0 sm:border-x border-[#B6C99C]/30 py-4 sm:py-0 transition-colors">
            <div className="text-2xl md:text-3xl font-bold text-[#88976C] dark:text-[#CFE1BB] mb-1 transition-colors">Instant</div>
            <div className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider transition-colors">Batching</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-2xl md:text-3xl font-bold text-[#98A77C] dark:text-[#B6C99C] mb-1 transition-colors">Enterprise</div>
            <div className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider transition-colors">Ready</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
