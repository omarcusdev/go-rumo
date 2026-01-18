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
  saveRumo: (rumo) => ipcRenderer.send('save-rumo', rumo)
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
