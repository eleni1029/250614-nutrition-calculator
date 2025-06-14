import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userUUID = ref('')
  
  // 生成 UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  // 初始化用戶 UUID
  function initializeUser() {
    let uuid = localStorage.getItem('userUUID')
    
    if (!uuid) {
      uuid = generateUUID()
      localStorage.setItem('userUUID', uuid)
    }
    
    userUUID.value = uuid
    
    // 設置 axios 默認標頭
    import('@/api/axios-config').then(() => {
      window.axios.defaults.headers.common['X-User-UUID'] = uuid
    })
  }
  
  // 重新生成用戶 UUID（清除歷史記錄時使用）
  function regenerateUser() {
    const newUUID = generateUUID()
    localStorage.setItem('userUUID', newUUID)
    userUUID.value = newUUID
    
    // 更新 axios 標頭
    import('@/api/axios-config').then(() => {
      window.axios.defaults.headers.common['X-User-UUID'] = newUUID
    })
  }
  
  return {
    userUUID,
    initializeUser,
    regenerateUser
  }
})