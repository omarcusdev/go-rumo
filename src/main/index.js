import { app, shell, BrowserWindow, ipcMain, Tray, Menu, Notification, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

const getIconPath = () => {
  if (is.dev) {
    return join(process.cwd(), 'resources/icon.png')
  }
  return join(__dirname, '../../resources/icon.png')
}

let store = null
let mainWindow = null
let tray = null

const initStore = async () => {
  const Store = (await import('electron-store')).default
  store = new Store()
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 580,
    minWidth: 280,
    minHeight: 520,
    show: false,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    hasShadow: false,
    vibrancy: 'hud',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = details.url
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const createTray = () => {
  const iconPath = getIconPath()
  console.log('Tray icon path:', iconPath)
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  console.log('Tray icon empty?', trayIcon.isEmpty())
  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar/Esconder',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide()
        } else {
          mainWindow.show()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setToolTip('Go Rumo')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow.show()
    }
  })
}

const setupIPC = () => {
  ipcMain.handle('get-always-on-top', () => {
    return mainWindow?.isAlwaysOnTop() ?? true
  })

  ipcMain.on('set-always-on-top', (_, value) => {
    mainWindow?.setAlwaysOnTop(value, 'floating')
  })

  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('close-window', () => {
    mainWindow?.hide()
  })

  ipcMain.on('show-notification', (_, title, body) => {
    const iconPath = getIconPath()
    const icon = nativeImage.createFromPath(iconPath)
    new Notification({ title, body, icon }).show()
  })

  ipcMain.handle('get-todos', () => {
    return store?.get('todos', []) ?? []
  })

  ipcMain.on('save-todos', (_, todos) => {
    store?.set('todos', todos)
  })

  ipcMain.handle('get-focused-todo-id', () => {
    return store?.get('focusedTodoId', null) ?? null
  })

  ipcMain.on('save-focused-todo-id', (_, id) => {
    store?.set('focusedTodoId', id)
  })

  ipcMain.on('update-tray-title', (_, time) => {
    tray?.setTitle(time)
  })

  ipcMain.handle('get-window-opacity', () => {
    return store?.get('windowOpacity', 0.12) ?? 0.12
  })

  ipcMain.on('set-window-opacity', (_, value) => {
    store?.set('windowOpacity', value)
  })

  ipcMain.handle('get-rumos', () => {
    return store?.get('rumos', []) ?? []
  })

  ipcMain.on('save-rumo', (_, rumo) => {
    const rumos = store?.get('rumos', []) ?? []
    store?.set('rumos', [...rumos, rumo])
  })
}

app.whenReady().then(async () => {
  app.name = 'Go Rumo'
  electronApp.setAppUserModelId('com.gorumo.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initStore()
  setupIPC()
  createWindow()
  createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
