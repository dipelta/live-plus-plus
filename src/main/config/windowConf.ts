import { BrowserWindowConstructorOptions } from 'electron'

class WindowConf {
  conf: BrowserWindowConstructorOptions | undefined
  confVideo: BrowserWindowConstructorOptions | undefined

  constructor () {
    this.conf = {
      width: 300,
      height: 500,
      maxWidth: 300,
      maxHeight: 500,
      maximizable: false,
      title: 'live++',
      frame: false,
      useContentSize: true,
      fullscreenable: false,
      fullscreen: false,
      resizable: false,
      transparent: true,
      show: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        backgroundThrottling: false
      }
    }
    this.confVideo = {
      width: 960,
      height: 540,
      frame: false,
      show: false,
      useContentSize: true,
      // maximizable: false,
      transparent: true,
      // fullscreenable: false,
      // fullscreen: false,
      // resizable: false,
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        backgroundThrottling: false
      }
    }
  }

  getMainWindowConf () {
    return this.conf
  }

  getVideoWindowConf () {
    return this.confVideo
  }
}

export default new WindowConf()
