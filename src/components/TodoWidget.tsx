import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { Plus, Check, Trash2, ListChecks } from 'lucide-react';
import { Priority } from '../core/types';

export const TodoWidget: React.FC = () => {
  const { tasks, loadAppData, addTask, toggleTask, deleteTask, isLoading } = useTaskStore();
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<Priority>('low');

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      addTask(newTodo.trim(), priority);
      setNewTodo('');
    }
  };

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6366f1'
  };

  return (
    <div className="glass-panel tasks-panel">
      <div className="panel-title">
        <span>DIRECTIVES</span>
        <ListChecks size={14} />
      </div>

      <ul className="task-list">
        {tasks.sort((a, b) => {
          const p = { high: 3, medium: 2, low: 1 };
          return p[b.priority] - p[a.priority];
        }).map((task) => (
          <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
            <div 
              className={`checkbox-custom ${task.completed ? 'checked' : ''}`}
              onClick={() => toggleTask(task.id)}
            >
              {task.completed && <Check size={12} color="white" />}
            </div>
            <div className="task-content-wrapper">
              <div className="priority-indicator" style={{ background: priorityColors[task.priority] }} />
              <span className="task-text">{task.title}</span>
            </div>
            <button onClick={() => deleteTask(task.id)} className="delete-button">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {!isLoading && tasks.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
            NO ACTIVE DIRECTIVES
          </div>
        )}
      </ul>

      <div className="add-task-container">
        <div className="priority-tabs">
          {(['low', 'medium', 'high'] as Priority[]).map((p) => (
            <div 
              key={p} 
              className={`priority-tab ${p} ${priority === p ? 'active' : ''}`}
              onClick={() => setPriority(p)}
            >
              {p}
            </div>
          ))}
        </div>
        <form onSubmit={handleAdd} className="task-form">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Initialize new task..."
            className="task-input"
          />
          <button type="submit" className="btn-icon primary">
            <Plus size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
