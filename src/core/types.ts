export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
}

export interface Shortcut {
  id: string;
  label: string;
  url: string;
}

export interface UserPreferences {
  visibleModules: {
    clock: boolean;
    intent: boolean;
    stats: boolean;
    pomodoro: boolean;
    launcher: boolean;
    scratchpad: boolean;
    tasks: boolean;
  };
  moduleOrder: string[];
  shortcuts: Shortcut[];
  glassOpacity: number;
  glassBlur: number;
  accentColor: string;
  position: { x: number; y: number };
}
