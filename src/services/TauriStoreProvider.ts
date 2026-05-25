import { load } from '@tauri-apps/plugin-store';
import { StorageProvider } from '../core/StorageProvider';
import { Task } from '../core/types';

export class TauriStoreProvider implements StorageProvider {
  private storePromise = load('app_data.json', { autoSave: true, defaults: {} });

  async getTasks(): Promise<Task[]> {
    const store = await this.storePromise;
    const tasks = await store.get<Task[]>('tasks');
    return tasks || [];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const store = await this.storePromise;
    await store.set('tasks', tasks);
    await store.save();
  }

  async getValue<T>(key: string, defaultValue: T): Promise<T> {
    const store = await this.storePromise;
    const val = await store.get<T>(key);
    return val ?? defaultValue;
  }

  async setValue<T>(key: string, value: T): Promise<void> {
    const store = await this.storePromise;
    await store.set(key, value);
    await store.save();
  }
}
