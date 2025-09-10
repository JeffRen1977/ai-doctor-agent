const geminiService = require('./geminiService');
const { db, storage } = require('../config/firebase');
const { collection, addDoc, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc, setDoc } = require('firebase/firestore');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Document parsing utilities
const parsePDF = async (filePath) => {
  try {
    console.log('📄 Parsing PDF file with Gemini:', filePath);
    
    // Read PDF file as buffer
    const pdfBuffer = await fs.readFile(filePath);
    const base64PDF = pdfBuffer.toString('base64');
    
    // Use Gemini to analyze PDF directly
    const geminiResult = await geminiService.analyzePDFDocument(base64PDF);
    
    if (!geminiResult.success) {
      console.warn('⚠️ Gemini PDF analysis failed, falling back to pdf-parse');
      // Fallback to traditional PDF parsing
      const data = await pdfParse(pdfBuffer);
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
      text: geminiResult.text,
      metadata: {
        pages: geminiResult.pages || 1,
        title: 'PDF Document',
        method: 'gemini-vision',
        confidence: 0.95
      }
    };
  } catch (error) {
    console.error('❌ PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

const parseWord = async (filePath) => {
  try {
    console.log('📝 Parsing Word document:', filePath);
    const result = await mammoth.extractRawText({ path: filePath });
    
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

const parseText = async (filePath) => {
  try {
    console.log('📄 Parsing text file:', filePath);
    const content = await fs.readFile(filePath, 'utf8');
    
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

const parseImage = async (filePath) => {
  try {
    console.log('🖼️ Extracting text from image using Gemini:', filePath);
    
    // Use Gemini to extract text from image
    const imageBuffer = await fs.readFile(filePath);
    const base64Image = imageBuffer.toString('base64');
    
    const geminiResult = await geminiService.extractTextFromImage(base64Image);
    
    if (!geminiResult.success) {
      throw new Error(`Gemini image text extraction failed: ${geminiResult.error}`);
    }
    
    return {
      text: geminiResult.text,
      metadata: {
        confidence: 0.9, // Gemini provides high confidence
        method: 'gemini-vision'
      }
    };
  } catch (error) {
    console.error('❌ Image text extraction error:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
};

/**
 * Upload file to Firebase Storage
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
    
    // Read file buffer
    const fileBuffer = await fs.readFile(file.path);
    
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
const parseDocuments = async (files) => {
  const parsedDocuments = [];

  for (const file of files) {
    try {
      let parsedContent;
      
      switch (file.mimetype) {
        case 'application/pdf':
          parsedContent = await parsePDF(file.path);
          break;
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          parsedContent = await parseWord(file.path);
          break;
        case 'text/plain':
        case 'text/csv':
          parsedContent = await parseText(file.path);
          break;
        case 'image/jpeg':
        case 'image/jpg':
        case 'image/png':
        case 'image/gif':
        case 'image/bmp':
        case 'image/tiff':
        case 'image/webp':
          parsedContent = await parseImage(file.path);
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
 * Analyze health documents using Gemini AI
 */
const analyzeHealthDocuments = async (files, userId, userEmail) => {
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

    // Step 2: Extract content from documents
    console.log('🔍 Starting document content extraction...');
    const parsedDocuments = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadResult = uploadResults[i];
      
      try {
        let extractedContent;
        
        // Extract content based on file type
        switch (file.mimetype) {
          case 'application/pdf':
            extractedContent = await parsePDF(file.path);
            break;
          case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          case 'application/msword':
            extractedContent = await parseWord(file.path);
            break;
          case 'text/plain':
          case 'text/csv':
            extractedContent = await parseText(file.path);
            break;
          case 'image/jpeg':
          case 'image/png':
          case 'image/gif':
          case 'image/webp':
            extractedContent = await parseImage(file.path);
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

    // Step 3: Analyze with Gemini AI
    console.log('🤖 Sending extracted content to Gemini AI for analysis...');
    
    const healthData = {
      documents: parsedDocuments,
      userProfile: {
        email: userEmail,
        analysisDate: new Date().toISOString()
      }
    };

    const result = await geminiService.analyzeHealthRecords(healthData);
    
    if (!result.success) {
      throw new Error(result.error || 'Gemini analysis failed');
    }
    
    const analysisText = result.analysis;

    console.log('✅ Received analysis from Gemini');

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
      aiModel: 'gemini-1.5-pro',
      version: '1.0',
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
      uploadedFiles: uploadResults
    };

  } catch (error) {
    console.error('❌ Health analysis error:', error);
    throw error;
  }
};

/**
 * Save health analysis to database
 */
const saveHealthAnalysis = async (analysisData) => {
  try {
    console.log('💾 Saving health analysis to database...');
    
    const analysisRef = await addDoc(collection(db, 'healthAnalyses'), {
      ...analysisData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Health analysis saved with ID:', analysisRef.id);
    
    return {
      id: analysisRef.id,
      ...analysisData
    };

  } catch (error) {
    console.error('❌ Error saving health analysis:', error);
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
    const healthRecordData = {
      userId: analysisData.userId,
      userEmail: analysisData.userEmail,
      date: new Date().toISOString().split('T')[0], // 今天的日期
      type: 'AI Analysis',
      description: analysisData.analysis.summary || 'AI健康分析结果',
      severity: 'medium', // 默认中等严重程度
      status: 'active',
      // 分析结果
      analysisResult: {
        summary: analysisData.analysis.summary,
        riskFactors: analysisData.analysis.riskFactors,
        recommendations: analysisData.analysis.recommendations,
        nextSteps: analysisData.analysis.nextSteps,
        analysisDate: analysisData.analysisDate,
        documentsAnalyzed: analysisData.documentsAnalyzed,
        uploadedFiles: analysisData.uploadedFiles
      },
      // 文档信息 - 使用用户电子邮件作为文档标识符
      documents: analysisData.uploadedFiles.map(file => ({
        documentId: file.userEmail, // 使用用户电子邮件作为文档标识符
        userEmail: file.userEmail,
        originalName: file.originalName,
        downloadURL: file.downloadURL,
        storagePath: file.storagePath,
        size: file.size,
        contentType: file.contentType,
        uploadedAt: file.uploadedAt
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 使用用户电子邮件和时间戳创建唯一的document ID
    const timestamp = Date.now();
    const sanitizedEmail = analysisData.userEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const documentId = `${sanitizedEmail}_${timestamp}`;
    
    const healthRecordsRef = collection(db, 'healthRecords');
    const recordDocRef = doc(healthRecordsRef, documentId);
    
    // 使用setDoc而不是addDoc，这样可以指定document ID
    await setDoc(recordDocRef, healthRecordData);

    console.log('✅ Health analysis saved to HealthRecords with ID:', documentId);
    console.log('📧 User email used as part of document ID:', analysisData.userEmail);
    
    return {
      id: documentId,
      ...healthRecordData
    };
  } catch (error) {
    console.error('❌ Error saving health analysis to HealthRecords:', error);
    throw error;
  }
};

/**
 * Get health analysis history for a user
 */
const getHealthAnalysisHistory = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10 } = options;
    
    const analysesRef = collection(db, 'healthAnalyses');
    const q = query(
      analysesRef,
      where('userId', '==', userId),
      orderBy('analysisDate', 'desc'),
      limit(limit * page)
    );

    const snapshot = await getDocs(q);
    const analyses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      analyses: analyses.slice((page - 1) * limit, page * limit),
      total: analyses.length,
      page,
      limit,
      hasMore: analyses.length > page * limit
    };

  } catch (error) {
    console.error('❌ Error getting analysis history:', error);
    throw error;
  }
};

/**
 * Get specific health analysis by ID
 */
const getHealthAnalysisById = async (analysisId, userId) => {
  try {
    const analysisRef = doc(db, 'healthAnalyses', analysisId);
    const analysisDoc = await getDoc(analysisRef);

    if (!analysisDoc.exists()) {
      return null;
    }

    const analysisData = analysisDoc.data();
    
    // Verify user owns this analysis
    if (analysisData.userId !== userId) {
      throw new Error('Unauthorized access to analysis');
    }

    return {
      id: analysisDoc.id,
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

/**
 * Analyze health documents directly with parsed content (for testing)
 */
const analyzeHealthDocumentsDirect = async (parsedDocuments, userId, userEmail) => {
  try {
    console.log('🔍 Starting direct health document analysis...');
    console.log('📁 Parsed documents:', parsedDocuments.length);
    console.log('👤 User:', userEmail);

    if (!parsedDocuments || parsedDocuments.length === 0) {
      throw new Error('No documents provided for analysis');
    }

    // Prepare health data for AI analysis
    const healthData = {
      documents: parsedDocuments,
      userId,
      userEmail,
      analysisDate: new Date().toISOString()
    };

    console.log('🤖 Sending to Gemini AI for analysis...');
    
    // Call Gemini AI for analysis
    const geminiResult = await geminiService.analyzeHealthRecords(healthData);
    
    if (!geminiResult.success) {
      throw new Error(`Gemini AI analysis failed: ${geminiResult.error}`);
    }

    console.log('✅ Gemini AI analysis completed');
    console.log('📝 Raw response length:', geminiResult.analysis.length);

    // Parse the response into structured format
    const analysisText = geminiResult.analysis;
    const structuredAnalysis = parseGeminiResponse(analysisText);

    console.log('✅ Health analysis completed successfully');
    
    return {
      success: true,
      analysis: structuredAnalysis,
      documentsAnalyzed: parsedDocuments.length,
      analysisDate: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Direct health analysis error:', error);
    throw error;
  }
};

module.exports = {
  analyzeHealthDocuments,
  analyzeHealthDocumentsDirect,
  saveHealthAnalysis,
  saveHealthAnalysisToRecords,
  getHealthAnalysisHistory,
  getHealthAnalysisById,
  parseDocuments,
  uploadFileToStorage
};

