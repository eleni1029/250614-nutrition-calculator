const express = require('express');
const Joi = require('joi');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 3
});

// 驗證架構
const bmrSchema = Joi.object({
  method: Joi.string().required(),
  gender: Joi.string().valid('male', 'female').required(),
  age: Joi.number().integer().min(1).max(120).required(),
  height: Joi.number().min(100).max(250).required(),
  weight: Joi.number().min(30).max(200).required()
});

const tdeeSchema = Joi.object({
  bmr: Joi.number().min(500).max(5000).required(),
  activity_level: Joi.string().required()
});

const targetCaloriesSchema = Joi.object({
  tdee: Joi.number().min(500).max(8000).required(),
  diet_goal: Joi.string().required()
});

// 用戶管理中介軟體
async function ensureUser(req, res, next) {
  try {
    if (!req.userUUID) {
      req.userUUID = uuidv4();
    }
    
    // 檢查用戶是否存在，不存在則創建
    const userResult = await pool.query(
      'SELECT id FROM users WHERE uuid = $1',
      [req.userUUID]
    );
    
    if (userResult.rows.length === 0) {
      const insertResult = await pool.query(
        'INSERT INTO users (uuid) VALUES ($1) RETURNING id',
        [req.userUUID]
      );
      req.userId = insertResult.rows[0].id;
    } else {
      req.userId = userResult.rows[0].id;
    }
    
    next();
  } catch (error) {
    console.error('用戶管理錯誤:', error);
    next(error);
  }
}

// 計算 BMR
router.post('/bmr', ensureUser, async (req, res) => {
  try {
    const { error, value } = bmrSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: '輸入資料驗證失敗',
        details: error.details
      });
    }
    
    const { method, gender, age, height, weight } = value;
    
    // 驗證計算方式是否存在
    const methodResult = await pool.query(
      'SELECT * FROM calculation_methods WHERE method_key = $1 AND is_active = true',
      [method]
    );
    
    if (methodResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: '不支援的計算方式'
      });
    }
    
    // 計算 BMR
    let bmr;
    if (method === 'mifflin') {
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
    }
    
    // 四捨五入到小數第一位
    bmr = Math.round(bmr * 10) / 10;
    
    // 保存計算歷史
    const inputData = { method, gender, age, height, weight };
    const resultData = { bmr, formula: methodResult.rows[0][`formula_${gender}`] };
    
    await pool.query(
      'INSERT INTO calculation_history (user_id, user_uuid, calculation_type, input_data, result_data) VALUES ($1, $2, $3, $4, $5)',
      [req.userId, req.userUUID, 'bmr', JSON.stringify(inputData), JSON.stringify(resultData)]
    );
    
    res.json({
      success: true,
      data: {
        bmr,
        formula: methodResult.rows[0][`formula_${gender}`],
        calculation: `${gender === 'male' ? '10' : '10'} × ${weight} + 6.25 × ${height} - 5 × ${age} ${gender === 'male' ? '+ 5' : '- 161'} = ${bmr}`,
        userUUID: req.userUUID // 返回給前端保存
      }
    });
    
  } catch (error) {
    console.error('BMR 計算失敗:', error);
    res.status(500).json({
      success: false,
      error: 'BMR 計算失敗'
    });
  }
});

// 計算 TDEE
router.post('/tdee', ensureUser, async (req, res) => {
  try {
    const { error, value } = tdeeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: '輸入資料驗證失敗',
        details: error.details
      });
    }
    
    const { bmr, activity_level } = value;
    
    // 驗證活動程度是否存在
    const levelResult = await pool.query(
      'SELECT * FROM activity_levels WHERE level_key = $1 AND is_active = true',
      [activity_level]
    );
    
    if (levelResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: '不支援的活動程度'
      });
    }
    
    const multiplier = parseFloat(levelResult.rows[0].multiplier);
    const tdee = Math.round(bmr * multiplier * 10) / 10;
    
    // 保存計算歷史
    const inputData = { bmr, activity_level };
    const resultData = { 
      tdee, 
      multiplier,
      activityInfo: {
        name: levelResult.rows[0].name,
        description: levelResult.rows[0].description
      }
    };
    
    await pool.query(
      'INSERT INTO calculation_history (user_id, user_uuid, calculation_type, input_data, result_data) VALUES ($1, $2, $3, $4, $5)',
      [req.userId, req.userUUID, 'tdee', JSON.stringify(inputData), JSON.stringify(resultData)]
    );
    
    res.json({
      success: true,
      data: {
        tdee,
        bmr,
        multiplier,
        calculation: `TDEE = BMR × 活動係數 = ${bmr} × ${multiplier} = ${tdee} kcal/day`,
        activityInfo: {
          name: levelResult.rows[0].name,
          description: levelResult.rows[0].description
        }
      }
    });
    
  } catch (error) {
    console.error('TDEE 計算失敗:', error);
    res.status(500).json({
      success: false,
      error: 'TDEE 計算失敗'
    });
  }
});

// 計算目標熱量
router.post('/target-calories', ensureUser, async (req, res) => {
  try {
    const { error, value } = targetCaloriesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: '輸入資料驗證失敗',
        details: error.details
      });
    }
    
    const { tdee, diet_goal } = value;
    
    // 驗證飲食目標是否存在
    const goalResult = await pool.query(
      'SELECT * FROM diet_goals WHERE goal_key = $1 AND is_active = true',
      [diet_goal]
    );
    
    if (goalResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: '不支援的飲食目標'
      });
    }
    
    const goal = goalResult.rows[0];
    let targetCalories;
    let adjustmentRange;
    
    if (goal.adjustment_type === 'percentage') {
      const minAdjustment = goal.adjustment_min / 100;
      const maxAdjustment = goal.adjustment_max / 100;
      
      const minCalories = Math.round((tdee * (1 + minAdjustment)) * 10) / 10;
      const maxCalories = Math.round((tdee * (1 + maxAdjustment)) * 10) / 10;
      
      // 使用範圍中間值作為建議值
      targetCalories = Math.round(((minCalories + maxCalories) / 2) * 10) / 10;
      adjustmentRange = {
        min: minCalories,
        max: maxCalories,
        percentage: {
          min: goal.adjustment_min,
          max: goal.adjustment_max
        }
      };
    }
    
    // 保存計算歷史
    const inputData = { tdee, diet_goal };
    const resultData = { 
      targetCalories,
      adjustmentRange,
      goalInfo: {
        name: goal.name,
        description: goal.description,
        advice: goal.advice
      }
    };
    
    await pool.query(
      'INSERT INTO calculation_history (user_id, user_uuid, calculation_type, input_data, result_data) VALUES ($1, $2, $3, $4, $5)',
      [req.userId, req.userUUID, 'target_calories', JSON.stringify(inputData), JSON.stringify(resultData)]
    );
    
    res.json({
      success: true,
      data: {
        targetCalories,
        tdee,
        adjustmentRange,
        goalInfo: {
          name: goal.name,
          description: goal.description,
          advice: goal.advice
        },
        calculation: `${goal.name} = TDEE ${goal.adjustment_min >= 0 ? '+' : ''}${goal.adjustment_min}~${goal.adjustment_max >= 0 ? '+' : ''}${goal.adjustment_max}% = ${adjustmentRange.min}~${adjustmentRange.max} kcal/day`
      }
    });
    
  } catch (error) {
    console.error('目標熱量計算失敗:', error);
    res.status(500).json({
      success: false,
      error: '目標熱量計算失敗'
    });
  }
});

module.exports = router;