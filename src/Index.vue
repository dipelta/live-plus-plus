<template>
  <v-app id="vapp">
<!--    <h1>asdfasd</h1>-->
    <router-view id="route-view"></router-view>
<!--    <p>-->
<!--      <router-link to="/">Go to Home</router-link>-->
<!--      <router-link to="/video">Go to Video</router-link>-->
<!--    </p>-->
    <v-snackbar v-model="showMsg" min-width="auto" multi-line min-height="0"
                location="center" :timeout="1500" :color="msgColor">
      {{ msgContent }}
    </v-snackbar>
  </v-app>
</template>
<script lang="ts">
import {defineComponent} from 'vue'
import {ipcRenderer} from "electron";

export default defineComponent({
  name: 'App',
  components: {},
  methods: {},
  mounted() {
    console.log(window.location.href)
    // this.$router.push("/video");
  },
  created() {
    const self = this

    // 监听消息弹窗的事件
    ipcRenderer.on('alert-msg', function (event, args) {
      switch (args[0]) {
        case 'success':
          self.msgColor = 'green-lighten-1'
          break;
        case 'warning':
          self.msgColor = 'yellow-darken-1'
          break;
        case 'error':
          self.msgColor = 'deep-orange-accent-2'
          break;
        default:
          self.msgColor = 'light-blue-lighten-3'
          break;
      }
      self.msgContent = args[1];
      self.showMsg = true
    })
  },
  data() {
    return {
      showMsg: false,
      msgContent: "",
      msgColor: "deep-orange-accent-2"
    }
  },
})
</script>
<style>
#vapp {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  background: #fff0;
}

#route-view {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 5px;
}
</style>
