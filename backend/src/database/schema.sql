-- 營養計算系統資料庫結構

-- 用戶表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 第三方登錄綁定表（預留）
CREATE TABLE IF NOT EXISTS user_oauth (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    provider_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_id)
);

-- 計算歷史表
CREATE TABLE IF NOT EXISTS calculation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_uuid VARCHAR(36) NOT NULL,
    calculation_type VARCHAR(20) NOT NULL,
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 計算方式配置表
CREATE TABLE IF NOT EXISTS calculation_methods (
    id SERIAL PRIMARY KEY,
    method_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    formula_male TEXT,
    formula_female TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 活動程度配置表
CREATE TABLE IF NOT EXISTS activity_levels (
    id SERIAL PRIMARY KEY,
    level_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    multiplier DECIMAL(3,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 飲食目標配置表
CREATE TABLE IF NOT EXISTS diet_goals (
    id SERIAL PRIMARY KEY,
    goal_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    adjustment_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    adjustment_min DECIMAL(5,2),
    adjustment_max DECIMAL(5,2),
    advice TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_calculation_history_user_uuid ON calculation_history(user_uuid);
CREATE INDEX IF NOT EXISTS idx_calculation_history_type ON calculation_history(calculation_type);
CREATE INDEX IF NOT EXISTS idx_calculation_history_created_at ON calculation_history(created_at DESC);