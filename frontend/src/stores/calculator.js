import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/axios-config'

export const useCalculatorStore = defineStore('calculator', () => {
  // 配置數據
  const calculationMethods = ref([])
  const activityLevels = ref([])
  const dietGoals = ref([])
  
  // 計算結果
  const bmrResult = ref(null)
  const tdeeResult = ref(null)
  const targetResult = ref(null)
  
  // 精密測量值
  const preciseBMR = ref(null)
  
  // 載入狀態
  const configLoading = ref(false)
  const calculating = ref(false)
  
  // 計算最終使用的 BMR
  const finalBMR = computed(() => {
    return preciseBMR.value || bmrResult.value?.bmr
  })
  
  // 是否有完整的計算結果
  const hasCompleteResults = computed(() => {
    return bmrResult.value && tdeeResult.value && targetResult.value
  })
  
  // 載入所有配置
  async function loadConfig() {
    try {
      configLoading.value = true
      const response = await api.get('/config/all')
      
      calculationMethods.value = response.data.calculationMethods
      activityLevels.value = response.data.activityLevels
      dietGoals.value = response.data.dietGoals
      
      return response.data
    } catch (error) {
      console.error('載入配置失敗:', error)
      throw error
    } finally {
      configLoading.value = false
    }
  }
  
  // 計算 BMR
  async function calculateBMR(params) {
    try {
      calculating.value = true
      const response = await api.post('/calculate/bmr', params)
      
      bmrResult.value = response.data
      
      return response.data
    } catch (error) {
      console.error('BMR 計算失敗:', error)
      throw error
    } finally {
      calculating.value = false
    }
  }
  
  // 計算 TDEE
  async function calculateTDEE(params) {
    try {
      calculating.value = true
      const response = await api.post('/calculate/tdee', params)
      
      tdeeResult.value = response.data
      
      return response.data
    } catch (error) {
      console.error('TDEE 計算失敗:', error)
      throw error
    } finally {
      calculating.value = false
    }
  }
  
  // 計算目標熱量
  async function calculateTargetCalories(params) {
    try {
      calculating.value = true
      const response = await api.post('/calculate/target-calories', params)
      
      targetResult.value = response.data
      
      return response.data
    } catch (error) {
      console.error('目標熱量計算失敗:', error)
      throw error
    } finally {
      calculating.value = false
    }
  }
  
  // 設置精密測量 BMR
  function setPreciseBMR(value) {
    preciseBMR.value = value
  }
  
  // 重置所有計算結果
  function resetResults() {
    bmrResult.value = null
    tdeeResult.value = null
    targetResult.value = null
    preciseBMR.value = null
  }
  
  // 重置特定類型的結果
  function resetFromType(type) {
    switch (type) {
      case 'bmr':
        bmrResult.value = null
        tdeeResult.value = null
        targetResult.value = null
        preciseBMR.value = null
        break
      case 'tdee':
        tdeeResult.value = null
        targetResult.value = null
        break
      case 'target':
        targetResult.value = null
        break
    }
  }
  
  // 載入歷史計算結果
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
      
      return latest
    } catch (error) {
      // 沒有歷史記錄時忽略錯誤
      console.log('沒有找到歷史計算記錄')
      return null
    }
  }
  
  // 獲取計算摘要
  const calculationSummary = computed(() => {
    if (!hasCompleteResults.value) return null
    
    return {
      bmr: finalBMR.value,
      tdee: tdeeResult.value.tdee,
      targetCalories: targetResult.value.targetCalories,
      goalName: targetResult.value.goalInfo?.name,
      activityName: tdeeResult.value.activityInfo?.name,
      caloriesDifference: targetResult.value.targetCalories - tdeeResult.value.tdee
    }
  })
  
  return {
    // 狀態
    calculationMethods,
    activityLevels,
    dietGoals,
    bmrResult,
    tdeeResult,
    targetResult,
    preciseBMR,
    configLoading,
    calculating,
    
    // 計算屬性
    finalBMR,
    hasCompleteResults,
    calculationSummary,
    
    // 方法
    loadConfig,
    calculateBMR,
    calculateTDEE,
    calculateTargetCalories,
    setPreciseBMR,
    resetResults,
    resetFromType,
    loadLatestResults
  }
})