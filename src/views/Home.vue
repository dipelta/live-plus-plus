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
    }
  },
  mounted() {
    console.log('home page')

    ipcRenderer.on('reflush-live-list-reply', (event, args) => {
      this.reflushLoading = true
    })

    ipcRenderer.on('reflush-live-list-over-reply', (event, args) => {
      this.reflushLoading = false
    })
  }
})
</script>
