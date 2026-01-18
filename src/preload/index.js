import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  showNotification: (title, body) => ipcRenderer.send('show-notification', title, body),
  getTodos: () => ipcRenderer.invoke('get-todos'),
  saveTodos: (todos) => ipcRenderer.send('save-todos', todos),
  getFocusedTodoId: () => ipcRenderer.invoke('get-focused-todo-id'),
  saveFocusedTodoId: (id) => ipcRenderer.send('save-focused-todo-id', id),
  updateTrayTitle: (time) => ipcRenderer.send('update-tray-title', time),
  getWindowOpacity: () => ipcRenderer.invoke('get-window-opacity'),
  setWindowOpacity: (value) => ipcRenderer.send('set-window-opacity', value),
  getRumos: () => ipcRenderer.invoke('get-rumos'),
  saveRumo: (rumo) => ipcRenderer.send('save-rumo', rumo),

  timerGetState: () => ipcRenderer.invoke('timer:get-state'),
  timerToggle: () => ipcRenderer.invoke('timer:toggle'),
  timerReset: () => ipcRenderer.invoke('timer:reset'),
  timerSwitchMode: (mode) => ipcRenderer.invoke('timer:switch-mode', mode),
  onTimerTick: (callback) => {
    const handler = (_, state) => callback(state)
    ipcRenderer.on('timer:tick', handler)
    return () => ipcRenderer.removeListener('timer:tick', handler)
  },
  onTimerComplete: (callback) => {
    const handler = (_, state) => callback(state)
    ipcRenderer.on('timer:complete', handler)
    return () => ipcRenderer.removeListener('timer:complete', handler)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.api = api
}
