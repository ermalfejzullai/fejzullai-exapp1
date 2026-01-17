import { ElectronAPI } from '@electron-toolkit/preload'
import { ExchangeRate, AppSettings } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      login: (credentials: any) => Promise<any>
      registerAdmin: (credentials: any) => Promise<any>
      checkUsersExist: () => Promise<boolean>
      getRates: () => Promise<ExchangeRate[]>
      updateRates: (data: any) => Promise<any>
      saveTransaction: (data: any) => Promise<any>
      getTransactions: (filters: any) => Promise<any>
      getSettings: () => Promise<AppSettings>
      saveSettings: (settings: AppSettings) => Promise<any>
      printInvoice: (html: string) => Promise<boolean>
    }
  }
}