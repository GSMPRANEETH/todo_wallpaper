import React from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Target } from 'lucide-react';

export const DailyIntent: React.FC = () => {
  const { dailyIntent, setDailyIntent, getFocusProgress } = useTaskStore();
  const progress = getFocusProgress();

  return (
    <div className="glass-panel">
      <div className="panel-title">
        <span>PRIMARY OBJECTIVE</span>
        <Target size={14} />
      </div>
      <input
        type="text"
        className="intent-input"
        value={dailyIntent}
        onChange={(e) => setDailyIntent(e.target.value)}
        placeholder="Enter core objective..."
      />
      {dailyIntent && (
        <div className="focus-progress-container">
          <div className="focus-bar">
            <div className="focus-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
            PROGRESS: {progress}%
          </div>
        </div>
      )}
    </div>
  );
};
