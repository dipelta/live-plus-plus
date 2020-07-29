<template>
  <v-container @mousemove="showBar" style="background: #2f2f2f;border-radius: 5px 5px 5px 5px">
    <VideoSystemBar :showStatus="showStatus" :onTheBar="onTheBar" :barTitle="barTitle"></VideoSystemBar>
    <div id="live-player" :showStatus="showStatus"></div>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VideoSystemBar from '../components/Video/VideoSystemBar.vue'
// eslint-disable-next-line no-unused-vars
import DPlayer from 'dplayer'
import CommonTool from '../../../src/ext/plugins/commontool'
import VideoTool from '../../ext/plugins/videotool'
import Bilibili from '../../ext/plugins/livetool/bilibili'
import { ipcRenderer } from 'electron'

@Component({
  name: 'Video',
  components: {
    VideoSystemBar
  }
})
export default class extends Vue {
  // 直播平台
  platform: any | undefined
  // 弹幕服务器
  danmuWebsocket: any
  danmuWsUrl: string
  danmuHeartbeat: any
  // bilibili
  danmuToken = ''
  // huya
  danmuHuyaInfo: any | undefined
  // 播放器
  dp: DPlayer | undefined
  // 播放状态
  videoPlayStatus: boolean | undefined
  barTitle = 'live++直播窗口' // 窗口标题栏
  videoUrl = '' // 播放地址
  liverInfo: any // 主播信息
  // 标题栏状态
  showStatus = true
  onTheBar = false
  hideTimeInterval: any
  checkMouseInterval: any | undefined
  hTime = 3000
  fTime = new Date().getTime()
  lTime = new Date().getTime()
  // 视频重载设置
  mostWaitTimeConfig = 15
  waitTime = 0
  reloadTimes = 0
  reloadInterval: any | undefined

  dplayerBindEvent () {
    const self = this
    // @ts-ignore
    this.dp.on('playing', function () {
      if (self.videoPlayStatus === false) {
        const isReplay = CommonTool.getVideoReplayEvent()
        if (isReplay === 2) {
          ipcRenderer.send('video-reload', [self.barTitle])
        } else {
          self.videoPlayStatus = true
        }
      } else {
        self.videoPlayStatus = true
      }
      console.log('直播-播放中:' + self.videoPlayStatus)
    })
    // @ts-ignore
    this.dp.on('play', function () {
      console.log('直播-play:' + self.videoPlayStatus)
    })
    // @ts-ignore
    this.dp.on('pause', function () {
      self.videoPlayStatus = false
      console.log('直播-暂停:' + self.videoPlayStatus)
    })
    // @ts-ignore
    this.dp.on('error', function () {
      console.log('直播-出现错误')
    })
  }

  autoHideBarAfterTime () {
    this.lTime = new Date().getTime()
    if (this.showStatus && this.lTime - this.fTime >= this.hTime) {
      if (!this.onTheBar) {
        this.showStatus = false
        // console.log('hide')
        clearInterval(this.checkMouseInterval)
        this.checkMouseInterval = null
      }
    }
  }

  checkAutoHideBarNow () {
    const self = this
    const isAtWindow = ipcRenderer.sendSync('is-leave-vieo-window')
    // console.log(isAtWindow)
    if (!isAtWindow) {
      this.showStatus = false
      this.onTheBar = false
      setTimeout(function () {
        clearInterval(self.checkMouseInterval)
        self.checkMouseInterval = null
      }, 200)
    }
  }

  // 直播重载定时器
  reloadIntervalFunc () {
    // console.log('reloadIntervalFunc')
    if (this.reloadTimes >= 2) {
      console.log('已经尝试过2次以上reload，放弃加载')
      this.dp.notice('直播地址无法加载，请检查直播平台是否有异常', 1000 * 3600 * 24 * 365, 1)
      clearInterval(this.reloadInterval)
      this.reloadInterval = null
    } else {
      if (this.videoPlayStatus === true) {
        clearInterval(this.reloadInterval)
        this.reloadInterval = null
      } else {
        // console.log('重载次数小于2次')
        console.log('waitTime:' + this.waitTime)
        this.dp.notice('直播加载中...', 1200, 1)
        if (this.videoPlayStatus === undefined) {
          // console.log('由于某些原因，播放器未能进行播放')
          this.waitTime++
        }
        if (this.platform === 1) {
          this.mostWaitTimeConfig = 30
        } else {
          this.mostWaitTimeConfig = 10
        }
        if (this.waitTime >= this.mostWaitTimeConfig) {
          // console.log('切换-重新加载')
          this.waitTime = 0
          this.reloadTimes++
          ipcRenderer.send('video-reload', [this.barTitle])
        }
      }
    }
  }

  showBar () {
    this.fTime = new Date().getTime()
    const isAtBar = ipcRenderer.sendSync('is-leave-video-bar')
    if (isAtBar) {
      this.onTheBar = true
    } else {
      this.onTheBar = false
    }
    this.showStatus = true
    // 重新设置定时器任务
    if (!this.hideTimeInterval) {
      // console.log('重新设置定时器任务-autoHideBarAfterTime')
      this.hideTimeInterval = setInterval(this.autoHideBarAfterTime, 50)
    }
    if (!this.checkMouseInterval) {
      // console.log('重新设置定时器任务-checkAutoHideBarNow')
      this.checkMouseInterval = setInterval(this.checkAutoHideBarNow, 50)
    }
  }

