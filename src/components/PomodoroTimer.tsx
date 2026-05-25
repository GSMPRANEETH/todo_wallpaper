import React, { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Play, Pause, Coffee, Focus, Timer } from 'lucide-react';

export const PomodoroTimer: React.FC = () => {
  const { pomodoro, tick, toggleTimer, setMode } = useTaskStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (pomodoro.isRunning) {
      intervalRef.current = window.setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pomodoro.isRunning, tick]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isFocus = pomodoro.mode === 'focus';
  const glowClass = pomodoro.isRunning ? (isFocus ? 'glowing-coral' : 'glowing-emerald') : '';

  return (
    <div className={`glass-panel timer-container ${glowClass}`}>
      <div className="panel-title" style={{ width: '100%', marginBottom: '1rem' }}>
        <span>{isFocus ? 'FOCUS SESSION' : 'BREAK TIME'}</span>
        <Timer size={14} />
      </div>

      <div className="timer-display" style={{ color: isFocus ? 'var(--accent-coral)' : 'var(--accent-emerald)' }}>
        {formatTime(pomodoro.timeLeft)}
      </div>

      <div className="timer-controls">
        <button 
          className={`btn-icon ${pomodoro.mode === 'focus' ? 'active' : ''}`}
          onClick={() => setMode('focus')}
        >
          <Focus size={18} />
        </button>
        <button 
          className={`btn-icon primary`}
          onClick={toggleTimer}
          style={{ background: isFocus ? 'var(--accent-coral)' : 'var(--accent-emerald)' }}
        >
          {pomodoro.isRunning ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button 
          className={`btn-icon ${pomodoro.mode === 'shortBreak' ? 'active' : ''}`}
          onClick={() => setMode('shortBreak')}
        >
          <Coffee size={18} />
        </button>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.6 }}>
        Daily Goal: {pomodoro.sessionsCompleted} / {pomodoro.targetSessions} sessions
      </div>
    </div>
  );
};
