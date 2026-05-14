import { AppData } from './types';

export interface BackupInfo {
  name: string;
  date: string;
  size: number;
  mtime: number;
}

export type ImportExportResult =
  | { ok: true; data?: AppData; path?: string }
  | { ok: false; error?: string; cancelled?: boolean };

export interface ElectronAPI {
  isElectron: true;

  loadData: () => Promise<AppData | null>;
  saveData: (data: AppData) => Promise<boolean>;

  getDataPath: () => Promise<string>;
  getDataDir: () => Promise<string>;
  getMirrorPath: () => Promise<string>;
  openDataFolder: () => Promise<boolean>;

  listBackups: () => Promise<BackupInfo[]>;
  restoreBackup: (
    name: string
  ) => Promise<{ ok: boolean; data?: AppData; error?: string }>;
  createBackupNow: () => Promise<{ ok: boolean; error?: string }>;

  exportData: () => Promise<ImportExportResult>;
  importData: () => Promise<ImportExportResult>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
