<template>
  <v-container>
    <div id="video-container" style="border-radius: 5px">
      <VideoSystemBar :fullScreenStatus="fullScreenStatus" :roomName="roomName" />
      <vue-danmaku v-model:danmus="danmus" ref="danmakuRef" id="live-danmaku" speeds="100"
        :fontSize="danmuSettings.fontSize">
        <template #danmu="{ danmu }">
          <span
            :style="{ color: danmu.color || '#fff', fontWeight: 800, '-webkit-text-stroke': '0.3px #000', opacity: danmuSettings.opacity, fontSize: danmuSettings.fontSize + 'px' }">
            {{ danmu.text }}
          </span>
        </template>
      </vue-danmaku>
      <div ref="videoPlayer" style="height:100%; width:100%; border-radius: 5px">
        <video id="live-player" class="video-js" style="border-radius: 5px"></video>
      </div>
      <v-container id="video-ctrl-bar" style="text-align: center" :class="videoShowClass">
        <v-row align="center" justify="space-around">
          <v-col>
            <v-row align="center" style="width: 120px;margin-left: 0">
              <v-icon color="white" style="font-size: 20px;margin-top: -13px;">mdi-volume-high</v-icon>
              <v-slider color="blue" v-model="volume" thumb-color="white" style="margin-top: 7px;"></v-slider>
            </v-row>
          </v-col>
          <v-col style="vertical-align: center">
            <v-btn color="white" variant="text" :icon="videoPlayIcon" flat :ripple="false"
              style="font-size: 30px;margin-top: -20px" @click="togglePlay()"></v-btn>
          </v-col>
          <v-col style="position: relative;">
            <v-btn id="fontSettingBtn" :color="fontSettingBtnColor" variant="text" icon="mdi-format-size" flat :ripple="false"
              style="width:20px;font-size: 14px;margin-top: -16px;margin-left: 0px" @click="toggleFontCtrlBar()"></v-btn>
            <div id="font-ctrl-bar" :class="fontCtrlBarClass">
              <v-row align="center" style="padding: 5px 10px;">
                <v-icon color="white" style="font-size: 14px;">mdi-format-size</v-icon>
                <v-slider v-model="fontSizePercent" :min="50" :max="150" color="blue" thumb-color="white"
                  style="margin-top: 0px; margin-left: 5px;" hide-details></v-slider>
              </v-row>
              <v-row align="center" style="padding: 0px 10px; margin-top: -10px;">
                <v-icon color="white" style="font-size: 14px;">mdi-opacity</v-icon>
                <v-slider v-model="opacityPercent" :min="0" :max="100" color="blue" thumb-color="white"
                  style="margin-top: 0px; margin-left: 5px;"hide-details></v-slider>
              </v-row>
              
            </div>
            <v-btn :color="danmakuBtnColor" variant="text" icon="mdi-card-bulleted-outline" flat :ripple="false"
              style="width:20px;font-size: 14px;margin-top: -16px;margin-left: 30px" @click="toggleDanmaku()"></v-btn>
            <v-btn :color="fullScreenColor" variant="text" icon="mdi-fullscreen" flat :ripple="false"
              style="width:20px;font-size: 14px;margin-top: -16px;margin-left: 20px"
              @click="toggleFullScreen()"></v-btn>
          </v-col>
        </v-row>
      </v-container>
      <v-container id="video-switch-qn-bar" :class="videoShowClass">
        <v-list style="border-radius:5px; padding-top: 0;padding-bottom: 0;background: rgba(66, 66, 66, 0.9);">
          <v-list-item v-for="(item, index) in qnList" :key="index"
            style="padding: 5px;text-align: center;min-height: 0;color: white" @click.left.prevent="changeLiveQn(item)">
            <template v-if="parseInt(item.rate) === parseInt(this.currentQn)">
              <v-list-item-title style="font-size: 12px; color: #FF8A65">{{ item.name }}</v-list-item-title>
            </template>
            <template v-else>
              <v-list-item-title style="font-size: 12px">{{ item.name }}</v-list-item-title>
            </template>
          </v-list-item>
        </v-list>
      </v-container>
    </div>
  </v-container>
</template>

