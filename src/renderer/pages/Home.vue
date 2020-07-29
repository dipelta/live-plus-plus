<template>
  <v-container>
    <SystemBar @editSheetListen="handleEditSheelValue" @settingSheetListen="handleSettingSheelValue"></SystemBar>
    <TitleBar></TitleBar>
    <LivePlatformTab @tabListen="handleTabValue" :settingSheet="settingSheet"></LivePlatformTab>
    <LiverList :livePlatformTab="defaultTab" :editSheet="editSheet"></LiverList>
    <EditSheet :editSheet="editSheet" :livePlatformTab="defaultTab"></EditSheet>
    <SettingSheet :settingSheet="settingSheet"></SettingSheet>
<!--    <LiveUrlSheet></LiveUrlSheet>-->
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SystemBar from '../components/SystemBar.vue'
import TitleBar from '../components/TitleBar.vue'
import LivePlatformTab from '../components/LivePlatformTab.vue'
import LiverList from '../components/LiverList.vue'
import EditSheet from '../components/Sheet/EditSheet.vue'
import SettingSheet from '../components/Sheet/SettingSheet.vue'
// import LiveUrlSheet from '../components/Sheet/LiveUrlSheet.vue'
import { ipcRenderer } from 'electron'
@Component({
  name: 'home',
  components: {
    SystemBar,
    TitleBar,
    LivePlatformTab,
    LiverList,
    EditSheet,
    SettingSheet
    // LiveUrlSheet
  }
})
export default class extends Vue {
  defaultTab: number = 0
  editSheet: boolean = false
  settingSheet: boolean = false

  private handleTabValue (val: any) {
    this.defaultTab = val
  }

  private handleEditSheelValue (val: boolean) {
    this.editSheet = val
  }

  private handleSettingSheelValue (val: boolean) {
    this.settingSheet = val
  }

  created () {
    const self = this
    ipcRenderer.on('realy-open-video', function (event, data) {
      console.log('realy-open-video')
      console.log(data)
      ipcRenderer.send('open-video', data)
    })
    ipcRenderer.on('video-switch', function (event, args) {
      console.log('切换直播源-home')
      console.log(args)
      const id = args[0]
      ipcRenderer.sendTo(id, 'video-switch-refresh', args[1])
    })
    ipcRenderer.on('live-url-to-clipboard', function (event, data) {
      self.$msgbox.show('直播地址复制到了剪切板中')
    })
  }
}
</script>

<style scoped>

</style>
