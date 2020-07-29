import VueRouter, { Route } from 'vue-router'
import db from '../plugins/db'
import msgbox from '../plugins/msgbox'
import appConf from '../../main/config/appConf'
import axios from 'axios'
import os from 'os'
import flvjs from 'flv.js'
declare module 'vue/types/vue' {
  interface Vue {
    $router: VueRouter,
    $route: Route,
    $flvjs: typeof flvjs,
    $appconf: typeof appConf,
    $db: typeof db,
    $msgbox: typeof msgbox,
    $os: typeof os,
    $http: typeof axios
  }
}
