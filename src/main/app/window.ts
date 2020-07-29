import { BrowserWindow, Rectangle } from 'electron'
// import * as path from 'path'
import windowConf from '../../main/config/windowConf'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

class Window {
  private windowMap: Map<string, BrowserWindow> = new Map()

  private windowIdMap: Map<number, string> = new Map()

  createMain () {
    const mainWindowConf = windowConf.getMainWindowConf()
    const win = new BrowserWindow(mainWindowConf)
    const id = win.id
    // console.log('main id = ' + id)
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
      // win.webContents.openDevTools()
    } else {
      createProtocol('app')
      win.loadURL('app://./index.html')
    }
    this.windowMap.set('MAIN_WINDOW', win)
    this.windowIdMap.set(id, 'MAIN_WINDOW')
    win.on('ready-to-show', () => {
      win.show()
    })
    win.on('close', (event: Event) => {
      // console.log('main close')
      this.delWindowById(id)
      win.destroy()
    })
    // win.webContents.openDevTools()
  }

  createVideo (title:string) {
    const conf = windowConf.getVideoWindowConf()
    if (!title) {
      title = 'live++直播窗口'
    }
    if (conf) {
      conf.title = title
    }
    const videoWin = new BrowserWindow(conf)
    const id = videoWin.id
    // console.log('video id = ' + id)
    let url
    if (process.env.WEBPACK_DEV_SERVER_URL) {
      url = process.env.WEBPACK_DEV_SERVER_URL + '#/video'
      // if (!process.env.IS_TEST) videoWin.webContents.openDevTools()
      videoWin.webContents.openDevTools()
    } else {
      url = 'app://./index.html' + '#/video'
    }
    videoWin.loadURL(url)
    this.windowMap.set('VIDEO_WINDOW', videoWin)
    this.windowIdMap.set(id, 'VIDEO_WINDOW')
    videoWin.on('ready-to-show', () => {
      videoWin.show()
    })
    videoWin.on('close', (event: Event) => {
      console.log('video close')
      this.delWindowById(id)
      videoWin.destroy()
      return true
    })
    // videoWin.on('will-resize', function (event: Event, newBounds: Rectangle) {
    //   console.log('正在修改播放器窗口大小')
    // })
  }

  showMain () {
    if (this.isHasWindow('MAIN_WINDOW')) {
      const win = this.getWindowByName('MAIN_WINDOW')
      if (win) {
        win.show()
      } else {
        console.log('无法获取【主窗口】对象，马上重新创建-1')
        this.createMain()
      }
    } else {
      console.log('无法获取【主窗口】对象，马上重新创建-2')
      this.createMain()
    }
  }

  showVideo (title:string) {
    if (this.isHasWindow('VIDEO_WINDOW')) {
      const win = this.getWindowByName('VIDEO_WINDOW')
      if (win) {
        win.show()
      } else {
        console.log('无法获取【直播窗口】对象，马上重新创建-1')
        this.createVideo(title)
      }
    } else {
      console.log('无法获取【直播窗口】对象，马上重新创建-2')
      this.createVideo(title)
    }
  }

  getWindowByName (name: string) {
    // console.log('--------------------------------')
    // console.log(this.windowMap)
    if (this.isHasWindow(name)) {
      // console.log('has')
      return this.windowMap.get(name)
    } else {
      // console.log('没有找到map中的[' + name + ']对象')
      return null
      // if (name === 'MAIN_WINDOW') {
      //   return this.createMain()
      // } else {
      //   return this.createVideo('live++播放器')
      // }
    }
  }

  isHasWindow (name: string) {
    return this.windowMap.has(name)
  }

  delWindowById (id: number) {
    const name = this.windowIdMap.get(id)
    if (name) {
      this.windowMap.delete(name)
      this.windowIdMap.delete(id)
    }
  }
}

export default new Window()
