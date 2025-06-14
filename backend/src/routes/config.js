const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 3
});

// 獲取計算方式列表
router.get('/calculation-methods', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT method_key, name, description, is_active FROM calculation_methods WHERE is_active = true ORDER BY sort_order'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('獲取計算方式失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取計算方式失敗'
    });
  }
});

// 獲取特定計算方式的詳細資訊
router.get('/calculation-methods/:methodKey', async (req, res) => {
  try {
    const { methodKey } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM calculation_methods WHERE method_key = $1 AND is_active = true',
      [methodKey]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '計算方式不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('獲取計算方式詳情失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取計算方式詳情失敗'
    });
  }
});

// 獲取活動程度列表
router.get('/activity-levels', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT level_key, name, description, multiplier FROM activity_levels WHERE is_active = true ORDER BY sort_order'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('獲取活動程度失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取活動程度失敗'
    });
  }
});

// 獲取飲食目標列表
router.get('/diet-goals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT goal_key, name, description, adjustment_type, adjustment_min, adjustment_max, advice FROM diet_goals WHERE is_active = true ORDER BY sort_order'
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('獲取飲食目標失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取飲食目標失敗'
    });
  }
});

// 獲取所有配置（一次性載入）
router.get('/all', async (req, res) => {
  try {
    const [methodsResult, levelsResult, goalsResult] = await Promise.all([
      pool.query('SELECT method_key, name, description FROM calculation_methods WHERE is_active = true ORDER BY sort_order'),
      pool.query('SELECT level_key, name, description, multiplier FROM activity_levels WHERE is_active = true ORDER BY sort_order'),
      pool.query('SELECT goal_key, name, description, adjustment_type, adjustment_min, adjustment_max, advice FROM diet_goals WHERE is_active = true ORDER BY sort_order')
    ]);
    
    res.json({
      success: true,
      data: {
        calculationMethods: methodsResult.rows,
        activityLevels: levelsResult.rows,
        dietGoals: goalsResult.rows
      }
    });
  } catch (error) {
    console.error('獲取配置失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取配置失敗'
    });
  }
});

module.exports = router;