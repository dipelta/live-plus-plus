import Vue from 'vue'
import App from './renderer/App.vue'
import router from './ext/router'
import db from './ext/plugins/db'
import appConf from './main/config/appConf'
import vuetify from './ext/plugins/vuetify'
import Message from './ext/plugins/msgbox'
import axios from 'axios'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/dist/vuetify.min.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import os from 'os'
import flvjs from 'flv.js'

Vue.config.productionTip = false
Vue.prototype.$http = axios
Vue.prototype.$db = db
Vue.prototype.$os = os
Vue.prototype.$appconf = appConf
Vue.prototype.$msgbox = Message
Vue.prototype.$flvjs = flvjs
// Vue.prototype.$vv = vuetify

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
