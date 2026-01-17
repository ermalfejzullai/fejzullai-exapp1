import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  registerAdmin: (credentials) => ipcRenderer.invoke('register-admin', credentials),
  checkUsersExist: () => ipcRenderer.invoke('check-users-exist'),
  getRates: () => ipcRenderer.invoke('get-rates'),
  updateRates: (data) => ipcRenderer.invoke('update-rates', data),
  saveTransaction: (data) => ipcRenderer.invoke('save-transaction', data),
  getTransactions: (filters) => ipcRenderer.invoke('get-transactions', filters),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  printInvoice: (html) => ipcRenderer.invoke('print-invoice', html)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
