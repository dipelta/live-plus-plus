import DPlayer from 'dplayer'
import Douyu from '../plugins/livetool/douyu'
import Bilibili from '../plugins/livetool/bilibili'
// import Huya from '../plugins/livetool/huya'
import CommonTool from './commontool'
import zlib from 'zlib'
// @ts-ignore
import huyaDanmu from 'huya-danmu/index.js'
// import CommonTool from '../plugins/commontool'

class VideoTool {
  createDplayer (dPlayer: DPlayer, videoUrl: string, platform: number) {
    let videoType = 'auto'
    if (platform === 1) {
      videoType = 'hls'
    }
    dPlayer = new DPlayer({
      container: document.getElementById('live-player'),
      autoplay: true,
      lang: 'zh-cn',
      live: true,
      // @ts-ignore
      danmaku: true,
      apiBackend: {
        read: function (endpoint, callback) {},
        send: function (endpoint, danmakuData, callback) {}
      },
      contextmenu: [
        {
          text: '测试按钮',
          click: function () {
            console.log('测试按钮')
            console.log(dPlayer)
            // @ts-ignore
            dPlayer.infoPanel.triggle()
          }
        }
      ],
      video: {
        url: videoUrl,
        type: videoType
      }
    })
    dPlayer.play()
    dPlayer.danmaku.opacity(1)
    // 读取是否开启弹幕的配置信息
    const isShowDanmaku = CommonTool.getShowDanmakuConf()
    if (isShowDanmaku === 1) {
      // @ts-ignore
      dPlayer.template.showDanmaku.classList.add('danmu-open')
      dPlayer.danmaku.show()
      // @ts-ignore
      dPlayer.user.set('danmaku', 1)
    } else {
      // @ts-ignore
      dPlayer.template.showDanmaku.classList.remove('danmu-open')
      // @ts-ignore
      dPlayer.user.set('danmaku', 0)
      dPlayer.danmaku.hide()
    }
    return dPlayer
  }

  createDanmuWebsocket (platform: number, dplayer: DPlayer, ws: WebSocket, url: string,
    roomId: string, bilibiliToken: string, danmuHuyaInfo: any) {
    if (platform === 0) {
      ws = this.douyuWebsocket(ws, dplayer, url, roomId)
    } else if (platform === 1) {
      ws = this.huyaWebsocket(ws, dplayer, url, roomId, danmuHuyaInfo)
    } else if (platform === 2) {
      ws = this.bilibiliWebsocket(ws, dplayer, url, roomId, bilibiliToken)
    }
    return ws
  }

  /**
   * @todo 创建直播弹幕心跳包
   * @param platform
   * @param heartbeat
   * @param ws
   * @param bilibiliToken
   * @param roomId
   */
  createDanmuHeartbeat (platform: number, heartbeat: any, ws: WebSocket, roomId: string, bilibiliToken: string) {
    clearInterval(heartbeat)
    if (platform === 0) {
      // 斗鱼
      heartbeat = setInterval(function () {
        if (ws) {
          ws.send(Douyu.packMsg('type@=mrkl/\0'))
        }
      }, 45000)
    } else if (platform === 1) {
      // huya
    } else if (platform === 2) {
      // Bilibili
      heartbeat = setInterval(function () {
        if (ws) {
          const msg = Bilibili.packMsg(roomId, bilibiliToken, 2)
          if (msg) {
            ws.send(msg)
          }
        }
      }, 20000)
    }
    return heartbeat
  }

  /**
   * @todo 创建虎牙弹幕ws连接
   * @param ws
   * @param dplayer
   * @param url
   * @param roomId
   * @param danmuHuyaInfo
   */
  private huyaWebsocket (ws: WebSocket, dplayer: DPlayer, url: string, roomId: string, danmuHuyaInfo: any) {
    console.log('正在准备与[虎牙]平台的弹幕服务器进行连接')
    // eslint-disable-next-line new-cap
    const client = new huyaDanmu(roomId)
    client.on('connect', () => {
      console.log('虎牙：弹幕服务器-' + roomId + '-已连接')
      dplayer.notice('弹幕加载成功', 1200, 1)
    })
    client.on('message', (msg:any) => {
      if (msg.type === 'chat') {
        // console.log(`[${msg.from.name}]:${msg.content}`)
        if (msg.content) {
          dplayer.danmaku.draw({
            text: msg.content,
            color: '#fff',
            type: 'right'
          })
        }
      }
    })
    client.on('error', (e:any) => {
      // console.log('虎牙：弹幕服务器-' + roomId + '-发生错误')
      // console.log(e)
    })
    client.on('close', () => {
      // console.log('虎牙：弹幕服务器-' + roomId + '-已关闭')
      client.start()
    })
    return client
  }

