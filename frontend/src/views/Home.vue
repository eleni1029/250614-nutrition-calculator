<template>
  <div class="home-container">
    <!-- 計算方式選擇 -->
    <el-card class="method-card" v-loading="configLoading">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>選擇計算方式</span>
        </div>
      </template>
      
      <el-radio-group v-model="selectedMethod" @change="onMethodChange">
        <div v-for="method in calculationMethods" :key="method.method_key" class="method-option">
          <el-radio :value="method.method_key" class="method-radio">
            {{ method.name }}
            <el-tag type="success" size="small" class="method-tag">
              {{ method.description }}
            </el-tag>
          </el-radio>
        </div>
      </el-radio-group>
      
      <!-- 公式說明 -->
      <el-alert 
        v-if="methodDetails"
        type="info" 
        :closable="false"
        class="formula-alert"
      >
        <template #title>計算公式說明</template>
        <div class="formula-content">
          <p><strong>男性：</strong>{{ methodDetails.formula_male }}</p>
          <p><strong>女性：</strong>{{ methodDetails.formula_female }}</p>
        </div>
      </el-alert>
    </el-card>

    <!-- BMR 計算區塊 -->
    <BMRCalculator 
      v-if="selectedMethod"
      :method="selectedMethod"
      @calculated="onBMRCalculated"
    />

    <!-- TDEE 計算區塊 -->
    <TDEECalculator 
      v-if="bmrResult"
      :bmr="finalBMR"
      :activity-levels="activityLevels"
      @calculated="onTDEECalculated"
    />

    <!-- 目標熱量計算區塊 -->
    <TargetCalories 
      v-if="tdeeResult"
      :tdee="tdeeResult.tdee"
      :diet-goals="dietGoals"
      @calculated="onTargetCalculated"
    />

    <!-- 歷史記錄快速入口 -->
    <el-card class="history-card" v-if="bmrResult">
      <template #header>
        <div class="card-header">
          <el-icon><Clock /></el-icon>
          <span>計算歷史</span>
        </div>
      </template>
      
      <div class="history-actions">
        <el-button type="primary" @click="$router.push('/history')">
          <el-icon><View /></el-icon>
          查看所有記錄
        </el-button>
        
        <el-button type="danger" @click="clearHistory" :loading="clearingHistory">
          <el-icon><Delete /></el-icon>
          清空歷史記錄
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, Clock, View, Delete } from '@element-plus/icons-vue'
import BMRCalculator from '@/components/BMRCalculator.vue'
import TDEECalculator from '@/components/TDEECalculator.vue'
import TargetCalories from '@/components/TargetCalories.vue'
import api from '@/api/axios-config'

// 響應式數據
const configLoading = ref(true)
const clearingHistory = ref(false)
const selectedMethod = ref('')
const methodDetails = ref(null)
const calculationMethods = ref([])
const activityLevels = ref([])
const dietGoals = ref([])

// 計算結果
const bmrResult = ref(null)
const preciseBMR = ref(null)
const tdeeResult = ref(null)
const targetResult = ref(null)

// 計算最終使用的 BMR（精密測量值優先）
const finalBMR = computed(() => {
  return preciseBMR.value || bmrResult.value?.bmr
})

// 載入配置數據
async function loadConfig() {
  try {
    configLoading.value = true
    const response = await api.get('/config/all')
    
    calculationMethods.value = response.data.calculationMethods
    activityLevels.value = response.data.activityLevels
    dietGoals.value = response.data.dietGoals
    
    // 默認選擇第一個計算方式
    if (calculationMethods.value.length > 0) {
      selectedMethod.value = calculationMethods.value[0].method_key
      await loadMethodDetails()
    }
    
  } catch (error) {
    console.error('載入配置失敗:', error)
  } finally {
    configLoading.value = false
  }
}

// 載入計算方式詳情
async function loadMethodDetails() {
  if (!selectedMethod.value) return
  
  try {
    const response = await api.get(`/config/calculation-methods/${selectedMethod.value}`)
    methodDetails.value = response.data
  } catch (error) {
    console.error('載入計算方式詳情失敗:', error)
  }
}

// 計算方式變更
function onMethodChange() {
  loadMethodDetails()
  // 重置計算結果
  bmrResult.value = null
  preciseBMR.value = null
  tdeeResult.value = null
  targetResult.value = null
}

// BMR 計算完成
function onBMRCalculated(result) {
  bmrResult.value = result
  ElMessage.success('BMR 計算完成')
}

// TDEE 計算完成
function onTDEECalculated(result) {
  tdeeResult.value = result
  ElMessage.success('TDEE 計算完成')
}

// 目標熱量計算完成
function onTargetCalculated(result) {
  targetResult.value = result
  ElMessage.success('目標熱量計算完成')
}

// 清空歷史記錄
async function clearHistory() {
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
    
    clearingHistory.value = true
    await api.delete('/history')
    
    ElMessage.success('歷史記錄已清空')
    
    // 重置計算結果
    bmrResult.value = null
    preciseBMR.value = null
    tdeeResult.value = null
    targetResult.value = null
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空歷史記錄失敗:', error)
    }
  } finally {
    clearingHistory.value = false
  }
}

// 載入最新計算結果（用於頁面刷新時恢復狀態）
async function loadLatestResults() {
  try {
    const response = await api.get('/history/latest-complete')
    const latest = response.data
    
    if (latest.bmr) {
      bmrResult.value = latest.bmr.result_data
    }
    
    if (latest.tdee) {
      tdeeResult.value = latest.tdee.result_data
    }
    
    if (latest.target_calories) {
      targetResult.value = latest.target_calories.result_data
    }
    
  } catch (error) {
    // 沒有歷史記錄時忽略錯誤
    console.log('沒有找到歷史計算記錄')
  }
}

onMounted(async () => {
  await loadConfig()
  await loadLatestResults()
})
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.method-card {
  margin-bottom: 0;
}

.method-option {
  margin-bottom: 16px;
}

.method-radio {
  width: 100%;
  height: auto;
  padding: 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.method-radio:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.method-radio.is-checked {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.method-tag {
  margin-left: 12px;
}

.formula-alert {
  margin-top: 20px;
}

.formula-content {
  margin-top: 8px;
}

.formula-content p {
  margin: 8px 0;
  font-family: 'Courier New', monospace;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.history-card {
  margin-top: 24px;
}

.history-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .history-actions {
    flex-direction: column;
  }
  
  .method-radio {
    padding: 12px;
  }
  
  .formula-content p {
    font-size: 14px;
    padding: 6px 8px;
  }
}
</style>