import {createApp} from 'vue'
import "./style.css"
import "video.js/dist/video-js.css"
// import App from './App.vue'
import App from './Index.vue'
import router from "./router";
import vuetify from './plugins/vuetify'
import {loadFonts} from './plugins/webfontloader'
import './samples/node-api'

loadFonts()

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app')
  .$nextTick(() => {
    postMessage({payload: 'removeLoading'}, '*')
  })
