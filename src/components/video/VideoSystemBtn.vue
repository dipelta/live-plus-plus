<template>
  <div id="sys-btn-group">
    <v-icon :class="'sys-btn close ' + sysBtnClass + ' ' + closeBtnClass"
            @mousemove="sysBtnHover" @mouseout="sysBtnNoHover"
            @mousedown="closeBtnClick" @mouseup="closeBtnClickUp">mdi-close
    </v-icon>
    <v-icon :class="'sys-btn minus ' + sysBtnClass + ' ' + minusBtnClass"
            @mousemove="sysBtnHover" @mouseout="sysBtnNoHover"
            @mousedown="minusBtnClick" @mouseup="minusBtnClickUp">mdi-minus
    </v-icon>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import {ipcRenderer} from "electron";

export default defineComponent({
  name: 'VideoSystemBtn',
  components: {},

  methods: {
    sysBtnHover() {
      this.sysBtnClass = 'hover'
    },

    sysBtnNoHover() {
      this.sysBtnClass = ''
      this.closeBtnClass = ''
      this.minusBtnClass = ''
    },

    closeBtnClick() {
      this.closeBtnClass = 'light-close'
    },

    closeBtnClickUp() {
      this.closeBtnClass = ''
      // 关闭主窗口
      ipcRenderer.send('window-close', ['VIDEO_WINDOW', 'close'])
    },

    minusBtnClick() {
      this.minusBtnClass = 'light-minus'
    },

    minusBtnClickUp() {
      this.minusBtnClass = ''
      // 最小化主窗口
      ipcRenderer.send('window-min', ['VIDEO_WINDOW', 'min'])
    }
  },
  data() {
    return {
      sysBtnClass: '',
      closeBtnClass: '',
      minusBtnClass: '',
      platform: process.platform
    }
  },
  mounted() {
  }
})
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
  opacity: 1;
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
