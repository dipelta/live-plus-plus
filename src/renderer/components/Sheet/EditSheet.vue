<template>
  <v-bottom-sheet id="editSheet" v-model="editSheet" hide-overlay dark persistent no-click-animation
                  style="border-radius: 0 0 5px 5px">
    <v-sheet class="text-center" id="add-liver-sheet" height="45px" style="border-radius: 0 0 5px 5px" color="grey darken-3" >
      <v-text-field solo v-model="inputValue" :label="inputLabel" :append-icon="appendIcon" :disabled="inputDisable"
                    @click:append="submit" :loading="loading" style="background: none;border-radius: 0 0 5px 5px;">
        <template v-slot:progress>
          <v-progress-circular size="20" indeterminate color="deep-orange lighten-2" ></v-progress-circular>
        </template>
      </v-text-field>
    </v-sheet>
  </v-bottom-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import LiveTool from '../../../ext/plugins/livetool'
@Component({
  name: 'EditSheet'
})
export default class extends Vue {
  inputValue = ''
  inputLabel = '请输入房间号'
  inputDisable = false
  appendIcon = 'add'
  loading = false
  @Prop() editSheet: boolean | undefined
  @Prop() livePlatformTab: number | undefined

  @Watch('livePlatformTab')
  changeEditSheetInputValue (platform: any, oldVal: any) {
    this.changeInputLabel(platform)
  }

  changeInputLabel (platform: number) {
    if (platform === 0) {
      this.inputLabel = '请输入房间号(斗鱼)'
    } else if (platform === 1) {
      this.inputLabel = '请输入房间号(虎牙)'
    } else if (platform === 2) {
      this.inputLabel = '请输入房间号(哔哩哔哩)'
    }
  }

  submit () {
    // console.log('input submit click')
    const timer = setTimeout(() => {
      clearTimeout(timer)
      if (self.inputDisable) {
        self.$msgbox.show('操作超时，请重试', 'warning')
        this.changeInputStatus(true)
      }
    }, 5000)
    const self = this
    if (!this.inputValue) {
      this.$msgbox.show('房间号不能为空', 'error')
    } else if (!new RegExp(/^[0-9]\d*$/).test(this.inputValue)) {
      this.$msgbox.show('房间号只能是数字', 'error')
    } else if (this.checkIsHas(this.inputValue, this.livePlatformTab)) {
      self.$msgbox.show('已经订阅过此主播', 'warning')
    } else {
      this.changeInputStatus(false)
      // 发送请求，获取主播信息
      ipcRenderer.send('get-liver-info', [this.livePlatformTab, this.inputValue])
      ipcRenderer.once('get-liver-info', function (event, res: any) {
        // console.log(res)
        if (res.errorCode === 0) {
          // 写入数据库
          const isSave = LiveTool.saveToDB(res.platform, res.data)
          if (isSave) {
            // 立即刷新列表数据
            ipcRenderer.send('refresh-live-list')
            self.inputValue = ''
            self.changeInputStatus(true)
          } else {
            self.$msgbox.show('添加失败，请重试', 'error')
            self.changeInputStatus(true)
          }
        } else {
          self.$msgbox.show(res.errorMsg, 'error')
          self.changeInputStatus(true)
        }
      })
    }
  }

  // 检查数据库中是否已经订阅过此主播，存在-true，不存在-false
  checkIsHas (roomId: string, livePlatformTab: number | undefined) {
    let followInfo
    if (livePlatformTab === 0) {
      followInfo = this.$db.get('douyu')
    } else if (livePlatformTab === 1) {
      followInfo = this.$db.get('huya')
    } else if (livePlatformTab === 2) {
      followInfo = this.$db.get('bilibili')
    } else {
      return false
    }
    let isHas = false
    followInfo.forEach(function (item: any, index: any) {
      if (item.room_id === roomId) {
        isHas = true
      }
    })
    return isHas
  }

  changeInputStatus (status: boolean) {
    if (status) {
      this.inputDisable = false
      this.appendIcon = 'add'
      this.loading = false
    } else {
      this.inputDisable = true
      this.appendIcon = ''
      this.loading = true
    }
  }

  created () {
    if (this.livePlatformTab !== undefined) {
      this.changeInputLabel(this.livePlatformTab)
    }
  }
}
</script>

<style>
#add-liver-sheet .v-input__slot {
  background: none !important;
}
</style>
