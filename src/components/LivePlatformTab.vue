<template>
  <v-tabs v-model="tab" id="live-platform"
          bg-color="grey-darken-3" slider-color="deep-orange-lighten-2"
          align-tabs="center"
          dark
          center-active
          fixed-tabs
          @click="changeTab()">
    <v-tab v-for="(item, index) in livePlatformItems" :key="index" :value="index" class="name-tab" color="white"
           :ripple=false>
      {{ item }}
    </v-tab>
  </v-tabs>
</template>

<script>
import {defineComponent, inject} from "vue";
import {ipcRenderer} from "electron";
import mainConfig from '../../electron/conf/main';

export default defineComponent({
  name: "LivePlatformTab",
  components: {},
  methods: {
    changeTab() {
      this.$emit('changeTab', this.tab)
      // ipcRenderer.send('refresh-live-list')
    }
  },
  data() {
    return {
      tab: 0, // 默认为斗鱼
      hideClass: '',
      livePlatformItems: mainConfig.getLivePlatformItems()
    }
  },
  mounted() {
  },
})
</script>

<style scoped>
#live-platform {
  position: absolute;
  top: 48px
}

#live-platform .name-tab {
  width: 100px;
  color: #a8a8a8;
}

</style>
