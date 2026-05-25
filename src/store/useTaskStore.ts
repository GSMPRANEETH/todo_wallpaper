import { create } from 'zustand';
import { Task, UserPreferences, Priority, Shortcut } from '../core/types';
import { StorageProvider } from '../core/StorageProvider';
import { TauriStoreProvider } from '../services/TauriStoreProvider';
import { invoke } from '@tauri-apps/api/core';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  mode: PomodoroMode;
  sessionsCompleted: number;
  targetSessions: number;
}

interface ProcessInfo {
  name: String;
  cpu_usage: number;
  memory: number;
}

interface SystemStats {
  cpu_usage: number;
  memory_used: number;
  memory_total: number;
  net_down: number;
  net_up: number;
  top_processes: ProcessInfo[];
}

const DEFAULT_PREFERENCES: UserPreferences = {
  visibleModules: {
    clock: true,
    intent: true,
    stats: true,
    pomodoro: true,
    launcher: true,
    scratchpad: true,
    tasks: true,
  },
  moduleOrder: ['clock', 'stats', 'pomodoro', 'intent', 'launcher', 'scratchpad', 'tasks'],
  shortcuts: [
    { id: '1', label: 'Web', url: 'https://google.com' },
    { id: '2', label: 'GitHub', url: 'https://github.com' },
    { id: '3', label: 'YouTube', url: 'https://youtube.com' },
    { id: '4', label: 'Gmail', url: 'https://gmail.com' },
    { id: '5', label: 'Discord', url: 'https://discord.com' },
    { id: '6', label: 'ChatGPT', url: 'https://chat.openai.com' },
  ],
  glassOpacity: 0.45,
  glassBlur: 40,
  accentColor: '#6366f1',
  position: { x: -1, y: -1 } // -1 means default/unset
};

interface TaskState {
  tasks: Task[];
  dailyIntent: string;
  scratchpad: string;
  pomodoro: PomodoroState;
  stats: SystemStats | null;
  preferences: UserPreferences;
  provider: StorageProvider;
  isLoading: boolean;
  isSettingsOpen: boolean;
  isAutostartEnabled: boolean;
  
  // Actions
  loadAppData: () => Promise<void>;
  addTask: (title: string, priority?: Priority) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setDailyIntent: (intent: string) => Promise<void>;
  setScratchpad: (text: string) => Promise<void>;
  setSettingsOpen: (isOpen: boolean) => void;
  
  // Customization Actions
  toggleModule: (module: keyof UserPreferences['visibleModules']) => Promise<void>;
  updateShortcuts: (shortcuts: Shortcut[]) => Promise<void>;
  updateModuleOrder: (newOrder: string[]) => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  setPosition: (x: number, y: number) => Promise<void>;
  toggleAutostart: () => Promise<void>;
  
  // Pomodoro Actions
  tick: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: PomodoroMode) => void;

  // System Stats
  updateStats: () => Promise<void>;

  // Calculated
  getFocusProgress: () => number;
}

