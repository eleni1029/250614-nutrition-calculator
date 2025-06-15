<template>
  <div class="history-container">
    <!-- 頁面標題 -->
    <div class="page-header">
      <div class="header-content">
        <el-button @click="$router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">
          <el-icon><Clock /></el-icon>
          計算歷史
        </h1>
      </div>
      
      <div class="header-actions">
        <el-button @click="refreshHistory" :loading="loading">
          <el-icon><Refresh /></el-icon>
          重新載入
        </el-button>
        <el-button type="danger" @click="clearAllHistory" :loading="clearing">
          <el-icon><Delete /></el-icon>
          清空全部
        </el-button>
      </div>
    </div>

    <!-- 篩選器 -->
    <el-card class="filter-card">
      <el-form :model="filters" class="filter-form" :inline="true">
        <el-form-item label="計算類型">
          <el-select v-model="filters.type" placeholder="全部類型" @change="loadHistory">
            <el-option value="" label="全部類型" />
            <el-option value="bmr" label="BMR 計算" />
            <el-option value="tdee" label="TDEE 計算" />
            <el-option value="target_calories" label="目標熱量" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="顯示數量">
          <el-select v-model="filters.limit" @change="loadHistory">
            <el-option :value="10" label="10 筆" />
            <el-option :value="20" label="20 筆" />
            <el-option :value="50" label="50 筆" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 歷史記錄列表 -->
    <div class="history-content">
      <el-empty v-if="!loading && history.length === 0" description="尚無計算記錄">
        <el-button type="primary" @click="$router.push('/')">
          開始計算
        </el-button>
      </el-empty>

      <div v-else class="history-list">
        <el-card 
          v-for="record in history" 
          :key="record.id"
          class="history-item"
          :class="`type-${record.calculation_type}`"
        >
          <template #header>
            <div class="record-header">
              <div class="record-info">
                <el-tag :type="getTypeTagType(record.calculation_type)" class="type-tag">
                  {{ getTypeLabel(record.calculation_type) }}
                </el-tag>
                <span class="record-date">
                  {{ formatDate(record.created_at) }}
                </span>
              </div>
              
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteRecord(record.id)"
                :loading="deletingIds.includes(record.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </template>

          <div class="record-content">
            <!-- BMR 記錄 -->
            <div v-if="record.calculation_type === 'bmr'" class="bmr-record">
              <div class="input-section">
                <h4>輸入資料</h4>
                <div class="input-grid">
                  <div class="input-item">
                    <span class="label">性別：</span>
                    <span class="value">{{ record.input_data.gender === 'male' ? '男性' : '女性' }}</span>
                  </div>
                  <div class="input-item">
                    <span class="label">年齡：</span>
                    <span class="value">{{ record.input_data.age }} 歲</span>
                  </div>
                  <div class="input-item">
                    <span class="label">身高：</span>
                    <span class="value">{{ record.input_data.height }} 公分</span>
                  </div>
                  <div class="input-item">
                    <span class="label">體重：</span>
                    <span class="value">{{ record.input_data.weight }} 公斤</span>
                  </div>
                </div>
              </div>
              
              <div class="result-section">
                <h4>計算結果</h4>
                <div class="result-value">
                  <el-statistic 
                    title="BMR" 
                    :value="record.result_data.bmr" 
                    suffix="kcal/day"
                    :precision="1"
                  />
                </div>
              </div>
            </div>

            <!-- TDEE 記錄 -->
            <div v-else-if="record.calculation_type === 'tdee'" class="tdee-record">
              <div class="input-section">
                <h4>輸入資料</h4>
                <div class="input-grid">
                  <div class="input-item">
                    <span class="label">BMR：</span>
                    <span class="value">{{ record.input_data.bmr }} kcal/day</span>
                  </div>
                  <div class="input-item">
                    <span class="label">活動程度：</span>
                    <span class="value">{{ record.result_data.activityInfo?.name }}</span>
                  </div>
                  <div class="input-item">
                    <span class="label">活動係數：</span>
                    <span class="value">{{ record.result_data.multiplier }}</span>
                  </div>
                </div>
              </div>
              
              <div class="result-section">
                <h4>計算結果</h4>
                <div class="result-value">
                  <el-statistic 
                    title="TDEE" 
                    :value="record.result_data.tdee" 
                    suffix="kcal/day"
                    :precision="1"
                  />
                </div>
              </div>
            </div>

            <!-- 目標熱量記錄 -->
            <div v-else-if="record.calculation_type === 'target_calories'" class="target-record">
              <div class="input-section">
                <h4>輸入資料</h4>
                <div class="input-grid">
                  <div class="input-item">
                    <span class="label">TDEE：</span>
                    <span class="value">{{ record.input_data.tdee }} kcal/day</span>
                  </div>
                  <div class="input-item">
                    <span class="label">飲食目標：</span>
                    <span class="value">{{ record.result_data.goalInfo?.name }}</span>
                  </div>
                </div>
              </div>
              
              <div class="result-section">
                <h4>計算結果</h4>
                <div class="result-value">
                  <el-statistic 
                    title="目標熱量" 
                    :value="record.result_data.targetCalories" 
                    suffix="kcal/day"
                    :precision="1"
                  />
                </div>
                <div class="result-range">
                  <span class="range-label">建議範圍：</span>
                  <span class="range-value">
                    {{ record.result_data.adjustmentRange?.min }} - 
                    {{ record.result_data.adjustmentRange?.max }} kcal/day
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 載入更多 -->
      <div v-if="pagination.hasMore" class="load-more">
        <el-button @click="loadMoreHistory" :loading="loadingMore">
          載入更多記錄
        </el-button>
      </div>
    </div>

    <!-- 載入狀態 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Clock, 
  ArrowLeft, 
  Refresh, 
  Delete 
} from '@element-plus/icons-vue'
import api from '@/api/axios-config'

