import { app, protocol } from 'electron'
// import {
//   installVueDevtools
// } from 'vue-cli-plugin-electron-builder/lib'
import window from '../app/window'
import ipc from '../app/ipc'
import crontab from '../../ext/plugins/crontab'
import douyu from '../../ext/plugins/livetool/douyu'
import huya from '../../ext/plugins/livetool/huya'
import bilibili from '../../ext/plugins/livetool/bilibili'
import appConf from '../config/appConf'
import menus from './menus'
// const isDevelopment = process.env.NODE_ENV !== 'production'
let tray: any = null

class Bootstrap {
  static beforeReady () {
    protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true } }])
    app.setName('live++')
    const platform = appConf.getSysPlatform()
    // mac下有菜单
    if (platform === 'darwin') {
      menus.register()
    }
    // 注册主进程事件
    ipc.register()
    // 刷新平台主播列表数据
    douyu.refreshList()
    huya.refreshList()
    bilibili.refreshList()
    // 开启定时任务
    crontab.start()
  }

  static onReady () {
    app.on('ready', () => {
      // if (isDevelopment && !process.env.IS_TEST) {
      //   try {
      //     await installVueDevtools()
      //   } catch (e) {
      //     console.error('Vue Devtools failed to install:', e.toString())
      //   }
      // }
      // 设置托盘
      tray = menus.setTray(tray)
      window.createMain()
    })
  }

  static onQuit () {
    app.on('window-all-closed', () => {
      if (appConf.getSysPlatform() !== 'darwin') {
        app.quit()
      }
    })
  }

  static onActivate () {
    app.on('activate', async () => {
      if (!window.isHasWindow('MAIN_WINDOW')) {
        window.createMain()
      } else {
        window.showMain()
      }
      if (window.isHasWindow('VIDEO_WINDOW')) {
        const video = window.getWindowByName('VIDEO_WINDOW')
        if (video) {
          video.show()
        }
      }
    })
  }

  start () {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      Bootstrap.beforeReady()
      Bootstrap.onReady()
      Bootstrap.onActivate()
      Bootstrap.onQuit()
    }
  }
}

const bootstrap = new Bootstrap()

export {
  bootstrap
}
