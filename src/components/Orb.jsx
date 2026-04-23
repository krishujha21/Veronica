import React from 'react';

export default function Orb({ isThinking = false, size = 'hero' }) {
  // We repurpose "Orb" to mean "Gemini Sparkle/Avatar"

  if (size === 'mini') {
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isThinking ? 'animate-sparkle' : ''}`}>
        {/* Simple custom SVG representing the DeepMind/Gemini star */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C12 6.62742 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.62742 12 0 12C6.62742 12 12 6.62742 12 0Z" fill="url(#paint0_linear)" />
          <defs>
            <linearGradient id="paint0_linear" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9b72cb" />
              <stop offset="0.5" stopColor="#d96570" />
              <stop offset="1" stopColor="#5c9df5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Hero Size used for Voice Overlays
  return (
    <div className={`flex items-center justify-center relative w-24 h-24 transition-all duration-1000 ${isThinking ? 'scale-110 animate-sparkle' : 'scale-100'}`}>
      {/* Animated Waveforms */}
      <div className="absolute inset-0 flex items-center justify-between px-2 gap-1.5 opacity-90 mix-blend-screen">
        {[20, 40, 100, 60, 80, 30, 70, 50].map((height, i) => (
          <div 
            key={i} 
            className="w-1.5 bg-gradient-to-t from-[var(--grad-1)] via-[var(--grad-2)] to-[var(--grad-4)] rounded-full animate-bounce"
            style={{ 
              height: `${height}%`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
              animationDelay: `${Math.random() * 0.5}s`
            }}
          />
        ))}
      </div>
      {/* Soft Glow Behind */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--grad-1)] to-[var(--grad-3)] opacity-20 blur-xl animate-pulse" />
    </div>
  );
}
