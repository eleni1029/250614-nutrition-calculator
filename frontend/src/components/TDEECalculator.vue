<template>
  <el-card class="tdee-calculator">
    <template #header>
      <div class="card-header">
        <el-icon><Odometer /></el-icon>
        <span>每日總消耗熱量 (TDEE) 計算</span>
      </div>
    </template>

    <!-- BMR 顯示 -->
    <div class="bmr-display">
      <el-alert type="success" :closable="false" class="bmr-info">
        <template #title>基礎代謝率 (BMR)</template>
        <div class="bmr-value">{{ bmr }} kcal/day</div>
      </el-alert>
    </div>

    <!-- 活動程度選擇 -->
    <el-form :model="form" class="tdee-form">
      <el-form-item label="活動程度" label-width="100px" class="activity-form-item">
        <el-select 
          v-model="form.activityLevel" 
          placeholder="請選擇您的活動程度"
          class="activity-select"
          @change="calculateTDEE"
        >
          <el-option
            v-for="level in activityLevels"
            :key="level.level_key"
            :value="level.level_key"
            class="activity-option"
          >
            <div class="activity-option-content">
              <div class="activity-name">
                {{ level.name }} 
                <el-tag size="small" type="info" class="multiplier-tag">
                  ×{{ level.multiplier }}
                </el-tag>
              </div>
              <div class="activity-description">{{ level.description }}</div>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 活動程度詳細說明 -->
      <div v-if="selectedActivity" class="activity-detail">
        <el-card shadow="never" class="activity-card">
          <div class="activity-info">
            <div class="activity-title">
              <el-icon><InfoFilled /></el-icon>
              {{ selectedActivity.name }}
            </div>
            <div class="activity-desc">{{ selectedActivity.description }}</div>
            <div class="activity-multiplier">
              活動係數：<strong>{{ selectedActivity.multiplier }}</strong>
            </div>
          </div>
        </el-card>
      </div>
    </el-form>

    <!-- 計算結果 -->
    <div v-if="result && !calculating" class="result-section">
      <el-divider>
        <el-icon><TrendCharts /></el-icon>
        TDEE 計算結果
      </el-divider>
      
      <div class="result-display">
        <el-statistic 
          title="每日總消耗熱量 (TDEE)" 
          :value="result.tdee" 
          suffix="kcal/day"
          :precision="1"
          class="tdee-statistic"
        />
        
        <div class="calculation-detail">
          <el-tag type="success" size="large" class="calculation-tag">
            {{ result.calculation }}
          </el-tag>
        </div>

        <!-- 熱量分解說明 -->
        <div class="calorie-breakdown">
          <el-row :gutter="16" class="breakdown-row">
            <el-col :span="12">
              <div class="breakdown-item">
                <div class="breakdown-label">基礎代謝 (BMR)</div>
                <div class="breakdown-value">{{ result.bmr }} kcal</div>
                <div class="breakdown-percent">
                  {{ Math.round((result.bmr / result.tdee) * 100) }}%
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="breakdown-item">
                <div class="breakdown-label">活動消耗</div>
                <div class="breakdown-value">
                  {{ Math.round((result.tdee - result.bmr) * 10) / 10 }} kcal
                </div>
                <div class="breakdown-percent">
                  {{ Math.round(((result.tdee - result.bmr) / result.tdee) * 100) }}%
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 計算中狀態 -->
    <div v-if="calculating" class="calculating-state">
      <el-skeleton :rows="3" animated />
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Odometer, 
  TrendCharts, 
  InfoFilled 
} from '@element-plus/icons-vue'
import api from '@/api/axios-config'

