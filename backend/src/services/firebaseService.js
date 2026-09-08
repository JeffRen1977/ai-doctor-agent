const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} = require('firebase/auth');
const { auth, storage } = require('../config/firebase');
const { userRepo, userProfileRepo, personalHealthRecordRepo } = require('../repositories');

class FirebaseService {
  constructor() {}

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

      await userRepo.setByEmail(email, {
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
      // 仅开发环境：可通过环境变量配置测试账号（不写死密码）
      const testEmail = process.env.TEST_USER_EMAIL;
      const testPassword = process.env.TEST_USER_PASSWORD;
      if (process.env.NODE_ENV !== 'production' && testEmail && testPassword && email === testEmail && password === testPassword) {
        let userData = await userRepo.getByEmail(email);
        if (!userData) {
          await userRepo.setByEmail(email, {
            uid: 'test-user-' + Date.now(),
            email,
            name: process.env.TEST_USER_NAME || 'Test User',
            createdAt: new Date(),
            updatedAt: new Date(),
            avatar: null,
            role: 'user'
          });
          userData = await userRepo.getByEmail(email);
        }
        return {
          success: true,
          user: { id: userData.uid, email: userData.email, name: userData.name, avatar: userData.avatar }
        };
      }

      // Firebase 认证
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = await userRepo.getByEmail(email);
      if (!userData) {
        throw new Error('用户文档不存在');
      }

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
      const userData = await userRepo.getByUid(uid);
      if (!userData) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
      if (userData.disabled || userData.deletedAt) {
        return {
          success: false,
          error: '账号已注销'
        };
      }
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
      const userData = await userRepo.getByEmail(email);
      if (!userData) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
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
      const userData = await userRepo.getByUid(uid);
      if (!userData) {
        return {
          success: false,
          error: '用户不存在'
        };
      }
      const userEmail = userData.email;
      await userRepo.updateByEmail(userEmail, {
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
      const userData = await userRepo.getByEmail(email);
      return !!userData;
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
      const profile = await userProfileRepo.getByEmail(email);
      if (!profile) {
        return {
          success: false,
          error: '用户资料不存在'
        };
      }
      return {
        success: true,
        profile
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
      const existing = await userProfileRepo.getByEmail(email);
      const updateData = {
        ...profileData,
        email: email,
        updatedAt: new Date()
      };

      if (!existing) {
        updateData.createdAt = new Date();
        await userProfileRepo.setByEmail(email, updateData);
      } else {
        await userProfileRepo.updateByEmail(email, updateData);
      }

      const profile = await userProfileRepo.getByEmail(email);
      return {
        success: true,
        profile: profile || updateData
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

      const uploadResults = [];
      const errors = [];
      
      const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      for (const file of files) {
        try {
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          const fileName = `${Date.now()}-${safeFileName}`;
          const storagePath = `${folder}/${sanitizedEmail}/${fileName}`;
          const storageRef = ref(storage, storagePath);
          const contentType = file.mimetype || (file.originalname.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

          const snapshot = await uploadBytes(storageRef, file.buffer, {
            contentType,
            customMetadata: {
              originalName: file.originalname,
              uploadedBy: userEmail,
              uploadedAt: new Date().toISOString()
            }
          });
          const downloadURL = await getDownloadURL(snapshot.ref);

          uploadResults.push({
            originalName: file.originalname,
            fileName,
            downloadURL,
            storagePath,
            size: file.size,
            contentType,
            uploadedAt: new Date().toISOString()
          });
        } catch (fileError) {
          console.error(`❌ Upload failed ${file.originalname}:`, fileError.message);
          if (fileError.code === 'storage/unknown' && fileError.status_ === 404) {
            console.error('🔍 404: 检查 Storage Bucket/规则/服务是否启用');
          }
          errors.push({
            fileName: file.originalname,
            error: fileError.message,
            code: fileError.code || 'unknown',
            status: fileError.status_,
            details: fileError.customData?.serverResponse || 'No server response'
          });
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

      const removeUndefined = (obj) => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) return obj.map(removeUndefined).filter(item => item !== undefined);
        if (typeof obj === 'object') {
          const cleaned = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) cleaned[key] = removeUndefined(value);
          }
          return cleaned;
        }
        return obj;
      };

      const existing = await personalHealthRecordRepo.get(sanitizedEmail);
      const now = new Date();

      const recordData = removeUndefined({
        userEmail: userEmail,
        ...healthRecordData,
        medicalDocuments: healthRecordData.medicalDocuments || [],
        wearableDataRefs: healthRecordData.wearableDataRefs || {},
        aiAnalyses: healthRecordData.aiAnalyses || [],
        timeSeriesData: healthRecordData.timeSeriesData || {},
        interventionHistory: healthRecordData.interventionHistory || [],
        updatedAt: now,
        createdAt: (existing && existing.createdAt) ? existing.createdAt : now
      });

      await personalHealthRecordRepo.set(sanitizedEmail, recordData, true);

      return {
        success: true,
        id: sanitizedEmail,
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
      const medicalDocuments = existingData.medicalDocuments || [];
      medicalDocuments.push(documentData);
      await personalHealthRecordRepo.update(sanitizedEmail, {
        medicalDocuments,
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
      const medicalDocuments = (existingData.medicalDocuments || []).filter(
        d => d.documentId !== documentId
      );
      await personalHealthRecordRepo.update(sanitizedEmail, {
        medicalDocuments,
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
      const aiAnalyses = existingData.aiAnalyses || [];
      aiAnalyses.push(analysisData);
      const trimmedAnalyses = aiAnalyses.slice(-50);
      await personalHealthRecordRepo.update(sanitizedEmail, {
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
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

      await personalHealthRecordRepo.update(sanitizedEmail, {
        timeSeriesData,
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
      const interventionHistory = existingData.interventionHistory || [];
      interventionHistory.push(interventionData);
      const trimmedHistory = interventionHistory.slice(-100);
      await personalHealthRecordRepo.update(sanitizedEmail, {
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
      const interventionHistory = existingData.interventionHistory || [];
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
      await personalHealthRecordRepo.update(sanitizedEmail, {
        interventionHistory,
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
      const existingData = await personalHealthRecordRepo.get(sanitizedEmail);
      if (!existingData) {
        return { success: false, error: 'Personal health record not found' };
      }
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