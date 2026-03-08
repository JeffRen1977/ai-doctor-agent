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
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.firebasestorage.app`;
  const rawKey = (process.env.FIREBASE_API_KEY || '').trim();
  const apiKey = rawKey.replace(/^["']|["']$/g, ''); // strip surrounding quotes from .env
  if (!apiKey || apiKey === 'AIzaSyDummyKey') {
    console.error('❌ Firebase Auth 需要有效的 Web API Key。');
    console.error('   请在 backend/.env 中设置 FIREBASE_API_KEY（从 Firebase 控制台 → 项目设置 → 常规 → 您的应用 → Web API Key）');
    process.exit(1);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('Firebase: FIREBASE_API_KEY loaded, length:', apiKey.length, 'starts with AIzaSy:', apiKey.startsWith('AIzaSy'));
  }
  firebaseConfig = {
    apiKey,
    authDomain: `${serviceAccount.project_id}.firebaseapp.com`,
    projectId: serviceAccount.project_id,
    storageBucket,
    messagingSenderId: serviceAccount.client_id,
    appId: process.env.FIREBASE_APP_ID || "1:103828834479878192658:web:dummy"
  };
} else {
  // 使用环境变量
  // 如果提供了完整的 gs:// URL，提取 bucket 名称
  let storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (storageBucket && storageBucket.startsWith('gs://')) {
    storageBucket = storageBucket.replace('gs://', '');
  }
  // 如果没有提供，使用默认格式（优先使用新格式）
  if (!storageBucket) {
    storageBucket = `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
  }
  
  // 如果使用的是旧格式 (.appspot.com)，尝试转换为新格式 (.firebasestorage.app)
  if (storageBucket.endsWith('.appspot.com')) {
    const projectId = storageBucket.replace('.appspot.com', '');
    console.warn(`⚠️ 检测到旧格式的 bucket: ${storageBucket}`);
    console.warn(`⚠️ 尝试使用新格式: ${projectId}.firebasestorage.app`);
    // 优先尝试新格式
    storageBucket = `${projectId}.firebasestorage.app`;
  }
  
  const envApiKey = (process.env.FIREBASE_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (process.env.NODE_ENV !== 'production' && envApiKey) {
    console.log('Firebase: FIREBASE_API_KEY loaded, length:', envApiKey.length, 'starts with AIzaSy:', envApiKey.startsWith('AIzaSy'));
  }
  firebaseConfig = {
    apiKey: envApiKey,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: storageBucket,
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
  
  // 初始化 Storage
  // 注意：getStorage 的第二个参数应该是 bucket URL（带或不带 gs:// 都可以）
  // 如果不提供，会使用 firebaseConfig 中的 storageBucket
  let storage;
  try {
    // 尝试使用配置中的 bucket（不指定第二个参数，使用 firebaseConfig 中的 storageBucket）
    storage = getStorage(app);
    console.log('✅ Firebase Storage 初始化成功（使用默认 bucket）');
    console.log(`📦 Storage Bucket from config: ${firebaseConfig.storageBucket}`);
  } catch (storageError) {
    console.warn('⚠️ 使用默认 bucket 初始化失败，尝试明确指定 bucket:', storageError.message);
    // 如果失败，尝试明确指定 bucket（不带 gs:// 前缀）
    try {
      storage = getStorage(app, firebaseConfig.storageBucket);
      console.log('✅ Firebase Storage 初始化成功（明确指定 bucket，不带 gs://）');
    } catch (storageError2) {
      console.warn('⚠️ 不带 gs:// 前缀失败，尝试带 gs:// 前缀:', storageError2.message);
      // 最后尝试带 gs:// 前缀
      try {
        storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
        console.log('✅ Firebase Storage 初始化成功（明确指定 bucket，带 gs://）');
      } catch (storageError3) {
        console.error('❌ Firebase Storage 初始化失败:', storageError3.message);
        console.error('所有初始化尝试都失败了');
        // 仍然继续，但 storage 会是 undefined
        storage = null;
      }
    }
  }
  
  console.log('✅ Firebase配置成功');
  console.log(`📍 项目ID: ${firebaseConfig.projectId}`);
  console.log(`📦 Storage Bucket: ${firebaseConfig.storageBucket}`);
  
  if (!storage) {
    console.warn('⚠️ Firebase Storage 未初始化，文件上传功能将不可用');
  }
  
  module.exports = { app, auth, db, storage };
} catch (error) {
  console.error('❌ Firebase初始化失败:', error.message);
  console.error('请检查配置是否正确');
  console.error('Storage Bucket 应该是: ai-doctor-agent-b3101.firebasestorage.app');
  process.exit(1);
} 