// 響應式數據
const loading = ref(false)
const loadingMore = ref(false)
const clearing = ref(false)
const deletingIds = ref([])
const history = ref([])
const pagination = ref({
  total: 0,
  limit: 10,
  offset: 0,
  hasMore: false
})

const filters = ref({
  type: '',
  limit: 10
})

// 載入歷史記錄
async function loadHistory(reset = true) {
  try {
    if (reset) {
      loading.value = true
      pagination.value.offset = 0
      history.value = []
    } else {
      loadingMore.value = true
    }
    
    const params = {
      limit: filters.value.limit,
      offset: pagination.value.offset
    }
    
    if (filters.value.type) {
      params.type = filters.value.type
    }
    
    const response = await api.get('/history', { params })
    
    if (reset) {
      history.value = response.data.history
    } else {
      history.value.push(...response.data.history)
    }
    
    pagination.value = response.data.pagination
    
  } catch (error) {
    console.error('載入歷史記錄失敗:', error)
    ElMessage.error('載入歷史記錄失敗')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 載入更多記錄
function loadMoreHistory() {
  pagination.value.offset += pagination.value.limit
  loadHistory(false)
}

// 重新載入
function refreshHistory() {
  loadHistory(true)
}

// 刪除單筆記錄
async function deleteRecord(id) {
  try {
    await ElMessageBox.confirm(
      '確定要刪除這筆計算記錄嗎？',
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deletingIds.value.push(id)
    
    await api.delete(`/history/${id}`)
    
    // 從列表中移除
    history.value = history.value.filter(record => record.id !== id)
    
    ElMessage.success('記錄已刪除')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('刪除記錄失敗:', error)
      ElMessage.error('刪除記錄失敗')
    }
  } finally {
    deletingIds.value = deletingIds.value.filter(delId => delId !== id)
  }
}

// 清空所有記錄
async function clearAllHistory() {
  try {
    await ElMessageBox.confirm(
      '確定要清空所有計算歷史記錄嗎？此操作無法復原。',
      '確認清空',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    clearing.value = true
    await api.delete('/history')
    
    history.value = []
    pagination.value = {
      total: 0,
      limit: 10,
      offset: 0,
      hasMore: false
    }
    
    ElMessage.success('所有記錄已清空')
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空記錄失敗:', error)
      ElMessage.error('清空記錄失敗')
    }
  } finally {
    clearing.value = false
  }
}

// 獲取類型標籤類型
function getTypeTagType(type) {
  const typeMap = {
    'bmr': 'primary',
    'tdee': 'success',
    'target_calories': 'warning'
  }
  return typeMap[type] || 'info'
}

// 獲取類型標籤文字
function getTypeLabel(type) {
  const labelMap = {
    'bmr': 'BMR 計算',
    'tdee': 'TDEE 計算',
    'target_calories': '目標熱量'
  }
  return labelMap[type] || type
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return `今天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days === 1) {
    return `昨天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days < 7) {
    return `${days} 天前`
  } else {
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  border-radius: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 24px;
}

.filter-form {
  margin: 0;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

.history-content {
  min-height: 400px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.history-item.type-bmr {
  border-left: 4px solid #409eff;
}

.history-item.type-tdee {
  border-left: 4px solid #67c23a;
}

.history-item.type-target_calories {
  border-left: 4px solid #e6a23c;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-tag {
  font-weight: 600;
}

.record-date {
  color: #909399;
  font-size: 14px;
}

.record-content {
  padding-top: 16px;
}

.input-section, .result-section {
  margin-bottom: 20px;
}

.input-section h4, .result-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #f0f2f5;
  padding-bottom: 8px;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.input-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #e9ecef;
}

.input-item .label {
  font-weight: 500;
  color: #6c757d;
  margin-right: 8px;
  min-width: 60px;
}

.input-item .value {
  font-weight: 600;
  color: #2c3e50;
}

.result-section {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.result-value {
  text-align: center;
  margin-bottom: 12px;
}

.result-value :deep(.el-statistic__number) {
  font-size: 2em;
  font-weight: 700;
}

.result-value :deep(.el-statistic__title) {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.result-range {
  text-align: center;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.range-label {
  color: #6c757d;
  font-size: 14px;
}

.range-value {
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

.load-more {
  text-align: center;
  margin-top: 32px;
  padding: 20px;
}

.loading-state {
  margin-top: 24px;
  padding: 20px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .header-content {
    justify-content: space-between;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .page-title {
    font-size: 20px;
  }
  
  .filter-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .filter-form .el-form-item {
    margin-bottom: 0;
  }
  
  .input-grid {
    grid-template-columns: 1fr;
  }
  
  .record-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .record-info {
    justify-content: space-between;
  }
  
  .result-value :deep(.el-statistic__number) {
    font-size: 1.5em;
  }
}

/* 深色模式適配 */
@media (prefers-color-scheme: dark) {
  .input-item {
    background-color: #2c2c2c;
    border-left-color: #404040;
  }
  
  .result-section {
    background-color: #2c2c2c;
    border-color: #404040;
  }
  
  .result-range {
    border-top-color: #404040;
  }
}

/* 動畫效果 */
.history-item {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 空狀態樣式 */
.el-empty {
  padding: 60px 20px;
}

.el-empty :deep(.el-empty__description) {
  margin-bottom: 20px;
  color: #909399;
  font-size: 16px;
}
</style>