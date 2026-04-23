import React, { useRef, useEffect, useState } from 'react';
import { Mic, ArrowUp, Square, Plus, Image, File, X, Camera, Globe } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { useAppContext } from '../context/AppContext';

export default function InputBar({ input, setInput, onSubmit, isProcessing, webSearchEnabled = false, onWebSearchChange }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);

  const COMMANDS = [
    { cmd: '/codestral', desc: 'Force Code Model' },
    { cmd: '/gemini', desc: 'Force Gemini 2.0' },
    { cmd: '/groq', desc: 'Force Groq Fast Stream' },
    { cmd: '/claude', desc: 'Force Claude Haiku' },
    { cmd: '/mistral', desc: 'Force Mistral' },
    { cmd: '/developer', desc: 'Persona: Senior Engineer' },
    { cmd: '/sarcastic', desc: 'Persona: Sarcastic' },
    { cmd: '/writer', desc: 'Persona: Creative Writer' },
  ];

  const showMenu = input.startsWith('/') && !input.includes(' ');
  const filterText = input.toLowerCase();
  const filteredCommands = COMMANDS.filter(c => c.cmd.startsWith(filterText));

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filterText]);
  const { isRecording, setIsRecording } = useAppContext();
  const { isListening, startListening, stopListening } = useVoice((transcript) => {
    setInput(prev => prev + (prev ? ' ' : '') + transcript);
  });
  const textareaRef = useRef(null);

  // Sync state
  useEffect(() => {
    setIsRecording(isListening);
  }, [isListening, setIsRecording]);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '24px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const submit = () => {
    if ((input.trim() || attachments.length > 0) && !isProcessing) {
      onSubmit(input, attachments);
      setAttachments([]);
      if (textareaRef.current) textareaRef.current.style.height = '24px';
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Create local object URLs for preview
    const newAttachments = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id);
      // Clean up object URLs
      const removed = prev.find(a => a.id === id);
      if (removed && removed.url) URL.revokeObjectURL(removed.url);
      return filtered;
    });
  };

  const handleKeyDown = (e) => {
    if (showMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        setInput(filteredCommands[selectedIndex].cmd + ' ');
        // Set focus back at the end of the input
        setTimeout(() => textareaRef.current?.focus(), 10);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasText = input.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-[850px] mx-auto relative group">
      
      {/* Slash Commands Floating Menu */}
      {showMenu && filteredCommands.length > 0 && (
        <div className="absolute bottom-[calc(100%+12px)] left-8 bg-[#1e1f20] border border-[#444746] rounded-xl shadow-2xl p-2 min-w-[240px] z-50 animate-fade-in origin-bottom-left">
          <div className="text-[10px] uppercase text-gemini-muted tracking-wider font-semibold mb-2 px-2">Slash Commands</div>
          {filteredCommands.map((cmd, i) => (
            <button
              key={cmd.cmd}
              onClick={() => { setInput(cmd.cmd + ' '); textareaRef.current?.focus(); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                i === selectedIndex ? 'bg-gemini-surface text-gemini-text' : 'hover:bg-gemini-hover text-[#a1a3a6]'
              }`}
            >
              <span className={`font-mono text-sm ${i === selectedIndex ? 'text-gemini-brand text-transparent bg-clip-text bg-gradient-to-r from-[#8ab4f8] to-[#c96ddc]' : ''}`}>
                {cmd.cmd}
              </span>
              <span className="text-[11px] opacity-70 ml-4">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}
      
      <div className={`
        relative w-full flex flex-col gap-2 bg-gemini-input rounded-[32px] p-2 pl-3 transition-shadow duration-300
        focus-within:bg-[#2e3032] focus-within:shadow-[0_0_15px_rgba(255,255,255,0.02)]
      `}>
        
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-12 pt-2 animate-fade-in">
             {attachments.map(att => (
               <div key={att.id} className="relative group rounded-xl overflow-hidden border border-[#444746] bg-[#1e1f20] flex items-center justify-center p-1 min-w-[60px] h-[60px]">
                 {att.type === 'image' ? (
                   <img src={att.url} alt="preview" className="w-full h-full object-cover rounded-lg" />
                 ) : (
                   <div className="flex flex-col items-center gap-1 text-[#a1a3a6]">
                     <File size={20} />
                     <span className="text-[9px] max-w-[40px] truncate">{att.name}</span>
                   </div>
                 )}
                 <button 
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   <X size={12} />
                 </button>
               </div>
             ))}
          </div>
        )}

        <div className="flex items-end gap-2 w-full">
          {/* Attachment Toggle */}
          <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full text-gemini-text hover:bg-gemini-hover transition-colors"
            title="Upload Files"
          >
            <Plus size={24} />
          </button>
          <button 
            className="h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full text-gemini-text hover:bg-gemini-hover transition-colors"
            title="Live Sight (Camera/Screen)"
          >
            <Camera size={20} />
          </button>
          <button 
            onClick={() => onWebSearchChange ? onWebSearchChange(!webSearchEnabled) : null}
            className={`h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-full transition-colors ${webSearchEnabled ? 'text-gemini-brand bg-gemini-brand/10' : 'text-gemini-text hover:bg-gemini-hover'}`}
            title={webSearchEnabled ? 'Web Search: ON' : 'Web Search: OFF'}
          >
            <Globe size={20} />
          </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Listening..." : "Ask Veronica"}
          disabled={isProcessing}
          className="flex-1 bg-transparent border-none outline-none resize-none min-h-[26px] max-h-[200px] font-sans text-[16px] text-gemini-text placeholder:text-[#a1a3a6] leading-relaxed custom-scrollbar py-2.5 px-1"
          autoFocus
        />

        <div className="flex items-center gap-1 shrink-0 pb-[2px]">
          {/* Animated iridescent mic when active */}
          {!hasText && !isProcessing && (
            <button
              onClick={toggleMic}
              className={`h-[40px] w-[40px] flex items-center justify-center rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-white text-black scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                  : 'bg-transparent hover:bg-gemini-hover text-gemini-text'
              }`}
            >
              <Mic size={22} className={isRecording ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''} fill={isRecording ? 'currentColor' : 'none'} strokeWidth={isRecording ? 1 : 2} />
            </button>
          )}

          {isProcessing ? (
             <button
             disabled
             className="h-[40px] w-[40px] flex items-center justify-center bg-transparent border-[2px] border-gemini-border rounded-full hover:bg-gemini-hover transition-colors"
           >
             <Square size={16} className="text-gemini-text" fill="currentColor" />
           </button>
          ) : (
            <div className={`transition-all duration-300 overflow-hidden flex items-center ${hasText ? 'w-[40px] opacity-100 mr-1' : 'w-0 opacity-0'}`}>
              <button
                onClick={submit}
                disabled={!hasText}
                className="h-[36px] w-[36px] flex items-center justify-center rounded-full bg-gemini-text text-[#131314] hover:bg-white scale-100 transition-colors"
              >
                <ArrowUp size={20} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>

        </div>

      </div>
      
    </div>
  );
}