const MODE_TIMES: Record<PomodoroMode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  dailyIntent: '',
  scratchpad: '',
  pomodoro: {
    timeLeft: MODE_TIMES.focus,
    isRunning: false,
    mode: 'focus',
    sessionsCompleted: 0,
    targetSessions: 4,
  },
  stats: null,
  preferences: DEFAULT_PREFERENCES,
  provider: new TauriStoreProvider(),
  isLoading: false,
  isSettingsOpen: false,
  isAutostartEnabled: false,

  loadAppData: async () => {
    set({ isLoading: true });
    const tasks = await get().provider.getTasks();
    const dailyIntent = await get().provider.getValue('dailyIntent', '');
    const scratchpad = await get().provider.getValue('scratchpad', '');
    
    // Merge loaded preferences with defaults to handle version upgrades
    const loadedPrefs = await get().provider.getValue('preferences', DEFAULT_PREFERENCES);
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...loadedPrefs,
      visibleModules: { ...DEFAULT_PREFERENCES.visibleModules, ...loadedPrefs?.visibleModules }
    };

    if (preferences.position.x !== -1) {
      await invoke('set_widget_position', { x: Math.round(preferences.position.x), y: Math.round(preferences.position.y) });
    }

    const sessionsCompleted = await get().provider.getValue('sessionsCompleted', 0);
    const autostart = await isEnabled();
    set({ 
      tasks, 
      dailyIntent, 
      scratchpad, 
      preferences, 
      isAutostartEnabled: autostart, 
      isLoading: false,
      pomodoro: { ...get().pomodoro, sessionsCompleted }
    });
  },

  addTask: async (title: string, priority: Priority = 'low') => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
      priority,
    };
    const updatedTasks = [...get().tasks, newTask];
    set({ tasks: updatedTasks });
    await get().provider.saveTasks(updatedTasks);
  },

  toggleTask: async (id: string) => {
    const updatedTasks = get().tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    set({ tasks: updatedTasks });
    await get().provider.saveTasks(updatedTasks);
  },

  deleteTask: async (id: string) => {
    const updatedTasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks: updatedTasks });
    await get().provider.saveTasks(updatedTasks);
  },

  setDailyIntent: async (dailyIntent: string) => {
    set({ dailyIntent });
    await get().provider.setValue('dailyIntent', dailyIntent);
  },

  setScratchpad: async (scratchpad: string) => {
    set({ scratchpad });
    await get().provider.setValue('scratchpad', scratchpad);
  },

  setSettingsOpen: (isSettingsOpen: boolean) => set({ isSettingsOpen }),

  toggleModule: async (module) => {
    const prefs = { ...get().preferences };
    prefs.visibleModules[module] = !prefs.visibleModules[module];
    set({ preferences: prefs });
    await get().provider.setValue('preferences', prefs);
  },

  updateShortcuts: async (shortcuts) => {
    const prefs = { ...get().preferences, shortcuts };
    set({ preferences: prefs });
    await get().provider.setValue('preferences', prefs);
  },

  updateModuleOrder: async (moduleOrder) => {
    const prefs = { ...get().preferences, moduleOrder };
    set({ preferences: prefs });
    await get().provider.setValue('preferences', prefs);
  },

  updatePreference: async (key, value) => {
    const prefs = { ...get().preferences, [key]: value };
    set({ preferences: prefs });
    await get().provider.setValue('preferences', prefs);
  },

  setPosition: async (x: number, y: number) => {
    const prefs = { ...get().preferences, position: { x, y } };
    set({ preferences: prefs });
    await get().provider.setValue('preferences', prefs);
    await invoke('set_widget_position', { x: Math.round(x), y: Math.round(y) });
  },

  toggleAutostart: async () => {
    const currentlyEnabled = await isEnabled();
    if (currentlyEnabled) {
      await disable();
    } else {
      await enable();
    }
    set({ isAutostartEnabled: !currentlyEnabled });
  },

  tick: async () => {
    const {timeLeft, isRunning, mode, sessionsCompleted} = get().pomodoro;
    if (!isRunning) return;
    
    if (timeLeft <= 0) {
      const newCount = mode === 'focus' ? sessionsCompleted + 1 : sessionsCompleted;
      set((state) => ({ 
        pomodoro: { ...state.pomodoro, isRunning: false, timeLeft: 0, sessionsCompleted: newCount } 
      }));
      
      if (mode === 'focus') {
        await get().provider.setValue('sessionsCompleted', newCount);
      }

      const permission = await isPermissionGranted();
      if (!permission) {
        await requestPermission();
      }
      sendNotification({
        title: mode === 'focus' ? 'Focus Session Complete!' : 'Break Over!',
        body: mode === 'focus' ? 'Time for a short break.' : 'Back to work!',
        icon: 'icon.png'
      });
      return;
    }
    set((state) => ({ pomodoro: { ...state.pomodoro, timeLeft: timeLeft - 1 } }));
  },

  toggleTimer: () => {
    set((state) => ({ pomodoro: { ...state.pomodoro, isRunning: !state.pomodoro.isRunning } }));
  },

  resetTimer: () => {
    const mode = get().pomodoro.mode;
    set((state) => ({ 
      pomodoro: { 
        ...state.pomodoro, 
        isRunning: false, 
        timeLeft: MODE_TIMES[mode] 
      } 
    }));
  },

  setMode: (mode: PomodoroMode) => {
    set((state) => ({ 
      pomodoro: { 
        ...state.pomodoro, 
        mode, 
        isRunning: false, 
        timeLeft: MODE_TIMES[mode] 
      } 
    }));
  },

  updateStats: async () => {
    try {
      const stats = await invoke<SystemStats>('get_system_stats');
      set({ stats });
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  },

  getFocusProgress: () => {
    const { tasks } = get();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }
}));
