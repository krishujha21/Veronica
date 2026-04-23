import React, { useState, useEffect } from 'react';
import { Download, Upload, X, Brain, Database, CheckCircle2, Save } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { memoryAPI } from '../api/client';

export default function SettingsModal({ onClose }) {
  const { persona, setPersona, customSystemPrompt, setCustomSystemPrompt, temperature, setTemperature, threads, setThreads, activeThreadId, theme, setTheme } = useAppContext();

  const [exportMessage, setExportMessage] = useState('');
  const [bio, setBio] = useState('');
  const [bioSaved, setBioSaved] = useState(false);

  // Load saved bio from backend on mount
  useEffect(() => {
    memoryAPI.get()
      .then(res => setBio(res.data.bio || ''))
      .catch(() => {});
  }, []);

  const handleBioSave = async () => {
    try {
      await memoryAPI.save(bio);
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 2000);
    } catch {
      // fail silently
    }
  };

  const personas = [
    { id: 'default', label: 'Default Veronica', desc: 'Helpful, concise, slightly witty Assistant.' },
    { id: 'developer', label: 'Senior Engineer', desc: 'Expert programmer formatting outputs optimally.' },
    { id: 'writer', label: 'Creative Writer', desc: 'Warm, vivid, highly imaginative language.' },
    { id: 'sarcastic', label: 'Sarcastic AI', desc: 'Helpful, but mildly condescending.' },
    { id: 'custom', label: 'Custom Persona', desc: 'Define your own system instructions.' }
  ];

  const themes = [
    { id: 'gemini', label: 'Gemini (Default)', hex: '#5c9df5' },
    { id: 'claude', label: 'Claude (Coral)', hex: '#da7756' },
    { id: 'cyberpunk', label: 'Cyberpunk (Neon)', hex: '#f50057' },
    { id: 'glass', label: 'Glass (Premium)', hex: '#ffffff' }
  ];

  const handleExport = () => {
    try {
      const dataStr = JSON.stringify(threads, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Veronica_Chat_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportMessage('History exported successfully!');
      setTimeout(() => setExportMessage(''), 3000);
    } catch (e) {
      setExportMessage('Export failed.');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          setThreads(importedData);
          setExportMessage('Import successful! (Reloading...)');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setExportMessage('Invalid file format.');
        }
      } catch (err) {
        setExportMessage('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gemini-surface w-full max-w-lg rounded-[24px] overflow-hidden border border-gemini-border shadow-2xl relative" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-[#282a2c]">
          <h2 className="text-[20px] font-medium text-gemini-text">Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gemini-hover rounded-full text-gemini-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

          {/* Persona Selection */}
          <div>
            <h3 className="text-[14px] font-medium text-gemini-text mb-3 tracking-wide uppercase">AI Persona Configuration</h3>
            <p className="text-[13px] text-gemini-muted mb-4 leading-relaxed">
              Select the system instructions injected into Veronica's core at runtime.
            </p>
            <div className="flex flex-col gap-2">
              {personas.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${p.id === persona ? 'bg-[#282a2c] border-gemini-brand shadow-[0_0_10px_rgba(168,199,250,0.1)]' : 'border-transparent hover:bg-gemini-hover'}`}
                >
                  <span className={`text-[15px] font-medium ${p.id === persona ? 'text-gemini-brand' : 'text-gemini-text'}`}>
                    {p.label}
                  </span>
                  <span className="text-[13px] text-gemini-muted mt-1">{p.desc}</span>
                </button>
              ))}
            </div>
            
            {persona === 'custom' && (
              <div className="mt-4 animate-fade-in">
                <label className="text-[13px] text-gemini-text font-medium mb-2 block">Custom Instructions</label>
                <textarea
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant who always answers in rhymes..."
                  className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-3 text-[14px] text-gemini-text placeholder:text-[#a1a3a6] min-h-[100px] resize-y focus:outline-none focus:border-gemini-brand focus:ring-1 focus:ring-gemini-brand/50 transition-all custom-scrollbar"
                />
              </div>
            )}
          </div>

          <div className="h-[1px] w-full bg-[#282a2c]" />

          {/* Model Creativity / Temperature */}
          <div>
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-[14px] font-medium text-gemini-text tracking-wide uppercase">Model Creativity</h3>
               <span className="text-[14px] text-gemini-brand font-mono font-bold bg-gemini-brand/10 px-2 py-0.5 rounded-md">{temperature.toFixed(2)}</span>
            </div>
            <p className="text-[13px] text-gemini-muted mb-4 leading-relaxed">
              Higher values make output more random, lower values make it more focused and deterministic.
            </p>
            <div className="flex items-center gap-4">
               <span className="text-[12px] text-gemini-muted shrink-0 text-right w-12">Precise</span>
               <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={temperature} 
                  onChange={(e) => setTemperature(parseFloat(e.target.value))} 
                  className="flex-1 h-1.5 bg-[#282a2c] rounded-lg appearance-none cursor-pointer accent-gemini-brand" 
               />
               <span className="text-[12px] text-gemini-muted shrink-0 w-12">Creative</span>
            </div>
          </div>

          <div className="h-[1px] w-full bg-[#282a2c]" />

          {/* Theme Selection */}
          <div>
            <h3 className="text-[14px] font-medium text-gemini-text mb-3 tracking-wide uppercase">Interface Appearance</h3>
            <p className="text-[13px] text-gemini-muted mb-4 leading-relaxed">
              Customize Veronica's visual theme globally.
            </p>
            <div className="flex gap-4">
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center gap-3 p-3 rounded-xl border transition-all ${t.id === theme ? 'bg-[#282a2c] border-gemini-brand shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'border-transparent hover:bg-gemini-hover'}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center p-1" style={{ border: `2px solid ${t.id === theme ? t.hex : 'transparent'}` }}>
                    <div className="w-full h-full rounded-full" style={{ backgroundColor: t.hex }} />
                  </div>
                  <span className={`text-[13px] font-medium ${t.id === theme ? 'text-gemini-text' : 'text-gemini-muted'}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] w-full bg-[#282a2c]" />

          {/* Global Context / Memory Core */}
          <div>
            <h3 className="text-[14px] font-medium text-gemini-text mb-3 tracking-wide uppercase flex items-center gap-2">
              <Brain size={16} className="text-[#c96ddc]" />
              Global Context / Memory Core
            </h3>
            <p className="text-[13px] text-gemini-muted mb-4 leading-relaxed">
              Information defined here is persistent across all conversations.
            </p>
            
            <label className="text-[13px] text-gemini-text font-medium mb-2 block">User Bio & Preferences</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., I am a web developer working on React. I prefer concise answers..."
              className="w-full bg-[#1e1f20] border border-[#444746] rounded-xl p-3 text-[14px] text-gemini-text placeholder:text-[#a1a3a6] min-h-[80px] resize-y focus:outline-none focus:border-[#c96ddc] focus:ring-1 focus:ring-[#c96ddc]/50 transition-all custom-scrollbar"
            />
            <button
              onClick={handleBioSave}
              className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all ${bioSaved ? 'bg-green-500/20 text-green-400' : 'bg-[#282a2c] hover:bg-gemini-hover text-gemini-text'}`}
            >
              {bioSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              {bioSaved ? 'Saved to Memory!' : 'Save to Memory'}
            </button>

            <div className="flex items-center justify-between p-3 rounded-xl border border-green-500/30 bg-green-500/5">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                    <Database size={18} />
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-gemini-text flex items-center gap-1.5">Notes RAG Vector Search <CheckCircle2 size={14} className="text-green-400" /></div>
                    <div className="text-[11px] text-gemini-muted mt-0.5">Veronica can semantically query your workspace notes.</div>
                  </div>
               </div>
               <div className="text-[11px] font-mono text-green-400 opacity-80 px-2 py-1 bg-green-500/10 rounded">ONLINE</div>
            </div>
          </div>

          <div className="h-[1px] w-full bg-[#282a2c]" />

          {/* Data Export/Import */}
          <div>
            <h3 className="text-[14px] font-medium text-gemini-text mb-3 tracking-wide uppercase">Data Management</h3>
            <p className="text-[13px] text-gemini-muted mb-4 leading-relaxed">
              Your chat history is stored locally. Export it to back up your conversations.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-[#282a2c] hover:bg-gemini-hover text-gemini-text px-4 py-2.5 rounded-full transition-colors text-[14px] font-medium"
              >
                <Download size={16} /> Export JSON
              </button>

              <label className="flex items-center gap-2 bg-[#282a2c] hover:bg-gemini-hover text-gemini-text px-4 py-2.5 rounded-full transition-colors text-[14px] font-medium cursor-pointer">
                <Upload size={16} /> Import JSON
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>

            {exportMessage && (
              <div className="mt-3 text-[13px] text-gemini-brand animate-fade-in">{exportMessage}</div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}