const aiServiceFactory = require('./aiServiceFactory');
const userSettingsService = require('./userSettingsService');
const { db, storage } = require('../config/firebase');
const { collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc } = require('firebase/firestore');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Document parsing utilities
const parsePDF = async (fileBuffer, userAISettings = {}) => {
  try {
    const provider = userAISettings.aiProvider || 'gemini';
    const model = userAISettings.aiModel || '';
    
    console.log(`📄 Parsing PDF file with ${provider} from buffer`);
    
    // Convert buffer to base64
    const base64PDF = fileBuffer.toString('base64');
    
    // Use AI service based on user settings
    const aiResult = await aiServiceFactory.analyzePDFDocument(base64PDF, { 
      provider, 
      model 
    });
    
    if (!aiResult.success) {
      console.warn(`⚠️ ${provider} PDF analysis failed, falling back to pdf-parse`);
      // Fallback to traditional PDF parsing
      const data = await pdfParse(fileBuffer);
      return {
        text: data.text,
        metadata: {
          pages: data.numpages,
          title: data.info?.Title || 'PDF Document',
          author: data.info?.Author || '',
          creator: data.info?.Creator || '',
          producer: data.info?.Producer || '',
          method: 'pdf-parse-fallback'
        }
      };
    }
    
    return {
      text: aiResult.text,
      metadata: {
        pages: aiResult.pages || 1,
        title: 'PDF Document',
        method: `${provider}-pdf-analysis`,
        confidence: 0.95
      }
    };
  } catch (error) {
    console.error('❌ PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

const parseWord = async (fileBuffer) => {
  try {
    console.log('📝 Parsing Word document from buffer');
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    
    return {
      text: result.value,
      metadata: {
        title: 'Word Document',
        messages: result.messages || []
      }
    };
  } catch (error) {
    console.error('❌ Word parsing error:', error);
    throw new Error(`Failed to parse Word document: ${error.message}`);
  }
};

const parseText = async (fileBuffer) => {
  try {
    console.log('📄 Parsing text file from buffer');
    const content = fileBuffer.toString('utf8');
    
    return {
      text: content,
      metadata: {
        encoding: 'utf8',
        method: 'direct-read'
      }
    };
  } catch (error) {
    console.error('❌ Text file parsing error:', error);
    throw new Error(`Failed to parse text file: ${error.message}`);
  }
};

const parseImage = async (fileBuffer, userAISettings = {}) => {
  try {
    const provider = userAISettings.aiProvider || 'gemini';
    const model = userAISettings.aiModel || '';
    
    console.log(`🖼️ Extracting text from image using ${provider} from buffer`);
    
    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');
    
    const aiResult = await aiServiceFactory.extractTextFromImage(base64Image, { 
      provider, 
      model 
    });
    
    if (!aiResult.success) {
      throw new Error(`${provider} image text extraction failed: ${aiResult.error}`);
    }
    
    return {
      text: aiResult.text,
      metadata: {
        confidence: 0.9, // AI provides high confidence
        method: `${provider}-vision`
      }
    };
  } catch (error) {
    console.error('❌ Image text extraction error:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

/**
 * Upload file to Firebase Storage directly from buffer (no local storage)
 */
const uploadFileToStorage = async (file, userEmail) => {
  try {
    console.log('📤 Uploading file to Firebase Storage:', file.originalname);
    console.log('📧 User email:', userEmail);
    
    // 验证用户电子邮件
    if (!userEmail || !userEmail.includes('@')) {
      throw new Error('Invalid user email provided');
    }
    
    // Create storage path: users/{email}/health-documents/{filename}
    // 使用更安全的电子邮件处理方式
    const sanitizedEmail = userEmail.toLowerCase().replace(/[^a-zA-Z0-9@._-]/g, '_');
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const baseFileName = path.basename(file.originalname, fileExtension);
    const fileName = `${baseFileName}_${timestamp}${fileExtension}`;
    const storagePath = `users/${sanitizedEmail}/health-documents/${fileName}`;
    
    console.log('📁 Storage path:', storagePath);
    
    // Create storage reference
    const storageRef = ref(storage, storagePath);
    
    // Use file.buffer directly instead of reading from disk
    const fileBuffer = file.buffer || Buffer.from(file.data);
    
    // Upload file with proper metadata
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.mimetype,
      customMetadata: {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString(),
        userEmail: userEmail,
        fileSize: file.size.toString(),
        fileType: file.mimetype
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ File uploaded successfully to Firebase Storage');
    console.log('🔗 Download URL:', downloadURL);
    console.log('📁 Storage path:', storagePath);
    
    return {
      success: true,
      downloadURL,
      storagePath,
      fileName,
      originalName: file.originalname,
      size: file.size,
      contentType: file.mimetype,
      userEmail: userEmail,
      uploadedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Firebase Storage upload error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      status: error.status
    });
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }
};

/**
 * Parse uploaded documents based on file type
 */
const parseDocuments = async (files, userAISettings = {}) => {
  const parsedDocuments = [];

  for (const file of files) {
    try {
      let parsedContent;
      
      // Get file buffer for parsing
      const fileBuffer = file.buffer || Buffer.from(file.data);
      
      switch (file.mimetype) {
        case 'application/pdf':
          parsedContent = await parsePDF(fileBuffer, userAISettings);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          parsedContent = await parseWord(fileBuffer);
          break;
        case 'text/plain':
        case 'text/csv':
          parsedContent = await parseText(fileBuffer);
          break;
        case 'image/jpeg':
        case 'image/jpg':
        case 'image/png':
        case 'image/gif':
        case 'image/bmp':
        case 'image/tiff':
        case 'image/webp':
          parsedContent = await parseImage(fileBuffer, userAISettings);
          break;
        default:
          console.warn(`Unsupported file type: ${file.mimetype}`);
          continue;
      }

      parsedDocuments.push({
        filename: file.originalname,
        type: file.mimetype,
        content: parsedContent.text,
        metadata: parsedContent.metadata
      });

    } catch (error) {
      console.error(`Error parsing file ${file.originalname}:`, error);
      // Continue with other files even if one fails
    }
  }

  return parsedDocuments;
};

/**
 * Analyze health documents using AI service factory
 */
const analyzeHealthDocuments = async (files, userId, userEmail, options = {}) => {
  try {
    console.log('🔍 Starting health document analysis...');
    console.log('📁 Uploaded files:', files.length);
    console.log('👤 User:', userEmail);

    if (!files || files.length === 0) {
      throw new Error('No files provided for analysis');
    }

    // Step 1: Upload files to Firebase Storage (optional for now)
    console.log('📤 Uploading files to Firebase Storage...');
    const uploadResults = [];
    for (const file of files) {
      try {
        const uploadResult = await uploadFileToStorage(file, userEmail);
        uploadResults.push(uploadResult);
      } catch (error) {
        console.error('❌ Failed to upload file to storage:', file.originalname, error.message);
        // Create mock upload result for local processing
        uploadResults.push({
          success: true,
          downloadURL: `local://${file.path}`,
          storagePath: `local/${file.originalname}`,
          fileName: file.originalname,
          originalName: file.originalname,
          size: file.size,
          contentType: file.mimetype
        });
      }
    }

    console.log('✅ Processed', uploadResults.length, 'files (some may be local)');

    // Step 2: Get user AI settings for document parsing
    const { provider: requestProvider, model: requestModel } = options;
    
    // Get user's AI settings
    const userAISettings = await userSettingsService.getUserAISettings(userId);
    const userProvider = userAISettings.success ? userAISettings.aiProvider : 'gemini';
    const userModel = userAISettings.success ? userAISettings.aiModel : '';
    
    // Use request provider if specified, otherwise use user's default
    const finalProvider = requestProvider || userProvider;
    const finalModel = requestModel || userModel;
    
    console.log(`🔍 Starting document content extraction with ${finalProvider}...`);

    // Step 3: Extract content from documents using user's AI settings
    const parsedDocuments = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadResult = uploadResults[i];
      
      try {
        let extractedContent;
        
        // Get file buffer for parsing
        const fileBuffer = file.buffer || Buffer.from(file.data);
        
        // Extract content based on file type using user's AI settings
        switch (file.mimetype) {
          case 'application/pdf':
            extractedContent = await parsePDF(fileBuffer, { aiProvider: finalProvider, aiModel: finalModel });
            break;
          case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          case 'application/msword':
            extractedContent = await parseWord(fileBuffer);
            break;
          case 'text/plain':
          case 'text/csv':
            extractedContent = await parseText(fileBuffer);
            break;
          case 'image/jpeg':
          case 'image/png':
          case 'image/gif':
          case 'image/webp':
            extractedContent = await parseImage(fileBuffer, { aiProvider: finalProvider, aiModel: finalModel });
            break;
          default:
            console.warn('⚠️ Unsupported file type:', file.mimetype);
            continue;
        }

        parsedDocuments.push({
          filename: file.originalname,
          content: extractedContent.text,
          metadata: extractedContent.metadata,
          storageInfo: {
            downloadURL: uploadResult.downloadURL,
            storagePath: uploadResult.storagePath,
            fileName: uploadResult.fileName,
            size: uploadResult.size,
            contentType: uploadResult.contentType
          },
          type: file.mimetype
        });

      } catch (error) {
        console.error('❌ Failed to extract content from:', file.originalname, error.message);
        // Continue with other files
      }
    }

    console.log('✅ Extracted content from', parsedDocuments.length, 'documents');

    if (parsedDocuments.length === 0) {
      throw new Error('No documents could be processed successfully');
    }

    // Step 4: Analyze with AI service factory
    console.log(`🤖 Sending extracted content to AI service for analysis...`);
    console.log(`🎯 Provider: ${finalProvider} (user default: ${userProvider}, request: ${requestProvider})`);
    console.log(`🎯 Model: ${finalModel || 'default'} (user default: ${userModel}, request: ${requestModel})`);
    
    const healthData = {
      documents: parsedDocuments,
      userProfile: {
        email: userEmail,
        analysisDate: new Date().toISOString()
      }
    };

    // Use single provider
    const result = await aiServiceFactory.analyzeHealthRecords(healthData, { 
      provider: finalProvider, 
      model: finalModel 
    });
    
    if (!result.success) {
      throw new Error(result.error || `${finalProvider} analysis failed`);
    }
    
    const analysisText = result.analysis;

    console.log(`✅ Received analysis from ${result.provider}`);
    console.log(`⏱️ Processing time: ${result.processingTime}ms`);

    // Step 4: Create structured analysis response
    const analysis = {
      summary: analysisText.substring(0, 500) + (analysisText.length > 500 ? '...' : ''),
      healthMetrics: {
        bloodPressure: extractValue(analysisText, '血压', '待检测'),
        cholesterol: extractValue(analysisText, '胆固醇', '待检测'),
        glucose: extractValue(analysisText, '血糖', '待检测')
      },
      riskFactors: extractRiskFactors(analysisText),
      medicalConditions: extractMedicalConditions(analysisText),
      medications: extractMedications(analysisText),
      recommendations: extractRecommendations(analysisText),
      nextSteps: extractNextSteps(analysisText),
      healthScore: {
        score: 7,
        explanation: "基于文档分析，建议定期体检"
      },
      priorityAreas: ["健康监测", "预防保健"],
      timeline: {
        nextCheckup: "3个月",
        urgentActions: [],
        longTermGoals: ["保持健康生活方式"]
      }
    };

    // Add metadata including file information
    analysis.metadata = {
      analysisDate: new Date().toISOString(),
      documentsAnalyzed: parsedDocuments.length,
      documentTypes: parsedDocuments.map(doc => doc.type),
      aiProvider: result.provider,
      aiModel: result.model,
      processingTime: result.processingTime,
      version: '2.0',
      uploadedFiles: uploadResults.map(result => ({
        documentId: result.userEmail, // 使用用户电子邮件作为文档标识符
        userEmail: result.userEmail,
        originalName: result.originalName,
        downloadURL: result.downloadURL,
        storagePath: result.storagePath,
        size: result.size,
        contentType: result.contentType,
        uploadedAt: result.uploadedAt
      }))
    };

    // Save analysis to HealthRecords database
    console.log('💾 Saving analysis to HealthRecords with userId:', userId, 'userEmail:', userEmail);
    const savedAnalysis = await saveHealthAnalysisToRecords({
      userId,
      userEmail,
      analysis: analysis,
      documentsAnalyzed: parsedDocuments.length,
      analysisDate: new Date().toISOString(),
      uploadedFiles: uploadResults.map(result => ({
        documentId: result.userEmail, // 使用用户电子邮件作为文档标识符
        userEmail: result.userEmail,
        originalName: result.originalName,
        downloadURL: result.downloadURL,
        storagePath: result.storagePath,
        size: result.size,
        contentType: result.contentType,
        uploadedAt: result.uploadedAt
      }))
    });

    console.log('✅ Health analysis completed and saved');

    return {
      success: true,
      analysisId: savedAnalysis.id,
      analysis: analysis,
      documentsAnalyzed: parsedDocuments.length,
      analysisDate: new Date().toISOString(),
      uploadedFiles: uploadResults,
      aiProvider: result.provider,
      aiModel: result.model,
      processingTime: result.processingTime
    };

  } catch (error) {
    console.error('❌ Health analysis error:', error);
    throw error;
  }
};

/**
 * Save health analysis to HealthRecords collection
 */
const saveHealthAnalysisToRecords = async (analysisData) => {
  try {
    console.log('💾 Saving health analysis to HealthRecords...');
    
    // 创建健康记录条目，包含分析结果
    // 使用用户电子邮件作为document ID（不添加时间戳）
    const sanitizedEmail = analysisData.userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const documentId = sanitizedEmail;
    
    const healthRecordsRef = collection(db, 'healthRecords');
    const recordDocRef = doc(healthRecordsRef, documentId);
    
    // 首先尝试获取现有文档
    let existingData = {};
    try {
      const existingDoc = await getDoc(recordDocRef);
      if (existingDoc.exists()) {
        existingData = existingDoc.data();
        console.log('📄 Found existing health record for user:', analysisData.userEmail);
      }
    } catch (error) {
      console.log('📄 No existing health record found, creating new one');
    }

    // 创建新的分析记录
    const newAnalysisRecord = {
      analysisId: analysisData.analysisId || `analysis_${Date.now()}`,
      summary: analysisData.analysis.summary,
      riskFactors: analysisData.analysis.riskFactors,
      recommendations: analysisData.analysis.recommendations,
      nextSteps: analysisData.analysis.nextSteps,
      healthScore: analysisData.analysis.healthScore,
      analysisDate: analysisData.analysisDate,
      documentsAnalyzed: analysisData.documentsAnalyzed,
      status: 'completed',
      uploadedFiles: analysisData.uploadedFiles.map(file => ({
        originalName: file.originalName,
        downloadURL: file.downloadURL,
        storagePath: file.storagePath,
        size: file.size,
        contentType: file.contentType,
        uploadedAt: file.uploadedAt
      }))
    };

    // 合并数据：保留现有数据，添加新的分析记录
    const healthRecordData = {
      userId: analysisData.userId,
      userEmail: analysisData.userEmail,
      // 将新分析添加到历史记录中
      analysisHistory: [
        ...(existingData.analysisHistory || []),
        newAnalysisRecord
      ],
      // 最新的分析作为当前分析
      latestAnalysis: newAnalysisRecord,
      // 更新元数据
      totalAnalyses: (existingData.totalAnalyses || 0) + 1,
      lastAnalysisDate: analysisData.analysisDate,
      createdAt: existingData.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    // 使用setDoc合并数据，这样每次分析都会更新同一个文档
    await setDoc(recordDocRef, healthRecordData, { merge: true });

    console.log('✅ Health analysis saved to HealthRecords with ID:', documentId);
    console.log('📧 User email used as document ID:', analysisData.userEmail);
    console.log('📊 Total analyses for this user:', healthRecordData.totalAnalyses);
    
    return {
      id: documentId,
      analysisId: newAnalysisRecord.analysisId,
      ...healthRecordData
    };
  } catch (error) {
    console.error('❌ Error saving health analysis to HealthRecords:', error);
    throw error;
  }
};

/**
 * Get health analysis history for a user from HealthRecords collection
 */
const getHealthAnalysisHistory = async (userEmail, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    
    // 使用用户电子邮件作为文档ID
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const healthRecordRef = doc(db, 'healthRecords', sanitizedEmail);
    const healthRecordDoc = await getDoc(healthRecordRef);

    if (!healthRecordDoc.exists()) {
      return {
        analyses: [],
        total: 0,
        page,
        limit,
        hasMore: false
      };
    }

    const healthRecordData = healthRecordDoc.data();
    const analysisHistory = healthRecordData.analysisHistory || [];
    
    // 按分析日期排序（最新的在前）
    const sortedAnalyses = analysisHistory.sort((a, b) => 
      new Date(b.analysisDate) - new Date(a.analysisDate)
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAnalyses = sortedAnalyses.slice(startIndex, endIndex);

    return {
      analyses: paginatedAnalyses,
      total: analysisHistory.length,
      page,
      limit,
      hasMore: endIndex < analysisHistory.length,
      latestAnalysis: healthRecordData.latestAnalysis,
      totalAnalyses: healthRecordData.totalAnalyses || 0
    };

  } catch (error) {
    console.error('❌ Error getting analysis history:', error);
    throw error;
  }
};

/**
 * Get specific health analysis by ID from HealthRecords collection
 */
const getHealthAnalysisById = async (analysisId, userEmail) => {
  try {
    // 使用用户电子邮件作为文档ID
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const healthRecordRef = doc(db, 'healthRecords', sanitizedEmail);
    const healthRecordDoc = await getDoc(healthRecordRef);

    if (!healthRecordDoc.exists()) {
      return null;
    }

    const healthRecordData = healthRecordDoc.data();
    const analysisHistory = healthRecordData.analysisHistory || [];
    
    // 查找特定的分析记录
    const analysisData = analysisHistory.find(analysis => analysis.analysisId === analysisId);
    
    if (!analysisData) {
      return null;
    }

    return {
      id: analysisId,
      ...analysisData
    };

  } catch (error) {
    console.error('❌ Error getting analysis by ID:', error);
    throw error;
  }
};

// Helper functions to extract information from Chinese text
function extractRiskFactors(text) {
  const riskKeywords = ['风险', '危险', '异常', '偏高', '偏低', '超标', '不足'];
  const factors = [];
  
  riskKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      factors.push(`发现${keyword}指标`);
    }
  });
  
  return factors.length > 0 ? factors : ['建议定期体检'];
}

function extractMedicalConditions(text) {
  const conditionKeywords = ['疾病', '症状', '诊断', '异常', '问题'];
  const conditions = [];
  
  conditionKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      conditions.push(`需要关注${keyword}`);
    }
  });
  
  return conditions.length > 0 ? conditions : ['整体健康状况良好'];
}

