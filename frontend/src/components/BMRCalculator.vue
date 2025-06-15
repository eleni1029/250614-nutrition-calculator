<template>
  <el-card class="bmr-calculator">
    <template #header>
      <div class="card-header">
        <el-icon><Calculator /></el-icon>
        <span>基礎代謝率 (BMR) 計算</span>
      </div>
    </template>

    <!-- 基本資料輸入 -->
    <el-form 
      :model="form" 
      :rules="rules"
      ref="formRef"
      label-width="100px"
      class="bmr-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性別" prop="gender">
            <el-radio-group v-model="form.gender" class="gender-group">
              <el-radio value="male" class="gender-radio">
                <el-icon><Male /></el-icon>
                男性
              </el-radio>
              <el-radio value="female" class="gender-radio">
                <el-icon><Female /></el-icon>
                女性
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="年齡" prop="age">
            <el-input-number 
              v-model="form.age" 
              :min="1" 
              :max="120"
              controls-position="right"
              class="full-width"
            />
            <span class="unit">歲</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="身高" prop="height">
            <el-input-number 
              v-model="form.height" 
              :min="100" 
              :max="250"
              :precision="1"
              controls-position="right"
              class="full-width"
            />
            <span class="unit">公分</span>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="體重" prop="weight">
            <el-input-number 
              v-model="form.weight" 
              :min="30" 
              :max="200"
              :precision="1"
              controls-position="right"
              class="full-width"
            />
            <span class="unit">公斤</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item class="submit-item">
        <el-button 
          type="primary" 
          @click="calculateBMR" 
          :loading="calculating"
          :disabled="!isFormValid"
          size="large"
          class="calculate-btn"
        >
          <el-icon><Lightning /></el-icon>
          開始計算 BMR
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 計算結果 -->
    <div v-if="result" class="result-section">
      <el-divider>
        <el-icon><TrendCharts /></el-icon>
        計算結果
      </el-divider>
      
      <div class="result-display">
        <el-statistic 
          title="基礎代謝率 (BMR)" 
          :value="result.bmr" 
          suffix="kcal/day"
          :precision="1"
          class="bmr-statistic"
        />
        
        <div class="calculation-detail">
          <el-tag type="info" size="large">
            {{ result.calculation }}
          </el-tag>
        </div>
      </div>

      <!-- 精密測量輸入 -->
      <el-card class="precise-measurement" shadow="never">
        <template #header>
          <div class="precise-header">
            <el-icon><DataAnalysis /></el-icon>
            <span>精密測量結果 (可選)</span>
          </div>
        </template>
        
        <el-alert type="info" :closable="false" class="precise-info">
          如果您有通過 InBody、醫學測量等精密設備測得的基礎代謝率，可在此輸入以獲得更準確的結果
        </el-alert>
        
        <el-form-item label="實測 BMR" label-width="100px" class="precise-input">
          <el-input-number 
            v-model="preciseBMR" 
            :min="800" 
            :max="5000"
            :precision="1"
            controls-position="right"
            class="full-width"
            @change="onPreciseBMRChange"
          />
          <span class="unit">kcal/day</span>
        </el-form-item>
        
        <div v-if="preciseBMR" class="precise-result">
          <el-alert type="success" :closable="false">
            <template #title>使用精密測量結果</template>
            將使用您輸入的精密測量值 {{ preciseBMR }} kcal/day 進行後續計算
          </el-alert>
        </div>
      </el-card>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Calculator, 
  Male, 
  Female, 
  Lightning, 
  TrendCharts, 
  DataAnalysis 
} from '@element-plus/icons-vue'
import api from '@/api/axios-config'

