<template>
  <el-card class="target-calories">
    <template #header>
      <div class="card-header">
        <el-icon><Aim /></el-icon>
        <span>目標熱量計算</span>
      </div>
    </template>

    <!-- TDEE 顯示 -->
    <div class="tdee-display">
      <el-alert type="success" :closable="false" class="tdee-info">
        <template #title>每日總消耗熱量 (TDEE)</template>
        <div class="tdee-value">{{ tdee }} kcal/day</div>
      </el-alert>
    </div>

    <!-- 飲食目標選擇 -->
    <el-form :model="form" class="target-form">
      <el-form-item label="飲食目標" label-width="100px" class="goal-form-item">
        <div class="goal-options">
          <div 
            v-for="goal in dietGoals" 
            :key="goal.goal_key"
            class="goal-option"
            :class="{ 'selected': form.dietGoal === goal.goal_key }"
            @click="selectGoal(goal.goal_key)"
          >
            <div class="goal-header">
              <div class="goal-name">{{ goal.name }}</div>
              <div class="goal-range">
                {{ formatAdjustmentRange(goal) }}
              </div>
            </div>
            <div class="goal-description">{{ goal.description }}</div>
          </div>
        </div>
      </el-form-item>

      <!-- 選中目標的詳細建議 -->
      <div v-if="selectedGoal" class="goal-advice">
        <el-card shadow="never" class="advice-card">
          <template #header>
            <div class="advice-header">
              <el-icon><Warning /></el-icon>
              <span>專業建議</span>
            </div>
          </template>
          <div class="advice-content">
            {{ selectedGoal.advice }}
          </div>
        </el-card>
      </div>
    </el-form>

    <!-- 計算結果 -->
    <div v-if="result && !calculating" class="result-section">
      <el-divider>
        <el-icon><TrendCharts /></el-icon>
        目標熱量結果
      </el-divider>
      
      <div class="result-display">
        <!-- 主要結果 -->
        <div class="main-result">
          <el-statistic 
            title="建議每日攝取熱量" 
            :value="result.targetCalories" 
            suffix="kcal/day"
            :precision="1"
            class="target-statistic"
          />
          
          <div class="calculation-detail">
            <el-tag type="primary" size="large" class="calculation-tag">
              {{ result.calculation }}
            </el-tag>
          </div>
        </div>

        <!-- 熱量範圍 -->
        <div class="calorie-range">
          <el-card shadow="never" class="range-card">
            <template #header>
              <div class="range-header">
                <el-icon><DataLine /></el-icon>
                <span>建議攝取範圍</span>
              </div>
            </template>
            
            <div class="range-content">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="range-item minimum">
                    <div class="range-label">最低</div>
                    <div class="range-value">{{ result.adjustmentRange.min }}</div>
                    <div class="range-unit">kcal/day</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="range-item recommended">
                    <div class="range-label">建議</div>
                    <div class="range-value">{{ result.targetCalories }}</div>
                    <div class="range-unit">kcal/day</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="range-item maximum">
                    <div class="range-label">最高</div>
                    <div class="range-value">{{ result.adjustmentRange.max }}</div>
                    <div class="range-unit">kcal/day</div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </div>

        <!-- 與 TDEE 的差異 -->
        <div class="tdee-comparison">
          <el-card shadow="never" class="comparison-card">
            <template #header>
              <div class="comparison-header">
                <el-icon><Compare /></el-icon>
                <span>與 TDEE 比較</span>
              </div>
            </template>
            
            <div class="comparison-content">
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="comparison-item">
                    <div class="comparison-label">熱量差異</div>
                    <div class="comparison-value" :class="getDifferenceClass()">
                      {{ formatDifference() }}
                    </div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="comparison-item">
                    <div class="comparison-label">預期效果</div>
                    <div class="comparison-effect">
                      {{ getExpectedEffect() }}
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </div>

        <!-- 營養建議 -->
        <div class="nutrition-tips">
          <el-alert type="info" :closable="false" class="tips-alert">
            <template #title>營養搭配建議</template>
            <div class="tips-content">
              <ul class="tips-list">
                <li v-if="selectedGoal?.goal_key === 'fat_loss'">
                  <strong>蛋白質：</strong>每公斤體重攝取 1.6-2.2g 蛋白質，幫助維持肌肉量
                </li>
                <li v-if="selectedGoal?.goal_key === 'muscle_gain'">
                  <strong>蛋白質：</strong>每公斤體重攝取 1.8-2.5g 蛋白質，促進肌肉合成
                </li>
                <li v-if="selectedGoal?.goal_key === 'maintenance'">
                  <strong>蛋白質：</strong>每公斤體重攝取 1.2-1.6g 蛋白質，維持身體機能
                </li>
                <li><strong>碳水化合物：</strong>選擇複合性碳水，如全穀物、蔬菜</li>
                <li><strong>脂肪：</strong>攝取優質脂肪，如堅果、橄欖油、魚類</li>
                <li><strong>水分：</strong>每日至少攝取 2000-3000ml 水分</li>
              </ul>
            </div>
          </el-alert>
        </div>
      </div>
    </div>

    <!-- 計算中狀態 -->
    <div v-if="calculating" class="calculating-state">
      <el-skeleton :rows="4" animated />
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Aim, 
  Warning, 
  TrendCharts, 
  DataLine, 
  Compare 
} from '@element-plus/icons-vue'
import api from '@/api/axios-config'

// Props
const props = defineProps({
  tdee: {
    type: Number,
    required: true
  },
  dietGoals: {
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
  dietGoal: ''
})

// 計算選中的飲食目標詳情
const selectedGoal = computed(() => {
  if (!form.value.dietGoal) return null
  return props.dietGoals.find(goal => goal.goal_key === form.value.dietGoal)
})

// 格式化調整範圍
function formatAdjustmentRange(goal) {
  if (goal.adjustment_min === 0 && goal.adjustment_max === 0) {
    return '維持 TDEE'
  }
  
  const minSign = goal.adjustment_min >= 0 ? '+' : ''
  const maxSign = goal.adjustment_max >= 0 ? '+' : ''
  
  if (goal.adjustment_min === goal.adjustment_max) {
    return `${minSign}${goal.adjustment_min}%`
  }
  
  return `${minSign}${goal.adjustment_min}% ~ ${maxSign}${goal.adjustment_max}%`
}

// 選擇目標
function selectGoal(goalKey) {
  form.value.dietGoal = goalKey
  calculateTargetCalories()
}

// 計算目標熱量
async function calculateTargetCalories() {
  if (!form.value.dietGoal) return
  
  try {
    calculating.value = true
    
    const response = await api.post('/calculate/target-calories', {
      tdee: props.tdee,
      diet_goal: form.value.dietGoal
    })
    
    result.value = response.data
    
    // 通知父組件
    emit('calculated', response.data)
    
    ElMessage.success('目標熱量計算完成！')
    
  } catch (error) {
    console.error('目標熱量計算失敗:', error)
    ElMessage.error('目標熱量計算失敗，請稍後再試')
  } finally {
    calculating.value = false
  }
}

// 獲取差異樣式類別
function getDifferenceClass() {
  if (!result.value) return ''
  
  const difference = result.value.targetCalories - result.value.tdee
  
  if (difference > 0) return 'positive'
  if (difference < 0) return 'negative'
  return 'neutral'
}

// 格式化差異顯示
function formatDifference() {
  if (!result.value) return ''
  
  const difference = Math.round((result.value.targetCalories - result.value.tdee) * 10) / 10
  
  if (difference > 0) return `+${difference} kcal`
  if (difference < 0) return `${difference} kcal`
  return '0 kcal'
}

// 獲取預期效果
function getExpectedEffect() {
  if (!selectedGoal.value) return ''
  
  const effectMap = {
    'fat_loss': '體重下降 0.5-1kg/週',
    'muscle_gain': '體重增加 0.25-0.5kg/週',
    'maintenance': '體重維持穩定'
  }
  
  return effectMap[selectedGoal.value.goal_key] || '根據目標調整'
}

// 監聽 TDEE 變化，重新計算
watch(() => props.tdee, () => {
  if (form.value.dietGoal) {
    calculateTargetCalories()
  }
})

// 監聽飲食目標列表變化，設置默認值
watch(() => props.dietGoals, (newGoals) => {
  if (newGoals.length > 0 && !form.value.dietGoal) {
    // 默認選擇"維持"
    const maintenance = newGoals.find(goal => goal.goal_key === 'maintenance')
    if (maintenance) {
      form.value.dietGoal = maintenance.goal_key
      calculateTargetCalories()
    }
  }
}, { immediate: true })
</script>

<style scoped>
.target-calories {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.tdee-display {
  margin-bottom: 24px;
}

.tdee-info {
  text-align: center;
}

.tdee-value {
  font-size: 20px;
  font-weight: 700;
  color: #67c23a;
  margin-top: 8px;
}

.target-form {
  margin-bottom: 24px;
}

.goal-form-item {
  margin-bottom: 16px;
}

.goal-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.goal-option {
  padding: 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fff;
}

.goal-option:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.goal-option.selected {
  border-color: #409eff;
  background-color: #f0f9ff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.goal-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.goal-range {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  background-color: #e8f4fd;
  padding: 4px 8px;
  border-radius: 4px;
}

.goal-description {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.4;
}

.goal-advice {
  margin-bottom: 24px;
}

.advice-card {
  background-color: #fff9e6;
  border: 1px solid #ffd666;
}

.advice-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #fa8c16;
}

.advice-content {
  color: #8c6e00;
  line-height: 1.6;
  font-size: 14px;
}

.result-section {
  margin-top: 32px;
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-result {
  text-align: center;
}

.target-statistic {
  margin-bottom: 16px;
}

.target-statistic :deep(.el-statistic__number) {
  font-size: 3em;
  font-weight: 700;
  color: #e6a23c;
}

.target-statistic :deep(.el-statistic__title) {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.calculation-tag {
  font-family: monospace;
  padding: 8px 16px;
}

.range-card, .comparison-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

.range-header, .comparison-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.range-content, .comparison-content {
  padding: 16px 0;
}

.range-item, .comparison-item {
  text-align: center;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.range-label, .comparison-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.range-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.range-item.minimum .range-value {
  color: #dc3545;
}

.range-item.recommended .range-value {
  color: #28a745;
}

.range-item.maximum .range-value {
  color: #ffc107;
}

.range-unit {
  font-size: 12px;
  color: #adb5bd;
}

.comparison-value {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.comparison-value.positive {
  color: #28a745;
}

.comparison-value.negative {
  color: #dc3545;
}

.comparison-value.neutral {
  color: #6c757d;
}

.comparison-effect {
  font-size: 14px;
  color: #495057;
  font-weight: 500;
}

.tips-alert {
  margin-top: 24px;
}

.tips-content {
  margin-top: 12px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 14px;
  color: #495057;
}

.calculating-state {
  margin-top: 24px;
  padding: 20px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .goal-options {
    grid-template-columns: 1fr;
  }
  
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .target-statistic :deep(.el-statistic__number) {
    font-size: 2.5em;
  }
  
  .range-content .el-row {
    flex-direction: column;
  }
  
  .range-item, .comparison-item {
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
  .goal-option {
    background-color: #2c2c2c;
    border-color: #404040;
  }
  
  .goal-option:hover,
  .goal-option.selected {
    background-color: #1e3a5f;
    border-color: #409eff;
  }
  
  .advice-card {
    background-color: #3a3a2e;
    border-color: #5a5a3a;
  }
  
  .range-card, .comparison-card {
    background-color: #2c2c2c;
    border-color: #404040;
  }
  
  .range-item, .comparison-item {
    background-color: #1e1e1e;
  }
}
</style>