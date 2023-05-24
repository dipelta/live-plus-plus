<template>
  <div id="tool-btn-group" :class="toolBtnPlatfromClass">
    <v-icon id="addLiveBtn" :color="addLiveBtnColor" :class="'tool-btn ' + addLiveBtnPlatfromClass"
            @click.stop.native="addLiveBtnClick">mdi-account-search
    </v-icon>
    <v-icon id="settingBtn" :color="settingBtnColor" class="tool-btn"
            @click.stop.native="settingBtnClick">mdi-cog
    </v-icon>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import {ipcRenderer} from "electron";

export default defineComponent({
  name: 'ToolBtn',
  components: {},
  props: ['platformTab'],
  data() {
    return {
      openSettingStatus: false, // 打开设置窗口
      openAddLiveStatus: false, // 打开添加主播窗口
      settingBtnColor: 'white',
      addLiveBtnColor: 'white',
      toolBtnPlatfromClass: 'tool-btn-bar-mac',
      addLiveBtnPlatfromClass: '',
      loadingClass: 'reload-0',
      reflushLiveListOver: true,
    }
  },
  methods: {
    // 点击设置按钮
    settingBtnClick() {
      this.openSettingStatus = !this.openSettingStatus
      if (this.openAddLiveStatus) {
        this.openAddLiveStatus = !this.openAddLiveStatus
      }
      this.changeBtnColor()
      this.$emit('openSettingStatus', this.openSettingStatus)
      this.$emit('openAddLiveStatus', this.openAddLiveStatus)
    },

    // 点击编辑按钮
    addLiveBtnClick() {
      this.openAddLiveStatus = !this.openAddLiveStatus
      if (this.openSettingStatus) {
        this.openSettingStatus = !this.openSettingStatus
      }
      this.changeBtnColor()
      this.$emit('openAddLiveStatus', this.openAddLiveStatus)
      this.$emit('openSettingStatus', this.openSettingStatus)
    },

    changeBtnColor() {
      if (this.openSettingStatus) {
        this.settingBtnColor = 'deep-orange-lighten-2'
      } else {
        this.settingBtnColor = 'white'
      }
      if (this.openAddLiveStatus) {
        this.addLiveBtnColor = 'deep-orange-lighten-2'
      } else {
        this.addLiveBtnColor = 'white'
      }
    },
  },
  mounted() {
    const self = this
    if (process.platform !== 'darwin') {
      this.toolBtnPlatfromClass = 'tool-btn-bar-windows'
      this.addLiveBtnPlatfromClass = 'edit-btn-bar-windows'
    }
  },
  created() {
  },
})
</script>

<style scoped>
#tool-btn-group .tool-btn {
  opacity: 1;
}

#settingBtn {
  font-size: 15px;
  -webkit-app-region: no-drag;
  /*margin-top: 1px;*/
  margin-left: 4px;
  /*margin-right: 4px*/
}

#addLiveBtn {
  font-size: 17px;
  -webkit-app-region: no-drag;
}

#addLiveBtn:focus:after {
  opacity: 0;
}

#settingBtn:focus:after {
  opacity: 0;
}

.tool-btn-bar-windows {
  transform: rotateY(360deg) !important;
}

.edit-btn-bar-windows {
  transform: rotateY(180deg) !important;
}

.tool-btn-bar-mac {
  transform: rotateY(0deg) !important;
}

</style>
