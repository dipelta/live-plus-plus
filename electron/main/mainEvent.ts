import {app, ipcMain, screen, clipboard, dialog} from 'electron'
import window from "./window";
import db from "../../src/plugins/db";
import {api, apiResponse} from "../../src/plugins/api";
import IpcMainEvent = Electron.IpcMainEvent;
import {autoUpdater} from "electron-updater";
import videoConfig from "../conf/video";

class MainEvent {

  register() {

    ipcMain.on('install-update-file', (event: IpcMainEvent, args: any[]) => {
      autoUpdater.quitAndInstall()
    })

    /**
     * 关闭窗口
     */
    ipcMain.on('window-close', function (event: IpcMainEvent, args: any[]) {
      const windowName = args[0]
      const win = window.getWindowByName(windowName)
      if (windowName == window.MAIN_WINDOW_NAME) {
        // 读取配置
        const main_window_close_event = db.getAppConfig('main_window_close_event')
        if (main_window_close_event === 0) {
          win.minimize()
        } else {
          win.close()
          win.destroy()
          app.quit()
        }
      } else {
        win.close()
        win.destroy()
      }
    })

    /**
     * 窗口最小化
     */
    ipcMain.on('window-min', function (event: IpcMainEvent, args: any[]) {
      const win = window.getWindowByName(args[0])
      if (win) {
        win.minimize()
      }
    })

    /**
     * 全局消息弹窗
     */
    ipcMain.on('alert-msg', function (event: IpcMainEvent, args: any[]) {
      const level = args[0]
      const msg = args[1]
      event.reply('alert-msg', [level, msg])
    })

    ipcMain.on('ws-danmaku-connect-error', function (event: IpcMainEvent, args: any[]) {
      const videoWindow = window.getWindowByName(window.VIDEO_WINDOW_NAME)
      videoWindow.webContents.send('ws-danmaku-connect-error-notice', [])
    })

    ipcMain.handle('bind-email', async function (event: IpcMainEvent, args: any[]) {
      const clientCode = db.getLocalClientCode()
      const email = args[0]
      const code = args[1]
      const response = await api.bindEmail(clientCode, email, code)
      if (response.code === 200) {
        // 绑定成功后，如果是新用户
        if (response.data.new_user) {
          // 1.将本地的关注数据同步到服务器中
          const follows = db.getAllPlatformFollows()
          api.syncFollowsUpload(clientCode, follows)
          // 2.将本地的app配置数据同步到服务器中
          const app_configs = db.getAppConfig()
          api.syncAppConfigUpload(clientCode, app_configs)
        } else {
          // 否则将线上的数据同步到本地
          db.syncFollow(clientCode)
          db.syncAppConfig(clientCode)
        }
      }
      return response
    })

    /**
     * 同步本地配置到服务器
     */
    ipcMain.on('sync-app-config', function (event: IpcMainEvent, args: any[]) {
      const clientCode = db.getLocalClientCode()
      const config = args[0]
      console.log(config)
      db.setAppConfig(config)
      const app_configs = db.getAppConfig()
      api.syncAppConfigUpload(clientCode, app_configs).then((response) => {
      })
    })

    ipcMain.handle('unbind-email', async function (event: IpcMainEvent, args: any[]) {
      const clientCode = db.getLocalClientCode()
      return await api.unbindEmail(clientCode)
    })

    ipcMain.handle('get-bind-email', async function (event: IpcMainEvent, args: any[]) {
      const clientCode = db.getLocalClientCode()
      return await api.getBindEmail(clientCode)
    })

    /**
     * 添加关注
     */
    ipcMain.handle('add-follow', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      const clientCode = db.getLocalClientCode()
      if (db.isFollow(platformTab, roomId)) { // 是否已经关注过
        return {code: 400, msg: '无法重复关注'}
      }
      db.addFollow(platformTab, roomId) // 保存关注数据到DB
      // 如果绑定了邮箱，则同时更新到服务器上
      const isBind = await api.isBindEmail(clientCode)
      if (isBind) {
        return await api.addFollow(clientCode, platformTab, roomId)
      }
      return {code: 200}
    })

