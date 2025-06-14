const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// 中介軟體
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 用戶 UUID 中介軟體
app.use((req, res, next) => {
  const userUUID = req.headers['x-user-uuid'];
  if (userUUID) {
    req.userUUID = userUUID;
  }
  next();
});

// API 路由
app.use('/api/config', require('./routes/config'));
app.use('/api/calculate', require('./routes/calculate'));
app.use('/api/history', require('./routes/history'));

// 前端靜態檔案服務
const frontendPath = path.join(__dirname, '../../../frontend/dist');
app.use(express.static(frontendPath));

// SPA 路由支援 - 所有非 API 請求都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 全域錯誤處理
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});