import {join} from "node:path";

class Video {

  getWindowConf() {
    return {
      width: 960,
      height: 540,
      frame: false,
      show: true,
      useContentSize: true,
      transparent: true,
      webPreferences: {
        spellcheck: false,
        webSecurity: false,
        contextIsolation: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        backgroundThrottling: false
      }
    }
  }
}

export default new Video()
