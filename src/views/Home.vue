<template>
  <v-container>
    <v-progress-linear
        :active="reflushLoading"
        :indeterminate="reflushLoading"
        absolute
        bottom
        color="deep-orange-lighten-2"
        height="2"
        style="z-index: 1010;"
    ></v-progress-linear>
    <SystemBar :platformTab="platformTab" @openAddLiveStatus="changeOpenAddLiveStatus" @openSettingStatus="changeOpenAppSettingStatus"/>
    <TitleBar/>
    <LivePlatformTab @changeTab="changeTab"/>
    <LiveList :platformTab="platformTab"/>
    <AddLive :openAddLiveStatus="openAddLiveStatus" :platformTab="platformTab"/>
    <AppSetting :openSettingStatus="openSettingStatus"></AppSetting>

    <v-dialog v-model="appUpdateDialog" width="auto">
      <v-card>
        <v-card-text>
          发现新版本，是否更新？
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green-darken-1" variant="text" @click="installUpdateFile">
            更新
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn color="red-darken-1" variant="text" @click="appUpdateDialog = false">
            取消
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script lang="ts">
import {defineComponent} from 'vue'
import SystemBar from '../components/system/SystemBar.vue'
import TitleBar from '../components/TitleBar.vue'
import LivePlatformTab from '../components/LivePlatformTab.vue'
import LiveList from "../components/livelist/LiveList.vue";
import AddLive from "../components/livelist/AddLive.vue";
import AppSetting from "../components/system/AppSetting.vue";
import {ipcRenderer} from "electron";

export default defineComponent({
  name: 'Home',
  components: {
    SystemBar,
    TitleBar,
    LivePlatformTab,
    LiveList,
    AddLive,
    AppSetting
  },
  data() {
    return {
      platformTab: 0,
      openSettingStatus: false, // 打开设置窗口
      openAddLiveStatus: false, // 打开添加主播窗口
      reflushLoading: false,
      appUpdateDialog: false
    }
  },
  methods: {
    changeTab(tab) {
      this.platformTab = tab
    },
    changeOpenAddLiveStatus(status) {
      this.openAddLiveStatus = status
    },
    changeOpenAppSettingStatus(status) {
      this.openSettingStatus = status
    },
    installUpdateFile() {
      this.appUpdateDialog = !this.appUpdateDialog
      ipcRenderer.send('alert-msg', ['success', '即将关闭程序进行更新，安装成功后应用将会自动重启'])
      setTimeout(()=>{
        ipcRenderer.send('install-update-file', [])
      }, 1500)
    }
  },
  mounted() {

    // 新版本已经下载结束，提示用户是否需要更新
    ipcRenderer.on('app-update-available', (event, args) => {
      this.appUpdateDialog = !this.appUpdateDialog
    })

    ipcRenderer.on('reflush-live-list-reply', (event, args) => {
      this.reflushLoading = true
    })

    ipcRenderer.on('reflush-live-list-over-reply', (event, args) => {
      this.reflushLoading = false
    })
  }
})
</script>
