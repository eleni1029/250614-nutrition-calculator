const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🗄️  開始資料庫遷移...');
    
    // 讀取 schema.sql 文件
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // 執行 schema
    await client.query(schema);
    
    console.log('✅ 資料庫結構創建成功');
    
    // 檢查表格是否創建成功
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 已創建的表格:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ 資料庫遷移失敗:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('🚀 資料庫遷移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 資料庫遷移失敗:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };