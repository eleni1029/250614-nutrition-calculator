import axios from 'axios'
import { ElMessage } from 'element-plus'

// 創建 axios 實例
const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 請求攔截器
instance.interceptors.request.use(
  (config) => {
    // 從 localStorage 獲取用戶 UUID
    const userUUID = localStorage.getItem('userUUID')
    if (userUUID) {
      config.headers['X-User-UUID'] = userUUID
    }
    
    return config
  },
  (error) => {
    console.error('請求錯誤:', error)
    return Promise.reject(error)
  }
)

// 響應攔截器
instance.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // API 返回成功
    if (data.success) {
      return data
    }
    
    // API 返回失敗
    ElMessage.error(data.error || '請求失敗')
    return Promise.reject(new Error(data.error || '請求失敗'))
  },
  (error) => {
    console.error('響應錯誤:', error)
    
    let errorMessage = '網路錯誤，請稍後再試'
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          errorMessage = data.error || '請求參數錯誤'
          break
        case 404:
          errorMessage = '請求的資源不存在'
          break
        case 500:
          errorMessage = '伺服器內部錯誤'
          break
        default:
          errorMessage = data.error || `請求失敗 (${status})`
      }
    } else if (error.request) {
      errorMessage = '網路連線失敗，請檢查網路連線'
    }
    
    ElMessage.error(errorMessage)
    return Promise.reject(error)
  }
)

// 將 axios 實例掛載到全域，方便其他地方使用
window.axios = instance

export default instance