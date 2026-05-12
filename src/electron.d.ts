import { AppData } from './types';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      loadData: () => Promise<AppData | null>;
      saveData: (data: AppData) => Promise<boolean>;
      getDataPath: () => Promise<string>;
    };
  }
}

export {};
