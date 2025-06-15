import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '營養計算工具'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue'),
    meta: {
      title: '計算歷史'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守衛 - 設置頁面標題
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '營養計算工具'
  next()
})

export default router