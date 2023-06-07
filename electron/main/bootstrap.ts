import {app, protocol, dialog} from 'electron'
import {release} from 'node:os'
import window from './window'
import mainEvent from "./mainEvent";
import {v4 as uuidv4} from 'uuid';
import {join} from 'node:path'
import {api, apiResponse} from "../../src/plugins/api";
import db from "../../src/plugins/db";
import {autoUpdater} from "electron-updater";
import {log} from "electron-log";
import packageConfig from "../../package.json"

class Bootstrap {

  private async beforReady() {
    protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: {secure: true, standard: true}}])
    app.setName('live++')
    // Disable GPU Acceleration for Windows 7
    if (release().startsWith('6.1')) app.disableHardwareAcceleration()
    // Set application name for Windows 10+ notifications
    if (process.platform === 'win32') app.setAppUserModelId(app.getName())
    // 注册客户端
    await this.registerClient()
    await this.login()
    // 注册主进程事件
    mainEvent.register()
    // 检查更新
    this.checkUpdate()
  }

  private checkUpdate() {
    let updateUrl = ""
    switch (process.platform){
      case 'darwin':
        updateUrl = 'https://api.live.dipelta.cn/app_releases/darwin'
        break
      case 'win32':
        updateUrl = 'https://api.live.dipelta.cn/app_releases/win32'
        break
      case 'linux':
        updateUrl = 'https://api.live.dipelta.cn/app_releases/linux'
        break
      default:
    }
    log(updateUrl)
    autoUpdater.on('error', (err) => {
      log('error: ' + err)
    })
    autoUpdater.on('update-available', (info) => {
      log('发现了新的版本：')
      log(info)
    })
    autoUpdater.on('checking-for-update', () => {
      log("checking-for-update")
    })

    autoUpdater.on('download-progress', (progressInfo) => {
      log(progressInfo)
    })

    autoUpdater.on('update-not-available', (res) => {
      log("没有可更新版本:")
      log(res)
    })

    //监听'update-downloaded'事件，新版本下载完成时触发
    autoUpdater.on('update-downloaded', () => {
      // 弹出确认更新窗口
      const mainWindow = window.getWindowByName(window.MAIN_WINDOW_NAME)
      mainWindow.webContents.send('app-update-available', [])
    })

    if (updateUrl !== "") {
      autoUpdater.setFeedURL(updateUrl)
      autoUpdater.checkForUpdates()
    }
  }

  /**
   * 1.将clientCode记录到lowDB中（方便后续绑定邮箱后的数据迁移）
   *   如果已经存在一个clientCode的配置，则不进行更新
   * 2.将clientCode发送到服务器保存（用于统计该应用的安装数量）
   */
  private async registerClient() {
    const clientCode = uuidv4() // eg: a12bbfe8-bf7f-4739-adf6-6cf03839de9b
    const realClientCode = db.registerClient(clientCode)
    if (clientCode === realClientCode) {
      const registerResult = await api.register(realClientCode) as apiResponse
      if (registerResult.code != 200) {
        let msg = "新客户端注册：" + registerResult.msg + "\n 可尝试删除" + process.env.DBPATH + "后再启动应用"
        if (registerResult.code === 502) {
          msg = "哦豁，服务器蹦了，赶快联系作者吧：zha_zha@outlook.com"
        }
        dialog.showMessageBox(null, {
          type: "error",
          title: "无法启动Live++",
          detail: msg,
          message: "无法启动Live++",
        }).then(() => {
          app.exit();
        })
      }
    }
  }

  private async login() {
    const clientCode = db.getLocalClientCode()
    const loginResult = await api.login(clientCode) as apiResponse
    if (loginResult.code != 200) {
      let msg = "登录服务器：" + loginResult.msg + "\n 可尝试删除" + process.env.DBPATH + "后再启动应用"
      if (loginResult.code === 502) {
        msg = "哦豁，服务器蹦了，赶快联系作者吧：zha_zha@outlook.com"
      }
      dialog.showMessageBox(null, {
        type: "error",
        title: "无法启动Live++",
        detail: msg,
        message: "无法启动Live++",
      }).then(() => {
        app.exit();
      })
    } else {
      // 同步服务器中的关注数据到lowdb中
      api.isBindEmail(clientCode).then((respose) => {
        if (respose) {
          db.syncFollow(clientCode)
          db.syncAppConfig(clientCode)
        }
      })

    }
  }

  private onReady() {
    app.on('ready', () => {
      // 创建主窗口
      window.createMainWindow()
      // window.createVideoWindow()
    })
  }

  private onQuit() {
    app.on('window-all-closed', () => {
      app.quit()
    })
  }

  private onActivate() {
    app.on('activate', async () => {
      let mainWindow
      if (!window.isHasWindow(window.MAIN_WINDOW_NAME)) {
        mainWindow = window.createMainWindow()
      } else {
        mainWindow = window.getWindowByName(window.MAIN_WINDOW_NAME)
      }
      mainWindow.show()
      if (window.isHasWindow(window.MAIN_WINDOW_NAME)) {
        const video = window.getWindowByName(window.VIDEO_WINDOW_NAME)
        if (video) {
          video.show()
        }
      }
    })
  }

  private setenv() {
    process.env.DIST_ELECTRON = join(__dirname, '..')
    process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
    process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
      ? join(process.env.DIST_ELECTRON, '../public')
      : process.env.DIST
    process.env.APP_VERSION = packageConfig.version
  }

  run() {
    this.setenv()
    if (!app.requestSingleInstanceLock()) {
      app.quit()
      process.exit(0)
    } else {
      this.beforReady()
      this.onReady()
      this.onActivate()
      this.onQuit()
    }
  }
}

const bootstrap = new Bootstrap()

export {bootstrap}
