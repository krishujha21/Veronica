import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import TopBar from './components/TopBar';
import LeftRail from './components/LeftRail';
import CenterPanel from './components/CenterPanel';
import ArtifactCanvas from './components/ArtifactCanvas';
import CommandPalette from './components/CommandPalette';
import CallMode from './components/CallMode';

import AuthWrapper from './pages/AuthWrapper';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isMobile, rightPanelOpen, activeArtifact, isAuthenticated, authLoading } = useAppContext();

  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-[#0e0e10] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-blue-500 animate-spin" size={48} />
        <p className="text-white/50 animate-pulse">Initializing Veronica...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gemini-bg text-gemini-text font-sans overflow-hidden">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* The Sidebar Drawer */}
        <LeftRail isOpen={rightPanelOpen} />
        
        {/* Main Stage */}
        <div className="flex-1 relative overflow-hidden flex justify-center">
           <CenterPanel />
        </div>
        
        {/* Artifacts Side Canvas */}
        {activeArtifact && <ArtifactCanvas />}

        {/* Global Overlays */}
        <CommandPalette />
        <CallMode />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
