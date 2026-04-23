import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Settings, HelpCircle, Activity, X, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { chatAPI } from '../api/client';
import SettingsModal from './SettingsModal';

export default function LeftRail({ isOpen }) {
  const { isMobile, clearHistory, threads, setThreads, activeThreadId, setActiveThreadId } = useAppContext();
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const deleteThread = (e, id) => {
    e.stopPropagation();
    const newThreads = threads.filter(t => t.id !== id);
    setThreads(newThreads);
    if (activeThreadId === id) {
      setActiveThreadId(null);
    }
  };

  // Sort threads by recently updated and filter by search query
  const sortedThreads = [...threads]
    .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      <div className={`
        ${isOpen ? 'w-[280px] translate-x-0' : 'w-[0px] -translate-x-[280px] opacity-0'} 
        ${isMobile ? 'fixed inset-y-[64px] left-0 z-40 bg-gemini-surface' : 'relative bg-gemini-bg'} 
        h-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col overflow-hidden
      `}>
        
        <div className="p-4 w-[280px] flex-1 overflow-y-auto custom-scrollbar">
          {/* New Chat Button */}
          <button 
            onClick={clearHistory}
            className="flex items-center gap-3 bg-gemini-surface hover:bg-gemini-hover transition-colors rounded-full px-4 py-3 border border-transparent w-full"
          >
             <Plus size={20} className="text-gemini-muted" />
             <span className="text-[14px] font-medium text-gemini-text">New chat</span>
          </button>

          {sortedThreads.length > 0 && (
            <>
              <div className="mt-8 mb-4 px-2 text-[12px] font-bold text-gemini-muted tracking-wide flex items-center justify-between">
                <span>Recent</span>
              </div>

              <div className="mb-4 px-2">
                <div className="relative flex items-center w-full bg-[#1e1f20] rounded-lg overflow-hidden border border-[#444746] focus-within:border-gemini-brand transition-colors">
                  <div className="pl-3 text-gemini-muted"><Search size={14} /></div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search history..." 
                    className="w-full bg-transparent border-none outline-none text-[13px] text-gemini-text placeholder:text-[#a1a3a6] py-2 px-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {sortedThreads.map(thread => (
                  <HistoryItem 
                    key={thread.id} 
                    label={thread.title} 
                    isActive={thread.id === activeThreadId}
                    onClick={() => setActiveThreadId(thread.id)}
                    onDelete={(e) => deleteThread(e, thread.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Sticky Actions */}
        <div className="mt-auto p-4 w-[280px] flex flex-col gap-1 border-t border-gemini-surface shrink-0">
           <ActionItem icon={HelpCircle} label="Help & FAQ" onClick={() => {}} />
           <ActionItem icon={Activity} label="Veronica Stats" onClick={() => setShowStats(true)} />
           <ActionItem icon={Settings} label="Settings" onClick={() => setShowSettings(true)} />
        </div>
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}

function HistoryItem({ label, isActive, onClick, onDelete }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between w-full rounded-full transition-colors px-3 py-2.5 group ${isActive ? 'bg-[#282a2c]' : 'hover:bg-gemini-hover'}`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <MessageSquare size={16} className={`${isActive ? 'text-gemini-text' : 'text-gemini-muted group-hover:text-gemini-text'} shrink-0`} />
        <span className={`text-[14px] truncate font-normal ${isActive ? 'text-gemini-text' : 'text-gemini-muted group-hover:text-gemini-text'}`}>
          {label}
        </span>
      </div>
      <div 
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#424549] rounded-full text-gemini-muted hover:text-white transition-all shrink-0"
      >
        <X size={14} />
      </div>
    </button>
  );
}

function ActionItem({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full rounded-full hover:bg-gemini-hover transition-colors px-3 py-2.5">
      <Icon size={18} className="text-gemini-muted" />
      <span className="text-[14px] font-medium text-gemini-text">{label}</span>
    </button>
  );
}

function StatsModal({ onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let interval;
    const fetchStats = async () => {
      try {
        const res = await chatAPI.system();
        setStats(res.data);
      } catch (e) {}
    };
    fetchStats();
    interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gemini-surface w-full max-w-sm rounded-[24px] overflow-hidden border border-gemini-border shadow-2xl relative" onClick={e => e.stopPropagation()}>
        
        <div className="p-6 pb-2">
          <h3 className="text-[20px] font-medium text-gemini-text mb-6">Veronica Diagnostics</h3>
          
          {stats ? (
            <div className="flex flex-col gap-5">
              <StatRow label="CPU Cores" value={`${stats.cpu.cores} Unit${stats.cpu.cores > 1 ? 's' : ''}`} />
              <StatRow label="CPU Load" value={`${stats.cpu.usage.toFixed(1)}%`} pct={stats.cpu.usage} />
              <StatRow label="Memory Alloc" value={`${stats.ram.used.toFixed(1)} / ${stats.ram.total} GB`} pct={(stats.ram.used/stats.ram.total)*100} />
              <StatRow label="Battery" value={`${stats.battery.percent}%`} pct={stats.battery.percent} isWarning={stats.battery.percent < 20} />
              <div className="text-[12px] text-gemini-muted mt-2">Uptime: {stats.uptime}</div>
            </div>
          ) : (
            <div className="text-gemini-muted py-8 text-center animate-pulse">Running diagnostic uplink...</div>
          )}
        </div>

        <div className="p-4 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-full hover:bg-gemini-hover text-gemini-brand font-medium text-[14px] transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, pct, isWarning }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[13px]">
        <span className="text-gemini-muted">{label}</span>
        <span className="text-gemini-text font-medium">{value}</span>
      </div>
      {pct !== undefined && (
        <div className="w-full h-1.5 bg-[#131314] rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isWarning ? 'bg-[#d96570]' : 'bg-[#a8c7fa]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
