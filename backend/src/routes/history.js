const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 3
});

// 獲取用戶計算歷史
router.get('/', async (req, res) => {
  try {
    const userUUID = req.userUUID;
    
    if (!userUUID) {
      return res.status(400).json({
        success: false,
        error: '用戶識別碼不存在'
      });
    }
    
    const { type, limit = 10, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        id,
        calculation_type,
        input_data,
        result_data,
        created_at
      FROM calculation_history 
      WHERE user_uuid = $1
    `;
    
    const params = [userUUID];
    
    if (type) {
      query += ' AND calculation_type = $2';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // 統計總數
    let countQuery = 'SELECT COUNT(*) FROM calculation_history WHERE user_uuid = $1';
    const countParams = [userUUID];
    
    if (type) {
      countQuery += ' AND calculation_type = $2';
      countParams.push(type);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        history: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        }
      }
    });
    
  } catch (error) {
    console.error('獲取計算歷史失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取計算歷史失敗'
    });
  }
});

// 獲取最近的完整計算結果（用於頁面載入時恢復狀態）
router.get('/latest-complete', async (req, res) => {
  try {
    const userUUID = req.userUUID;
    
    if (!userUUID) {
      return res.status(400).json({
        success: false,
        error: '用戶識別碼不存在'
      });
    }
    
    // 獲取最近的每種計算類型
    const bmrResult = await pool.query(
      'SELECT * FROM calculation_history WHERE user_uuid = $1 AND calculation_type = $2 ORDER BY created_at DESC LIMIT 1',
      [userUUID, 'bmr']
    );
    
    const tdeeResult = await pool.query(
      'SELECT * FROM calculation_history WHERE user_uuid = $1 AND calculation_type = $2 ORDER BY created_at DESC LIMIT 1',
      [userUUID, 'tdee']
    );
    
    const targetResult = await pool.query(
      'SELECT * FROM calculation_history WHERE user_uuid = $1 AND calculation_type = $2 ORDER BY created_at DESC LIMIT 1',
      [userUUID, 'target_calories']
    );
    
    const latestCalculations = {
      bmr: bmrResult.rows[0] || null,
      tdee: tdeeResult.rows[0] || null,
      target_calories: targetResult.rows[0] || null
    };
    
    res.json({
      success: true,
      data: latestCalculations
    });
    
  } catch (error) {
    console.error('獲取最新計算結果失敗:', error);
    res.status(500).json({
      success: false,
      error: '獲取最新計算結果失敗'
    });
  }
});

// 刪除特定計算記錄
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userUUID = req.userUUID;
    
    if (!userUUID) {
      return res.status(400).json({
        success: false,
        error: '用戶識別碼不存在'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM calculation_history WHERE id = $1 AND user_uuid = $2 RETURNING id',
      [id, userUUID]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '記錄不存在或無權限刪除'
      });
    }
    
    res.json({
      success: true,
      message: '記錄刪除成功'
    });
    
  } catch (error) {
    console.error('刪除計算記錄失敗:', error);
    res.status(500).json({
      success: false,
      error: '刪除計算記錄失敗'
    });
  }
});

// 清空用戶所有計算歷史
router.delete('/', async (req, res) => {
  try {
    const userUUID = req.userUUID;
    
    if (!userUUID) {
      return res.status(400).json({
        success: false,
        error: '用戶識別碼不存在'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM calculation_history WHERE user_uuid = $1',
      [userUUID]
    );
    
    res.json({
      success: true,
      message: `已刪除 ${result.rowCount} 筆記錄`
    });
    
  } catch (error) {
    console.error('清空計算歷史失敗:', error);
    res.status(500).json({
      success: false,
      error: '清空計算歷史失敗'
    });
  }
});

module.exports = router;