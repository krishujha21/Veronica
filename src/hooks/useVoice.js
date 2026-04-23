import { useState, useEffect, useCallback } from 'react';

export function useVoice(onResult) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = 'en-US';

        reco.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          if (onResult) onResult(transcript);
          setIsRecording(false);
        };

        reco.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        reco.onend = () => {
          setIsRecording(false);
        };

        setRecognition(reco);
      } else {
        setSupported(false);
      }
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!recognition) return;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start listening", err);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    try {
      recognition.stop();
      setIsRecording(false);
    } catch (err) {
      console.error("Failed to stop listening", err);
    }
  }, [recognition]);

  return { isRecording, startListening, stopListening, supported };
}
