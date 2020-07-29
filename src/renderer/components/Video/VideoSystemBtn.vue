<template>
  <div id="sys-btn-group" style="height: 24px;line-height: 24px" :class="groupClass">
    <template v-if="sysPlatform !== 'darwin'">
      <v-icon size="10" :class="'sys-btn-win minus ' + sysBtnClass + ' ' + minusBtnClass"
              @mousemove="sysBtnHover" @mouseout="sysBtnNoHover"
              @mousedown="minusBtnClick" @mouseup="minusBtnClickUp">mdi-minus</v-icon>
      <v-icon size="10" :class="'sys-btn-win close ' + sysBtnClass + ' ' + closeBtnClass"
              @mousemove="sysBtnHover" @mouseout="sysBtnNoHover"
              @mousedown="closeBtnClick" @mouseup="closeBtnClickUp">mdi-close</v-icon>
    </template>
    <template v-else>
      <v-icon size="10" :class="'sys-btn close ' + sysBtnClass + ' ' + closeBtnClass"
              @mousemove="sysBtnHover" @mouseout="sysBtnNoHover"
              @mousedown="closeBtnClick" @mouseup="closeBtnClickUp">mdi-close</v-icon>
      <v-icon size="10" :class="'sys-btn minus ' + sysBtnClass + ' ' + minusBtnClass"
              @mousemove="sysBtnHover" @mouseout="sysBtnNoHover"
              @mousedown="minusBtnClick" @mouseup="minusBtnClickUp">mdi-minus</v-icon>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
@Component({
  name: 'VideoSystemBtn'
})
export default class extends Vue {
  sysPlatform = this.$appconf.getSysPlatform()
  groupClass = ''
  sysBtnClass = ''
  closeBtnClass = ''
  minusBtnClass = ''
  sysBtnHover () {
    this.sysBtnClass = 'hover'
  }

  sysBtnNoHover () {
    this.sysBtnClass = ''
    this.closeBtnClass = ''
    this.minusBtnClass = ''
  }

  closeBtnClick () {
    this.closeBtnClass = 'light-close'
  }

  closeBtnClickUp () {
    console.log('关闭video窗口')
    this.closeBtnClass = ''
    // 关闭video窗口
    ipcRenderer.send('video-window-close', ['VIDEO_WINDOW', 'close'])
  }

  minusBtnClick () {
    this.minusBtnClass = 'light-minus'
  }

  minusBtnClickUp () {
    console.log('最小化video窗口')
    this.minusBtnClass = ''
    // 最小化video窗口
    ipcRenderer.send('video-window-min', ['VIDEO_WINDOW', 'min'])
  }

  created () {
    if (this.sysPlatform !== 'darwin') {
      this.groupClass = 'sys-btn-right'
    } else {
      // mac
      this.groupClass = 'sys-btn-left'
    }
  }
}
</script>

<style scoped>
#sys-btn-group .sys-btn {
  font-size: 10px;
  width: 12px;
  height: 12px;
  color: #007fff00;
  margin-right: 8px;
  border-radius: 100%;
  background: azure;
  -webkit-app-region: no-drag;
}

#sys-btn-group .sys-btn-win {
  font-size: 10px;
  width: 12px;
  height: 12px;
  color: #007fff00;
  border-radius: 100%;
  margin-right: 0;
  margin-left: 8px;
  background: azure;
  -webkit-app-region: no-drag;
}

.sys-btn-left {
  float: left;
  margin-left: 8px;
}

.sys-btn-right {
  float: right;
  margin-right: 8px;
}

#sys-btn-group .light-close {
  background: #ff8989 !important;
}

#sys-btn-group .light-minus {
  background: #ffea81 !important;
}

#sys-btn-group .close {
  background: #ff5555;
}

#sys-btn-group .minus {
  background: #ffd400;
}

#sys-btn-group .hover {
  color: #252525 !important;
}
</style>
