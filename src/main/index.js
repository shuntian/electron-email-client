'use strict'

import { app, BrowserWindow } from 'electron'
import Config from '../models/config'
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const path = require('path')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
  BrowserWindow.addDevToolsExtension('E:/vue-devtools-master/shells/chrome')
}

// 获取用户根目录
// 由于存储app用户的数据目录
// 用户存储app数据的目录，升级会被覆盖
// 桌面目录
const config = new FileSync(path.join(app.getPath('userData'), 'config.json'))
const db = low(config)
db.defaults(new Config()).write()

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    autoHideMenuBar: true,
    title: 'shuntian-email',
    disableAutoHideCursor: true,
    frame: false, // 没有边框
    // transparent: true,  // 边框，不随系统
    // titleBarStyle: 'hidden-inset',
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
