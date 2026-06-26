import { useState, useCallback, useEffect } from 'react';

// Basic regex to strip markdown syntax so the voice doesn't read asterisks and hashes out loud
const stripMarkdown = (md) => {
  if (!md) return '';
  return md
    .replace(/[#_*~`]/g, '') // Remove simple markdown chars
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to just text
    .replace(/\n+/g, '. '); // Convert newlines to periods for better pacing
};

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeText, setActiveText] = useState('');

  useEffect(() => {
    // Ensure speech synthesis is available
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis API not supported in this browser.');
      return;
    }

    const setSpeechState = () => setIsSpeaking(window.speechSynthesis.speaking);

    // Poll state since some browsers don't reliably fire end events if cancelled
    const interval = setInterval(setSpeechState, 500);
    return () => clearInterval(interval);
  }, []);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop anything currently playing

    if (!text || text === activeText && isSpeaking) {
      // If clicking play on the same text while playing, treat it as a stop toggle
      setActiveText('');
      setIsSpeaking(false);
      return;
    }

    const cleanText = stripMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Try to find a good female/AI voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Google UK English Female') ||
      v.name.includes('Samantha') ||
      v.name.includes('Victoria') ||
      (v.lang.startsWith('en') && v.name.includes('Female'))
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.05; // Slightly faster for an AI feel
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveText('');
    };
    utterance.onerror = () => setIsSpeaking(false);

    setActiveText(text);
    window.speechSynthesis.speak(utterance);
  }, [activeText, isSpeaking]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveText('');
    }
  }, []);

  return { speak, stop, isSpeaking, activeText };
}