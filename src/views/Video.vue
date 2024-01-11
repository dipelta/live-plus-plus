<template>
  <v-container>
    <div id="video-container" style="border-radius: 5px">
      <VideoSystemBar :fullScreenStatus="fullScreenStatus" :roomName="roomName"/>
      <vue-danmaku v-model:danmus="danmus" ref="danmakuRef" id="live-danmaku"
                   speeds="100" :extraStyle="extraStyle" fontSize="20">
      </vue-danmaku>
      <div ref="videoPlayer" style="height:100%; width:100%; border-radius: 5px">
        <video id="live-player" class="video-js" style="border-radius: 5px"></video>
      </div>
      <v-container id="video-ctrl-bar" style="text-align: center" :class="videoShowClass">
        <v-row align="center" justify="space-around">
          <v-col>
            <v-row align="center" style="width: 90px;margin-left: 0">
              <v-icon color="white" style="font-size: 20px;margin-top: -15px;">mdi-volume-high</v-icon>
              <v-slider color="blue" v-model="volume" thumb-color="white"
                        style="margin-top: 7px;"></v-slider>
            </v-row>
          </v-col>
          <v-col style="vertical-align: center">
            <v-btn color="white" variant="text" :icon="videoPlayIcon"
                   flat :ripple="false"
                   style="font-size: 30px;margin-top: -20px"
                   @click="togglePlay()"
            ></v-btn>
          </v-col>
          <v-col>
            <v-btn :color="danmakuBtnColor" variant="text" icon="mdi-card-bulleted-outline"
                   flat :ripple="false"
                   style="width:20px;font-size: 14px;margin-top: -16px;margin-left: 30px"
                   @click="toggleDanmaku()"></v-btn>
            <v-btn :color="fullScreenColor" variant="text" icon="mdi-fullscreen"
                   flat :ripple="false"
                   style="width:20px;font-size: 14px;margin-top: -16px;margin-left: 20px"
                   @click="toggleFullScreen()"></v-btn>
          </v-col>
        </v-row>
      </v-container>
      <v-container id="video-switch-qn-bar" :class="videoShowClass">
        <v-list style="border-radius:5px; padding-top: 0;padding-bottom: 0;background: rgba(66, 66, 66, 0.9);">
          <v-list-item v-for="(item, index) in qnList" :key="index"
                       style="padding: 5px;text-align: center;min-height: 0;color: white"
                       @click.left.prevent="changeLiveQn(item)">
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
import {defineComponent, ref, toRaw} from "vue";
import VideoSystemBar from '../components/video/VideoSystemBar.vue'
import douyu from "../../src/plugins/danmaku/douyu";
import bilibili from "../../src/plugins/danmaku/bilibili";
import huya from "../../src/plugins/danmaku/huya";
import videojs from 'video.js';
import {ipcRenderer} from "electron";
import 'videojs-flvjs-es6'
import vueDanmaku from 'vue3-danmaku'
import tool from "../plugins/tool";

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
      // console.log('即将切换清晰度:')
      // console.log('rate:' + rate)
      // console.log('platformTab:' + platformTab)
      // console.log('roomId:' + roomId)
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
    toggleDanmaku() {
      if (this.showDanmaku) {
        // 隐藏弹幕
        this.$refs.danmakuRef.hide()
        this.danmakuBtnColor = "white"
        sessionStorage.setItem('auto_show_danmaku', "0")
      } else {
        // 显示弹幕
        this.$refs.danmakuRef.show()
        this.danmakuBtnColor = "deep-orange-lighten-2"
        sessionStorage.setItem('auto_show_danmaku', "1")
      }
      this.showDanmaku = !this.showDanmaku
    },
    toggleFullScreen() {
      const playerLive = document.querySelector('#app');
      if (this.fullScreenStatus) {
        document.webkitCancelFullScreen()
        this.fullScreenColor = "white"
      } else {
        playerLive.webkitRequestFullScreen()
        this.fullScreenColor = "deep-orange-lighten-2"
      }
      this.fullScreenStatus = !this.fullScreenStatus
      setTimeout(() => {
        this.$refs.danmakuRef.resize()
      }, 300)
    },
    async makeDanmakuColorStyle(color) {
      this.extraStyle = "color: " + color + ";font-weight:800;-webkit-text-stroke: 0.3px #000;"
    },
    makeDefaultDanmakuColorStyle() {
      this.extraStyle = "color: #fff;font-weight:800;-webkit-text-stroke: 0.3px #000;"
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
          let first = this.danmuQueue[0]
          this.danmuQueue.shift()
          if (first.length === 1) {
            this.$refs.danmakuRef.insert(first[0])
          }
          if (first.length === 2) {
            this.makeDanmakuColorStyle(first[1]).then(() => {
              this.$refs.danmakuRef.insert(first[0])
            })
          }
        }
      }, 10)

      if (platformTab === 0) { // 斗鱼弹幕
        this.danmuWebsocket = douyu.connectWs(roomId, (danmuMsg, danmuColor) => {
          this.danmuQueue.push([danmuMsg, danmuColor])
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
          this.danmuQueue.push([danmuMsg, danmuColor])
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
          // this.$refs.danmakuRef.insert(content)
          this.danmuQueue.push([danmuMsg, danmuColor])
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
      this.player.dispose();
      this.$refs.videoPlayer.innerHTML = `<video id="live-player" class="video-js" style="border-radius: 5px"></video>`
      let playerOptions = {
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
      this.player = videojs("live-player", playerOptions, function () {
        // console.log("xxxx")
      });
      this.$nextTick(() => {
        // console.log('load')
        this.reflushRoomInfo(newplatformTab, newRoomId, rate)
      })
    },
    reflushRoomInfo(platformTab, roomId, rate) {
      ipcRenderer.send('alert-msg', ['brown', '直播加载中...'])
      ipcRenderer.invoke('get-live-url-info', [platformTab, roomId, rate]).then((data) => {
        console.log(data)
        let liveUrl = data.url
        this.currentQn = data.rate

        const player = toRaw(this.player)
        let liveUrlType = 'application/x-mpegURL' // hls
        if (liveUrl.indexOf('.flv') !== -1) {
          liveUrlType = 'video/x-flv'
        }
        player.src({
          src: liveUrl,
          type: liveUrlType
        })
        console.log("liveUrl = " + liveUrl)
        console.log("liveUrlType = " + liveUrlType)
        ipcRenderer.invoke('get-room-info', [platformTab, [roomId]]).then((data) => {
          if (data) {
            this.roomName = data[0].room_name
          }
        })
      }).then(() => {
        if (this.danmuWebsocket) {
          console.log("发现已经存在danmakuRef对象，准备清除")
          this.$refs.danmakuRef.stop()
          this.danmuWebsocket.close()
          this.danmuWebsocket = null
        }
        this.reflushDanmakuInfo(platformTab, roomId)
      }).then(() => {
        // 获取清晰度列表
        ipcRenderer.invoke('get-live-qn-list', [platformTab, roomId]).then((data) => {
          console.log(data)
          this.qnList = data

          console.log('当前清晰度, rate = ' + this.currentQn)

        })
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

    this.makeDefaultDanmakuColorStyle()
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

    const platformTab = parseInt(tool.urlGetParams('platform'))
    const roomId = parseInt(tool.urlGetParams('room_id'))

    this.reflushRoomInfo(platformTab, roomId, this.currentQn)

    ipcRenderer.on('change-video-info', (event, args) => {
      if (platformTab !== parseInt(args[1]) || roomId !== parseInt(args[2])) {
        const newplatformTab = parseInt(args[1])
        const newRoomId = parseInt(args[2])
        this.$router.push({path: '/video', query: {platform: parseInt(args[1]), room_id: parseInt(args[2])}});
        console.log(window.location.href)
        console.log(this.player)
        setTimeout(() => {
          self.reloadVideoPlayer(newplatformTab, newRoomId, null)
        }, 200)
      }
    })
    ipcRenderer.on('ws-danmaku-connect-error-notice', (event, args) => {
      setTimeout(() => {
        this.reflushDanmakuInfo(platformTab, roomId)
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
    // 改变窗口大小后要重新加载弹幕的弹道
    ipcRenderer.on('video-window-resize', (event, args) => {
      setTimeout(() => {
        self.$refs.danmakuRef.resize()
      }, 300)
    })

  },
  setup(props) {
    const danmus = ref([])
    return {danmus}
  },
  beforeDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  },
  watch: {
    "volume"(newVal, oldVal) {
      this.player.volume(newVal / 100)
    }
  },
  data() {
    return {
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
      extraStyle: "",
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
  width: 350px;
  height: 50px;
  border-radius: 10px;
  z-index: 2;
  background: rgba(66, 66, 66, 0.9);
  left: 50%;
  margin-left: -175px;
  top: 75%;
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

.show-video-ctrl {
  /*z-index: -1 !important;*/
  /*display: none !important;*/
}

</style>
