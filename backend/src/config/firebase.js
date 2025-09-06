const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');
const path = require('path');

// 尝试加载Firebase服务账号配置文件
let serviceAccount = null;
try {
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  serviceAccount = require(serviceAccountPath);
  console.log('✅ 成功加载Firebase服务账号配置文件');
} catch (error) {
  console.warn('⚠️  无法加载Firebase服务账号配置文件，将使用环境变量');
}

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

// 如果缺少环境变量且没有服务账号文件，则退出
if (missingVars.length > 0 && !serviceAccount) {
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

// Firebase配置 - 优先使用服务账号文件，否则使用环境变量
let firebaseConfig;
if (serviceAccount) {
  // 使用服务账号文件中的信息
  firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDummyKey", // 需要从Firebase控制台获取Web API Key
    authDomain: `${serviceAccount.project_id}.firebaseapp.com`,
    projectId: serviceAccount.project_id,
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
    messagingSenderId: serviceAccount.client_id,
    appId: process.env.FIREBASE_APP_ID || "1:103828834479878192658:web:dummy" // 需要从Firebase控制台获取
  };
} else {
  // 使用环境变量
  firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  };
}

try {
  // 初始化Firebase
  const app = initializeApp(firebaseConfig);
  
  // 获取Firebase服务
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  
  console.log('✅ Firebase配置成功');
  console.log(`📍 项目ID: ${firebaseConfig.projectId}`);
  
  module.exports = { app, auth, db, storage };
} catch (error) {
  console.error('❌ Firebase初始化失败:', error.message);
  console.error('请检查配置是否正确');
  process.exit(1);
} 