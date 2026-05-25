import './App.css';
import { useTaskStore } from './store/useTaskStore';
import { TodoWidget } from './components/TodoWidget';
import { PomodoroTimer } from './components/PomodoroTimer';
import { DailyIntent } from './components/DailyIntent';
import { SystemMonitor } from './components/SystemMonitor';
import { Scratchpad } from './components/Scratchpad';
import { AppLauncher } from './components/AppLauncher';
import { SettingsPanel } from './components/SettingsPanel';
import { ClockWidget } from './components/ClockWidget';
import { Settings as SettingsIcon } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const appWindow = getCurrentWebviewWindow();

function App() {
  const { preferences, isSettingsOpen, setSettingsOpen, loadAppData, setPosition } = useTaskStore();
  const { visibleModules, moduleOrder, accentColor, glassOpacity, glassBlur, position } = preferences;
  
  const [currentPos, setCurrentPos] = useState({ x: 1400, y: 50 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    loadAppData();
  }, []);

  useEffect(() => {
    if (position.x !== -1) {
      setCurrentPos(position);
    }
  }, [position]);

  // CRITICAL: Robust click-through management
  const setInteractive = (interactive: boolean) => {
    if (isDraggingRef.current) return;
    invoke('set_clickthrough', { ignore: !interactive });
  };

  const handleDragStart = async (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      isDraggingRef.current = true;
      // We must be interactive while dragging
      await invoke('set_clickthrough', { ignore: false });
      
      // Native dragging handles everything perfectly
      await appWindow.startDragging();
      
      // After native drag finishes, sync the final position
      const pos = await appWindow.innerPosition();
      const scale = await appWindow.scaleFactor();
      const x = pos.x / scale;
      const y = pos.y / scale;
      
      setPosition(x, y);
      isDraggingRef.current = false;
      // Re-evaluate mouse position to set transparency
      const mouseIn = document.querySelector('.command-center:hover');
      if (!mouseIn) invoke('set_clickthrough', { ignore: true });
    }
  };

  const renderModule = (id: string) => {
    if (!visibleModules[id as keyof typeof visibleModules]) return null;
    
    switch (id) {
      case 'clock': return <ClockWidget key={id} />;
      case 'stats': return <SystemMonitor key={id} />;
      case 'pomodoro': return <PomodoroTimer key={id} />;
      case 'intent': return <DailyIntent key={id} />;
      case 'launcher': return <AppLauncher key={id} />;
      case 'scratchpad': return <Scratchpad key={id} />;
      case 'tasks': return <TodoWidget key={id} />;
      default: return null;
    }
  };

  const dynamicStyles = {
    '--glass-bg-opacity': glassOpacity,
    '--glass-blur-px': `${glassBlur}px`,
    '--accent-primary': accentColor,
    left: `${currentPos.x}px`,
    top: `${currentPos.y}px`,
  } as React.CSSProperties;

  return (
    <div className="ghost-canvas">
      <div 
        className="command-center" 
        style={dynamicStyles}
        onMouseEnter={() => setInteractive(true)}
        onMouseLeave={() => setInteractive(false)}
      >
        {/* Absolute Drag Bar */}
        <div className="command-bar" onMouseDown={handleDragStart}>
          <button className="settings-trigger" onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}>
            <SettingsIcon size={14} />
          </button>
        </div>

        {moduleOrder.map(id => renderModule(id))}
        
        {isSettingsOpen && <SettingsPanel />}

        <div className="version-tag">
          COMMAND CENTER v2.0 • ABSOLUTE EDITION
        </div>
      </div>
    </div>
  );
}

export default App;
