
import React from 'react';
import { exportDocumentationToPDF } from '../exportUtils';

interface DocumentationProps { isDarkMode: boolean; }

const Documentation: React.FC<DocumentationProps> = ({ isDarkMode }) => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 transition-colors">
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <h1 className="text-4xl font-black text-[#728156] dark:text-[#B6C99C] transition-colors">Documentation & User Guide</h1>
          <button 
            onClick={exportDocumentationToPDF}
            className="px-8 py-3 bg-[#728156] dark:bg-[#B6C99C] hover:bg-[#88976C] dark:hover:bg-[#CFE1BB] text-white dark:text-[#1A1C18] rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Docs PDF
          </button>
        </div>
        
        <div className="prose prose-stone dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 transition-colors">
          <h3 className="text-2xl font-bold text-[#88976C] dark:text-[#B6C99C]">1. Tech Stack</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-white dark:bg-[#2A2D26] border border-[#CFE1BB] dark:border-[#3A3D36] rounded-2xl text-center transition-colors">
              <div className="text-[#728156] dark:text-[#B6C99C] font-bold text-sm">AI Engine</div>
              <p className="text-xs">Gemini 3 Flash</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#2A2D26] border border-[#CFE1BB] dark:border-[#3A3D36] rounded-2xl text-center transition-colors">
              <div className="text-[#728156] dark:text-[#B6C99C] font-bold text-sm">Styling</div>
              <p className="text-xs">Tailwind CSS</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#2A2D26] border border-[#CFE1BB] dark:border-[#3A3D36] rounded-2xl text-center transition-colors">
              <div className="text-[#728156] dark:text-[#B6C99C] font-bold text-sm">Frontend</div>
              <p className="text-xs">React 19</p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-[#88976C] dark:text-[#B6C99C] mt-8 transition-colors">2. User Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-6 bg-white dark:bg-[#2A2D26] border border-[#CFE1BB] dark:border-[#3A3D36] rounded-3xl transition-colors">
              <div className="font-bold text-[#728156] dark:text-[#B6C99C] mb-2">Step 1: Input Data</div>
              <p className="text-sm">Paste text or upload a CSV into the intelligence console.</p>
            </div>
            <div className="p-6 bg-white dark:bg-[#2A2D26] border border-[#CFE1BB] dark:border-[#3A3D36] rounded-3xl transition-colors">
              <div className="font-bold text-[#728156] dark:text-[#B6C99C] mb-2">Step 2: Deep Analysis</div>
              <p className="text-sm">Let the AI decode sentiment vectors and extract precision drivers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="p-10 bg-[#E8F4DC] dark:bg-[#1A1C18]/50 rounded-[2rem] border border-[#B6C99C] dark:border-[#3A3D36] transition-colors">
        <h4 className="text-xl font-bold text-[#728156] dark:text-[#B6C99C] mb-4">Model Thresholds</h4>
        <div className="space-y-4 text-[#88976C] dark:text-[#B6C99C]/60 text-sm transition-colors">
          <p><strong>Confidence:</strong> Flag scores below 0.65 for review.</p>
          <p><strong>Capacity:</strong> Optimal for 10-500 word fragments.</p>
        </div>
      </section>
    </div>
  );
};

export default Documentation;
