import React from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { PenTool } from 'lucide-react';

export const Scratchpad: React.FC = () => {
  const { scratchpad, setScratchpad } = useTaskStore();

  return (
    <div className="glass-panel scratchpad-container cozy">
      <div className="panel-title">
        <span>COZY SCRATCHPAD</span>
        <PenTool size={16} />
      </div>
      <textarea
        className="scratchpad-area cozy-font"
        value={scratchpad}
        onChange={(e) => setScratchpad(e.target.value)}
        placeholder="Pour your thoughts here..."
      />
      <div className="cozy-footer">Auto-saved for your next session</div>
    </div>
  );
};