function extractMedications(text) {
  const medKeywords = ['药物', '用药', '治疗', '处方'];
  const medications = [];
  
  medKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      medications.push(`建议咨询医生关于${keyword}`);
    }
  });
  
  return medications.length > 0 ? medications : ['暂无用药建议'];
}

function extractRecommendations(text) {
  const recommendations = [];
  
  if (text.includes('饮食')) recommendations.push('注意饮食健康');
  if (text.includes('运动')) recommendations.push('增加适量运动');
  if (text.includes('休息')) recommendations.push('保证充足睡眠');
  if (text.includes('检查')) recommendations.push('定期体检');
  
  return recommendations.length > 0 ? recommendations : ['保持健康生活方式'];
}

function extractNextSteps(text) {
  const nextSteps = [];
  
  if (text.includes('复查')) nextSteps.push('按建议时间复查');
  if (text.includes('医生')) nextSteps.push('咨询专业医生');
  if (text.includes('检查')) nextSteps.push('进行相关检查');
  
  return nextSteps.length > 0 ? nextSteps : ['继续监测健康状况'];
}

/**
 * Parse Gemini AI response into structured format
 */
function parseGeminiResponse(text) {
  return {
    summary: text.substring(0, 200) + '...', // First 200 characters as summary
    healthMetrics: {
      bloodPressure: extractValue(text, '血压', '120/80'),
      heartRate: extractValue(text, '心率', '72'),
      bloodSugar: extractValue(text, '血糖', '5.5')
    },
    riskFactors: extractRiskFactors(text),
    medicalConditions: extractMedicalConditions(text),
    medications: extractMedications(text),
    recommendations: extractRecommendations(text),
    nextSteps: extractNextSteps(text),
    healthScore: {
      score: 85,
      explanation: '整体健康状况良好，建议继续保持'
    },
    priorityAreas: ['血压监测', '定期体检'],
    timeline: {
      nextCheckup: '3个月后',
      urgentActions: [],
      longTermGoals: ['维持健康生活方式']
    },
    analysisDate: new Date().toISOString(),
    documentsAnalyzed: 1,
    status: 'completed'
  };
}

/**
 * Extract value from text using keyword
 */
function extractValue(text, keyword, defaultValue) {
  const regex = new RegExp(`${keyword}[：:]([^，。\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : defaultValue;
}


module.exports = {
  analyzeHealthDocuments,
  saveHealthAnalysisToRecords,
  getHealthAnalysisHistory,
  getHealthAnalysisById,
  parseDocuments,
  uploadFileToStorage
};

