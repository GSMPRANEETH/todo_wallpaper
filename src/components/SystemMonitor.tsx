import React, { useEffect } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Cpu, HardDrive, ArrowDown, ArrowUp, Activity } from 'lucide-react';

export const SystemMonitor: React.FC = () => {
  const { stats, updateStats } = useTaskStore();

  useEffect(() => {
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [updateStats]);

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="glass-panel stats-container">
      <div className="panel-title">
        <span>SYSTEM TELEMETRY</span>
        <Activity size={14} />
      </div>

      <div className="telemetry-grid">
        <div className="stat-item">
          <Cpu size={14} color="#6366f1" />
          <div className="stat-info">
            <div className="stat-label">CPU</div>
            <div className="stat-value">{stats ? `${stats.cpu_usage.toFixed(1)}%` : '---'}</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: `${stats?.cpu_usage || 0}%`, background: '#6366f1' }} /></div>
          </div>
        </div>

        <div className="stat-item">
          <HardDrive size={14} color="#a855f7" />
          <div className="stat-info">
            <div className="stat-label">RAM</div>
            <div className="stat-value">{stats ? formatBytes(stats.memory_used) : '---'}</div>
            <div className="stat-bar"><div className="stat-fill" style={{ width: `${stats ? (Number(stats.memory_used) / Number(stats.memory_total)) * 100 : 0}%`, background: '#a855f7' }} /></div>
          </div>
        </div>
      </div>

      <div className="telemetry-grid" style={{ marginTop: '0.5rem' }}>
        <div className="net-stat">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowDown size={10} color="#34d399" /> DOWN
          </div>
          <div className="stat-value" style={{ fontSize: '0.8rem' }}>{stats ? `${stats.net_down.toFixed(2)} MB/s` : '0.00'}</div>
        </div>
        <div className="net-stat">
          <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ArrowUp size={10} color="#fb923c" /> UP
          </div>
          <div className="stat-value" style={{ fontSize: '0.8rem' }}>{stats ? `${stats.net_up.toFixed(2)} MB/s` : '0.00'}</div>
        </div>
      </div>

      <div className="process-list">
        <div className="stat-label" style={{ marginBottom: '4px', opacity: 0.5 }}>Top Processes</div>
        {stats?.top_processes.map((p, i) => (
          <div key={i} className="process-item">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>{p.name}</span>
            <span style={{ color: p.cpu_usage > 20 ? '#fb923c' : 'inherit' }}>{p.cpu_usage.toFixed(1)}%</span>
          </div>
        )) || <div className="process-item">Loading processes...</div>}
      </div>
    </div>
  );
};
