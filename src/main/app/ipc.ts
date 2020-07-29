import { app, clipboard, ipcMain, screen } from 'electron'
import window from '../app/window'
import Livetool from '../../ext/plugins/livetool'
import douyu from '../../ext/plugins/livetool/douyu'
import huya from '../../ext/plugins/livetool/huya'
import bilibili from '../../ext/plugins/livetool/bilibili'
import DB from '../../ext/plugins/db'
import AppConfig from '../config/appConf'
import IpcMainEvent = Electron.IpcMainEvent

class Ipc {
  private static videoArgs: any[] | undefined;

  static setVideoArgs (value:any[]) {
    Ipc.videoArgs = value
  }

  static getVideoArgs () {
    return Ipc.videoArgs
  }

  register () {
    // 最小化主窗口
    ipcMain.on('main-window-min', function (event: IpcMainEvent, args: any[]) {
      const mainWindow = window.getWindowByName('MAIN_WINDOW')
      if (mainWindow) {
        mainWindow.minimize()
      }
    })

    // 关闭主窗口
    ipcMain.on('main-window-close', function (event: IpcMainEvent, args: any[]) {
      const mainWindow = window.getWindowByName('MAIN_WINDOW')
      const config = DB.get('system-config')
      const platform = AppConfig.getSysPlatform()
      if (config.windowCloseEvent === 1) {
        if (mainWindow) {
          if (platform === 'darwin') {
            mainWindow.hide()
          } else {
            mainWindow.minimize()
          }
        }
      } else if (config.windowCloseEvent === 2) {
        if (mainWindow) {
          if (platform === 'darwin') {
            mainWindow.hide()
          } else {
            mainWindow.minimize()
          }
        }
        const videoWindow = window.getWindowByName('VIDEO_WINDOW')
        if (videoWindow) {
          if (platform === 'darwin') {
            videoWindow.hide()
          } else {
            videoWindow.minimize()
          }
        }
      } else {
        const videoWindow = window.getWindowByName('VIDEO_WINDOW')
        if (videoWindow) {
          videoWindow.close()
          videoWindow.destroy()
        }
        if (mainWindow) {
          mainWindow.close()
          mainWindow.destroy()
        }
        app.quit()
      }
    })

    // 关闭直播窗口
    ipcMain.on('video-window-close', function (event: IpcMainEvent, args: any[]) {
      console.log('关闭直播窗口')
      const videoWindow = window.getWindowByName('VIDEO_WINDOW')
      if (videoWindow) {
        console.log('关闭直播窗口 - ing')
        videoWindow.close()
      }
    })

    // 最小化直播窗口
    ipcMain.on('video-window-min', function (event: IpcMainEvent, args: any[]) {
      console.log('最小化直播窗口')
      const videoWindow = window.getWindowByName('VIDEO_WINDOW')
      if (videoWindow) {
        console.log('最小化直播窗口 - ing')
        videoWindow.minimize()
      }
    })

    // 直播窗口最大化
    ipcMain.on('video-window-max', function (event: IpcMainEvent, args: any[]) {
      const videoWindow = window.getWindowByName('VIDEO_WINDOW')
      if (videoWindow) {
        if (videoWindow.isMaximized()) {
          console.log('还原窗口大小')
          videoWindow.unmaximize()
        } else {
          console.log('直播窗口最大化 - ing')
          videoWindow.maximize()
        }
      }
    })

    // 判断鼠标是否离开了直播窗口 - 同步返回  true-在窗口内  false-不在窗口内
    ipcMain.on('is-leave-vieo-window', function (event: IpcMainEvent, args: any[]) {
      // console.log('判断鼠标是否离开了直播窗口')
      const videoWindow = window.getWindowByName('VIDEO_WINDOW')
      let status = true
      if (videoWindow) {
        const videoWindowPositionArr = videoWindow.getPosition()
        const videoX = videoWindowPositionArr[0]
        const videoY = videoWindowPositionArr[1]
        const mousePoint = screen.getCursorScreenPoint()
        const mouseX = mousePoint.x
        const mouseY = mousePoint.y
        const size = videoWindow.getSize()
        const winWidth = size[0]
        const winHeight = size[1]
        // 判断是否在窗口范围内
        if (mouseX >= videoX && mouseX <= videoX + winWidth && mouseY >= videoY && mouseY <= videoY + winHeight) {
          status = true
        } else {
          status = false
        }
      }
      // event.reply('is-leave-vieo-window', isLeave)
      event.returnValue = status
    })

    // 判断鼠标是否离开了直播窗口的系统栏 - 同步返回  true-在窗口内  false-不在窗口内
    ipcMain.on('is-leave-video-bar', function (event: IpcMainEvent, args: any[]) {
      const videoWindow = window.getWindowByName('VIDEO_WINDOW')
      let status = true
      if (videoWindow) {
        // console.log(videoWindow.getSize())
        const videoWindowPositionArr = videoWindow.getPosition()
        const videoX = videoWindowPositionArr[0]
        const videoY = videoWindowPositionArr[1]
        const mousePoint = screen.getCursorScreenPoint()
        const mouseX = mousePoint.x
        const mouseY = mousePoint.y
        // console.log(videoX + '--' + videoY)
        // console.log(mouseX + '--' + mouseY)
        // 判断是否在系统栏范围内
        const size = videoWindow.getSize()
        const winWidth = size[0]
        // console.log(videoX + winWidth)
        if (mouseX >= videoX && mouseX <= videoX + winWidth && mouseY >= videoY && mouseY <= videoY + 24) {
          status = true
        } else {
          status = false
        }
      }
      event.returnValue = status
    })

    ipcMain.on('config-changed', function (event: IpcMainEvent, args: any[]) {
      const keyName = args[0]
      event.reply('config-changed-' + keyName, true)
    })

    // 刷新数据库中的主播数据
    ipcMain.on('refresh-live-db-list', function (event: IpcMainEvent, args: any[]) {
      douyu.refreshList()
      huya.refreshList()
      bilibili.refreshList()
      event.reply('live-list-refresh', true)
    })

    // 马上刷新LiveList.vue组件中的列表数据
    ipcMain.on('refresh-live-list', function (event: IpcMainEvent, args: any[]) {
      event.reply('live-list-refresh', true)
    })

    ipcMain.on('scroll-to-bottom', function (event: IpcMainEvent, args: any[]) {
      event.reply('scroll-to-bottom', true)
    })

    // 获取主播信息
    ipcMain.on('get-liver-info', function (event: IpcMainEvent, args: any[]) {
      const roomId = args[1]
      const platform = args[0]
      console.log('直播平台：' + platform + '，房间号：' + roomId)
      if (platform === 0) {
        console.log('正在获取[斗鱼]主播信息')
        Livetool.getDouyuInfo(roomId).then(function (data: any) {
          data.platform = platform
          event.reply('get-liver-info', data)
        })
      } else if (platform === 1) {
        console.log('正在获取[虎牙]主播信息')
        Livetool.getHuyaInfo(roomId).then(function (data: any) {
          data.platform = platform
          event.reply('get-liver-info', data)
        })
      } else {
        console.log('正在获取[哔哩哔哩]主播信息')
        Livetool.getBilibiliInfo(roomId).then(function (data: any) {
          data.platform = platform
          event.reply('get-liver-info', data)
        })
      }
    })

    // 删除主播
    ipcMain.on('del-liver', function (event: IpcMainEvent, args: any[]) {
      if (args[0] !== undefined && args[0] !== null &&
      args[1] !== undefined && args[1] !== null &&
      args[2] !== undefined && args[2] !== null) {
        const platform = parseInt(args[0])
        const index = args[2]
        const item = args[1]
        if (platform === 0) {
          douyu.deleteLiver(item, index)
        } else if (platform === 1) {
          huya.deleteLiver(item, index)
        } else if (platform === 2) {
          bilibili.deleteLiver(item, index)
        }
        event.reply('live-list-refresh', true)
      }
    })

    // 将直播地址写入剪切板
    ipcMain.on('live-url-to-clipboard', function (event: IpcMainEvent, args: any[]) {
      const platform = parseInt(args[0])
      const item = args[1]
      if (parseInt(item.is_live) === 2) {
        console.log('还未开播')
        event.reply('get-live-url-error', ['还未开播', 'warning'])
      } else {
        let promise:Promise<any> | undefined
        if (platform === 0) {
          promise = douyu.getLiveUrl(item)
        } else if (platform === 1) {
          promise = huya.getLiveUrl(item)
        } else if (platform === 2) {
          promise = bilibili.getLiveUrl(item)
        }
        if (promise) {
          promise.then(function (data) {
            console.log(data)
            if (data) {
              clipboard.writeText(data)
              event.reply('live-url-to-clipboard', true)
            } else {
              console.log('发生异常，打开终止')
              event.reply('get-live-url-error', ['无法获取到直播地址', 'error'])
            }
          })
        } else {
          console.log('no promise')
          event.reply('get-live-url-error', ['功能未开发', 'warning'])
        }
      }
    })

    // 移动主播的索引
    // platform, item, index, type
    ipcMain.on('move-liver-index', function (event: IpcMainEvent, args: any[]) {
      // 获取平台下的数据列表信息
      const platform = parseInt(args[0])
      const item = args[1]
      const index = args[2]
      const moveType = args[3]
      let dbName
      if (platform === 0) {
        dbName = 'douyu'
      } else if (platform === 1) {
        dbName = 'huya'
      } else {
        dbName = 'bilibili'
      }
      const list = DB.get(dbName)
      if (moveType === 'up' && index !== 0) {
        list[index] = list[index - 1]
        list[index - 1] = item
        DB.set(dbName, list)
      } else if (moveType === 'down' && index !== list.length - 1) {
        list[index] = list[index + 1]
        list[index + 1] = item
        DB.set(dbName, list)
      }
      event.reply('live-list-refresh', true)
    })

    // 获取直播源地址
    ipcMain.on('get-live-url', function (event: IpcMainEvent, args: any[]) {
      const platform = parseInt(args[0])
      const item = args[1]
      if (parseInt(item.is_live) === 2) {
        console.log('还未开播')
        event.reply('get-live-url-error', ['还未开播', 'warning'])
      } else {
        let promise:Promise<any> | undefined
        if (platform === 0) {
          promise = douyu.getLiveUrl(item)
        } else if (platform === 1) {
          promise = huya.getLiveUrl(item)
        } else if (platform === 2) {
          promise = bilibili.getLiveUrl(item)
        }
        if (promise) {
          promise.then(function (data) {
            console.log(data)
            if (data) {
              // if (platform === 0) {
              //   data = 'http://tx2play1.douyucdn.cn/live/xxxxxxxxx.flv?uuid='
              // }
              event.reply('realy-open-video', [item.room_name, data, platform, item])
            } else {
              console.log('发生异常，打开终止')
              event.reply('get-live-url-error', ['无法获取到直播流，播放失败', 'error'])
            }
          })
        } else {
          console.log('no promise')
          event.reply('get-live-url-error', ['功能未开发', 'warning'])
        }
      }
    })

    ipcMain.on('open-video', function (event: IpcMainEvent, args: any[]) {
      Ipc.setVideoArgs(args)
      if (!window.isHasWindow('VIDEO_WINDOW')) {
        window.createVideo(args[0])
      } else {
        console.log('video-switch')
        const videoWin = window.getWindowByName('VIDEO_WINDOW')
        if (videoWin) {
          console.log('发现直播窗口存在，准备开始刷新')
          const id = videoWin.webContents.id
          videoWin.setTitle(args[0])
          event.reply('video-switch', [id, Ipc.getVideoArgs()])
        }
      }
    })

    ipcMain.on('video-reload', function (event: IpcMainEvent, args: any[]) {
      const videoWin = window.getWindowByName('VIDEO_WINDOW')
      if (videoWin) {
        console.log('video-reload')
        const id = videoWin.webContents.id
        videoWin.setTitle(args[0])
        event.reply('video-switch-refresh', Ipc.getVideoArgs())
      }
    })

    ipcMain.on('video-init', function (event: IpcMainEvent, args: any[]) {
      // console.log('正在初始化直播窗口信息')
      // console.log(Ipc.getVideoArgs())
      if (Ipc.videoArgs !== undefined) {
        event.reply('video-init', Ipc.getVideoArgs())
      } else {
        console.log('无法获取直播窗口的信息')
      }
    })
  }
}

export default new Ipc()
