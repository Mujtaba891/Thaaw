/**
 * THAAW Browser — Context Menu Preload Bridge
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('contextMenuAPI', {
  onSetItems: (callback: (items: any[]) => void) => {
    ipcRenderer.on('context-menu:set-items', (_e, items) => callback(items));
  },
  selectAction: (actionId: string) => {
    ipcRenderer.send('context-menu:select-action', actionId);
  },
  resize: (width: number, height: number) => {
    ipcRenderer.send('context-menu:resize', { width, height });
  },
  close: () => {
    ipcRenderer.send('context-menu:close');
  }
});
