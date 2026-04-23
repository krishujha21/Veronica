import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Orb from './Orb';
import { Volume2, Square, Copy, Check, ExternalLink, Download, Pencil, Play, StopCircle, Terminal } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';
import { useAppContext } from '../context/AppContext';
import { sandboxAPI } from '../api/client';

// Custom Markdown Code Block Renderer with Copy Button
function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = React.useState(false);
  const [runState, setRunState] = React.useState(null); // null | 'running' | { stdout, stderr, exitCode }
  const { setActiveArtifact } = useAppContext();
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = async () => {
    const code = String(children).replace(/\n$/, '');
    const lang = language === 'python' ? 'python' : language === 'javascript' || language === 'js' ? 'javascript' : null;
    if (!lang) return; // Only run python or js
    setRunState('running');
    try {
      const res = await sandboxAPI.run(code, lang);
      setRunState(res.data);
    } catch (err) {
      setRunState({ stdout: '', stderr: err.response?.data?.error || err.message, exitCode: 1 });
    }
  };

  const runnableLanguages = ['python', 'javascript', 'js'];
  const isRunnable = runnableLanguages.includes(language);

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className="relative group rounded-xl overflow-hidden my-4 border border-[#444746]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#282a2c] text-[#a1a3a6] text-[11px] font-mono tracking-wider">
        <span>{language}</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveArtifact({ code: String(children).replace(/\n$/, ''), language })}
            className="flex items-center gap-1.5 hover:text-gemini-text transition-colors p-1.5 rounded bg-[#444746]/50 hover:bg-[#444746]"
            title="Open in Canvas IDE"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Canvas</span>
          </button>
          {isRunnable && (
            <button 
              onClick={handleRun}
              disabled={runState === 'running'}
              className={`flex items-center gap-1.5 transition-colors p-1.5 rounded bg-[#444746]/50 hover:bg-[#444746] ${
                runState === 'running' ? 'text-yellow-400 animate-pulse' : 'text-green-400 hover:text-green-300'
              }`}
              title="Run in sandbox"
            >
              <Play size={14} fill="currentColor" />
              <span className="hidden sm:inline">{runState === 'running' ? 'Running...' : 'Run'}</span>
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 hover:text-gemini-text transition-colors p-1.5 rounded border border-[#444746]"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto bg-[#1e1f20] p-4 text-[13px] font-mono !mt-0 !mb-0">
        <code className={className} {...props}>
          {children}
        </code>
      </div>
      {/* Output Panel */}
      {runState && runState !== 'running' && (
        <div className="border-t border-[#444746] bg-[#0d1117] p-3 font-mono text-[12px] animate-fade-in">
          <div className="flex items-center gap-2 mb-2 text-[#a1a3a6]">
            <Terminal size={12} />
            <span className="tracking-wider text-[10px]">OUTPUT</span>
            <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] ${
              runState.exitCode === 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              exit {runState.exitCode}
            </span>
          </div>
          {runState.stdout && (
            <pre className="text-green-300 whitespace-pre-wrap break-words">{runState.stdout}</pre>
          )}
          {runState.stderr && (
            <pre className="text-red-400 whitespace-pre-wrap break-words mt-1">{runState.stderr}</pre>
          )}
          {!runState.stdout && !runState.stderr && (
            <span className="text-[#4a829e]">(no output)</span>
          )}
        </div>
      )}
    </div>
  );
}

// Smart Data Tables Wrapper with CSV Export
function TableWrapper({ children, ...props }) {
  const tableRef = React.useRef(null);

  const exportCSV = () => {
    if (!tableRef.current) return;
    const rows = Array.from(tableRef.current.querySelectorAll('tr'));
    
    const csvContent = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => {
         let text = cell.innerText.replace(/"/g, '""');
         return `"${text}"`;
      }).join(',');
    }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Veronica_Data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group my-6 border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)] shadow-lg">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button 
          onClick={exportCSV}
          className="flex items-center gap-1.5 bg-[#444746] hover:bg-[#5f6368] text-white px-3 py-1.5 rounded-lg text-[12px] font-medium shadow shadow-black/50 transition-colors"
          title="Export as CSV"
        >
          <Download size={14} /> CSV
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table ref={tableRef} className="w-full text-left border-collapse text-[14.5px] whitespace-nowrap lg:whitespace-normal" {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

export default function ChatBubble({ role, content, isTyping = false, isStreaming = false, model, latency, id, onEdit }) {
  const isAI = role === 'assistant';

  const { speak, stop, isSpeaking, activeText } = useSpeech();
  const isThisBubbleSpeaking = isSpeaking && activeText === content;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState(content);

  const handleEditSubmit = () => {
    if (editContent.trim()) {
      setIsEditing(false);
      if (onEdit) onEdit(id, editContent);
    }
  };

  let displayContent = content;
  let thinkProcess = '';

  if (isAI && content) {
    const thinkStart = content.indexOf('<think>');
    const thinkEnd = content.indexOf('</think>');
    
    if (thinkStart !== -1 && thinkEnd !== -1) {
      thinkProcess = content.substring(thinkStart + 7, thinkEnd).trim();
      displayContent = content.substring(0, thinkStart) + content.substring(thinkEnd + 8);
    } else if (thinkStart !== -1 && isStreaming) {
      thinkProcess = content.substring(thinkStart + 7).trim();
      displayContent = content.substring(0, thinkStart);
    }
  }

  if (isTyping) {
    return (
      <div className="flex w-full gap-4 sm:gap-6 animate-fade-in pl-2">
         <div className="mt-1 shrink-0">
           <Orb size="mini" isThinking={true} />
         </div>
         <div className="flex flex-col justify-center">
            <div className="flex gap-2.5 mt-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#8ab4f8] animate-[bounce_1s_infinite]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#c96ddc] animate-[bounce_1s_infinite_0.2s]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#f18c8e] animate-[bounce_1s_infinite_0.4s]"></div>
            </div>
         </div>
      </div>
    );
  }

  if (!isAI) {
    return (
      <div className="flex w-full justify-end animate-fade-in pr-2 group">
        <div className="flex items-start max-w-[85%] md:max-w-[70%] relative">
          
          {isEditing ? (
            <div className="bg-[#1e1f20] p-4 rounded-2xl w-[85vw] md:w-[500px] border border-[#444746] flex flex-col gap-3 shadow-2xl relative right-0 sm:-right-4">
               <textarea 
                 value={editContent} 
                 onChange={(e) => setEditContent(e.target.value)}
                 className="w-full bg-transparent border-b border-[#444746] p-2 text-gemini-text text-[15px] outline-none focus:border-hud-cyan min-h-[80px] font-sans resize-none custom-scrollbar"
                 autoFocus
                 onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); } }}
               />
               <div className="flex justify-end gap-2">
                 <button onClick={() => { setIsEditing(false); setEditContent(content); }} className="px-3 py-1.5 text-[12px] font-medium text-[#a1a3a6] hover:text-white rounded-lg transition-colors">Cancel</button>
                 <button onClick={handleEditSubmit} className="px-3 py-1.5 text-[12px] font-medium bg-gemini-text text-black hover:bg-white rounded-lg transition-colors shadow">Save & Resend</button>
               </div>
            </div>
          ) : (
            <>
              <div className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setIsEditing(true)} className="p-2 bg-[#282a2c] border border-[#444746] rounded-full text-[#a1a3a6] hover:text-white transition-colors hover:shadow-lg" title="Edit and Resend">
                    <Pencil size={14} />
                 </button>
              </div>
              <div className="bg-gemini-userBubble text-[15px] text-gemini-text px-6 py-3 rounded-[24px] rounded-br-[4px] leading-relaxed break-words font-medium">
                {content}
              </div>
            </>
          )}

        </div>
      </div>
    );
  }

  // AI Response Block
  return (
    <div className="flex w-full gap-4 sm:gap-6 animate-fade-in pl-2">
      <div className="mt-1 shrink-0">
        <Orb size="mini" isThinking={isStreaming} />
      </div>

      <div className="flex-1 w-full max-w-[100%] overflow-hidden flex flex-col gap-2">
        {thinkProcess && (
          <details className="group border border-[#444746] rounded-xl bg-[#1e1f20] overflow-hidden mb-2 max-w-[85%]">
            <summary className="px-4 py-2.5 text-[12.5px] font-mono tracking-wide text-[#a1a3a6] cursor-pointer hover:bg-[#282a2c] transition-colors list-none flex items-center gap-2 select-none [&::-webkit-details-marker]:hidden outline-none">
              <span className={`transition-transform duration-300 ${isStreaming ? 'animate-pulse' : 'group-open:rotate-90'}`}>💭</span> 
              {isStreaming && content.indexOf('</think>') === -1 ? 'Veronica is thinking deeply...' : 'Thought Process'}
            </summary>
            <div className="px-4 py-3 border-t border-[#444746] text-[#8ab4f8] text-[13.5px] font-mono whitespace-pre-wrap leading-[1.7] opacity-80 bg-[#131314] overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
              {thinkProcess}
            </div>
          </details>
        )}
        <div className="prose prose-invert max-w-none text-[15px] sm:text-[16px] leading-[1.65]">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{ code: CodeBlock, pre: ({children}) => <>{children}</>, table: TableWrapper }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <div className="w-1.5 h-4 bg-gemini-text opacity-50 ml-1 inline-block animate-pulse align-middle" />
        )}
        
        {/* Actions Bar (Below AI Response) */}
        {!isStreaming && content && content.trim().length > 0 && (
          <div className="flex items-center gap-2 mt-2 -ml-2">
            <button 
              onClick={() => isThisBubbleSpeaking ? stop() : speak(content)}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${isThisBubbleSpeaking ? 'bg-gemini-surface text-gemini-brand' : 'hover:bg-gemini-hover text-gemini-muted hover:text-gemini-text'}`}
              title={isThisBubbleSpeaking ? "Stop speaking" : "Listen"}
            >
              {isThisBubbleSpeaking ? <Square size={16} fill="currentColor" /> : <Volume2 size={16} />}
            </button>
            {model && (
              <div className="ml-2 px-2.5 py-1 text-[11px] font-mono tracking-wide rounded-full border border-[#444746] text-[#a1a3a6] flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <span className="text-[#c96ddc]">⚡</span> {model}
                {latency && <span className="opacity-50">• {(latency/1000).toFixed(1)}s</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
