import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initDb } from './db'
import { registerApi } from './api'
import log from 'electron-log'
import Store from 'electron-store'

const store = new Store()

function initAutoUpdater(): void {
  autoUpdater.logger = log
  // @ts-ignore
  autoUpdater.logger.transports.file.level = 'info'
  autoUpdater.autoDownload = true
  
  // Disable code signing verification for unsigned builds (GitHub Releases)
  // @ts-ignore
  autoUpdater.verifyUpdateCodeSignature = false
  // @ts-ignore
  autoUpdater.forceCodeSigning = false

  log.info('App starting...')

  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })
  
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info)
  })
  
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info)
  })

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded')
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: 'A new version has been downloaded. Restart to install it now?',
        buttons: ['Restart', 'Later'],
        defaultId: 0,
        cancelId: 1
      })
      .then((result) => {
        if (result.response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (error) => {
    log.error('Auto-updater error:', error)
    dialog.showErrorBox('Update Error', 'An error occurred while updating: ' + (error.message || 'Unknown error'))
  })

  // Check immediately
  autoUpdater.checkForUpdates()
  
  // Check every 1 hour
  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 60 * 60 * 1000)
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'Exchange App',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    if (details.url === 'about:blank') {
      return { 
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 400,
          height: 600,
          autoHideMenuBar: true,
          webPreferences: {
            sandbox: false,
            contextIsolation: false
          }
        }
      }
    }
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.exchange.app')

  initDb()
  registerApi()
  
  // Check for successful update
  const currentVersion = app.getVersion()
  const lastVersion = store.get('version')
  
  if (lastVersion && lastVersion !== currentVersion) {
      dialog.showMessageBox({
          type: 'info',
          title: 'Update Successful',
          message: `The application has been updated to version ${currentVersion}.`
      })
  }
  store.set('version', currentVersion)

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  if (app.isPackaged) initAutoUpdater()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