  /**
   * @todo 创建B站弹幕ws连接
   * @param ws
   * @param dplayer
   * @param url
   * @param roomId
   * @param bilibiliToken
   */
  private bilibiliWebsocket (ws: WebSocket, dplayer: DPlayer, url: string, roomId: string, bilibiliToken: string) {
    console.log('正在准备与[bilibili]平台的弹幕服务器进行连接')
    // console.log(url)
    ws = new WebSocket(url)
    ws.onopen = function () {
      console.log('Bilibili：弹幕服务器-' + roomId + '-已连接')
      dplayer.notice('弹幕加载成功', 1200, 1)
      const inToRoomMsg = Bilibili.packMsg(roomId, bilibiliToken, 1)
      if (inToRoomMsg !== false) {
        ws.send(inToRoomMsg)
      }
    }
    ws.onmessage = function (msg: any) {
      const reader = new FileReader()
      reader.readAsArrayBuffer(msg.data)
      reader.onload = function () {
        const buffStr = Buffer.from(reader.result).toString('hex').substr(32)
        const buff = Buffer.from(buffStr, 'hex')
        zlib.inflate(buff, function (errors, decoded) {
          if (decoded) {
            const resultArr = Bilibili.unPackMsg(decoded.toString())
            // console.log(resultArr)
            resultArr.forEach(function (data) {
              if (data.cmd === 'DANMU_MSG' && data.info[1]) {
                dplayer.danmaku.draw({
                  text: data.info[1],
                  color: '#fff',
                  type: 'right'
                })
              }
            })
          }
        })
      }
    }
    ws.onclose = function () {
      console.log('Bilibili：弹幕服务器-' + roomId + '-已关闭')
    }
    ws.onerror = function () {
      console.log('Bilibili：弹幕服务器-' + roomId + '-发生错误')
    }
    return ws
  }

  private douyuWebsocket (ws: WebSocket, dplayer: DPlayer, url: string, roomId: string) {
    console.log('正在准备与[斗鱼]平台的弹幕服务器进行连接')
    ws = new WebSocket(url)
    ws.onopen = function () {
      console.log('斗鱼：弹幕服务器-' + roomId + '-已连接')
      dplayer.notice('弹幕加载成功', 1200, 1)
      ws.send(Douyu.packMsg('type@=loginreq/roomid@=:msg/\0', roomId))
      ws.send(Douyu.packMsg('type@=joingroup/rid@=:msg/gid@=-1/\0', roomId))
      ws.send(Douyu.packMsg('type@=mrkl/\0'))
    }
    ws.onmessage = function (msg: any) {
      const reader = new FileReader()
      reader.readAsText(msg.data, 'utf-8')
      reader.onload = function () {
        const data = reader.result.toString()
        const unpackData = Douyu.unpackMsg(data)
        if (unpackData !== false) {
          const danmuMsg = unpackData[0]
          const danmuColor = unpackData[1]
          dplayer.danmaku.draw({
            text: danmuMsg,
            color: danmuColor,
            type: 'right'
          })
        }
      }
    }
    ws.onclose = function () {
      console.log('斗鱼：弹幕服务器-' + roomId + '-已关闭')
    }
    ws.onerror = function () {
      console.log('斗鱼：弹幕服务器-' + roomId + '-发生错误')
    }
    return ws
  }

  customDestroyPlayer (dplayer: DPlayer) {
    dplayer.pause()
    dplayer.danmaku.hide()
    dplayer.destroy()
    dplayer = null
    return dplayer
  }
}

export default new VideoTool()
