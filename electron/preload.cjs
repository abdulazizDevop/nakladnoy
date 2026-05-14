const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  // Базовые операции
  loadData: () => ipcRenderer.invoke('app:load'),
  saveData: data => ipcRenderer.invoke('app:save', data),

  // Служебные пути
  getDataPath: () => ipcRenderer.invoke('app:get-data-path'),
  getDataDir: () => ipcRenderer.invoke('app:get-data-dir'),
  getMirrorPath: () => ipcRenderer.invoke('app:get-mirror-path'),
  openDataFolder: () => ipcRenderer.invoke('app:open-data-folder'),

  // Бекапы
  listBackups: () => ipcRenderer.invoke('app:list-backups'),
  restoreBackup: name => ipcRenderer.invoke('app:restore-backup', name),
  createBackupNow: () => ipcRenderer.invoke('app:create-backup-now'),

  // Экспорт / импорт
  exportData: () => ipcRenderer.invoke('app:export'),
  importData: () => ipcRenderer.invoke('app:import'),
});
