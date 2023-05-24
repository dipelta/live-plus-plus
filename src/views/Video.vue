<template>
  <v-container>
    <div id="video-container">
      <VideoSystemBar :fullScreenStatus="fullScreenStatus" :roomName="roomName"/>
      <vue-danmaku v-model:danmus="danmus" ref="danmakuRef" id="live-danmaku"
                   speeds="100" :extraStyle="extraStyle" fontSize="20">
      </vue-danmaku>
      <video id="live-player" class="video-js"></video>
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
    togglePlay() {
      if (this.player.paused()) { // true 直播没有播放
        this.videoPlayIcon = 'mdi-pause'
        this.player.play()
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
      } else {
        // 显示弹幕
        this.$refs.danmakuRef.show()
        this.danmakuBtnColor = "deep-orange-lighten-2"
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
    makeDanmakuColorStyle(color) {
      this.extraStyle = "color: " + color + ";font-weight:800;-webkit-text-stroke: 0.3px #000;"
    },
    makeDefaultDanmakuColorStyle() {
      this.extraStyle = "color: #fff;font-weight:800;-webkit-text-stroke: 0.3px #000;"
    },
    reflushDanmakuInfo(platformTab, roomId) {
      console.log("尝试连接弹幕服务器")
      if (this.danmuWebsocket) {
        this.$refs.danmakuRef.stop()
        this.danmuWebsocket.close()
        this.danmuWebsocket = null
      }
      if (this.heartbeat) {
        clearInterval(this.heartbeat)
      }
      if (platformTab === 0) { // 斗鱼弹幕
        this.danmuWebsocket = douyu.connectWs(roomId, (danmuMsg, danmuColor) => {
          this.makeDanmakuColorStyle(danmuColor)
          this.$refs.danmakuRef.insert(danmuMsg)
          this.$refs.danmakuRef.play()
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
          this.makeDanmakuColorStyle(danmuColor)
          this.$refs.danmakuRef.insert(danmuMsg)
          this.$refs.danmakuRef.play()
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
        huya.getChatInfo(roomId).then((chat) => {
          huya.connectWs(chat, roomId, (content) => {
            this.$refs.danmakuRef.insert(content)
          }).then((result) => {
            const info = result[0]
            const main_user_id = result[1]
            const client = result[2]
            this.heartbeat = setInterval(() => {
              huya.heartbeat(info, main_user_id, client)
            }, 60000)
          })
        })
      }
    },
    reflushRoomInfo(platformTab, roomId) {
      ipcRenderer.invoke('get-live-url-info', [platformTab, roomId]).then((liveUrl) => {
        console.log(liveUrl)
        const player = toRaw(this.player)
        let liveUrlType = 'application/x-mpegURL' // hls
        if (platformTab === 2) {
          liveUrlType = 'video/x-flv'
        }
        player.src({
          src: liveUrl,
          type: liveUrlType
        })
        ipcRenderer.invoke('get-room-info', [platformTab, [roomId]]).then((data) => {
          if (data) {
            this.roomName = data[0].room_name
          }
        })
      }).then(() => {
        this.reflushDanmakuInfo(platformTab, roomId)
      })
    }
  },
  mounted() {
    console.log(window.location.href)
    const self = this
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

    this.reflushRoomInfo(platformTab, roomId)

    ipcRenderer.on('change-video-info', (event, args) => {
      if (platformTab !== parseInt(args[1]) || roomId !== parseInt(args[2])) {
        this.$router.push({path: '/video', query: {platform: parseInt(args[1]), room_id: parseInt(args[2])}});
        const player = toRaw(self.player)
        player.dispose()
        setTimeout(() => {
          window.location.reload()
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

#live-player {
  position: absolute;
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
