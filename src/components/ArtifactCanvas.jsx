import React, { useState, useEffect } from 'react';
import { X, Code, Play, Diff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ArtifactCanvas() {
  const { activeArtifact, setActiveArtifact, isMobile, previousArtifact } = useAppContext();
  const [activeTab, setActiveTab] = useState('preview');

  // Switch to code tab automatically if preview is not supported
  useEffect(() => {
    if (activeArtifact) {
      const lang = activeArtifact.language.toLowerCase();
      if (['html', 'css', 'javascript', 'js', 'jsx', 'react', 'tsx', 'ts'].includes(lang)) {
        setActiveTab('preview');
      } else {
        setActiveTab('code');
      }
    }
  }, [activeArtifact]);

  if (!activeArtifact) return null;

  const { code, language } = activeArtifact;
  const isWebDev = ['html', 'css', 'javascript', 'js', 'jsx', 'react', 'tsx', 'ts'].includes(language.toLowerCase());

  // Generate iframe source doc
  let srcDoc = '';
  if (isWebDev) {
    if (language.toLowerCase() === 'html') {
      srcDoc = code;
    } else if (language.toLowerCase() === 'css') {
      srcDoc = `<html><head><style>${code}</style></head><body><h1>CSS Preview</h1><p>The CSS was injected successfully.</p></body></html>`;
    } else {
      // JavaScript / React support with Babel standalone
      const cleanCode = code
        .replace(/import .* from .*/g, '')
        .replace(/export default /g, '')
        .replace(/export /g, '');

      srcDoc = `<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>body { padding: 16px; font-family: system-ui, sans-serif; background: #ffffff; color: #000; }</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-presets="react">
      try {
        ${cleanCode}
        
        // Auto-mount if App is defined but not explicitly mounted
        setTimeout(() => {
          const rootNode = document.getElementById('root');
          if (!rootNode.hasChildNodes() && typeof App !== 'undefined') {
             const root = ReactDOM.createRoot(rootNode);
             root.render(React.createElement(App));
          }
          lucide.createIcons();
        }, 100);
      } catch(err) {
        document.getElementById('root').innerHTML = '<div style="color:red; font-family:monospace; padding: 20px;"><b>Render Error:</b> ' + err.toString() + '</div>';
      }
    </script>
  </body>
</html>`;
    }
  }

  return (
    <div className={`
      ${isMobile ? 'fixed inset-0 z-50' : 'relative w-[50%] min-w-[500px] border-l border-[#444746]'}
      bg-[#1e1f20] h-full flex flex-col font-sans transition-all duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]
    `}>
      {/* Header */}
      <div className="h-[52px] border-b border-[#444746] flex items-center justify-between px-4 bg-[#131314] shrink-0">
        <div className="flex gap-2 bg-[#282a2c] p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === 'preview' ? 'bg-[#444746] text-white shadow-sm' : 'text-[#a1a3a6] hover:text-white'
            }`}
          >
            <Play size={14} /> Preview
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === 'code' ? 'bg-[#444746] text-white shadow-sm' : 'text-[#a1a3a6] hover:text-white'
            }`}
          >
            <Code size={14} /> Code
          </button>
          {previousArtifact && previousArtifact.language === activeArtifact.language && (
            <button 
              onClick={() => setActiveTab('changes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                activeTab === 'changes' ? 'bg-[#444746] text-white shadow-sm' : 'text-[#a1a3a6] hover:text-white'
              }`}
            >
              <Diff size={14} /> Changes
            </button>
          )}
        </div>
        <button 
          onClick={() => setActiveArtifact(null)}
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#282a2c] text-[#a1a3a6] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' ? (
          isWebDev ? (
            <iframe 
               title="Preview"
               srcDoc={srcDoc}
               className="w-full h-full border-none bg-white"
               sandbox="allow-scripts allow-modals"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#a1a3a6] flex-col gap-4 bg-[#131314]">
              <Play size={48} className="opacity-20" />
              <p>Preview not available for {language}</p>
              <button onClick={() => setActiveTab('code')} className="px-4 py-2 bg-gemini-surface rounded-full text-sm">View Code Instead</button>
            </div>
          )
        ) : activeTab === 'code' ? (
          <div className="w-full h-full overflow-auto bg-[#1e1f20] p-6 custom-scrollbar">
            <pre className="font-mono text-[14px] leading-[1.6] text-[#e8eaed]"><code>{code}</code></pre>
          </div>
        ) : (
          <div className="w-full h-full overflow-auto bg-[#1e1f20] p-6 flex custom-scrollbar">
            <div className="w-1/2 border-r border-[#444746] pr-4">
              <div className="text-[12px] text-[#a1a3a6] font-mono mb-4 pb-2 border-b border-[#444746]">PREVIOUS VERSION</div>
              <pre className="font-mono text-[13px] leading-[1.6] text-[#f18c8e] opacity-80 whitespace-pre-wrap word-break"><code>{previousArtifact?.code}</code></pre>
            </div>
            <div className="w-1/2 pl-4">
              <div className="text-[12px] text-[#a1a3a6] font-mono mb-4 pb-2 border-b border-[#444746]">NEW VERSION</div>
              <pre className="font-mono text-[13px] leading-[1.6] text-[#81c995] whitespace-pre-wrap word-break"><code>{code}</code></pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
