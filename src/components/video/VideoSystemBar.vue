<template>
  <v-system-bar fixed id="sys-bar" color="grey-darken-3" :class="systemPlatfromClass + ' ' + showStatus">
    <VideoSystemBtn/>
    <v-spacer></v-spacer>
    <span style="">{{ roomName }}</span>
    <v-spacer></v-spacer>
  </v-system-bar>
</template>

<script>
import {defineComponent, watch} from "vue";
import VideoSystemBtn from './VideoSystemBtn.vue'
import {ipcRenderer} from "electron";

export default defineComponent({
  name: 'VideoSystemBar',

  components: {
    VideoSystemBtn,
  },
  props: ['platformTab', 'roomName', 'fullScreenStatus'],
  methods: {},
  mounted() {
    const self = this
    if (process.platform !== 'darwin') {
      this.systemPlatfromClass = 'system-bar-windows'
    }
    ipcRenderer.on('mouse-leave-video-window', (event, args) => {
      self.showStatus = 'hide-bar'
    })
    ipcRenderer.on('mouse-on-video-window', (event, args) => {
      if (this.fullScreenStatus === false) {
        self.showStatus = 'show-bar'
      }
    })
    ipcRenderer.on('mouse-nomove-video-window', (event, args) => {
      self.showStatus = 'hide-bar'
    })
  },
  data() {
    return {
      mouseX: 0,
      mouseY: 0,
      systemPlatfromClass: 'system-bar-mac',
      showStatus: 'show-bar',
    }
  },
  watch: {
    fullScreenStatus: function (newVal, oldVal) {
      if (newVal === true) {
        this.showStatus = 'hide-bar'
      } else {
        this.showStatus = 'show-bar'
      }
    }
  },
  // watch: {
  // mousePosition: function (newV, oldV) {
  //   if (this.mousePositionArr.length >= 3) {
  //     this.mousePositionArr.shift()
  //   }
  //   this.mousePositionArr.push(newV)
  //   this.showStatus = 'show-bar'
  // },
  // barStatus: function (newV, oldV) {
  //   if (newV === false) {
  //     this.showStatus = 'hide-bar'
  //   } else {
  //     this.showStatus = 'show-bar'
  //   }
  // }
  // },
})
</script>

<style scoped>
#sys-bar {
  -webkit-app-region: no-drag;
  border-radius: 5px 5px 0 0;
  z-index: 100;
}

.system-bar-windows {
  transform: rotateY(180deg) !important;
}

.system-bar-mac {
  transform: rotateY(0deg) !important;
}

.hide-bar {
  z-index: -1 !important;
  display: none !important;
}

.show-bar {
  /*z-index: 0 !important;*/
  /*display: flex !important;*/
}

</style>
