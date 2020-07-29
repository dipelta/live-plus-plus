<template>
  <v-system-bar fixed id="sys-bar" color="grey darken-3"
                style="-webkit-app-region: drag;z-index: 10;border-radius: 5px 5px 0 0">
    <template v-if="sysPlatform !== 'darwin'">
      <ToolBtn @editSheetListen="handleEditSheetValue" @settingSheetListen="handleSettingSheetValue"></ToolBtn>
      <v-spacer></v-spacer>
      <SystemBtn></SystemBtn>
    </template>
    <template v-else>
      <SystemBtn></SystemBtn>
      <v-spacer></v-spacer>
      <ToolBtn @editSheetListen="handleEditSheetValue" @settingSheetListen="handleSettingSheetValue"></ToolBtn>
    </template>
  </v-system-bar>
</template>

<script lang="ts">
import { Component, Emit, Vue } from 'vue-property-decorator'
import SystemBtn from '../../renderer/components/SystemBar/SystemBtn.vue'
import ToolBtn from '../../renderer/components/SystemBar/ToolBtn.vue'
@Component({
  name: 'SystemBar',
  components: {
    SystemBtn,
    ToolBtn
  }
})
export default class extends Vue {
  sysPlatform = this.$appconf.getSysPlatform()
  handleEditSheetValue (val: boolean) {
    this.handleEditSheet(val)
  }

  handleSettingSheetValue (val: boolean) {
    this.handleSettingSheet(val)
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

  created () {
  }
}
</script>

<style scoped>

</style>
