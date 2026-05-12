const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  loadData: () => ipcRenderer.invoke('app:load'),
  saveData: data => ipcRenderer.invoke('app:save', data),
  getDataPath: () => ipcRenderer.invoke('app:get-data-path'),
});
