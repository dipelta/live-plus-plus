import { Menu, MenuItem, BrowserWindow, KeyboardEvent } from 'electron'
import window from '../app/window'
class MenuConf {
  private conf = [
    {
      label: 'live++',
      submenu: [
        { role: 'about', label: '关于live++' },
        { type: 'separator' },
        {
          label: '偏好设置',
          accelerator: 'Command+,',
          click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
            const mainWindow = window.getWindowByName('MAIN_WINDOW')
            if (mainWindow) {
              mainWindow.webContents.send('menu-to-open-setting', true)
            }
          }
        },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏live++' },
        { role: 'hideothers', label: '隐藏其他应用' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { role: 'quit', label: '退出live++' }
      ]
    },
    {
      role: 'editMenu',
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'selectAll', label: '全选' },
        // { role: 'delete', label: '删除' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '拷贝' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { type: 'separator' },
        { role: 'reload', label: '刷新窗口' }
      ]
    },
    {
      role: 'help',
      label: '帮助',
      submenu: [
        {
          label: '检查更新',
          click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
            console.log('检查更新')
          }
        },
        {
          label: '使用说明',
          click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
            console.log('使用说明')
          }
        },
        {
          label: '错误报告',
          click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
            console.log('报告错误')
          }
        },
        { type: 'separator' },
        {
          label: '主程序调试工具',
          click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
            const mainWindow = window.getWindowByName('MAIN_WINDOW')
            if (mainWindow) {
              mainWindow.webContents.openDevTools()
            }
          }
        },
        {
          label: '播放器调试工具',
          click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
            const videoWindow = window.getWindowByName('VIDEO_WINDOW')
            if (videoWindow) {
              videoWindow.webContents.openDevTools()
            }
          }
        }
      ]
    }
  ]

  private trayMenuConf = [
    {
      label: '程序设置',
      click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
        const mainWindow = window.getWindowByName('MAIN_WINDOW')
        mainWindow.webContents.send('menu-to-open-setting', true)
      }
    },
    {
      label: '检查更新',
      click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
        console.log('检查更新')
      }
    },
    {
      label: '错误报告',
      click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
        console.log('报告错误')
      }
    },
    {
      label: '主程序调试工具',
      click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
        const mainWindow = window.getWindowByName('MAIN_WINDOW')
        if (mainWindow) {
          mainWindow.webContents.openDevTools()
        }
      }
    },
    {
      label: '播放器调试工具',
      click: function (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) {
        const videoWindow = window.getWindowByName('VIDEO_WINDOW')
        if (videoWindow) {
          videoWindow.webContents.openDevTools()
        }
      }
    },
    { role: 'about', label: '关于live++' },
    { role: 'quit', label: '退出' }
  ]

  getTrayMenuConf () {
    // @ts-ignore
    return Menu.buildFromTemplate(this.trayMenuConf)
  }

  getConf () {
    // @ts-ignore
    return Menu.buildFromTemplate(this.conf)
  }
}

export default new MenuConf()
