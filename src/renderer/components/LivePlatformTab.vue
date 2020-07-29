<template>
  <v-tabs v-model="tab"
          background-color="grey darken-3" slider-color="deep-orange lighten-2"
          grow dark centered @change="changeTab" style="position: fixed;top: 48px">
    <v-tab v-for="item in livePlatformItems" :key="item" :class="'live-platform ' + hideClass" :ripple=false>
      {{ item }}
    </v-tab>
  </v-tabs>
</template>

<script lang="ts">
import { Component, Vue, Emit, Prop, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
@Component({
  name: 'LivePlatformTab'
})
export default class extends Vue {
  tab = 0
  hideClass = ''
  @Prop() settingSheet: boolean | undefined
  livePlatformItems = [
    '斗鱼', '虎牙', '哔哩哔哩'
  ]

  // @ts-ignore
  @Emit('tabListen')
  private handleTab (tabNumber: any) {
    return tabNumber
  }

  @Watch('settingSheet')
  hideTab (x:any, y:any) {
    const self = this
    if (x) {
      setTimeout(function () {
        self.hideClass = 'live-platform-hide'
      }, 300)
    } else {
      this.hideClass = ''
    }
  }

  changeTab () {
    this.handleTab(this.tab)
    ipcRenderer.send('refresh-live-list')
  }
}
</script>

<style scoped>
.live-platform-hide {
  display: none;
}

.live-platform:focus:before {
  opacity: 0 !important;
}

.live-platform:hover:before {
  opacity: 0 !important;
}

</style>
