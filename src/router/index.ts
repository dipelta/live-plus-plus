import * as VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Video from '../views/Video.vue'

const routes = [
  {path: '/', component: Home},
  {path: '/home', component: Home},
  {path: '/video', component: Video},
]

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(import.meta.env.VITE_BASE_PATH as string),
  routes,
})

export default router
