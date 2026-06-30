import React, { useRef, useEffect, useState } from 'react';
import ChatBubble from './ChatBubble';
import InputBar from './InputBar';
import Orb from './Orb';
import { useChat } from '../hooks/useChat';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, Circle, Sun, CloudRain, Bell } from 'lucide-react';

export default function CenterPanel() {
  const { user, messages, isLoading, isMobile, isRecording, tasks, weather } = useAppContext();
  const { sendMessage, editAndResend } = useChat();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Smooth scroll to bottom whenever DOM mutates (e.g. streaming tokens)
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new MutationObserver(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    });
    observer.observe(scrollContainerRef.current, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  // Guarantee scroll on new message block spawn
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning.';
    if (h < 17) return 'Good Afternoon.';
    return 'Good Evening.';
  };

  const handleSubmit = (inputText, attachments = []) => {
    sendMessage(inputText || input, attachments, webSearchEnabled);
    setInput('');
  };

  const suggestions = [
    { title: 'Help me plan', subtitle: 'a weekend getaway' },
    { title: 'Write code', subtitle: 'for a react component' },
    { title: 'Summarize', subtitle: 'this meeting transcript' },
    { title: 'Brainstorm', subtitle: 'names for a startup' }
  ];

  return (
    <div className="flex-1 w-full max-w-[900px] h-full flex flex-col relative mx-auto font-sans">
      
      {/* Scrollable Message List */}
      <div className={`flex-1 overflow-y-auto w-full px-4 sm:px-6 pb-[140px] pt-8 flex flex-col gap-8 custom-scrollbar`} ref={scrollContainerRef}>
        
        {messages.length === 0 ? (
          
          /* --- IDLE STATE (Gemini "Hello" screen) --- */
          <div className="flex flex-col min-h-[70%] justify-center mt-[-40px]">
            <div className="mb-10 animate-fade-in pl-2">
              <h1 className="text-[44px] md:text-[56px] font-medium tracking-tight leading-[1.1] mb-2 gemini-gradient-text">
                Hello, {user?.username || 'Guest'}
              </h1>
              <h2 className="text-[44px] md:text-[56px] font-medium tracking-tight text-[#444746] leading-[1.1]">
                How can I help you today?
              </h2>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 mb-6">
               {suggestions.map((s, i) => (
                 <button 
                  key={i}
                  className="bg-gemini-surface hover:bg-gemini-hover transition-colors rounded-2xl p-4 min-w-[160px] h-[160px] flex flex-col text-left shrink-0 cursor-pointer border border-[#444746]/50"
                  onClick={() => setInput(`${s.title} ${s.subtitle}`)}
                 >
                    <span className="text-[15px] font-medium text-gemini-text mb-1">{s.title}</span>
                    <span className="text-[15px] font-normal text-gemini-muted">{s.subtitle}</span>
                 </button>
               ))}
            </div>

            {/* Daily Briefing Widget */}
            <div className="bg-[#1e1f20] border border-[#444746] flex flex-col gap-4 rounded-2xl p-5 mx-2 sm:mx-0 animate-fade-in shadow-lg">
              <div className="flex items-center gap-3 border-b border-[#444746] pb-3">
                 <div className="p-2 bg-blue-500/10 text-blue-400 rounded-full">
                    <Sun size={18} />
                 </div>
                 <div>
                    <h3 className="text-gemini-text font-medium text-[15px]">{getGreeting()}</h3>
                    <p className="text-gemini-muted text-[13px]">
                      {weather ? `${weather.temp}°C · ${weather.condition} in ${weather.city}.` : 'Loading weather...'}
                      {' '}You have {tasks?.filter(t => !t.completed).length || 0} active threads.
                    </p>
                 </div>
              </div>
              <div className="flex flex-col gap-2">
                 {(tasks?.length > 0 ? tasks.slice(0, 3) : []).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 px-1 py-1">
                      {task.completed ? <CheckCircle2 size={16} className="text-[#a1a3a6]" /> : <Circle size={16} className="text-blue-400" />}
                      <span className={`text-[14px] ${task.completed ? 'text-[#a1a3a6] line-through' : 'text-gemini-text'}`}>{task.text}</span>
                    </div>
                 ))}
                 {tasks?.length === 0 && (
                    <p className="text-gemini-muted text-[13px] px-1">No active tasks. Add some from the right panel →</p>
                 )}
                 <button className="flex justify-between items-center text-[12px] bg-gemini-surface hover:bg-gemini-hover px-3 py-2 rounded-lg mt-2 transition-colors border border-transparent hover:border-[#444746] text-gemini-text">
                    <span>Show complete briefing</span>
                    <Bell size={14} className="text-gemini-muted" />
                 </button>
              </div>
            </div>
          </div>

        ) : (
          
          /* --- CHAT STREAM --- */
          <div className="flex flex-col w-full gap-8">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} id={msg.id} role={msg.role} content={msg.content} model={msg.model} latency={msg.latency} isStreaming={msg.isStreaming} onEdit={editAndResend} />
            ))}

            {isLoading && (
              <ChatBubble role="assistant" content="" isTyping={true} />
            )}

            <div ref={bottomRef} className="h-6" />
          </div>

        )}
      </div>

      {/* CINEMATIC VOICE OVERLAY */}
      {isRecording && (
        <div className="absolute inset-0 z-40 bg-[#131314]/80 backdrop-blur-[30px] flex flex-col items-center justify-center animate-fade-in pb-[100px]">
          <div className="scale-[2.5] mb-20 pointer-events-none">
            <Orb />
          </div>
          <div className="text-[#a1a3a6] text-[18px] font-medium animate-pulse tracking-widest font-mono">
            LISTENING...
          </div>
        </div>
      )}

      {/* FLOATING INPUT CONTAINER */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pt-12 pb-6 px-4 sm:px-6 z-50">
        <InputBar 
          input={input} 
          setInput={setInput} 
          onSubmit={handleSubmit} 
          isProcessing={isLoading}
          webSearchEnabled={webSearchEnabled}
          onWebSearchChange={setWebSearchEnabled}
        />
        <div className="text-center mt-3 text-[11px] font-medium text-[#737577]">
          Veronica may display inaccurate info, so double-check its responses.
        </div>
      </div>

    </div>
  );
}
