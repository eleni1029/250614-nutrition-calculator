const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 清空現有資料（開發環境）
    if (process.env.NODE_ENV !== 'production') {
      await client.query('DELETE FROM diet_goals');
      await client.query('DELETE FROM activity_levels');
      await client.query('DELETE FROM calculation_methods');
    }
    
    // 插入計算方式
    const calculationMethods = [
      {
        method_key: 'mifflin',
        name: 'Mifflin-St Jeor公式（1990）',
        description: '目前最廣泛使用、準確性較高',
        formula_male: 'BMR = 10 × 體重(kg) + 6.25 × 身高(cm) - 5 × 年齡 + 5',
        formula_female: 'BMR = 10 × 體重(kg) + 6.25 × 身高(cm) - 5 × 年齡 - 161',
        sort_order: 1
      }
    ];
    
    for (const method of calculationMethods) {
      await client.query(
        `INSERT INTO calculation_methods (method_key, name, description, formula_male, formula_female, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (method_key) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         formula_male = EXCLUDED.formula_male,
         formula_female = EXCLUDED.formula_female`,
        [method.method_key, method.name, method.description, method.formula_male, method.formula_female, method.sort_order]
      );
    }
    
    // 插入活動程度
    const activityLevels = [
      {
        level_key: 'sedentary',
        name: '久坐不動',
        description: '幾乎沒運動、上班族',
        multiplier: 1.2,
        sort_order: 1
      },
      {
        level_key: 'light',
        name: '輕度活動',
        description: '每週1-3次輕量運動',
        multiplier: 1.375,
        sort_order: 2
      },
      {
        level_key: 'moderate',
        name: '中等活動',
        description: '每週3-5次中強度運動',
        multiplier: 1.55,
        sort_order: 3
      },
      {
        level_key: 'active',
        name: '高度活動',
        description: '每週6-7次訓練',
        multiplier: 1.725,
        sort_order: 4
      },
      {
        level_key: 'very_active',
        name: '非常活躍',
        description: '運動員、勞力工作者',
        multiplier: 1.9,
        sort_order: 5
      }
    ];
    
    for (const level of activityLevels) {
      await client.query(
        `INSERT INTO activity_levels (level_key, name, description, multiplier, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (level_key) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         multiplier = EXCLUDED.multiplier`,
        [level.level_key, level.name, level.description, level.multiplier, level.sort_order]
      );
    }
    
    // 插入飲食目標
    const dietGoals = [
      {
        goal_key: 'fat_loss',
        name: '減脂',
        description: 'TDEE - 15~25%（或減少 300~500 kcal）',
        adjustment_type: 'percentage',
        adjustment_min: -25,
        adjustment_max: -15,
        advice: '常見減重策略，建議保留蛋白質與重量訓練，避免瘦掉肌肉',
        sort_order: 1
      },
      {
        goal_key: 'maintenance',
        name: '維持',
        description: '= TDEE 本身',
        adjustment_type: 'percentage',
        adjustment_min: 0,
        adjustment_max: 0,
        advice: '控制體重不變，適合穩定期／養身期／運動表現優化',
        sort_order: 2
      },
      {
        goal_key: 'muscle_gain',
        name: '增肌',
        description: 'TDEE + 5~15%（或增加 200~500 kcal）',
        adjustment_type: 'percentage',
        adjustment_min: 5,
        adjustment_max: 15,
        advice: '配合重量訓練與高蛋白飲食，避免熱量過剩變成脂肪',
        sort_order: 3
      }
    ];
    
    for (const goal of dietGoals) {
      await client.query(
        `INSERT INTO diet_goals (goal_key, name, description, adjustment_type, adjustment_min, adjustment_max, advice, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (goal_key) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         adjustment_min = EXCLUDED.adjustment_min,
         adjustment_max = EXCLUDED.adjustment_max,
         advice = EXCLUDED.advice`,
        [goal.goal_key, goal.name, goal.description, goal.adjustment_type, goal.adjustment_min, goal.adjustment_max, goal.advice, goal.sort_order]
      );
    }
    
    await client.query('COMMIT');
    console.log('✅ 資料庫種子資料插入成功');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 資料庫種子資料插入失敗:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🌱 資料庫初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 資料庫初始化失敗:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };