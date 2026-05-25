import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { X, Plus, Trash2, Globe, Settings, Eye, EyeOff, MonitorUp, GripVertical, Palette, Layers } from 'lucide-react';
import { Shortcut } from '../core/types';
import { exit } from '@tauri-apps/plugin-process';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export const SettingsPanel: React.FC = () => {
  const { 
    preferences, toggleModule, updateShortcuts, setSettingsOpen, 
    isAutostartEnabled, toggleAutostart, updateModuleOrder, updatePreference 
  } = useTaskStore();
  
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [draggedIndex, setDragIndex] = useState<number | null>(null);

  const handleAddShortcut = () => {
    if (newLabel && newUrl) {
      const newShortcut: Shortcut = {
        id: crypto.randomUUID(),
        label: newLabel,
        url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
      };
      updateShortcuts([...preferences.shortcuts, newShortcut]);
      setNewLabel('');
      setNewUrl('');
    }
  };

  const handleDeleteShortcut = (id: string) => {
    updateShortcuts(preferences.shortcuts.filter(s => s.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...preferences.moduleOrder];
    const item = newOrder.splice(draggedIndex, 1)[0];
    newOrder.splice(index, 0, item);
    
    setDragIndex(index);
    updateModuleOrder(newOrder);
  };

  return (
    <div className="settings-overlay">
      <div className="glass-panel settings-panel">
        <div className="settings-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>PREFERENCES</h2>
          </div>
          <button className="btn-icon" onClick={() => setSettingsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <div className="settings-subtitle">
            <Palette size={12} style={{ marginRight: '4px' }} /> VISUALS
          </div>
          <div className="settings-row">
            <span style={{ fontSize: '0.85rem' }}>Opacity</span>
            <input 
              type="range" min="0.1" max="0.9" step="0.05" 
              value={preferences.glassOpacity}
              onChange={(e) => updatePreference('glassOpacity', parseFloat(e.target.value))}
              className="settings-slider"
            />
          </div>
          <div className="settings-row">
            <span style={{ fontSize: '0.85rem' }}>Blur</span>
            <input 
              type="range" min="0" max="100" step="1" 
              value={preferences.glassBlur}
              onChange={(e) => updatePreference('glassBlur', parseInt(e.target.value))}
              className="settings-slider"
            />
          </div>
          <div className="settings-row">
            <span style={{ fontSize: '0.85rem' }}>Accent</span>
            <input 
              type="color" 
              value={preferences.accentColor}
              onChange={(e) => updatePreference('accentColor', e.target.value)}
              style={{ background: 'none', border: 'none', width: '30px', height: '30px', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Reordering Section */}
        <div className="settings-section">
          <div className="settings-subtitle">
            <Layers size={12} style={{ marginRight: '4px' }} /> MODULE ORDER (Drag to move)
          </div>
          <div className="reorder-list">
            {preferences.moduleOrder.map((id, index) => (
              <div 
                key={id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={() => setDragIndex(null)}
                className={`reorder-item ${draggedIndex === index ? 'dragging' : ''}`}
              >
                <GripVertical size={14} style={{ opacity: 0.3 }} />
                <span style={{ textTransform: 'capitalize', flexGrow: 1 }}>{id}</span>
                <div onClick={() => toggleModule(id as any)} style={{ cursor: 'pointer', opacity: preferences.visibleModules[id as keyof typeof preferences.visibleModules] ? 1 : 0.3 }}>
                  {preferences.visibleModules[id as keyof typeof preferences.visibleModules] ? <Eye size={16} /> : <EyeOff size={16} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="settings-section">
          <div className="settings-subtitle">
            <Globe size={12} style={{ marginRight: '4px' }} /> SHORTCUTS
          </div>
          <div className="shortcut-editor-list">
            {preferences.shortcuts.map(s => (
              <div key={s.id} className="shortcut-edit-item">
                <div style={{ flexGrow: 1, fontSize: '0.85rem' }}>{s.label}</div>
                <button className="delete-button" onClick={() => handleDeleteShortcut(s.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="add-shortcut-form">
            <input 
              type="text" placeholder="Label" value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="settings-input"
            />
            <input 
              type="text" placeholder="URL" value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="settings-input"
            />
            <button className="btn-icon primary" onClick={handleAddShortcut} style={{ width: '100%' }}>
              <Plus size={18} /> Add Shortcut
            </button>
          </div>
        </div>

        {/* Automation Section */}
        <div className="settings-section" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div 
            className={`module-toggle-item ${isAutostartEnabled ? 'active' : ''}`}
            onClick={toggleAutostart}
            style={{ width: '100%', opacity: 1 }}
          >
            <MonitorUp size={16} />
            <span style={{ flexGrow: 1 }}>Launch at Startup</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button className="btn-icon" onClick={async () => { await getCurrentWebviewWindow().hide() }} style={{ flexGrow: 1 }}>
              Hide
            </button>
            <button className="btn-icon" onClick={async () => { await exit(0) }} style={{ flexGrow: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              Quit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
