const { 
  getStorage, 
  ref, 
  uploadBytes,
  uploadBytesResumable, 
  getDownloadURL 
} = require('firebase/storage');
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} = require('firebase/auth');
const { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} = require('firebase/firestore');
const { auth, db, storage } = require('../config/firebase');

class FirebaseService {
  constructor() {
    console.log('✅ 使用真实Firebase服务');
  }

  // 用户注册
  async registerUser(email, password, name) {
    try {
      // 创建用户账户
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 更新用户资料
      await updateProfile(user, {
        displayName: name
      });

      // 在Firestore中创建用户文档，使用电子邮件作为文档ID
      const userDocRef = doc(db, 'users', email);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        name: name,
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: null,
        role: 'user'
      });

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: name,
          avatar: null
        }
      };
    } catch (error) {
      console.error('注册错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 用户登录
  async loginUser(email, password) {
    try {
      // 临时解决方案：检查是否是测试用户
      if (email === 'jianfengren.sd@gmail.com' && password === '123456') {
        // 创建或获取测试用户文档
        const userDocRef = doc(db, 'users', email);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // 创建测试用户文档
          await setDoc(userDocRef, {
            uid: 'test-user-' + Date.now(),
            email: email,
            name: 'Jianfeng Ren',
            createdAt: new Date(),
            updatedAt: new Date(),
            avatar: null,
            role: 'user'
          });
        }

        const userData = userDoc.exists() ? userDoc.data() : {
          uid: 'test-user-' + Date.now(),
          email: email,
          name: 'Jianfeng Ren',
          avatar: null
        };

        return {
          success: true,
          user: {
            id: userData.uid,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar
          }
        };
      }

      // 正常的Firebase认证流程
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 获取用户文档，使用电子邮件作为文档ID
      const userDoc = await getDoc(doc(db, 'users', email));
      
      if (!userDoc.exists()) {
          throw new Error('用户文档不存在');
      }

      const userData = userDoc.data();

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: userData.name,
          avatar: userData.avatar
        }
      };
    } catch (error) {
      console.error('登录错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户信息
  async getUserById(uid) {
    try {
      // 首先通过uid查找用户的电子邮件
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      const userData = querySnapshot.docs[0].data();
      return {
        success: true,
        user: {
          id: userData.uid,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          role: userData.role
        }
      };
    } catch (error) {
      console.error('获取用户信息错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 通过电子邮件获取用户信息
  async getUserByEmail(email) {
    try {
      const userDoc = await getDoc(doc(db, 'users', email));
      
      if (!userDoc.exists()) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      const userData = userDoc.data();
      return {
        success: true,
        user: {
          id: userData.uid,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          role: userData.role
        }
      };
    } catch (error) {
      console.error('获取用户信息错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新用户信息
  async updateUser(uid, updates) {
    try {
      // 首先通过uid查找用户的电子邮件
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      const userEmail = querySnapshot.docs[0].data().email;
      const userRef = doc(db, 'users', userEmail);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });

      return {
        success: true,
        message: '用户信息更新成功'
      };
    } catch (error) {
      console.error('更新用户信息错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 检查用户是否存在
  async checkUserExists(email) {
    try {
      const userDoc = await getDoc(doc(db, 'users', email));
      return userDoc.exists();
    } catch (error) {
      console.error('检查用户存在错误:', error);
      return false;
    }
  }

  // 用户登出
  async logoutUser() {
    try {
      await signOut(auth);
      return {
        success: true,
        message: '登出成功'
      };
    } catch (error) {
      console.error('登出错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload health record file to Firebase Storage

  // 获取用户详细资料
  async getUserProfile(email) {
    try {
      const profileDoc = await getDoc(doc(db, 'userProfile', email));
      
      if (!profileDoc.exists()) {
        return {
          success: false,
          error: '用户资料不存在'
        };
      }

      return {
        success: true,
        profile: profileDoc.data()
      };
    } catch (error) {
      console.error('获取用户资料错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 更新用户详细资料
  async updateUserProfile(email, profileData) {
    try {
      const profileRef = doc(db, 'userProfile', email);
      
      // 检查用户资料是否存在，如果不存在则创建
      const profileDoc = await getDoc(profileRef);
      
      const updateData = {
        ...profileData,
        email: email,
        updatedAt: new Date()
      };

      if (!profileDoc.exists()) {
        // 创建新的用户资料文档
        updateData.createdAt = new Date();
        await setDoc(profileRef, updateData);
      } else {
        // 更新现有用户资料
        await updateDoc(profileRef, updateData);
      }

      // 返回更新后的资料
      const updatedDoc = await getDoc(profileRef);
      
      return {
        success: true,
        profile: updatedDoc.data()
      };
    } catch (error) {
      console.error('更新用户资料错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 上传多个文件到 Firebase Storage
  async uploadMultipleFiles(files, userEmail, folder = 'health-records') {
    try {
      if (!files || files.length === 0) {
        console.warn('⚠️ No files to upload');
        return { success: false, error: 'No files provided' };
      }

      if (!storage) {
        console.error('❌ Firebase Storage is not initialized');
        return { success: false, error: 'Firebase Storage not initialized' };
      }
      
      // 调试信息：检查 Storage 实例
      console.log('🔍 Storage instance check:', {
        hasStorage: !!storage,
        storageType: typeof storage,
        storageApp: storage?.app?.name || 'unknown'
      });

      const uploadResults = [];
      const errors = [];
      
      for (const file of files) {
        try {
          console.log(`📤 Uploading file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
          
          const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
          const timestamp = Date.now();
          // 清理文件名，移除特殊字符
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileName = `${timestamp}-${safeFileName}`;
          const storagePath = `${folder}/${sanitizedEmail}/${fileName}`;
          
          console.log(`📁 Storage path: ${storagePath}`);
          
          const storageRef = ref(storage, storagePath);
          
          // 确保文件有正确的 MIME 类型
          const contentType = file.mimetype || (file.originalname.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
          
          // 使用 uploadBytes 而不是 uploadBytesResumable（更简单，适合小文件）
          // uploadBytesResumable 需要监听上传进度，对于小文件使用 uploadBytes 更直接
          console.log(`📦 Storage reference created`);
          console.log(`📦 Full path: ${storageRef.fullPath}`);
          console.log(`📦 Bucket: ${storageRef.bucket || 'default'}`);
          
          const snapshot = await uploadBytes(storageRef, file.buffer, {
            contentType: contentType,
            customMetadata: {
              originalName: file.originalname,
              uploadedBy: userEmail,
              uploadedAt: new Date().toISOString()
            }
          });
          
          console.log(`✅ Upload snapshot created, getting download URL...`);
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          console.log(`✅ File uploaded successfully: ${file.originalname}`);
          console.log(`🔗 Download URL: ${downloadURL}`);
          
          uploadResults.push({
            originalName: file.originalname,
            fileName: fileName,
            downloadURL: downloadURL,
            storagePath: storagePath,
            size: file.size,
            contentType: contentType,
            uploadedAt: new Date().toISOString()
          });
        } catch (fileError) {
          console.error(`❌ Error uploading file ${file.originalname}:`, fileError);
          console.error(`❌ Error details:`, {
            code: fileError.code,
            status: fileError.status_,
            message: fileError.message,
            customData: fileError.customData,
            serverResponse: fileError.customData?.serverResponse || 'No server response'
          });
          
          // 如果是 404 错误，提供更详细的诊断信息
          if (fileError.code === 'storage/unknown' && fileError.status_ === 404) {
            console.error(`🔍 404 错误诊断:`);
            console.error(`   - 检查 Storage Bucket 是否正确`);
            console.error(`   - 检查 Storage 规则是否允许上传`);
            console.error(`   - 检查 Storage 服务是否已启用`);
            console.error(`   - 尝试在 Firebase 控制台手动上传文件测试`);
          }
          
          errors.push({
            fileName: file.originalname,
            error: fileError.message,
            code: fileError.code || 'unknown',
            status: fileError.status_,
            details: fileError.customData?.serverResponse || 'No server response'
          });
          // 继续处理其他文件，即使某个文件失败
        }
      }
      
      // 如果所有文件都失败，返回错误
      if (uploadResults.length === 0 && errors.length > 0) {
        const firstError = errors[0];
        return { 
          success: false, 
          error: `All file uploads failed. First error: ${firstError.error}`,
          code: firstError.code || 'unknown',
          errors: errors
        };
      }
      
      // 如果至少有一个文件成功，返回成功（但包含错误信息）
      return { 
        success: true, 
        files: uploadResults,
        ...(errors.length > 0 && { errors: errors })
      };
    } catch (error) {
      console.error('❌ 批量上传文件错误:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        status: error.status_,
        customData: error.customData,
        stack: error.stack
      });
      return { 
        success: false, 
        error: error.message || 'Unknown error',
        code: error.code || (error.status_ ? `http-${error.status_}` : 'unknown')
      };
    }
  }

  // 保存个人健康档案到 Firestore（新格式）
  async savePersonalHealthRecord(userEmail, healthRecordData) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      
      // 递归函数：移除所有 undefined 值（Firestore 不支持 undefined）
      const removeUndefined = (obj) => {
        if (obj === null || obj === undefined) {
          return null;
        }
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        }
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              cleaned[key] = removeUndefined(value);
            }
          }
          return cleaned;
        }
        return obj;
      };
      
      // 检查文档是否存在
      const existingDoc = await getDoc(recordDocRef);
      const now = new Date();
      
      // 准备新格式数据
      const recordData = removeUndefined({
        userEmail: userEmail,
        ...healthRecordData,
        // 确保必要字段存在
        medicalDocuments: healthRecordData.medicalDocuments || [],
        wearableDataRefs: healthRecordData.wearableDataRefs || {},
        aiAnalyses: healthRecordData.aiAnalyses || [],
        // 新增字段
        timeSeriesData: healthRecordData.timeSeriesData || {},
        interventionHistory: healthRecordData.interventionHistory || [],
        updatedAt: now,
        createdAt: existingDoc.exists() ? existingDoc.data().createdAt || now : now
      });

      await setDoc(recordDocRef, recordData, { merge: true });
      
      return { 
        success: true, 
        id: recordDocRef.id,
        data: recordData
      };
    } catch (error) {
      console.error('保存个人健康档案错误:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  // 添加医疗文档到个人健康档案
  async addMedicalDocument(userEmail, documentData) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const medicalDocuments = existingData.medicalDocuments || [];
      
      // 添加新文档
      medicalDocuments.push(documentData);
      
      await updateDoc(recordDocRef, {
        medicalDocuments: medicalDocuments,
        updatedAt: new Date()
      });
      
      return { success: true, documentId: documentData.documentId };
    } catch (error) {
      console.error('添加医疗文档错误:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 删除医疗文档
  async deleteMedicalDocument(userEmail, documentId) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const medicalDocuments = (existingData.medicalDocuments || []).filter(
        doc => doc.documentId !== documentId
      );
      
      await updateDoc(recordDocRef, {
        medicalDocuments: medicalDocuments,
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('删除医疗文档错误:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 添加AI分析结果到个人健康档案
  async addAIAnalysis(userEmail, analysisData) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const aiAnalyses = existingData.aiAnalyses || [];
      
      // 添加新分析
      aiAnalyses.push(analysisData);
      
      // 只保留最近50条分析记录
      const trimmedAnalyses = aiAnalyses.slice(-50);
      
      await updateDoc(recordDocRef, {
        aiAnalyses: trimmedAnalyses,
        updatedAt: new Date()
      });
      
      return { success: true, analysisId: analysisData.analysisId };
    } catch (error) {
      console.error('添加AI分析错误:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== 时间序列数据管理 ==========

  // 添加时间序列数据点
  async addTimeSeriesDataPoint(userEmail, metric, unit, dataPoint) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const timeSeriesData = existingData.timeSeriesData || {};
      
      // 获取或创建该指标的时间序列数据
      if (!timeSeriesData[metric]) {
        timeSeriesData[metric] = {
          metric: metric,
          unit: unit,
          dataPoints: [],
          lastUpdated: new Date().toISOString()
        };
      }
      
      // 添加新数据点
      timeSeriesData[metric].dataPoints.push({
        timestamp: dataPoint.timestamp || new Date().toISOString(),
        value: dataPoint.value,
        source: dataPoint.source || 'manual',
        quality: dataPoint.quality || 'medium',
        metadata: dataPoint.metadata || {}
      });
      
      // 只保留最近1000个数据点
      if (timeSeriesData[metric].dataPoints.length > 1000) {
        timeSeriesData[metric].dataPoints = timeSeriesData[metric].dataPoints.slice(-1000);
      }
      
      // 更新统计信息
      const values = timeSeriesData[metric].dataPoints.map(dp => dp.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // 计算趋势（简单线性回归）
      let trend = 'stable';
      if (values.length >= 2) {
        const recent = values.slice(-10);
        const older = values.slice(-20, -10);
        if (older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          const change = (recentAvg - olderAvg) / olderAvg;
          if (change > 0.05) trend = 'increasing';
          else if (change < -0.05) trend = 'decreasing';
        }
      }
      
      timeSeriesData[metric].statistics = {
        mean: mean,
        median: median,
        min: min,
        max: max,
        stdDev: stdDev,
        trend: trend
      };
      timeSeriesData[metric].lastUpdated = new Date().toISOString();
      
      await updateDoc(recordDocRef, {
        timeSeriesData: timeSeriesData,
        updatedAt: new Date()
      });
      
      return { success: true, metric: metric };
    } catch (error) {
      console.error('添加时间序列数据点错误:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取时间序列数据
  async getTimeSeriesData(userEmail, metric = null, startDate = null, endDate = null) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const timeSeriesData = existingData.timeSeriesData || {};
      
      if (metric) {
        // 返回特定指标的数据
        const metricData = timeSeriesData[metric];
        if (!metricData) {
          return { success: true, data: null };
        }
        
        // 过滤时间范围
        let dataPoints = metricData.dataPoints || [];
        if (startDate || endDate) {
          dataPoints = dataPoints.filter(dp => {
            const timestamp = new Date(dp.timestamp);
            if (startDate && timestamp < new Date(startDate)) return false;
            if (endDate && timestamp > new Date(endDate)) return false;
            return true;
          });
        }
        
        return {
          success: true,
          data: {
            ...metricData,
            dataPoints: dataPoints
          }
        };
      } else {
        // 返回所有指标的数据
        return { success: true, data: timeSeriesData };
      }
    } catch (error) {
      console.error('获取时间序列数据错误:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== 干预历史管理 ==========

  // 添加干预历史记录
  async addInterventionHistory(userEmail, interventionData) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const interventionHistory = existingData.interventionHistory || [];
      
      // 添加新干预记录
      interventionHistory.push(interventionData);
      
      // 只保留最近100条干预记录
      const trimmedHistory = interventionHistory.slice(-100);
      
      await updateDoc(recordDocRef, {
        interventionHistory: trimmedHistory,
        updatedAt: new Date()
      });
      
      return { success: true, interventionId: interventionData.interventionId };
    } catch (error) {
      console.error('添加干预历史错误:', error);
      return { success: false, error: error.message };
    }
  }

  // 更新干预历史记录
  async updateInterventionHistory(userEmail, interventionId, updates) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      const interventionHistory = existingData.interventionHistory || [];
      
      // 查找并更新干预记录
      const index = interventionHistory.findIndex(
        item => item.interventionId === interventionId
      );
      
      if (index === -1) {
        return { success: false, error: 'Intervention not found' };
      }
      
      interventionHistory[index] = {
        ...interventionHistory[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(recordDocRef, {
        interventionHistory: interventionHistory,
        updatedAt: new Date()
      });
      
      return { success: true, interventionId: interventionId };
    } catch (error) {
      console.error('更新干预历史错误:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取干预历史
  async getInterventionHistory(userEmail, status = null) {
    try {
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const recordDocRef = doc(db, 'personalHealthRecords', sanitizedEmail);
      const existingDoc = await getDoc(recordDocRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Personal health record not found' };
      }
      
      const existingData = existingDoc.data();
      let interventionHistory = existingData.interventionHistory || [];
      
      // 按状态过滤
      if (status) {
        interventionHistory = interventionHistory.filter(
          item => item.status === status
        );
      }
      
      // 按开始日期排序（最新的在前）
      interventionHistory.sort((a, b) => {
        return new Date(b.startDate) - new Date(a.startDate);
      });
      
      return { success: true, data: interventionHistory };
    } catch (error) {
      console.error('获取干预历史错误:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FirebaseService(); 