import {join} from "node:path";

const preload = join(__dirname, '../preload/index.js')

class Main {

  getLivePlatformItems() {
    return [
      '斗鱼', '哔哩哔哩', '虎牙'
    ]
  }

  getMainWindowConf() {
    return {
      title: 'live++',
      icon: join(process.env.PUBLIC, 'favicon.ico'),
      width: 300,
      height: 500,
      maxWidth: 300,
      maxHeight: 500,
      maximizable: false,
      frame: false,
      useContentSize: true,
      fullscreenable: false,
      fullscreen: false,
      resizable: false,
      transparent: true,
      webPreferences: {
        preload,
        spellcheck: false,
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        nodeIntegrationInWorker: true,
        backgroundThrottling: false
      },
    }
  }
}

export default new Main()