<script>
import { defineComponent, ref, toRaw } from "vue";
import VideoSystemBar from '../components/video/VideoSystemBar.vue'
import douyu from "../../src/plugins/danmaku/douyu";
import bilibili from "../../src/plugins/danmaku/bilibili";
import huya from "../../src/plugins/danmaku/huya";
import videojs from 'video.js';
import { ipcRenderer } from "electron";
import 'videojs-flvjs-es6'
import vueDanmaku from 'vue-danmaku'
import tool from "../plugins/tool";

const BTN_COLOR_ACTIVE = 'deep-orange-lighten-2'
const BTN_COLOR_DEFAULT = 'white'

export default defineComponent({
  name: "Video",
  components: {
    VideoSystemBar,
    vueDanmaku
  },
  methods: {
    // 切换清晰度
    changeLiveQn(item) {
      let rate = item.rate
      const platformTab = parseInt(tool.urlGetParams('platform'))
      const roomId = parseInt(tool.urlGetParams('room_id'))
      this.reloadVideoPlayer(platformTab, roomId, rate)
    },
    togglePlay() {
      if (this.player.paused()) { // true 直播没有播放
        this.videoPlayIcon = 'mdi-pause'
        // 再次播放时的动作根据配置进行，0-继续播放，1-更新到最近进度
        if (this.videoReplayEventConfig === 0) {
          this.player.play()
        } else {
          const platformTab = parseInt(tool.urlGetParams('platform'))
          const roomId = parseInt(tool.urlGetParams('room_id'))
          this.reloadVideoPlayer(platformTab, roomId, this.currentQn)
        }
      } else {
        this.videoPlayIcon = 'mdi-play'
        this.player.pause()
      }
    },
    toggleState(stateKey, colorKey) {
      this[colorKey] = this[stateKey] ? BTN_COLOR_DEFAULT : BTN_COLOR_ACTIVE
      this[stateKey] = !this[stateKey]
    },
    // 显示弹幕按钮
    toggleDanmaku() {
      this.toggleState('showDanmaku', 'danmakuBtnColor')
      if (this.showDanmaku) {
        this.$refs.danmakuRef.show()
        sessionStorage.setItem('auto_show_danmaku', "1")
      } else {
        this.$refs.danmakuRef.hide()
        sessionStorage.setItem('auto_show_danmaku', "0")
      }
    },
    // 全屏按钮
    toggleFullScreen() {
      this.toggleState('fullScreenStatus', 'fullScreenColor')
      const playerLive = document.querySelector('#app')
      if (this.fullScreenStatus) {
        playerLive.webkitRequestFullScreen()
      } else {
        document.webkitCancelFullScreen()
      }
      setTimeout(() => { this.$refs.danmakuRef.resize() }, 300)
    },
    // 调整弹幕字体按钮
    toggleFontCtrlBar() {
      this.toggleState('showFontCtrlBar', 'fontSettingBtnColor')
    },
    async reflushDanmakuInfo(platformTab, roomId) {
      console.log("尝试连接弹幕服务器")
      // console.log(this.danmuWebsocket)
      this.danmuQueue = []; // 清空弹幕队列
      if (this.danmuWebsocket) {
        console.log("发现已经存在danmakuRef对象，准备清除")
        this.$refs.danmakuRef.stop()
        this.danmuWebsocket.close()
        this.danmuWebsocket = null
      }
      if (this.heartbeat) {
        clearInterval(this.heartbeat)
      }
      this.$refs.danmakuRef.play()


      // 开始显示弹幕的任务
      if (this.danmuTask) {
        clearInterval(this.danmuTask)
      }
      this.danmuTask = setInterval(() => {
        if (this.danmuQueue.length > 0) {
          const danmu = this.danmuQueue.shift()
          this.$refs.danmakuRef.insert(danmu)
        }
      }, 10)


      if (platformTab === 0) { // 斗鱼弹幕
        this.danmuWebsocket = douyu.connectWs(roomId, (danmuMsg, danmuColor) => {
          this.danmuQueue.push({ text: danmuMsg, color: danmuColor })
        })
        // 重置心跳
        this.heartbeat = setInterval(() => {
          if (this.danmuWebsocket) {
            this.danmuWebsocket.send(douyu.packMsg('type@=mrkl/\0'))
          }
        }, 45000)
      } else if (platformTab === 1) { // B站弹幕
        let token = ""
        bilibili.connectWs(roomId, (danmuMsg, danmuColor, bilibiliToken) => {
          // 将弹幕信息发送到队列中
          this.danmuQueue.push({ text: danmuMsg, color: danmuColor })
          token = bilibiliToken
        }).then((ws) => {
          this.danmuWebsocket = ws
        })
        this.heartbeat = setInterval(() => {
          if (this.danmuWebsocket && token) {
            const msg = bilibili.packMsg(roomId, token, 2)
            if (msg) {
              this.danmuWebsocket.send(msg)
            }
          }
        }, 15000)
      } else { // 虎牙弹幕
        const chatInfo = await ipcRenderer.invoke('get-huya-chat-info', [roomId])
        huya.connectWs(chatInfo.data, roomId, (danmuMsg, danmuColor) => {
          this.danmuQueue.push({ text: danmuMsg, color: danmuColor })
        }).then((result) => {
          const info = result[0]
          const main_user_id = result[1]
          const client = result[2]
          this.danmuWebsocket = client
          this.heartbeat = setInterval(() => {
            huya.heartbeat(info, main_user_id, client)
          }, 60000)
        })
      }
    },
    reloadVideoPlayer(newplatformTab, newRoomId, rate) {
      this.qnList = [];
      this.$nextTick(() => {
        this.reflushRoomInfo(newplatformTab, newRoomId, rate)
      })
    },
    // 刷新流地址（不重新加载播放器，仅切换播放源）
    refreshStreamUrl() {
      console.log('Refreshing stream URL...')
      ipcRenderer.invoke('get-live-url-info', [this.currentPlatformTab, this.currentRoomId, this.currentQn])
        .then((data) => {
          if (data && data.url) {
            let liveUrl = data.url
            let liveUrlType = 'application/x-mpegURL'
            if (liveUrl.indexOf('.flv') !== -1) {
              liveUrlType = 'video/x-flv'
            }
            console.log('New stream URL:', liveUrl)
            this.switchPlayerSource(liveUrl, liveUrlType)
            this.liveUrl = liveUrl
          }
        })
        .catch((error) => {
          console.error('Failed to refresh stream URL:', error)
          setTimeout(() => {
            this.reloadVideoPlayer(this.currentPlatformTab, this.currentRoomId, this.currentQn)
          }, 2000)
        })
    },
    switchPlayerSource(liveUrl, liveUrlType) {
      const player = toRaw(this.player)
      if (!player) {
        return
      }
      try {
        player.pause()
        if (player.reset) {
          player.reset()
        }
      } catch (error) {
        console.log('player reset failed', error)
      }

      player.src({
        src: liveUrl,
        type: liveUrlType
      })
      player.load()
      player.play().catch((error) => {
        console.log('player play failed, retry once', error)
        setTimeout(() => {
          player.play().catch(() => {
          })
        }, 300)
      })
    },
    reflushRoomInfo(platformTab, roomId, rate) {

      // if (this.currentRoomId != roomId) {
      // ipcRenderer.send('alert-msg', ['brown', '直播加载中...'])
      // }

      ipcRenderer.invoke('get-live-url-info', [platformTab, roomId, rate]).then((data) => {
        // console.log(data)
        // 获取直播流的视频比例信息
        ipcRenderer.send('get-media-metadata', [data.url, ''])
        return data
      }).then((data) => {
        // 更新直播间名称
        ipcRenderer.invoke('get-room-info', [platformTab, [roomId]]).then((roomData) => {
          if (roomData) {
            this.roomName = roomData[0].room_name
          }
        })
        return data
      }).then((data) => {
        // 重载清晰度列表
        ipcRenderer.invoke('get-live-qn-list', [platformTab, roomId]).then((list) => {
          this.qnList = list
        })
        return data
      }).then((data) => {
        // 重载播放器
        let liveUrl = data.url
        this.currentQn = data.rate
        let liveUrlType = 'application/x-mpegURL' // hls
        if (liveUrl.indexOf('.flv') !== -1) {
          liveUrlType = 'video/x-flv'
        }
        if (liveUrl !== this.liveUrl) {
          this.switchPlayerSource(liveUrl, liveUrlType)
          this.liveUrl = liveUrl
        }

        console.log("liveUrl = " + liveUrl)
        console.log("liveUrlType = " + liveUrlType)
      }).then(() => {
        // this.player.play()
        // 重载弹幕播放模块
        if (this.danmuWebsocket) {
          console.log("发现已经存在danmakuRef对象，准备清除")
          this.$refs.danmakuRef.stop()
          this.danmuWebsocket.close()
          this.danmuWebsocket = null
        }
        this.reflushDanmakuInfo(platformTab, roomId)
      })
    }
  },
  mounted() {
    console.log(window.location.href)
    const self = this

    // 读取播放器弹幕开启设置、继续播放设置
    ipcRenderer.invoke('get-app-config', []).then((appConfig) => {
      self.showDanmakuConfig = appConfig.auto_show_danmaku
      self.videoReplayEventConfig = appConfig.video_replay_event

      // 从sessionStorage中获取当前弹幕的开关状态
      let sessionShowDanmakuConfig = sessionStorage.getItem('auto_show_danmaku')
      if (!sessionShowDanmakuConfig) {
        // 如果sessionStorage中不存在，则将用户的配置放入
        sessionStorage.setItem('auto_show_danmaku', self.showDanmakuConfig.toString())
        sessionShowDanmakuConfig = self.showDanmakuConfig.toString()
      }
      //修改当前的弹幕播放状态
      self.showDanmaku = sessionShowDanmakuConfig !== "1"
      self.toggleDanmaku()
    })

    this.playerOptions = {
      bigPlayButton: false,
      textTrackDisplay: false,
      posterImage: true,
      errorDisplay: false,
      autoplay: true,
      fluid: true,
      flvjs: {
        mediaDataSource: {
          isLive: true,
          cors: false,
          withCredentials: false,
        },
      },
    }
    this.player = videojs("live-player", this.playerOptions, function () {
    });

    this.currentPlatformTab = parseInt(tool.urlGetParams('platform'))
    this.currentRoomId = parseInt(tool.urlGetParams('room_id'))
    // const platformTab = parseInt(tool.urlGetParams('platform'))
    // const roomId = parseInt(tool.urlGetParams('room_id'))

    this.reflushRoomInfo(this.currentPlatformTab, this.currentRoomId, this.currentQn)

    // 流状态监控：检测缓冲区是否即将耗尽（对 HLS 和 FLV 都有效）
    this._refreshing = false
    this._streamMonitor = setInterval(() => {
      const player = this.player
      if (!player || player.paused() || this._refreshing) {
        return
      }
      const buffered = player.buffered()
      const currentTime = player.currentTime()

      if (buffered.length > 0) {
        const bufferEnd = buffered.end(buffered.length - 1)
        const bufferRemaining = bufferEnd - currentTime
        if (this.currentPlatformTab === 2) {
          // 缓冲区剩余不足2秒，判定为流失效
          if (bufferRemaining < 1.2) {
            console.log('Buffer nearly empty (' + bufferRemaining.toFixed(2) + 's), refreshing stream...')
            this._refreshing = true
            this.refreshStreamUrl()
            setTimeout(() => { this._refreshing = false }, 5000)
          }
        }

      }
    }, 1000)

    ipcRenderer.on('change-video-info', (event, args) => {
      console.log('change-video-info')
      if (this.currentPlatformTab !== parseInt(args[1]) || this.currentRoomId !== parseInt(args[2])) {
        this.currentPlatformTab = parseInt(args[1])
        this.currentRoomId = parseInt(args[2])
        this.$router.push({ path: '/video', query: { platform: parseInt(args[1]), room_id: parseInt(args[2]) } });
        console.log(window.location.href)
        console.log(this.player)
        setTimeout(() => {
          self.reloadVideoPlayer(this.currentPlatformTab, this.currentRoomId, null)
        }, 200)
      }
    })
    ipcRenderer.on('ws-danmaku-connect-error-notice', (event, args) => {
      setTimeout(() => {
        this.reflushDanmakuInfo(this.currentPlatformTab, this.currentRoomId)
      }, 3000)
    })
    ipcRenderer.on('mouse-leave-video-window', (event, args) => {
      this.videoShowClass = 'hide-video-ctrl'
    })
    ipcRenderer.on('mouse-nomove-video-window', (event, args) => {
      this.videoShowClass = 'hide-video-ctrl'
    })
    ipcRenderer.on('mouse-on-video-window', (event, args) => {
      this.videoShowClass = 'show-video-ctrl'
    })
    // 监听直播流ffmpeg的信息
    ipcRenderer.on('get-media-metadata-reply', (event, args) => {
      // console.log('监听直播流ffmpeg的信息')
      // console.log(args)
      const data = args[0].data
      // console.log(data.display_aspect_ratio)
      if (data.width && data.height) {
        let ratio = data.width + ":" + data.height
        // 改变窗口比例
        ipcRenderer.send('video-window-resize', [ratio])
      }
    })
    // 改变窗口大小后要重新加载弹幕的弹道
    ipcRenderer.on('video-window-resize', (event, args) => {
      setTimeout(() => {
        self.$refs.danmakuRef.resize()
      }, 300)
    })

  },
  setup(props) {
    const danmus = ref([])
    return { danmus }
  },
  beforeDestroy() {
    if (this._streamMonitor) {
      clearInterval(this._streamMonitor)
    }
    if (this.player) {
      this.player.dispose();
    }
  },
  computed: {
    fontCtrlBarClass() {
      return this.showFontCtrlBar ? 'show-video-ctrl' : 'hide-video-ctrl'
    }
  },
  watch: {
    "volume"(newVal, oldVal) {
      this.player.volume(newVal / 100)
    },
    fontSizePercent(newVal) {
      this.danmuSettings.fontSize = 20 * (newVal / 100)
    },
    opacityPercent(newVal) {
      this.danmuSettings.opacity = newVal / 100
    }
  },
  data() {
    return {
      platformTabPlatformId: 0,
      currentRoomId: 0,
      qnList: [],
      currentQn: null, // 当前清晰度
      danmuQueue: [],
      danmuTask: null,
      pageX: 0,
      pageY: 0,
      mousePosition: '',
      barStatus: true,
      volume: 100,
      player: null,
      playerOptions: null,
      liveUrl: '',
      roomName: 'Live++',
      danmuWebsocket: null, // 各平台弹幕ws
      heartbeat: null, // 弹幕心跳
      danmuSettings: {
        fontSize: 20,    // 弹幕字体大小（px）
        opacity: 1,      // 弹幕不透明度（0-1）
      },
      fontSettingBtnColor: 'white',    // 字体设置按钮颜色
      showFontCtrlBar: false,          // 是否显示字体控制栏
      fontSizePercent: 100,            // 字体大小百分比（50-150）
      opacityPercent: 100,             // 透明度百分比（0-100）
      videoShowClass: "show-video-ctrl",
      videoPlayIcon: "mdi-pause",
      showDanmaku: true,
      fullScreenStatus: false,
      danmakuBtnColor: 'deep-orange-lighten-2',
      fullScreenColor: 'white',
      showDanmakuConfig: 1, // 默认显示弹幕
      videoReplayEventConfig: 0, // 默认继续播放
    }
  },
})
</script>

<style scoped>
#video-container {
  width: 100%;
  height: 100%;
  background: #2f2f2f;
  border-radius: 5px 5px 5px 5px;
}

#live-danmaku {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #FFFFFF00;
  z-index: 1;
}

#video-ctrl-bar {
  position: absolute;
  width: 420px;
  height: 50px;
  border-radius: 10px;
  z-index: 2;
  background: rgba(66, 66, 66, 0.9);
  left: 50%;
  margin-left: -210px;
  top: 75%;
}

#font-ctrl-bar {
  position: absolute;
  width: 150px;
  padding: 15px 10px;
  border-radius: 10px;
  z-index: 10;
  background: rgba(66, 66, 66, 0.9);
  left: 15%;
  transform: translateX(-50%);
  bottom: 100%;
  margin-bottom: 20px;
}

#video-switch-qn-bar {
  position: absolute;
  width: auto;
  max-width: 200px;
  border-radius: 10px;
  z-index: 2;
  right: 1%;
  top: 5%;
}

.hide-video-ctrl {
  z-index: -1 !important;
  display: none !important;
}

.hide-video-danmaku {
  z-index: -1 !important;
  display: none !important;
}
</style>
