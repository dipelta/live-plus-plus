<template>
  <div id="sys-btn-group">
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
  name: 'SystemBtn'
})
export default class extends Vue {
  sysPlatform = this.$appconf.getSysPlatform()
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
    this.closeBtnClass = ''
    // 关闭主窗口
    ipcRenderer.send('main-window-close', ['MAIN_WINDOW', 'close'])
  }

  minusBtnClick () {
    this.minusBtnClass = 'light-minus'
  }

  minusBtnClickUp () {
    this.minusBtnClass = ''
    // 最小化主窗口
    ipcRenderer.send('main-window-min', ['MAIN_WINDOW', 'min'])
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
