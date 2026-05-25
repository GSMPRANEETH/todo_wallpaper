import React from 'react';
import { Crown } from 'lucide-react';

export const PremiumBanner: React.FC = () => {
  return (
    <div className="glass-panel premium-lock">
      <Crown size={16} color="#c084fc" />
      <div style={{ flexGrow: 1 }}>
        <div style={{ fontWeight: 600 }}>Pro Features</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Cloud Sync, Calendar & GitHub</div>
      </div>
      <span className="lock-badge">Upgrade</span>
    </div>
  );
};
