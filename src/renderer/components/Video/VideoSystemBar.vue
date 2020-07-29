<template>
  <v-system-bar fixed id="video-sys-bar" :class="barClass" color="grey darken-3"
                style="-webkit-app-region: drag;z-index: 10;padding: 0;border-radius: 5px 5px 0 0">
    <template v-if="sysPlatform !== 'darwin'">
      <div style="-webkit-app-region: no-drag;width: 100%" @dblclick="maxWindow">
        <div id="live-name" style="">{{ barTitle }}</div>
        <v-spacer style=""></v-spacer>
        <VideoSystemBtn></VideoSystemBtn>
      </div>
    </template>
    <template v-else>
      <div style="-webkit-app-region: no-drag;width: 100%" @dblclick="maxWindow">
        <VideoSystemBtn></VideoSystemBtn>
        <v-spacer></v-spacer>
        <div id="live-name">{{ barTitle }}</div>
      </div>
    </template>
  </v-system-bar>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import VideoSystemBtn from './VideoSystemBtn.vue'
import AppConf from '../../../main/config/appConf'
@Component({
  name: 'VideoSystemBar',
  components: {
    VideoSystemBtn
  }
})
export default class extends Vue {
  barClass = 'video-sys-bar-hide'
  @Prop() showStatus: boolean | undefined
  @Prop() onTheBar: boolean | undefined
  @Prop() barTitle: string | undefined
  sysPlatform = this.$appconf.getSysPlatform()

  @Watch('showStatus')
  changeShowStatus (newStatus:boolean, oldStatus:boolean) {
    this.showStatus = newStatus
    if (this.showStatus) {
      this.barClass = 'video-sys-bar-show'
    } else {
      this.barClass = 'video-sys-bar-hide'
    }
  }

  maxWindow () {
    if (AppConf.getSysPlatform() === 'darwin') {
      ipcRenderer.send('video-window-max', true)
    }
  }

  created () {
    if (this.showStatus === undefined) {
      this.showStatus = false
    } else {
      if (this.showStatus) {
        this.barClass = 'video-sys-bar-show'
      } else {
        this.barClass = 'video-sys-bar-hide'
      }
    }
  }
}
</script>

<style scoped>
#video-sys-bar {
}

#live-name {
  position: absolute;
  float: left;
  width: 90%;
  text-align: center;
  color: white;
  margin-left: 5%;
  height: 24px;
  line-height: 24px;
}

.video-sys-bar-show {
  display: block;
}

.video-sys-bar-hide {
  display: none;
}
</style>
