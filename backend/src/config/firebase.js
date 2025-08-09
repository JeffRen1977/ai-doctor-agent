const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

// 检查必需的环境变量
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN', 
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ 缺少必需的Firebase环境变量:', missingVars.join(', '));
  console.error('请参考 backend/FIREBASE_SETUP.md 进行配置');
  console.error('或者创建 .env 文件并添加以下配置:');
  console.error(`
# Firebase配置
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
  `);
  
  // 如果缺少环境变量，退出程序
  console.error('❌ 无法启动：缺少必需的Firebase配置');
  process.exit(1);
}

// Firebase配置 - 仅使用环境变量
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

try {
  // 初始化Firebase
  const app = initializeApp(firebaseConfig);
  
  // 获取Firebase服务
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  console.log('✅ Firebase配置成功');
  
  module.exports = { app, auth, db, storage, isMock: false };
} catch (error) {
  console.error('❌ Firebase初始化失败:', error.message);
  console.error('请检查环境变量配置是否正确');
  process.exit(1);
} 