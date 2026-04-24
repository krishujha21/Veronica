import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, User, Sparkles, Zap, Code, MessagesSquare, Check, Phone, LogOut, Settings } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function TopBar() {
  const { 
    preferredModel, 
    setPreferredModel, 
    setRightPanelOpen, 
    rightPanelOpen, 
    setCallModeOpen, 
    user, 
    logout 
  } = useAppContext();
  
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const modelDropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setModelDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const models = [
    { id: 'gemini', name: 'Gemini Advanced', icon: Sparkles, color: 'text-[#8ab4f8]', desc: 'Most capable logic & reasoning' },
    { id: 'groq', name: 'Llama Ultra 3', icon: Zap, color: 'text-[#f18c8e]', desc: 'Ultra-fast streaming generation' },
    { id: 'claude', name: 'Claude Haiku', icon: MessagesSquare, color: 'text-[#fac173]', desc: 'Natural conversational flow' },
    { id: 'codestral', name: 'Codestral', icon: Code, color: 'text-[#c96ddc]', desc: 'Expert coding & algorithms' },
  ];
  const activeModel = models.find(m => m.id === preferredModel) || models[0];

  return (
    <div className="w-full h-[64px] bg-gemini-bg flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-30">
      
      {/* LEFT: Menu / Branding */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          className="p-2 -ml-2 rounded-full hover:bg-gemini-hover transition-colors text-gemini-muted"
        >
          <Menu size={24} />
        </button>
        
        <span className="text-[22px] font-medium text-gemini-text tracking-tight hidden sm:block">
          Veronica
        </span>

        {/* Custom Model Selector Dropdown */}
        <div className="relative" ref={modelDropdownRef}>
          <button 
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className={`flex items-center gap-2 bg-gemini-surface rounded-xl px-4 py-2 hover:bg-gemini-hover transition-colors text-[14.5px] font-medium ${modelDropdownOpen ? 'bg-gemini-hover' : ''}`}
          >
            {activeModel.name}
            <svg className={`w-3 h-3 text-gemini-muted transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 10 6" fill="currentColor">
              <path d="M0 0.5L5 5.5L10 0.5H0Z"/>
            </svg>
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-[280px] bg-[#1e1f20] border border-[#444746] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in origin-top-left flex flex-col p-1.5">
              {models.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setPreferredModel(m.id); setModelDropdownOpen(false); }}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors relative ${m.id === preferredModel ? 'bg-[#282a2c]' : 'hover:bg-gemini-hover'}`}
                >
                  <div className={`w-8 h-8 rounded-full bg-[#131314] flex items-center justify-center shrink-0 ${m.color}`}>
                    <m.icon size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[14px] font-medium ${m.id === preferredModel ? 'text-gemini-text' : 'text-gemini-text'}`}>
                      {m.name}
                    </span>
                    <span className="text-[12px] text-gemini-muted leading-tight mt-0.5">{m.desc}</span>
                  </div>
                  {m.id === preferredModel && (
                    <div className="absolute right-4 text-gemini-brand"><Check size={16} /></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: User Profile / Icons */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setCallModeOpen(true)}
          className="hidden sm:flex items-center gap-2 bg-gemini-surface hover:bg-gemini-hover text-[#a1a3a6] hover:text-white px-4 py-1.5 rounded-full transition-colors font-medium text-[13px]"
          title="Hands-free continuous mode"
        >
          <Phone size={14} /> Call
        </button>
        <button className="hidden md:flex p-2 rounded-full hover:bg-gemini-hover transition-colors text-gemini-muted">
          <Search size={22} />
        </button>
        
        {/* User Account Dropdown */}
        <div className="relative ml-2" ref={userDropdownRef}>
          <button 
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-inner overflow-hidden border-2 border-transparent hover:border-white/20 transition-all active:scale-95"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </button>

          {userDropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-[240px] bg-[#1e1f20] border border-[#444746] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in origin-top-right flex flex-col p-2">
              <div className="px-3 py-2 mb-1 border-b border-white/5">
                <p className="text-[14px] font-medium text-white truncate">{user?.username || 'User'}</p>
                <p className="text-[12px] text-gemini-muted truncate">{user?.email}</p>
              </div>
              
              <button className="flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-white/5 transition-colors text-[14px] text-gemini-text">
                <Settings size={18} className="text-gemini-muted" />
                Settings
              </button>
              
              <button 
                onClick={logout}
                className="flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-red-500/10 transition-colors text-[14px] text-red-400 group"
              >
                <LogOut size={18} className="text-red-400/70 group-hover:text-red-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
