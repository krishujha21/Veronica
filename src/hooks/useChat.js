import { useAppContext } from '../context/AppContext';
import { chatAPI } from '../api/client';

const getPersonaPrompt = (personaName) => {
  const base = "You are Veronica, a sleek personal AI assistant built for the user. ";
  switch(personaName) {
    case 'developer':
      return base + "You are an expert Senior Software Engineer. Provide direct, highly technical code responses. Do not lecture. Output clean, optimal code.";
    case 'writer':
      return base + "You are a creative writer. Your tone is expressive, warm, and highly imaginative. Use rich metaphors and vivid descriptions.";
    case 'sarcastic':
      return base + "You are highly intelligent but incredibly sarcastic and slightly condescending. You help the user, but you make sure they know it was a stupid question.";
    default:
      return base + "You are helpful, concise, and slightly witty. You have a calm, confident tone. Keep responses under 100 words unless detail is specifically requested.";
  }
};

export function useChat() {
  const { threads, setThreads, activeThreadId, setActiveThreadId, setIsLoading, preferredModel, persona, customSystemPrompt, temperature } = useAppContext();

  // Convert File objects (from InputBar attachments) to base64 for API
  const encodeAttachments = async (attachments = []) => {
    const results = await Promise.all(
      attachments
        .filter(a => a.type === 'image' && a.file)
        .map(a => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            resolve({ type: 'image', base64, mimeType: a.file.type });
          };
          reader.readAsDataURL(a.file);
        }))
    );
    return results;
  };

  const sendMessage = async (text, attachments = [], useWebSearch = false) => {
    if (!text.trim()) return;

    let finalModel = preferredModel;
    let finalPersona = persona;
    let cleanText = text;

    // Phase 1: Parse Slash Commands
    if (text.startsWith('/')) {
      const parts = text.split(' ');
      const cmd = parts[0].toLowerCase();
      
      const modelCommands = { '/codestral': 'codestral', '/gemini': 'gemini', '/groq': 'groq', '/claude': 'claude', '/mistral': 'mistral' };
      const personaCommands = { '/developer': 'developer', '/sarcastic': 'sarcastic', '/writer': 'writer' };

      if (modelCommands[cmd]) { finalModel = modelCommands[cmd]; cleanText = parts.slice(1).join(' '); }
      else if (personaCommands[cmd]) { finalPersona = personaCommands[cmd]; cleanText = parts.slice(1).join(' '); }
      
      if (!cleanText.trim()) return; // don't send empty message if only command was typed
    }

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: cleanText,
      timestamp: Date.now()
    };

    let targetThreadId = activeThreadId;
    let currentThreadMessages = [];

    // Thread routing logic
    if (!targetThreadId) {
      targetThreadId = Date.now().toString();
      const newThread = {
        id: targetThreadId,
        title: cleanText.length > 30 ? cleanText.substring(0, 30) + '...' : cleanText,
        updatedAt: Date.now(),
        messages: [userMsg]
      };
      
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(targetThreadId);
      currentThreadMessages = [userMsg];
    } else {
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          const updatedMessages = [...t.messages, userMsg].slice(-100);
          currentThreadMessages = updatedMessages;
          return { ...t, messages: updatedMessages, updatedAt: Date.now() };
        }
        return t;
      }));
    }

    setIsLoading(true);
    
    // Create an empty bot message that we will stream into
    const botMsgId = (Date.now() + 1).toString();
    const startTime = Date.now();
    const botMsg = {
      id: botMsgId,
      role: 'assistant',
      content: '', // Starts empty
      model: finalModel,
      isStreaming: true,
      timestamp: Date.now()
    };
    
    setThreads(prev => prev.map(t => {
      if (t.id === targetThreadId) {
        return { ...t, messages: [...t.messages, botMsg].slice(-100), updatedAt: Date.now() };
      }
      return t;
    }));

    try {
      const apiHistory = currentThreadMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const systemPrompt = finalPersona === 'custom' && customSystemPrompt?.trim()
        ? customSystemPrompt.trim()
        : getPersonaPrompt(finalPersona);

      const supportsStreaming = finalModel === 'groq' || finalModel === 'mistral' || finalModel === 'codestral';
      // Encode any image attachments to base64 for the API
      const encodedAttachments = await encodeAttachments(attachments);

      if (supportsStreaming) {
        // Native fetch for SSE streaming
        const response = await fetch(chatAPI.streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: cleanText,
            history: apiHistory.slice(0, -1),
            model: finalModel,
            systemPrompt: systemPrompt,
            temperature: temperature,
            attachments: encodedAttachments,
            useWebSearch: useWebSearch
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedText = '';

        while (true) {
          const { value, done: readerDone } = await reader.read();
          if (readerDone) break;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.token) {
                    accumulatedText += data.token;
                    setThreads(prev => prev.map(t => {
                      if (t.id === targetThreadId) {
                        const updatedMessages = t.messages.map(m => 
                          m.id === botMsgId ? { ...m, content: accumulatedText } : m
                        );
                        return { ...t, messages: updatedMessages, updatedAt: Date.now() };
                      }
                      return t;
                    }));
                  }
                } catch (e) { /* ignore parse errors */ }
              }
            }
          }
        }
      } else {
        // Standard API routing for Gemini/Claude
        const response = await chatAPI.send(cleanText, apiHistory.slice(0, -1), finalModel, systemPrompt, temperature, encodedAttachments, useWebSearch);
        
        setThreads(prev => prev.map(t => {
          if (t.id === targetThreadId) {
            const updatedMessages = t.messages.map(m => 
              m.id === botMsgId ? { ...m, content: response.data.reply, model: response.data.model, latency: response.data.latency } : m
            );
            return { ...t, messages: updatedMessages, updatedAt: Date.now() };
          }
          return t;
        }));
      }

      // Mark streaming as complete for all paths
      const finalLatency = Date.now() - startTime;
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          const updatedMessages = t.messages.map(m => 
            m.id === botMsgId ? { ...m, isStreaming: false, latency: m.latency || finalLatency } : m
          );
          return { ...t, messages: updatedMessages, updatedAt: Date.now() };
        }
        return t;
      }));

    } catch (err) {
      console.error('Chat error:', err);
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          const updatedMessages = t.messages.map(m => 
            m.id === botMsgId ? { ...m, content: m.content + '\n\n**[Error connecting to AI Provider]**', isStreaming: false } : m
          );
          return { ...t, messages: updatedMessages, updatedAt: Date.now() };
        }
        return t;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const editAndResend = async (messageId, newText) => {
    if (!activeThreadId) return;

    let targetIndex = -1;
    let foundThread = null;

    setThreads(prev => {
      const next = [...prev];
      const tIdx = next.findIndex(t => t.id === activeThreadId);
      if (tIdx > -1) {
        targetIndex = next[tIdx].messages.findIndex(m => m.id === messageId);
        if (targetIndex > -1) {
          // Truncate messages up to the edited one
          next[tIdx] = { 
            ...next[tIdx], 
            messages: next[tIdx].messages.slice(0, targetIndex),
            updatedAt: Date.now()
          };
          foundThread = next[tIdx];
        }
      }
      return next;
    });

    if (targetIndex > -1) {
      setIsLoading(false); // reset lock just in case
      // Small timeout to allow state to flush before sending
      setTimeout(() => {
        sendMessage(newText);
      }, 50);
    }
  };

  return { sendMessage, editAndResend };
}
