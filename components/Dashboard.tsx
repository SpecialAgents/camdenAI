
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Sentiment, SentimentResult } from '../types';
import { analyzeSentiment, batchAnalyzeSentiment, analyzeAudioSentiment } from '../geminiService';
import { exportToCSV, exportToJSON, exportToPDF } from '../exportUtils';
import { GoogleGenAI, Modality } from '@google/genai';

interface DashboardProps {
  results: SentimentResult[];
  setResults: React.Dispatch<React.SetStateAction<SentimentResult[]>>;
  isDarkMode: boolean;
}

const COLORS = {
  [Sentiment.POSITIVE]: '#88976C', // Medium Olive
  [Sentiment.NEUTRAL]: '#B6C99C',  // Light Sage
  [Sentiment.NEGATIVE]: '#728156', // Dark Olive
};

const AFFIRMATIONS = {
  [Sentiment.POSITIVE]: [
    "Your brilliance is shining through!",
    "The matrix reflects your excellence.",
    "Positive vectors detected. Keep ascending.",
    "Excellence is your natural state.",
    "A beacon of positive intelligence."
  ],
  [Sentiment.NEUTRAL]: [
    "Perfect equilibrium achieved.",
    "Objectivity is the highest form of intelligence.",
    "Stable signals. Clarity is your strength.",
    "The middle path leads to the most insight.",
    "Balance is the core of wisdom."
  ],
  [Sentiment.NEGATIVE]: [
    "Resilience is built in the shadows.",
    "A temporary dip before a major breakthrough.",
    "Your strength is greater than any negative vector.",
    "Every challenge is a data point for growth.",
    "You are built to handle the heavy signals."
  ]
};

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const Dashboard: React.FC<DashboardProps> = ({ results, setResults, isDarkMode }) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'individual' | 'batch' | 'voice'>('individual');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      setLiveTranscript('');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onmessage: async (message) => {
            if (message.serverContent?.inputTranscription) {
              setLiveTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
            }
          },
          onerror: (e) => console.error("Transcription error:", e),
          onclose: () => console.log("Transcription session closed")
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
        },
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        const base64 = await blobToBase64(blob);
        await handleVoiceAnalysis(base64, recorder.mimeType || 'audio/webm');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Microphone access is required for voice intelligence capture.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleVoiceAnalysis = async (base64Audio: string, mimeType: string) => {
    setIsAnalyzing(true);
    setRetryStatus("Analyzing Voice Vector...");
    try {
      const result = await analyzeAudioSentiment(base64Audio, mimeType);
      setResults(prev => [result, ...prev]);
    } catch (error: any) {
      alert(`Voice Matrix failure: ${error.message || "Failed to resolve audio signals."}`);
    } finally {
      setIsAnalyzing(false);
      setRetryStatus(null);
    }
  };

  const processTextBatch = async (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    if (lines.length === 0) {
      alert("No valid text found in source.");
      return;
    }

    setIsAnalyzing(true);
    setRetryStatus(null);
    try {
      const batchResults = await batchAnalyzeSentiment(lines.slice(0, 50)); 
      setResults(prev => [...batchResults, ...prev]);
    } catch (error: any) {
      const isQuota = error?.message?.includes('429') || error?.message?.includes('quota');
      alert(isQuota 
        ? "Google API Quota Limit Reached. Please wait a minute before trying again." 
        : `Analysis failure: ${error.message || "Check your API key and connection."}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSingleAnalysis = async () => {
    if (!inputText.trim()) return;
    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    setIsAnalyzing(true);
    setRetryStatus(null);
    try {
      if (lines.length > 1) {
        const batchResults = await batchAnalyzeSentiment(lines.slice(0, 50));
        setResults(prev => [...batchResults, ...prev]);
      } else {
        const result = await analyzeSentiment(inputText);
        setResults(prev => [result, ...prev]);
      }
      setInputText('');
    } catch (error: any) {
      const isQuota = error?.message?.includes('429') || error?.message?.includes('quota');
      alert(isQuota 
        ? "Google API Quota Limit Reached. This usually resets every minute." 
        : `Analysis failure: ${error.message || "Failed to analyze."}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      await processTextBatch(text);
      setActiveTab('batch');
    };
    reader.readAsText(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearResults = () => {
    if (window.confirm("Are you sure you want to clear all analysis data?")) {
      setResults([]);
    }
  };

  const sentimentData = [
    { name: 'Positive', value: results.filter(r => r.sentiment === Sentiment.POSITIVE).length },
    { name: 'Neutral', value: results.filter(r => r.sentiment === Sentiment.NEUTRAL).length },
    { name: 'Negative', value: results.filter(r => r.sentiment === Sentiment.NEGATIVE).length },
  ];

  const latestAffirmation = useMemo(() => {
    if (results.length === 0) return null;
    const sentiment = results[0].sentiment;
    const options = AFFIRMATIONS[sentiment];
    const index = results[0].id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % options.length;
    return options[index];
  }, [results]);

  return (
    <div className="px-4 py-6 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10 animate-in slide-in-from-bottom duration-500 relative transition-colors">
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#E8F4DC]/80 dark:bg-[#1A1C18]/80 backdrop-blur-md transition-all animate-in fade-in">
          <div className="w-16 h-16 md:w-24 md:h-24 border-4 border-[#CFE1BB] border-t-[#728156] rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl md:text-4xl font-black text-[#728156] dark:text-[#B6C99C] animate-pulse-text tracking-tighter">
            Camden Intelligence
          </h2>
          <p className="mt-4 text-[#88976C] dark:text-[#B6C99C]/60 font-semibold uppercase tracking-widest text-xs md:text-sm">
            {retryStatus || "Deciphering Matrix..."}
          </p>
        </div>
      )}

      {/* Input Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#2A2D26] p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-[#B6C99C]/20 flex flex-col gap-4 transition-colors">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-[#728156] dark:text-[#B6C99C]">Intelligence Console</h2>
              <div className="flex w-full sm:w-auto bg-[#E8F4DC] dark:bg-[#1A1C18] p-1 rounded-xl transition-colors">
                <button 
                  onClick={() => setActiveTab('individual')}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'individual' ? 'bg-white dark:bg-[#2A2D26] shadow-sm text-[#728156] dark:text-[#B6C99C]' : 'text-[#88976C]'}`}
                >
                  Text
                </button>
                <button 
                  onClick={() => setActiveTab('batch')}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'batch' ? 'bg-white dark:bg-[#2A2D26] shadow-sm text-[#728156] dark:text-[#B6C99C]' : 'text-[#88976C]'}`}
                >
                  Batch
                </button>
                <button 
                  onClick={() => setActiveTab('voice')}
                  className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'voice' ? 'bg-white dark:bg-[#2A2D26] shadow-sm text-[#728156] dark:text-[#B6C99C]' : 'text-[#88976C]'}`}
                >
                  Voice
                </button>
              </div>
            </div>

            {activeTab === 'individual' && (
              <div className="space-y-4">
                <textarea 
                  className="w-full h-32 md:h-44 p-4 md:p-5 rounded-xl md:rounded-2xl border-2 border-[#E8F4DC] dark:border-[#3A3D36] bg-transparent focus:border-[#B6C99C] outline-none transition-all resize-none text-gray-700 dark:text-gray-100 leading-relaxed font-medium text-sm md:text-base"
                  placeholder="Paste multi-line text source here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button 
                  onClick={handleSingleAnalysis}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="w-full py-3 md:py-4 bg-[#728156] dark:bg-[#B6C99C] hover:bg-[#88976C] dark:hover:bg-[#CFE1BB] disabled:bg-[#B6C99C] dark:disabled:bg-[#3A3D36] text-white dark:text-[#1A1C18] rounded-xl md:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] text-sm md:text-base"
                >
                  Initialize Analysis
                </button>
              </div>
            )}

            {activeTab === 'batch' && (
              <div 
                className={`h-44 md:h-52 border-2 border-dashed rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-4 transition-all p-4 ${
                  isDragging ? 'border-[#728156] bg-[#CFE1BB]/20' : 'border-[#B6C99C] dark:border-[#3A3D36] bg-[#E8F4DC]/10 dark:bg-[#1A1C18]/30'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-[#3A3D36] rounded-full shadow-sm flex items-center justify-center text-[#728156] dark:text-[#B6C99C] transition-colors">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm md:text-base text-[#728156] dark:text-[#B6C99C]">
                    {isDragging ? 'Drop File Now' : 'Drag Source File'}
                  </p>
                  <p className="text-[10px] md:text-xs text-[#88976C] dark:text-[#B6C99C]/60 mt-1">Supports .csv, .txt (Max 50 nodes)</p>
                </div>
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  className="hidden" 
                  id="batch-upload"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="batch-upload" 
                  className="px-6 md:px-8 py-2 md:py-2.5 bg-white dark:bg-[#1A1C18] border border-[#B6C99C] rounded-xl text-xs md:text-sm font-bold text-[#728156] dark:text-[#B6C99C] cursor-pointer hover:bg-[#E8F4DC] dark:hover:bg-[#3A3D36] transition-all shadow-sm"
                >
                  Upload Local Source
                </label>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="flex flex-col items-center justify-center gap-6 py-4 min-h-[176px]">
                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500/10 scale-105' : 'bg-[#E8F4DC] dark:bg-[#1A1C18]'}`}>
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 border-4 border-white dark:border-[#2A2D26] ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#728156] dark:bg-[#B6C99C]'
                    } disabled:opacity-50`}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-white rounded-md" />
                    ) : (
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-white dark:text-[#1A1C18]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-center w-full px-4">
                  <p className={`font-bold transition-colors text-xs md:text-base ${isRecording ? 'text-red-500' : 'text-[#728156] dark:text-[#B6C99C]'}`}>
                    {isRecording ? `RECOGNIZING SIGNAL: ${recordingTime}s` : 'READY FOR VOICE DECRYPTION'}
                  </p>
                  
                  {isRecording && (
                    <div className="mt-4 p-4 bg-[#E8F4DC]/30 dark:bg-[#1A1C18]/30 rounded-2xl border border-[#B6C99C]/20 animate-in fade-in slide-in-from-top-2 max-w-lg mx-auto">
                      <p className="text-[9px] font-black text-[#88976C] dark:text-[#B6C99C]/60 uppercase tracking-widest mb-1 text-left">Live Decryption Stream</p>
                      <p className="text-xs md:text-sm text-[#728156] dark:text-[#B6C99C] italic font-medium text-left line-clamp-3">
                        {liveTranscript || "Listening for vectors..."}
                      </p>
                    </div>
                  )}

                  <p className="text-[9px] md:text-[10px] font-black text-[#88976C] dark:text-[#B6C99C]/60 uppercase tracking-widest mt-1">
                    {isRecording ? 'Click to Resolve Signal' : 'Initiate Audio Intelligence Vector'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#2A2D26] p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-[#B6C99C]/20 h-full flex flex-col justify-between transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-[#728156] dark:text-[#B6C99C] mb-4">Matrix Stats</h3>
            
            {results.length > 0 && (
              <div className="space-y-3">
                <div className="p-4 bg-[#CFE1BB]/10 dark:bg-[#3A3D36]/20 rounded-xl md:rounded-2xl border border-[#B6C99C]/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[9px] md:text-[10px] font-black text-[#88976C] dark:text-[#B6C99C]/60 uppercase tracking-widest mb-1">Latest Vector</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-base md:text-lg font-black tracking-tight ${
                      results[0].sentiment === 'POSITIVE' ? 'text-[#728156] dark:text-[#B6C99C]' :
                      results[0].sentiment === 'NEGATIVE' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {results[0].sentiment}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-[#88976C] dark:text-[#B6C99C] bg-white dark:bg-[#1A1C18] px-2 py-0.5 rounded-md border border-[#B6C99C]/20 shadow-sm transition-colors">
                      {(results[0].confidence * 100).toFixed(0)}% FDLTY
                    </span>
                  </div>
                </div>

                {latestAffirmation && (
                  <div className="p-4 bg-camden-light/40 dark:bg-camden-olive/20 rounded-xl md:rounded-2xl border border-camden-sage/30 animate-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">✨</span>
                      <p className="text-[8px] md:text-[9px] font-black text-camden-olive dark:text-camden-sage uppercase tracking-widest">Matrix Affirmation</p>
                    </div>
                    <p className="text-[10px] md:text-xs italic font-semibold text-camden-olive dark:text-camden-sage leading-snug">
                      "{latestAffirmation}"
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:gap-4 flex-grow my-6">
              <div className="p-4 bg-[#E8F4DC] dark:bg-[#1A1C18] rounded-xl md:rounded-2xl flex flex-col justify-center transition-colors">
                <div className="text-[#728156] dark:text-[#B6C99C] text-2xl md:text-3xl font-black">{results.length}</div>
                <div className="text-[9px] md:text-[10px] text-[#88976C] dark:text-[#B6C99C]/60 font-bold uppercase tracking-widest mt-1">Decoded</div>
              </div>
              <div className="p-4 bg-[#CFE1BB]/30 dark:bg-[#3A3D36]/30 rounded-xl md:rounded-2xl flex flex-col justify-center transition-colors">
                <div className="text-[#88976C] dark:text-[#CFE1BB] text-2xl md:text-3xl font-black">
                  {results.length > 0 ? ((results.filter(r => r.sentiment === 'POSITIVE').length / results.length) * 100).toFixed(0) : 0}%
                </div>
                <div className="text-[9px] md:text-[10px] text-[#728156] dark:text-[#B6C99C] font-bold uppercase tracking-widest mt-1">Positive</div>
              </div>
            </div>
            
            <div className="mt-auto space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={clearResults}
                  disabled={results.length === 0}
                  className="px-2 py-2.5 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold text-red-600 dark:text-red-400 disabled:opacity-50 transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => exportToPDF(results)}
                  disabled={results.length === 0}
                  className="px-2 py-2.5 bg-[#728156] dark:bg-[#B6C99C] hover:bg-[#88976C] dark:hover:bg-[#CFE1BB] rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold text-white dark:text-[#1A1C18] disabled:opacity-50 transition-colors shadow-sm"
                >
                  Export PDF
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => exportToJSON(results)}
                  disabled={results.length === 0}
                  className="px-2 py-2.5 bg-[#E8F4DC] dark:bg-[#1A1C18] hover:bg-[#CFE1BB] dark:hover:bg-[#3A3D36] rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold text-[#728156] dark:text-[#B6C99C] disabled:opacity-50 transition-colors border border-[#B6C99C]/20"
                >
                  JSON
                </button>
                <button 
                  onClick={() => exportToCSV(results)}
                  disabled={results.length === 0}
                  className="px-2 py-2.5 bg-[#E8F4DC] dark:bg-[#1A1C18] hover:bg-[#CFE1BB] dark:hover:bg-[#3A3D36] rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold text-[#728156] dark:text-[#B6C99C] disabled:opacity-50 transition-colors border border-[#B6C99C]/20"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visualizations Section */}
      {results.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="bg-white dark:bg-[#2A2D26] p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-[#B6C99C]/20 transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-[#728156] dark:text-[#B6C99C] mb-6 tracking-tight">Emotional Spectrum</h3>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#3A3D36' : '#E8F4DC'} />
                  <XAxis dataKey="name" stroke={isDarkMode ? '#B6C99C' : '#88976C'} tick={{fontSize: 10}} />
                  <YAxis stroke={isDarkMode ? '#B6C99C' : '#88976C'} tick={{fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: isDarkMode ? '#1A1C18' : '#E8F4DC'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', fontSize: '12px', backgroundColor: isDarkMode ? '#1A1C18' : '#FFF', color: isDarkMode ? '#FFF' : '#000'}} 
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toUpperCase() as Sentiment]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#2A2D26] p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-[#B6C99C]/20 transition-colors">
            <h3 className="text-lg md:text-xl font-bold text-[#728156] dark:text-[#B6C99C] mb-6 tracking-tight">Intelligence Breakdown</h3>
            <div className="h-48 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toUpperCase() as Sentiment]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', fontSize: '12px', backgroundColor: isDarkMode ? '#1A1C18' : '#FFF', color: isDarkMode ? '#FFF' : '#000'}} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Results Table */}
      <section className="bg-white dark:bg-[#2A2D26] rounded-2xl md:rounded-3xl shadow-sm border border-[#B6C99C]/20 overflow-hidden transition-colors">
        <div className="p-5 md:p-8 border-b border-[#E8F4DC] dark:border-[#3A3D36] flex justify-between items-center bg-gray-50/20 dark:bg-[#1A1C18]/30 transition-colors">
          <h3 className="text-lg md:text-xl font-bold text-[#728156] dark:text-[#B6C99C]">Decryption Table</h3>
          <div className="text-[10px] font-bold text-[#88976C] dark:text-[#B6C99C]/60 uppercase tracking-widest">{results.length} Nodes</div>
        </div>
        {results.length === 0 ? (
          <div className="p-16 md:p-24 text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#E8F4DC] dark:bg-[#1A1C18] rounded-full flex items-center justify-center mx-auto text-[#88976C] dark:text-[#B6C99C] transition-colors">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            </div>
            <p className="text-[#88976C] dark:text-[#B6C99C]/60 font-semibold tracking-wide text-sm md:text-base">Awaiting Data Injection...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-[#E8F4DC]/30 dark:bg-[#1A1C18]/50 transition-colors">
                <tr>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-[#88976C] dark:text-[#B6C99C] uppercase tracking-wider">Target Node</th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-[#88976C] dark:text-[#B6C99C] uppercase tracking-wider">Vector</th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-[#88976C] dark:text-[#B6C99C] uppercase tracking-wider">Fidelity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F4DC] dark:divide-[#3A3D36] transition-colors">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-[#E8F4DC]/10 dark:hover:bg-[#3A3D36]/20 transition-colors">
                    <td className="px-6 md:px-8 py-5 md:py-6">
                      <p className="text-xs md:text-sm text-gray-700 dark:text-gray-200 font-semibold max-w-xs md:max-w-md line-clamp-2">{res.text}</p>
                      <p className="text-[9px] md:text-[10px] text-[#88976C] dark:text-[#B6C99C]/60 mt-1 line-clamp-1">{res.explanation}</p>
                    </td>
                    <td className="px-6 md:px-8 py-5 md:py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${
                        res.sentiment === 'POSITIVE' ? 'bg-[#E8F4DC] dark:bg-[#728156]/20 border-[#B6C99C] text-[#728156] dark:text-[#B6C99C]' :
                        res.sentiment === 'NEGATIVE' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-400' :
                        'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {res.sentiment}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-5 md:py-6">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-12 md:w-16 bg-[#E8F4DC] dark:bg-[#1A1C18] h-1.5 md:h-2 rounded-full overflow-hidden transition-colors">
                          <div 
                            className="h-full rounded-full bg-[#728156] dark:bg-[#B6C99C]"
                            style={{ width: `${res.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-[#88976C] dark:text-[#B6C99C] tabular-nums">{(res.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
