import React, { useEffect } from 'react';
import { PhoneOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useVoice } from '../hooks/useVoice';
import { useChat } from '../hooks/useChat';
import Orb from './Orb';

export default function CallMode() {
  const { callModeOpen, setCallModeOpen, isLoading } = useAppContext();
  const { sendMessage } = useChat();

  const { isListening, startListening, stopListening } = useVoice((transcript) => {
    if (transcript.trim() && !isLoading) {
      sendMessage(transcript);
    }
  });

  // Auto-start listening when entering call mode, if not already loading
  useEffect(() => {
    if (callModeOpen && !isLoading && !isListening) {
      startListening();
    }
  }, [callModeOpen, isLoading, isListening, startListening]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!callModeOpen && isListening) {
      stopListening();
    }
  }, [callModeOpen, isListening, stopListening]);

  if (!callModeOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#020205] flex flex-col items-center justify-between py-20 px-6 font-sans animate-zoom-in">
      
      {/* Header */}
      <div className="w-full max-w-md flex justify-center text-center">
        <span className="text-white/40 tracking-widest text-sm font-medium">VERONICA CONTINUOUS MODE</span>
      </div>

      {/* Main Orb Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`transform scale-[3] sm:scale-[4] transition-all duration-700 ${isListening ? 'opacity-100' : 'opacity-60'} ${!isListening && isLoading ? 'animate-pulse' : ''}`}>
          <Orb isThinking={isLoading || !isListening} />
        </div>
        
        <div className="absolute -bottom-24 text-center">
          <p className="text-white text-xl font-medium tracking-wide">
            {isLoading ? 'Thinking...' : isListening ? 'Listening...' : 'Resting...'}
          </p>
          <p className="text-white/50 text-sm mt-2">
            Speak naturally. Veronica will auto-reply.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-md flex justify-center">
        <button 
          onClick={() => { stopListening(); setCallModeOpen(false); }}
          className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]"
        >
          <PhoneOff size={28} />
        </button>
      </div>

    </div>
  );
}
