import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, MessageSquarePlus, Activity, MessagesSquare, Code, Zap } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function CommandPalette() {
  const { 
    commandPaletteOpen, setCommandPaletteOpen, 
    setPreferredModel, setThreads, setActiveThreadId,
    setRightPanelOpen, setRightPanelView 
  } = useAppContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
         setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const ACTIONS = [
    { title: 'New Chat', desc: 'Start a fresh conversation', icon: MessageSquarePlus, action: () => { setActiveThreadId(null); } },
    { title: 'Switch to Gemini', desc: 'Google Gemini 2.0 Flash', icon: Sparkles, action: () => setPreferredModel('gemini') },
    { title: 'Switch to Claude', desc: 'Anthropic Claude Haiku', icon: MessagesSquare, action: () => setPreferredModel('claude') },
    { title: 'Switch to Groq', desc: 'Fast LLama 3', icon: Zap, action: () => setPreferredModel('groq') },
    { title: 'Switch to Codestral', desc: 'Mistral Code Model', icon: Code, action: () => setPreferredModel('codestral') },
    { title: 'View Telemetry', desc: 'Open System Stats', icon: Activity, action: () => { setRightPanelOpen(true); setRightPanelView('overview'); } },
  ];

  const filtered = ACTIONS.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) || a.desc.toLowerCase().includes(query.toLowerCase()));

  const handleExecute = (actionObj) => {
    actionObj.action();
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleExecute(filtered[selectedIndex]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      {/* Background click to close */}
      <div className="absolute inset-0 z-0" onClick={() => setCommandPaletteOpen(false)} />
      
      <div className="relative z-10 w-[90vw] max-w-[600px] bg-[#1e1f20] border border-[#444746] rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans animate-fade-in">
        
        {/* Input */}
        <div className="flex items-center px-4 h-[64px] border-b border-[#444746] bg-[#131314]">
          <Search size={20} className="text-[#a1a3a6]" />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-gemini-text text-[18px] ml-3 placeholder:text-[#444746]"
          />
          <div className="text-[11px] font-mono tracking-wider text-[#444746] bg-[#282a2c] px-2 py-1 rounded">ESC</div>
        </div>

        {/* Results */}
        <div className="flex flex-col py-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-[#a1a3a6] text-[14px]">No actions found.</div>
          ) : (
            filtered.map((item, i) => (
              <button 
                key={item.title}
                onClick={() => handleExecute(item)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`flex items-center gap-4 px-6 py-3 text-left transition-colors ${i === selectedIndex ? 'bg-[#282a2c]' : 'hover:bg-[#282a2c]/50'}`}
              >
                <div className={`w-8 h-8 rounded-lg bg-[#131314] flex items-center justify-center shrink-0 ${i === selectedIndex ? 'text-gemini-text' : 'text-[#a1a3a6]'}`}>
                  <item.icon size={16} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[15px] font-medium ${i === selectedIndex ? 'text-white' : 'text-gemini-text'}`}>{item.title}</span>
                  <span className="text-[12px] text-gemini-muted">{item.desc}</span>
                </div>
                {i === selectedIndex && (
                  <span className="ml-auto text-[11px] font-mono text-[#444746]">↵</span>
                )}
              </button>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