  setVideoParamsFromArgs (args: any) {
    console.log('切换前：' + this.platform)
    const self = this
    this.barTitle = args[0]
    this.videoUrl = args[1]
    this.platform = args[2]
    this.liverInfo = args[3]
    console.log('切换后：' + this.platform)
    if (this.platform === 0) {
      this.danmuWsUrl = 'wss://danmuproxy.douyu.com:8503'
    } else if (this.platform === 2) {
      Bilibili.getDanmuWssUrl(this.liverInfo.room_id).then(function (data: any) {
        // console.log(data)
        self.danmuWsUrl = data[0]
        self.danmuToken = data[1]
      })
    } else {
      this.danmuWsUrl = 'wss://cdnws.api.huya.com'
    }
  }

  beforeCreate () {
    ipcRenderer.send('video-init')
  }

  created () {
    const self = this
    ipcRenderer.on('video-init', function (event, args) {
      self.setVideoParamsFromArgs(args)
    })
    ipcRenderer.on('video-switch-refresh', function (event, args) {
      console.log('切换直播源-video')
      if (self.platform === 1) {
        console.log('stop')
        self.danmuWebsocket.stop()
      }
      // 暂停播放，隐藏弹幕，摧毁旧的播放器
      self.dp = VideoTool.customDestroyPlayer(self.dp)
      clearInterval(self.danmuHeartbeat)
      self.danmuHeartbeat = null
      self.danmuWsUrl = ''
      self.danmuToken = ''
      self.danmuHuyaInfo = undefined
      // 重新加载相关参数
      self.videoPlayStatus = undefined
      self.waitTime = 0
      if (!self.reloadInterval) {
        self.reloadTimes = 0
        self.reloadInterval = setInterval(self.reloadIntervalFunc, 1000)
      }
      if (self.danmuWebsocket) {
        if (self.platform !== 1) {
          self.danmuWebsocket.close()
          console.log('关闭上一个弹幕连接')
          self.danmuWebsocket.onopen = null
          self.danmuWebsocket.onmessage = null
          self.danmuWebsocket.onclose = null
          self.danmuWebsocket.onerror = null
        }
        self.danmuWebsocket = null
      }
      self.setVideoParamsFromArgs(args)
      try {
        self.dp = VideoTool.createDplayer(self.dp, self.videoUrl, self.platform)
        self.dplayerBindEvent()
        if (!self.danmuWebsocket) {
          const initWs = setInterval(function () {
            if (self.danmuWebsocket) {
              clearInterval(initWs)
            } else {
              self.danmuWebsocket = VideoTool.createDanmuWebsocket(self.platform, self.dp, self.danmuWebsocket,
                self.danmuWsUrl, self.liverInfo.room_id, self.danmuToken, self.danmuHuyaInfo)
              self.danmuHeartbeat = VideoTool.createDanmuHeartbeat(self.platform, self.danmuHeartbeat,
                self.danmuWebsocket, self.liverInfo.room_id, self.danmuToken)
              if (self.platform === 1) {
                self.danmuWebsocket.start()
              }
            }
          }, 1000)
        }
      } catch (e) {
        console.log(e)
      }
    })
  }

  mounted () {
    const self = this
    this.checkMouseInterval = setInterval(this.checkAutoHideBarNow, 50)
    this.hideTimeInterval = setInterval(this.autoHideBarAfterTime, 50)
    this.reloadInterval = setInterval(this.reloadIntervalFunc, 1000)
    const initDP = setInterval(function () {
      if (self.dp === undefined) {
        self.dp = VideoTool.createDplayer(self.dp, self.videoUrl, self.platform)
        self.dplayerBindEvent()
      } else {
        clearInterval(initDP)
      }
    }, 100)
    const initWs = setInterval(function () {
      if (!self.danmuWebsocket) {
        if (self.dp && self.liverInfo && self.danmuWsUrl) {
          // 确定了dplayer已经生成实例，则进行弹幕服务器的连接和加载
          self.danmuWebsocket = VideoTool.createDanmuWebsocket(self.platform, self.dp, self.danmuWebsocket,
            self.danmuWsUrl, self.liverInfo.room_id, self.danmuToken, self.danmuHuyaInfo)
          self.danmuHeartbeat = VideoTool.createDanmuHeartbeat(self.platform, self.danmuHeartbeat,
            self.danmuWebsocket, self.liverInfo.room_id, self.danmuToken)
          if (self.platform === 1) {
            self.danmuWebsocket.start()
          }
        }
      } else {
        clearInterval(initWs)
      }
    }, 200)
  }
}
</script>
<style>
#live-player {
  width: 100%;
  height: 100%;
  background: #2f2f2f;
  border-radius: 5px 5px 5px 5px;
}
#live-player .dplayer-controller-mask {
  display: none !important;
}

#live-player .dplayer-controller {
  background: #0404049e;
  width: 250px;
  margin: 14% auto;
  border-radius: 5px;
}
#live-player .dplayer-controller .dplayer-icons .dplayer-full .dplayer-full-in-icon {
  display: none !important;
}

#live-player .dplayer-live-badge {
  display: none !important;
}

#live-player .dplayer-volume {
  margin-left: -10px;
}

#live-player .dplayer-volume-bar{
  display: block;
  width: 70px;
}

#live-player .dplayer-thumb {
  transform: scale(1);
}

#live-player .dplayer-custom-danmu {
  color: white;
  cursor: pointer;
  margin-left: 12px;
  font-size: 14px;
  opacity: 0.9;
}

#live-player .danmu-open {
  color: #ff9d38 !important;
}

#live-player .dplayer-custom-danmu:hover {
  opacity: 1;
}

#live-player .dplayer-danmaku .dplayer-danmaku-item {
  text-shadow: 0.5px 0.5px 1px #404040 !important;
}
</style>
