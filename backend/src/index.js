const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const healthRecordsRoutes = require('./routes/healthRecords');
const dietAnalysisRoutes = require('./routes/dietAnalysis');
const wearableRoutes = require('./routes/wearables');

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health-records', healthRecordsRoutes);
app.use('/api/diet-analysis', dietAnalysisRoutes);
app.use('/api/wearables', wearableRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI医生助理API服务运行正常' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI医生助理后端服务启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
}); 