// Props
const props = defineProps({
  method: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['calculated'])

// 響應式數據
const formRef = ref()
const calculating = ref(false)
const result = ref(null)
const preciseBMR = ref(null)

const form = ref({
  gender: '',
  age: null,
  height: null,
  weight: null
})

// 表單驗證規則
const rules = {
  gender: [
    { required: true, message: '請選擇性別', trigger: 'change' }
  ],
  age: [
    { required: true, message: '請輸入年齡', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '年齡範圍 1-120 歲', trigger: 'blur' }
  ],
  height: [
    { required: true, message: '請輸入身高', trigger: 'blur' },
    { type: 'number', min: 100, max: 250, message: '身高範圍 100-250 公分', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '請輸入體重', trigger: 'blur' },
    { type: 'number', min: 30, max: 200, message: '體重範圍 30-200 公斤', trigger: 'blur' }
  ]
}

// 計算表單是否有效
const isFormValid = computed(() => {
  return form.value.gender && 
         form.value.age && 
         form.value.height && 
         form.value.weight
})

// 最終使用的 BMR（精密測量優先）
const finalBMR = computed(() => {
  return preciseBMR.value || result.value?.bmr
})

// 計算 BMR
async function calculateBMR() {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    calculating.value = true
    
    const response = await api.post('/calculate/bmr', {
      method: props.method,
      gender: form.value.gender,
      age: form.value.age,
      height: form.value.height,
      weight: form.value.weight
    })
    
    result.value = response.data
    
    // 通知父組件
    emit('calculated', {
      bmr: response.data.bmr,
      formula: response.data.formula,
      calculation: response.data.calculation,
      userUUID: response.data.userUUID
    })
    
    ElMessage.success('BMR 計算完成！')
    
  } catch (error) {
    console.error('BMR 計算失敗:', error)
    ElMessage.error('計算失敗，請檢查輸入資料')
  } finally {
    calculating.value = false
  }
}

// 精密測量值變更
function onPreciseBMRChange() {
  if (result.value) {
    // 通知父組件使用新的 BMR 值
    emit('calculated', {
      bmr: finalBMR.value,
      formula: result.value.formula,
      calculation: result.value.calculation,
      isPrecise: !!preciseBMR.value
    })
  }
}

// 監聽計算方式變更，重置表單
watch(() => props.method, () => {
  result.value = null
  preciseBMR.value = null
})
</script>

<style scoped>
.bmr-calculator {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.bmr-form {
  margin-bottom: 0;
}

.gender-group {
  width: 100%;
}

.gender-radio {
  width: 48%;
  margin-right: 4%;
  padding: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.gender-radio:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.gender-radio.is-checked {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.gender-radio:last-child {
  margin-right: 0;
}

.full-width {
  width: 100%;
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.submit-item {
  text-align: center;
  margin-top: 24px;
  margin-bottom: 0;
}

.calculate-btn {
  padding: 12px 32px;
  font-size: 16px;
  border-radius: 8px;
}

.result-section {
  margin-top: 32px;
}

.result-display {
  text-align: center;
  margin-bottom: 24px;
}

.bmr-statistic {
  margin-bottom: 16px;
}

.bmr-statistic :deep(.el-statistic__number) {
  font-size: 2.5em;
  font-weight: 700;
  color: #409eff;
}

.bmr-statistic :deep(.el-statistic__title) {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.calculation-detail {
  margin-top: 16px;
}

.precise-measurement {
  margin-top: 24px;
  background-color: #fafbfc;
  border: 1px solid #e1e4e8;
}

.precise-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.precise-info {
  margin-bottom: 20px;
}

.precise-input {
  margin-bottom: 16px;
}

.precise-result {
  margin-top: 16px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .gender-radio {
    width: 100%;
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .gender-radio:last-child {
    margin-bottom: 0;
  }
  
  .bmr-statistic :deep(.el-statistic__number) {
    font-size: 2em;
  }
  
  .calculate-btn {
    width: 100%;
  }
}

/* 深色模式適配 */
@media (prefers-color-scheme: dark) {
  .precise-measurement {
    background-color: #1e1e1e;
    border-color: #3a3a3a;
  }
}
</style>