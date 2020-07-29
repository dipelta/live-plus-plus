<template>
  <v-bottom-sheet hide-overlay persistent no-click-animation
                  id="settingSheet" v-model="settingSheet"
                  style="border-radius: 0 0 5px 5px">
    <v-sheet height="435px" elevation="0"
             style="box-shadow: inset 0px 0px 0px 1px #0000001f !important;border-radius: 0 0 5px 5px;">
      <v-row align="center" style="padding: 20px" id="settingGroup">
        <v-col cols="12">
          <v-select dense disable-lookup
                    :disabled="disabled"
                    :items="settingConfig.listRefreshRate"
                    :value="settingValue.listRefreshRate"
                    items-text="text"
                    items-value="value"
                    label="主播列表刷新频率"
                    @change="saveInDb('listRefreshRate', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <v-select dense disable-lookup
                    :disabled="disabled"
                    :items="settingConfig.listSortType"
                    :value="settingValue.listSortType"
                    items-text="text"
                    items-value="value"
                    label="排序方式（下次刷新时生效）"
                    @change="saveInDb('listSortType', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <v-select dense disable-lookup
                    :disabled="disabled"
                    :items="settingConfig.listClickEvent"
                    :value="settingValue.listClickEvent"
                    items-text="text"
                    items-value="value"
                    label="点击主播事件"
                    @change="saveInDb('listClickEvent', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <v-select dense disable-lookup
                    :disabled="disabled"
                    :items="settingConfig.showDanmaku"
                    :value="settingValue.showDanmaku"
                    items-text="text"
                    items-value="value"
                    label="播放器自动开启弹幕"
                    @change="saveInDb('showDanmaku', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <v-select dense disable-lookup
                    :disabled="disabled"
                    :items="settingConfig.videoReplayEvent"
                    :value="settingValue.videoReplayEvent"
                    items-text="text"
                    items-value="value"
                    label="暂停后再播放事件"
                    @change="saveInDb('videoReplayEvent', $event)"
          ></v-select>
        </v-col>
        <v-col cols="12">
          <v-select dense disable-lookup
                    :disabled="disabled"
                    :items="settingConfig.windowCloseEvent"
                    :value="settingValue.windowCloseEvent"
                    items-text="text"
                    items-value="value"
                    label="关闭主窗口事件"
                    @change="saveInDb('windowCloseEvent', $event)"
          ></v-select>
        </v-col>
      </v-row>
    </v-sheet>
  </v-bottom-sheet>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
@Component({
  name: 'EditSheet'
})
export default class extends Vue {
  disabled = false
  settingConfig = this.$appconf.getAppDefaultConfigList()
  settingValue = this.$db.get('system-config')
  @Prop() settingSheet: boolean | undefined

  @Watch('settingSheet')
  disableSetting (x: any, y: any) {
    this.disabled = !x
    this.settingValue = this.$db.get('system-config')
    // console.log(this.settingValue)
  }

  saveInDb (key: string, value?: any) {
    // console.log(key + '  :  ' + value)
    // console.log('new config, ready to save in db')
    const dbConfig = this.$db.get('system-config')
    dbConfig[key] = value
    this.$db.set('system-config', dbConfig)
    ipcRenderer.send('config-changed', [key])
  }
}
</script>

<style>
#settingGroup .v-select__slot .v-label {
  font-size: 16px;
}

#settingGroup .v-select__slot .v-select__selections {
  font-size: 14px;
}

#settingGroup .primary--text {
  color: #d45900 !important;
  caret-color: #d45900 !important;
}

#settingGroup .v-text-field .v-label--active {
  color: #d45900;
  font-size: 22px;
  line-height: 22px;
  height: 22px;
  transform: translateY(-24px) scale(.75);
}
</style>
