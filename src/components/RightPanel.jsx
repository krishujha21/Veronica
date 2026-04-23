import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { chatAPI, tasksAPI } from '../api/client';
import { Trash2 } from 'lucide-react';

export default function RightPanel() {
  const { rightPanelOpen, rightPanelView, setRightPanelView, tasks, setTasks, notes, setNotes, isMobile } = useAppContext();
  const [stats, setStats] = useState(null);
  const [newTaskInput, setNewTaskInput] = useState('');

  useEffect(() => {
    let interval;
    if (rightPanelView === 'system' || rightPanelView === 'tasks') {
      const fetchStats = async () => {
        try {
          const res = await chatAPI.system();
          setStats(res.data);
        } catch (e) {}
      };
      fetchStats();
      interval = setInterval(fetchStats, 3000);
    }
    return () => clearInterval(interval);
  }, [rightPanelView]);

  if (!rightPanelOpen && !isMobile) return null;
  if (!rightPanelOpen && isMobile) return null; // Controlled by App directly on mobile via backdrop, but safe check

  const handleTaskSubmit = async (e) => {
    if (e.key === 'Enter' && newTaskInput.trim()) {
      e.preventDefault();
      try {
        const res = await tasksAPI.create(newTaskInput.trim());
        setTasks(prev => [res.data.task, ...prev]);
      } catch {
        // fallback: add locally
        setTasks(prev => [...prev, { id: Date.now(), text: newTaskInput.trim(), completed: false, priority: 'medium' }]);
      }
      setNewTaskInput('');
    }
  };

  const toggleTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    const newCompleted = !task?.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    try { await tasksAPI.toggle(id, newCompleted); } catch {}
  };

  const deleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try { await tasksAPI.remove(id); } catch {}
  };

  return (
    <div className={`
      ${isMobile ? 'fixed inset-y-[60px] right-0 w-[85%] border-l' : 'relative w-[320px]'} 
      h-full bg-hud-panel border-x border-hud-blue backdrop-blur-md shrink-0 z-40 transition-transform duration-300 flex flex-col corner-brackets shadow-[inset_0_0_20px_rgba(0,119,255,0.15)]
    `}>
      
      {/* HUD Panel Header */}
      <div className="h-[40px] border-b border-hud-line flex items-center justify-between bg-[rgba(0,243,255,0.05)] px-4 shrink-0 relative overflow-hidden">
        <div className="w-[100%] h-[1px] bg-hud-cyan absolute bottom-0 left-0 animate-[translateX_2s_linear_infinite]" style={{ transform: 'translateX(-100%)', width: '20%' }} />
        <span className="font-mono text-[12px] text-hud-cyan tracking-[3px] uppercase font-bold">
          {rightPanelView.toUpperCase()}
        </span>
        <div className="flex gap-3 relative z-10">
          <button onClick={() => setRightPanelView('overview')} className={`text-[10px] font-mono tracking-wider transition-colors ${rightPanelView === 'overview' ? 'text-hud-cyan' : 'text-[#4a829e] hover:text-hud-cyan'}`}>SYS</button>
          <button onClick={() => setRightPanelView('tasks')} className={`text-[10px] font-mono tracking-wider transition-colors ${rightPanelView === 'tasks' ? 'text-hud-cyan' : 'text-[#4a829e] hover:text-hud-cyan'}`}>TASKS</button>
          <button onClick={() => setRightPanelView('notes')} className={`text-[10px] font-mono tracking-wider transition-colors ${rightPanelView === 'notes' ? 'text-hud-cyan' : 'text-[#4a829e] hover:text-hud-cyan'}`}>NOTES</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

        {/* Radar Graphic (Fake telemetry) */}
        {(rightPanelView === 'overview' || rightPanelView === 'system') && (
          <div className="w-full aspect-square border border-hud-darkBlue rounded-full flex items-center justify-center relative overflow-hidden bg-[rgba(0,119,255,0.05)]">
            <div className="w-full h-[1px] bg-hud-darkBlue absolute" />
            <div className="w-[1px] h-full bg-hud-darkBlue absolute" />
            <div className="w-[80%] h-[80%] border border-hud-darkBlue rounded-full absolute" />
            <div className="w-[40%] h-[40%] border border-hud-darkBlue rounded-full absolute" />
            {/* The sweeping radar arm */}
            <div className="absolute w-[50%] h-[50%] top-0 right-0 origin-bottom-left animate-radar-sweep bg-[conic-gradient(from_0deg,rgba(0,243,255,0.4),transparent_60deg)]" />
            {/* Blips */}
            <div className="w-1.5 h-1.5 bg-hud-cyan rounded-full absolute top-[30%] right-[30%] animate-pulse shadow-[0_0_5px_#00f3ff]" />
            <div className="w-1 h-1 bg-[#ff003c] rounded-full absolute bottom-[40%] left-[20%] animate-[blink_2s_infinite] shadow-[0_0_5px_#ff003c]" />
          </div>
        )}

        {/* --- SYSTEM TELEMETRY BARS --- */}
        {stats && (rightPanelView === 'system' || rightPanelView === 'overview') && (
          <div className="flex flex-col gap-4 font-mono">
            <TelemetryBar label={`CPU_USAGE [${stats.cpu.cores}C]`} value={`${stats.cpu.usage.toFixed(1)}%`} pct={stats.cpu.usage} />
            <TelemetryBar label={`MEM_ALLOC [${stats.ram.total}GB]`} value={`${stats.ram.used.toFixed(1)}GB`} pct={(stats.ram.used/stats.ram.total)*100} />
            <TelemetryBar label="BTY_RESERVE" value={`${stats.battery.percent}%`} pct={stats.battery.percent} isWarning={stats.battery.percent < 20} />
            <div className="flex justify-between text-[11px] text-[#4a829e] border-t border-hud-darkBlue pt-2 mt-2">
               <span>SYS_UPTIME</span>
               <span>{stats.uptime}</span>
            </div>
          </div>
        )}

        {/* --- AUTONOMOUS TASKS --- */}
        {(rightPanelView === 'tasks' || rightPanelView === 'overview') && (
          <div className="flex flex-col font-mono">
            <div className="flex justify-between items-end border-b border-hud-darkBlue pb-1 mb-3">
              <span className="text-[10px] text-hud-cyan tracking-[2px]">ACTIVE_THREADS</span>
              <span className="text-[10px] text-[#4a829e]">[{tasks.filter(t=>!t.completed).length}]</span>
            </div>
            
            <input 
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyDown={handleTaskSubmit}
              placeholder="> INPUT_NEW_THREAD..."
              className="w-full bg-[rgba(0,119,255,0.05)] border border-hud-blue px-2 py-1.5 text-[11px] text-hud-text placeholder:text-[#4a829e] outline-none focus:border-hud-cyan focus:shadow-[inset_0_0_8px_rgba(0,243,255,0.2)] mb-4"
            />
            
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div key={task.id} className="flex gap-3 relative group items-start">
                  {/* Left indicator line */}
                  <div className={`w-[2px] h-full absolute -left-2 ${task.completed ? 'bg-hud-darkBlue' : 'bg-hud-cyan shadow-hud-glow'}`} />
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={`w-[12px] h-[12px] mt-0.5 border flex items-center justify-center shrink-0 transition-all ${
                      task.completed ? 'bg-hud-darkBlue border-hud-darkBlue' : 'border-hud-cyan bg-transparent hover:shadow-[0_0_8px_rgba(0,243,255,0.5)]'
                    }`}
                  >
                    {task.completed && <div className="w-[6px] h-[6px] bg-[#020205]" />}
                  </button>
                  <span className={`text-[12px] leading-[1.2] flex-1 ${task.completed ? 'text-[#4a829e] line-through decoration-[#003366]' : 'text-hud-text'}`}>
                    {task.text}
                  </span>
                  <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#4a829e] hover:text-red-500 shrink-0">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SMART NOTES / WORKSPACE --- */}
        {(rightPanelView === 'notes' || rightPanelView === 'overview') && (
          <div className="flex flex-col flex-1 min-h-[250px] font-mono mt-4">
            <div className="flex justify-between items-end border-b border-hud-darkBlue pb-1 mb-3 shrink-0">
              <span className="text-[10px] text-hud-cyan tracking-[2px]">SYS_WORKSPACE</span>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="> BEGIN_NOTES..."
              className="w-full flex-1 bg-[rgba(0,119,255,0.02)] border border-hud-blue px-3 py-3 text-[12px] text-hud-text placeholder:text-[#4a829e] outline-none focus:border-hud-cyan focus:shadow-[inset_0_0_15px_rgba(0,243,255,0.1)] custom-scrollbar resize-none leading-relaxed"
            />
          </div>
        )}

      </div>
    </div>
  );
}

function TelemetryBar({ label, value, pct, isWarning = false }) {
  const colorClass = isWarning ? 'bg-hud-crimson shadow-hud-error' : 'bg-hud-cyan shadow-hud-glow';
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-[#4a829e] tracking-wider">{label}</span>
        <span className="text-[10px] text-hud-text">{value}</span>
      </div>
      <div className="w-full h-[6px] bg-[rgba(0,119,255,0.1)] border border-hud-darkBlue flex">
        {/* Fill */}
        <div className={`h-full ${colorClass} transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
        {/* Scrubber artifact */}
        <div className="h-full w-[2px] bg-white opacity-50 animate-pulse" />
      </div>
    </div>
  );
}
