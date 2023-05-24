<template>
  <v-system-bar fixed id="sys-bar" color="grey-darken-3" :class="systemPlatfromClass">
    <SystemBtn/>
    <v-spacer></v-spacer>
    <ToolBtn :platformTab="platformTab" @openAddLiveStatus="changeOpenAddLiveStatus" @openSettingStatus="changeOpenAppsettingStatus"/>
  </v-system-bar>
</template>

<script>
import {defineComponent} from "vue";
import SystemBtn from './SystemBtn.vue'
import ToolBtn from './ToolBtn.vue'

export default defineComponent({
  name: 'SystemBar',

  components: {
    SystemBtn,
    ToolBtn
  },
  props: ['platformTab'],
  methods: {
    changeOpenAddLiveStatus(status) {
      this.openAddLiveStatus = status
      this.$emit('openAddLiveStatus', this.openAddLiveStatus)
    },
    changeOpenAppsettingStatus(status) {
      this.openSettingStatus = status
      this.$emit('openSettingStatus', this.openSettingStatus)
    }
  },
  mounted() {
    if (process.platform !== 'darwin') {
      this.systemPlatfromClass = 'system-bar-windows'
    }
  },
  data() {
    return {
      systemPlatfromClass: 'system-bar-mac',
      openSettingStatus: false, // 打开设置窗口
      openAddLiveStatus: false, // 打开添加主播窗口
    }
  },
})
</script>

<style scoped>
#sys-bar {
  -webkit-app-region: drag;
  z-index: 10;
  border-radius: 5px 5px 0 0
}

.system-bar-windows {
  transform: rotateY(180deg) !important;
}

.system-bar-mac {
  transform: rotateY(0deg) !important;
}
</style>
