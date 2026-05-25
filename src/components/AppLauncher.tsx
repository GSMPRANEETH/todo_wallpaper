import React, { useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Globe, Mail, MessageCircle, Code2, LayoutGrid, Play, Pencil, Plus, Trash2, Check, X, Monitor } from 'lucide-react';
import { openUrl, openPath } from '@tauri-apps/plugin-opener';
import { Shortcut } from '../core/types';

const getIcon = (url: string, label: string) => {
  const l = label.toLowerCase();
  const u = url.toLowerCase();
  if (l.includes('github') || u.includes('github')) return <LayoutGrid size={20} />;
  if (l.includes('youtube') || u.includes('youtube')) return <Play size={20} />;
  if (l.includes('gmail') || u.includes('gmail') || l.includes('mail')) return <Mail size={20} />;
  if (l.includes('discord') || u.includes('discord')) return <MessageCircle size={20} />;
  if (l.includes('chatgpt') || u.includes('openai')) return <Code2 size={20} />;
  if (u.includes('http')) return <Globe size={20} />;
  return <Monitor size={20} />;
};

export const AppLauncher: React.FC = () => {
  const { preferences, updateShortcuts } = useTaskStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const handleOpen = async (s: Shortcut) => {
    try {
      if (s.url.startsWith('http')) {
        await openUrl(s.url);
      } else {
        await openPath(s.url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (s: Shortcut) => {
    setEditingId(s.id);
    setEditLabel(s.label);
    setEditUrl(s.url);
  };

  const saveEdit = () => {
    if (editingId) {
      let newShortcuts;
      if (editingId.startsWith('new')) {
        const newShortcut: Shortcut = { id: crypto.randomUUID(), label: editLabel, url: editUrl };
        newShortcuts = [...preferences.shortcuts, newShortcut];
      } else {
        newShortcuts = preferences.shortcuts.map(s => 
          s.id === editingId ? { ...s, label: editLabel, url: editUrl } : s
        );
      }
      updateShortcuts(newShortcuts);
      setEditingId(null);
    }
  };

  const deleteShortcut = (id: string) => {
    updateShortcuts(preferences.shortcuts.filter(s => s.id !== id));
    setEditingId(null);
  };

  return (
    <div className="glass-panel">
      <div className="panel-title">
        <span>QUICK ACCESS</span>
        <Plus size={14} style={{ cursor: 'pointer' }} onClick={() => startEdit({ id: 'new-' + Date.now(), label: '', url: '' })} />
      </div>
      
      <div className="launcher-grid">
        {preferences.shortcuts.map((s) => (
          <div key={s.id} className="launcher-item" onClick={() => handleOpen(s)}>
            <div className="launcher-icon">{getIcon(s.url, s.label)}</div>
            <div className="launcher-label">{s.label}</div>
            <div className="launcher-edit-btn" onClick={(e) => { e.stopPropagation(); startEdit(s); }}>
              <Pencil size={10} color="white" />
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="settings-overlay" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="glass-panel" style={{ width: '300px' }}>
            <div className="panel-title">EDIT SHORTCUT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
              <input 
                className="settings-input" 
                value={editLabel} 
                onChange={e => setEditLabel(e.target.value)} 
                placeholder="Name"
              />
              <input 
                className="settings-input" 
                value={editUrl} 
                onChange={e => setEditUrl(e.target.value)} 
                placeholder="URL or App Path"
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-icon primary flex-grow" onClick={saveEdit}><Check size={18} /></button>
                <button className="btn-icon" onClick={() => setEditingId(null)}><X size={18} /></button>
                {!editingId.startsWith('new') && (
                  <button className="btn-icon" onClick={() => deleteShortcut(editingId)} style={{ background: 'rgba(239,68,68,0.2)' }}>
                    <Trash2 size={18} color="#ef4444" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
