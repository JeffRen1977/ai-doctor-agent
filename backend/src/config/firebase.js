const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

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
  
  // 如果缺少环境变量，使用真实Firebase配置（开发模式）
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  使用真实Firebase配置（开发模式）');
    const firebaseConfig = {
      apiKey: "AIzaSyDmoZRDyZWldXcRtmSxYGxdfpNDVDbMyAc",
      authDomain: "ai-doctor-agent-b3101.firebaseapp.com",
      projectId: "ai-doctor-agent-b3101",
      storageBucket: "ai-doctor-agent-b3101.firebasestorage.app",
      messagingSenderId: "1044375747487",
      appId: "1:1044375747487:web:3278f62319cda068995baa",
      measurementId: "G-2GKJT03EK2"
    };
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase配置成功（开发模式）');
    module.exports = { app, auth, db, isMock: false };
    return;
  } else {
    process.exit(1);
  }
}

// Firebase配置
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
  
  console.log('✅ Firebase配置成功');
  
  module.exports = { app, auth, db, isMock: false };
} catch (error) {
  console.error('❌ Firebase初始化失败:', error.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  使用真实Firebase配置（开发模式）');
    const firebaseConfig = {
      apiKey: "AIzaSyDmoZRDyZWldXcRtmSxYGxdfpNDVDbMyAc",
      authDomain: "ai-doctor-agent-b3101.firebaseapp.com",
      projectId: "ai-doctor-agent-b3101",
      storageBucket: "ai-doctor-agent-b3101.firebasestorage.app",
      messagingSenderId: "1044375747487",
      appId: "1:1044375747487:web:3278f62319cda068995baa",
      measurementId: "G-2GKJT03EK2"
    };
    
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    console.log('✅ Firebase配置成功（开发模式）');
    module.exports = { app, auth, db, isMock: false };
  } else {
    process.exit(1);
  }
} 