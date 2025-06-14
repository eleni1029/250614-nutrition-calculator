<template>
  <div id="app">
    <el-container class="main-container">
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><Calculator /></el-icon>
            營養計算工具
          </h1>
          <div class="header-subtitle">
            BMR / TDEE / 目標熱量計算器
          </div>
        </div>
      </el-header>
      
      <el-main class="app-main">
        <router-view />
      </el-main>
      
      <el-footer class="app-footer">
        <div class="footer-content">
          <p>&copy; 2025 營養計算工具 - 基於科學公式的精準計算</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { Calculator } from '@element-plus/icons-vue'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  // 初始化用戶 UUID
  userStore.initializeUser()
})
</script>

<style scoped>
.main-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 4px;
}

.app-main {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
}

.footer-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* 全域樣式重置 */
:deep(.el-card) {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #2c3e50;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .app-main {
    padding: 20px 16px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .header-content {
    padding: 0 16px;
  }
}
</style>