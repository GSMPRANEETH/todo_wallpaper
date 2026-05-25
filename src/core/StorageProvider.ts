import { Task } from './types';

export interface StorageProvider {
  getTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<void>;
  getValue<T>(key: string, defaultValue: T): Promise<T>;
  setValue<T>(key: string, value: T): Promise<void>;
}