// Props
const props = defineProps({
  bmr: {
    type: Number,
    required: true
  },
  activityLevels: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['calculated'])

// 響應式數據
const calculating = ref(false)
const result = ref(null)

const form = ref({
  activityLevel: ''
})

// 計算選中的活動程度詳情
const selectedActivity = computed(() => {
  if (!form.value.activityLevel) return null
  return props.activityLevels.find(level => level.level_key === form.value.activityLevel)
})

// 計算 TDEE
async function calculateTDEE() {
  if (!form.value.activityLevel) return
  
  try {
    calculating.value = true
    
    const response = await api.post('/calculate/tdee', {
      bmr: props.bmr,
      activity_level: form.value.activityLevel
    })
    
    result.value = response.data
    
    // 通知父組件
    emit('calculated', response.data)
    
    ElMessage.success('TDEE 計算完成！')
    
  } catch (error) {
    console.error('TDEE 計算失敗:', error)
    ElMessage.error('TDEE 計算失敗，請稍後再試')
  } finally {
    calculating.value = false
  }
}

// 監聽 BMR 變化，重新計算
watch(() => props.bmr, () => {
  if (form.value.activityLevel) {
    calculateTDEE()
  }
})

// 監聽活動程度列表變化，設置默認值
watch(() => props.activityLevels, (newLevels) => {
  if (newLevels.length > 0 && !form.value.activityLevel) {
    // 默認選擇"久坐不動"
    const sedentary = newLevels.find(level => level.level_key === 'sedentary')
    if (sedentary) {
      form.value.activityLevel = sedentary.level_key
      calculateTDEE()
    }
  }
}, { immediate: true })
</script>

<style scoped>
.tdee-calculator {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.bmr-display {
  margin-bottom: 24px;
}

.bmr-info {
  text-align: center;
}

.bmr-value {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
  margin-top: 8px;
}

.tdee-form {
  margin-bottom: 24px;
}

.activity-form-item {
  margin-bottom: 16px;
}

.activity-select {
  width: 100%;
}

.activity-option-content {
  padding: 8px 0;
}

.activity-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 4px;
}

.multiplier-tag {
  font-family: monospace;
}

.activity-description {
  font-size: 13px;
  color: #909399;
  line-height: 1.4;
}

.activity-detail {
  margin-bottom: 24px;
}

.activity-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.activity-info {
  text-align: center;
}

.activity-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.activity-desc {
  color: #6c757d;
  margin-bottom: 12px;
  font-size: 14px;
}

.activity-multiplier {
  color: #495057;
  font-size: 14px;
}

.result-section {
  margin-top: 32px;
}

.result-display {
  text-align: center;
}

.tdee-statistic {
  margin-bottom: 20px;
}

.tdee-statistic :deep(.el-statistic__number) {
  font-size: 2.8em;
  font-weight: 700;
  color: #67c23a;
}

.tdee-statistic :deep(.el-statistic__title) {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.calculation-detail {
  margin-bottom: 24px;
}

.calculation-tag {
  font-family: monospace;
  padding: 8px 16px;
}

.calorie-breakdown {
  margin-top: 24px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.breakdown-row {
  margin: 0;
}

.breakdown-item {
  text-align: center;
  padding: 16px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.breakdown-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.breakdown-value {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.breakdown-percent {
  font-size: 12px;
  color: #28a745;
  font-weight: 600;
}

.calculating-state {
  margin-top: 24px;
  padding: 20px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .activity-name {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .tdee-statistic :deep(.el-statistic__number) {
    font-size: 2.2em;
  }
  
  .breakdown-row {
    flex-direction: column;
  }
  
  .breakdown-item {
    margin-bottom: 12px;
  }
  
  .calculation-tag {
    display: block;
    word-break: break-all;
    white-space: normal;
    line-height: 1.4;
  }
}

/* 深色模式適配 */
@media (prefers-color-scheme: dark) {
  .activity-card {
    background-color: #2c2c2c;
    border-color: #404040;
  }
  
  .calorie-breakdown {
    background-color: #2c2c2c;
    border-color: #404040;
  }
  
  .breakdown-item {
    background-color: #1e1e1e;
  }
}
</style>