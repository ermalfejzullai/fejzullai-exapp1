import { ElectronAPI } from '@electron-toolkit/preload'
import { ExchangeRate, AppSettings } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      login: (credentials: any) => Promise<any>
  registerAdmin: (credentials: import('../shared/types').AuthCredentials) => Promise<{ success: boolean; message?: string }>;
  checkUsersExist: () => Promise<boolean>;
  getUsers: () => Promise<import('../shared/types').User[]>;
  addUser: (data: import('../shared/types').AuthCredentials & { adminId: number }) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (data: { userId: number; adminId: number }) => Promise<{ success: boolean; message?: string }>;
  clearTransactions: (data: { adminId: number }) => Promise<{ success: boolean; message?: string }>;
  getRates: () => Promise<import('../shared/types').ExchangeRate[]>;
      updateRates: (data: any) => Promise<any>
      saveTransaction: (data: any) => Promise<any>
      getTransactions: (filters: any) => Promise<any>
  getSettings: () => Promise<import('../shared/types').AppSettings>;
  saveSettings: (settings: import('../shared/types').AppSettings) => Promise<{ success: boolean }>;
  getPrinters: () => Promise<any[]>;
  printInvoice: (html: string) => Promise<boolean>;
    }
  }
}