    /**
     * 取消关注
     */
    ipcMain.handle('del-follow', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      console.log(platformTab, roomId)
      const clientCode = db.getLocalClientCode()
      if (db.isFollow(platformTab, roomId)) {
        db.delFollow(platformTab, roomId)
      }
      // 如果绑定了邮箱，则同时更新到服务器上
      const isBind = await api.isBindEmail(clientCode)
      if (isBind) {
        return await api.delFollow(clientCode, platformTab, roomId)
      }
      return {code: 200}
    })


    /**
     * 获取某个平台的关注数据
     */
    ipcMain.handle('get-follow-by-platform', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      return db.getPlatformFollows(platformTab)
    })

    ipcMain.handle('get-huya-chat-info', async function (event: IpcMainEvent, args: any[]) {
      const roomId = args[0]
      return await api.huyaChatInfo(roomId)
    })

    /**
     * 获取某个平台的关注数据
     */
    ipcMain.handle('search-anchor-by-keyword', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const searchKeyWord = args[1]
      return await api.search(platformTab, searchKeyWord)
    })

    /**
     * 获取所有平台的关注数据
     */
    ipcMain.handle('get-all-follow', async function (event: IpcMainEvent, args: any[]) {
      const clientCode = db.getLocalClientCode()
      const isBind = await api.isBindEmail(clientCode)
      if (isBind) {
        // 直接从服务器上获取
        let data = {douyu: [], bilibili: [], huya: []}
        const allFollowsResponse = await api.followData(clientCode) as apiResponse
        if (allFollowsResponse.code === 200) {
          const allFollows = allFollowsResponse.data
          for (let i = 0; i < allFollows.length; i++) {
            if (allFollows[i].platform_type === 'douyu') {
              data.douyu.push(allFollows[i].room_id)
            } else if (allFollows[i].platform_type === 'bilibili') {
              data.bilibili.push(allFollows[i].room_id)
            } else if (allFollows[i].platform_type === 'huya') {
              data.huya.push(allFollows[i].room_id)
            }
          }
          return data
        }
      }
      return db.getAllPlatformFollows()
    })

    ipcMain.handle('get-room-info', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      const data = await api.roomInfo(platformTab, roomId) as apiResponse
      return data
    })

    ipcMain.handle('get-multi-room-info', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      return await api.multiRoomInfo(platformTab, roomId) as apiResponse
    })

    /**
     * 打开直播窗口
     */
    ipcMain.handle('open-video', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      window.showVideo(platformTab, roomId)
    })

    ipcMain.handle('get-live-url-info', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      const rate = args[2]
      const liveUrl = await api.liveUrl(platformTab, roomId, rate) as apiResponse
      return liveUrl.data
    })

    ipcMain.handle('get-live-qn-list', async function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      const liveUrl = await api.liveQnList(platformTab, roomId) as apiResponse
      return liveUrl.data
    })

    ipcMain.on('live-url-to-clipboard', async function (event: IpcMainEvent, args: any[]) {
      clipboard.writeText(args[0])
      event.reply('live-url-to-clipboard-reply', true)
    })

    ipcMain.on('change-video-info', function (event: IpcMainEvent, args: any[]) {
      const platformTab = args[0]
      const roomId = args[1]
      const roomName = args[2]
      const videoWindow = window.getWindowByName(window.VIDEO_WINDOW_NAME)
      videoWindow.webContents.send('change-video-info', [roomName, platformTab, roomId])
    })

    ipcMain.on('reflush-live-list', function (event: IpcMainEvent, args: any[]) {
      const mainWindow = window.getWindowByName(window.MAIN_WINDOW_NAME)
      mainWindow.webContents.send('reflush-live-list-reply', [])
    })

    ipcMain.on('reflush-live-list-over', function (event: IpcMainEvent, args: any[]) {
      const mainWindow = window.getWindowByName(window.MAIN_WINDOW_NAME)
      mainWindow.webContents.send('reflush-live-list-over-reply', [])
    })

    ipcMain.on('get-media-metadata', async function (event: IpcMainEvent, args: any[]) {
      let liveUrl = args[0]
      let keyName = args[1]
      const videoWindow = window.getWindowByName(window.VIDEO_WINDOW_NAME)
      const data = await api.mediaMetadata(liveUrl, keyName)
      videoWindow.webContents.send('get-media-metadata-reply', [data])
    })

    // 改变窗口比例
    ipcMain.on('video-window-resize', async function (event: IpcMainEvent, args: any[]) {
      // console.log('video-window-resize')
      if (args.hasOwnProperty(0)) {
        let display_aspect_ratio = args[0]
        if (display_aspect_ratio) {
          // console.log(display_aspect_ratio)
          const videoWindow = window.getWindowByName(window.VIDEO_WINDOW_NAME)
          const videoConf = videoConfig.getWindowConf()
          const defaultWidth = videoConf.width
          // const defaultHeight = videoConf.height
          const defaultW = 16
          // const defaultH = 9
          let display = display_aspect_ratio.split(":");
          let defaultUnit = defaultWidth / defaultW
          let newWidth = defaultUnit * display[0]
          let newHeight = defaultUnit * display[1]
          // 宽度超过了960，则按960的标准计算高度
          if (newWidth >= 960 && parseInt(display[0]) > parseInt(display[1])) {
            // console.log('change-1')
            newWidth = 960
            newHeight = newWidth * display[1] / display[0]
          } else if (parseInt(display[1]) > parseInt(display[0])) {
            // console.log('change-2')
            newHeight = 960
            newWidth = newHeight * display[0] / display[1]
          }
          // console.log('newWidth = ' + newWidth)
          // console.log('newHeight = ' + newHeight)
          videoWindow.setSize(Math.round(newWidth), Math.round(newHeight))
        }
      }
    })

    ipcMain.handle('get-app-config', async function (event: IpcMainEvent, args: any[]) {
      return db.getAppConfig()
    })

    ipcMain.handle('get-app-version', (event: IpcMainEvent, args: any[]) =>{
      return process.env.APP_VERSION
    })

  }

}

export default new MainEvent()
