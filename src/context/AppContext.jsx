import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { tasksAPI, weatherAPI, authAPI } from '../api/client';

const AppContext = createContext();

export function AppProvider({ children }) {
  // ─── Auth State ──────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Mobile / Breakpoint state ──────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 640 && window.innerWidth < 1024);

  // ─── Persistent State ───────────────────────────────────────────────────
  const [threads, setThreads] = useLocalStorage('veronica_threads_v3', []);
  const [activeThreadId, setActiveThreadId] = useLocalStorage('veronica_active_thread', null);
  const [notes, setNotes] = useLocalStorage('veronica_notes', '');
  const [preferredModel, setPreferredModel] = useLocalStorage('veronica_preferred_model', 'groq');
  const [persona, setPersona] = useLocalStorage('veronica_persona', 'default');
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorage('veronica_custom_prompt', '');
  const [temperature, setTemperature] = useLocalStorage('veronica_temperature', 0.7);
  const [theme, setTheme] = useLocalStorage('veronica_theme', 'gemini');

  // ─── UI State ──────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelView, setRightPanelView] = useState('overview');
  const [activeNav, setActiveNav] = useState('chat');
  const [activeArtifact, setActiveArtifactState] = useState(null);
  const [previousArtifact, setPreviousArtifact] = useState(null);
  const [callModeOpen, setCallModeOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // ─── Live Data State ────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [weather, setWeather] = useState(null);

  // Compute active messages from threads
  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread ? activeThread.messages : [];

  const clearHistory = () => {
    setActiveThreadId(null);
  };

  // ─── Auth Actions ───────────────────────────────────────────────────────
  const login = (userData, token) => {
    localStorage.setItem('veronica_auth_token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('veronica_auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('veronica_auth_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    try {
      const res = await authAPI.getMe();
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      logout();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ─── Data Fetching ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      tasksAPI.list()
        .then(res => setTasks(res.data.tasks || []))
        .catch(() => {});
      
      weatherAPI.get()
        .then(res => setWeather(res.data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Intercept setActiveArtifact to save history
  const setActiveArtifact = (artifact) => {
    if (activeArtifact && artifact && activeArtifact.code !== artifact.code) {
      setPreviousArtifact(activeArtifact);
    }
    setActiveArtifactState(artifact);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Theme Applier
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  return (
    <AppContext.Provider value={{
      user, isAuthenticated, authLoading, login, logout,
      isMobile, isTablet,
      threads, setThreads,
      activeThreadId, setActiveThreadId,
      messages, clearHistory,
      preferredModel, setPreferredModel,
      persona, setPersona,
      customSystemPrompt, setCustomSystemPrompt,
      temperature, setTemperature,
      theme, setTheme,
      isLoading, setIsLoading,
      isRecording, setIsRecording,
      rightPanelOpen, setRightPanelOpen,
      rightPanelView, setRightPanelView,
      activeNav, setActiveNav,
      activeArtifact, setActiveArtifact,
      previousArtifact,
      callModeOpen, setCallModeOpen,
      commandPaletteOpen, setCommandPaletteOpen,
      notes, setNotes,
      tasks, setTasks,
      weather,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
