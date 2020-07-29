<!--suppress ALL -->
<template>
  <div>
    <template v-if="sysPlatform !== 'darwin'">
      <v-icon id="settingBtn" :color="settingBtnColor"
              style="font-size: 15px;-webkit-app-region: no-drag;margin-top: 1px;margin-left: -1px;margin-right: 4px"
              @click.stop.native="settingBtnClick" @mouseup="settingBtnClickUp">settings</v-icon>
      <v-icon id="editBtn" :color="editBtnColor" style="font-size: 16px;-webkit-app-region: no-drag;"
              @click.stop.native="editBtnClick" @mouseup="editBtnClickUp">mdi-account-edit</v-icon>
    </template>
    <template v-else>
      <v-icon id="editBtn" :color="editBtnColor" style="font-size: 16px;-webkit-app-region: no-drag;"
              @click.stop.native="editBtnClick" @mouseup="editBtnClickUp">mdi-account-edit</v-icon>
      <v-icon id="settingBtn" :color="settingBtnColor"
              style="font-size: 15px;-webkit-app-region: no-drag;margin-top: 1px;margin-left: 2px;margin-right: -2px"
              @click.stop.native="settingBtnClick" @mouseup="settingBtnClickUp">settings</v-icon>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
@Component({
  name: 'ToolBtn'
})
export default class extends Vue {
  sysPlatform = this.$appconf.getSysPlatform()
  // 设置按钮
  settingBtnColor = 'white'
  settingSheet = false
  // 编辑按钮
  editBtnColor = 'white'
  editSheet = false

  created () {
    const self = this
    ipcRenderer.on('menu-to-open-setting', function () {
      if (!self.settingSheet) {
        self.settingBtnClick()
      }
    })
  }

  // 点击设置按钮
  settingBtnClick () {
    // console.log('点击设置按钮')
    // 如果添加sheet在弹出状态，则关闭
    if (this.editSheet) {
      this.editBtnClick()
      this.editBtnClickUp()
    }
    this.settingSheet = !this.settingSheet
    if (this.settingSheet) {
      this.settingBtnColor = 'deep-orange lighten-2'
    } else {
      this.settingBtnColor = 'white'
    }
    this.handleSettingSheet(this.settingSheet)
  }

  settingBtnClickUp () {
    if (this.settingSheet) {
      this.settingBtnColor = 'deep-orange lighten-2'
    } else {
      this.settingBtnColor = 'white'
    }
  }

  // @ts-ignore
  @Emit('settingSheetListen')
  private handleSettingSheet (status: boolean) {
    return status
  }

  // @ts-ignore
  @Emit('editSheetListen')
  private handleEditSheet (status: boolean) {
    return status
  }

  // 点击编辑按钮
  editBtnClick () {
    // console.log('点击编辑按钮')
    if (this.settingSheet) {
      this.settingBtnClick()
      this.settingBtnClickUp()
    }
    this.editSheet = !this.editSheet
    if (this.editSheet) {
      this.editBtnColor = 'deep-orange lighten-2'
    } else {
      this.editBtnColor = 'white'
    }
    this.handleEditSheet(this.editSheet)
  }

  editBtnClickUp () {
    if (this.editSheet) {
      this.editBtnColor = 'deep-orange lighten-2'
    } else {
      this.editBtnColor = 'white'
    }
  }
}
</script>

<style scoped>
#editBtn:focus:after {
  opacity: 0;
}

#settingBtn:focus:after {
  opacity: 0;
}
</style>
