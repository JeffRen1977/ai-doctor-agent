import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  FileImage, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Flame,
  Droplets,
  Zap,
  Heart,
  Star
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { dietAnalysisAPI } from '../services/api';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';
import './DietAnalysisPage.css';

interface FoodItem {
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  glycemicIndex: number;
  servingSize: string;
  confidence: number;
}

interface DietAnalysis {
  // New structure from backend
  imagePath?: string;
  originalFilename?: string;
  imageSize?: number;
  aiAnalysis?: string;
  recognizedFoods?: any[];
  analysisType?: string;
  userEmail?: string;
  analysisTimestamp?: string;
  
  // Additional nutrition fields (if available from AI analysis)
  totalCalories?: number;
  totalCarbs?: number;
  totalProtein?: number;
  totalFat?: number;
  totalFiber?: number;
  averageGlycemicIndex?: number;
  estimatedBloodSugarImpact?: string;
  recommendations?: string[];
  diabetesRisk?: 'low' | 'medium' | 'high';
}

const DietAnalysisPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DietAnalysis | null>(null);
  const [recognizedFoods, setRecognizedFoods] = useState<FoodItem[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Mock food database
  const foodDatabase: { [key: string]: FoodItem } = {
    'rice': {
      name: t('dietAnalysis.foodDatabase.rice'),
      calories: 130,
      carbs: 28,
      protein: 2.7,
      fat: 0.3,
      fiber: 0.4,
      glycemicIndex: 73,
      servingSize: '100g',
      confidence: 0.95
    },
    'noodles': {
      name: t('dietAnalysis.foodDatabase.noodles'),
      calories: 138,
      carbs: 25,
      protein: 4.5,
      fat: 1.1,
      fiber: 1.2,
      glycemicIndex: 55,
      servingSize: '100g',
      confidence: 0.92
    },
    'vegetables': {
      name: t('dietAnalysis.foodDatabase.vegetables'),
      calories: 25,
      carbs: 5,
      protein: 2,
      fat: 0.2,
      fiber: 3,
      glycemicIndex: 15,
      servingSize: '100g',
      confidence: 0.88
    },
    'meat': {
      name: t('dietAnalysis.foodDatabase.meat'),
      calories: 250,
      carbs: 0,
      protein: 26,
      fat: 15,
      fiber: 0,
      glycemicIndex: 0,
      servingSize: '100g',
      confidence: 0.90
    },
    'fish': {
      name: t('dietAnalysis.foodDatabase.fish'),
      calories: 120,
      carbs: 0,
      protein: 22,
      fat: 3,
      fiber: 0,
      glycemicIndex: 0,
      servingSize: '100g',
      confidence: 0.87
    },
    'bread': {
      name: t('dietAnalysis.foodDatabase.bread'),
      calories: 265,
      carbs: 49,
      protein: 9,
      fat: 3.2,
      fiber: 2.7,
      glycemicIndex: 70,
      servingSize: '100g',
      confidence: 0.93
    },
    'fruit': {
      name: t('dietAnalysis.foodDatabase.fruit'),
      calories: 60,
      carbs: 15,
      protein: 0.5,
      fat: 0.2,
      fiber: 2.5,
      glycemicIndex: 40,
      servingSize: '100g',
      confidence: 0.85
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError(t('dietAnalysis.errors.selectValidImage'));
      }
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeDiet = async () => {
    if (!selectedImage) {
      setError(t('dietAnalysis.errors.uploadImageFirst'));
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      console.log('🚀 开始分析饮食，上传图片:', selectedImage.name, selectedImage.size);
      
      // Call backend API for diet analysis
      const response = await dietAnalysisAPI.analyzeDiet(selectedImage);
      
      console.log('📡 后端API响应:', response);
      console.log('📊 响应数据结构:', {
        success: response.success,
        message: response.message,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        data: response.data
      });
      
      if (response.success) {
        // Handle the new data structure
        const analysisData = response.data;
        
        console.log('🔍 分析数据详情:', {
          imagePath: analysisData.imagePath,
          originalFilename: analysisData.originalFilename,
          imageSize: analysisData.imageSize,
          aiAnalysis: analysisData.aiAnalysis ? analysisData.aiAnalysis.substring(0, 100) + '...' : 'null',
          recognizedFoods: analysisData.recognizedFoods,
          analysisType: analysisData.analysisType,
          userEmail: analysisData.userEmail,
          analysisTimestamp: analysisData.analysisTimestamp,
          analysis: analysisData.analysis
        });
        
        // Set the analysis result with the new structure
        const resultToSet = {
          imagePath: analysisData.imagePath,
          originalFilename: analysisData.originalFilename,
          imageSize: analysisData.imageSize,
          aiAnalysis: analysisData.aiAnalysis,
          recognizedFoods: analysisData.recognizedFoods || [],
          analysisType: analysisData.analysisType || 'food-image-analysis',
          userEmail: analysisData.userEmail,
          analysisTimestamp: analysisData.analysisTimestamp || new Date().toISOString(),
          
          // Additional nutrition fields (if available from AI analysis)
          totalCalories: analysisData.totalCalories,
          totalCarbs: analysisData.totalCarbs,
          totalProtein: analysisData.totalProtein,
          totalFat: analysisData.totalFat,
          totalFiber: analysisData.totalFiber,
          averageGlycemicIndex: analysisData.averageGlycemicIndex,
          estimatedBloodSugarImpact: analysisData.estimatedBloodSugarImpact,
          recommendations: analysisData.recommendations,
          diabetesRisk: analysisData.diabetesRisk
        };
        
        console.log('🎯 设置分析结果到状态:', resultToSet);
        setAnalysisResult(resultToSet);
        
        // Set recognized foods if available
        if (analysisData.recognizedFoods && Array.isArray(analysisData.recognizedFoods)) {
          setRecognizedFoods(analysisData.recognizedFoods);
        }
        
        setError(''); // Clear any previous errors
        console.log('✅ 饮食分析完成，结果已设置');
      } else {
        console.error('❌ 后端返回失败:', response.message);
        setError(response.message || t('dietAnalysis.errors.analysisFailed'));
      }
    } catch (err: any) {
      console.error('❌ 饮食分析错误:', err);
      console.error('❌ 错误详情:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      // Handle specific error types
      if (err.response?.status === 401) {
        setError(t('dietAnalysis.errors.unauthorized') || '认证失败，请重新登录');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 403) {
        setError(t('dietAnalysis.errors.forbidden') || '访问被拒绝，请检查您的权限');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (err.response?.status === 429) {
        setError(t('dietAnalysis.errors.rateLimit') || 'AI服务配额已用完，请稍后再试或升级您的账户');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message?.includes('Network Error')) {
        setError(t('dietAnalysis.errors.networkError') || '网络连接错误，请检查您的网络连接');
      } else {
        setError(t('dietAnalysis.errors.analysisError'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
    }
  };

  const getRiskText = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return t('dietAnalysis.diabetes.lowRisk');
      case 'medium': return t('dietAnalysis.diabetes.mediumRisk');
      case 'high': return t('dietAnalysis.diabetes.highRisk');
      default: return t('dietAnalysis.diabetes.lowRisk');
    }
  };

  return (
    <div className="diet-analysis-page">
      <div className="diet-analysis-header">
        <h1>{t('dietAnalysis.header.title')}</h1>
        <p>{t('dietAnalysis.header.subtitle')}</p>
      </div>

      <div className="diet-analysis-container">
        {/* Image upload area */}
        <div className="upload-section">
          <div className="upload-area">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Food image" />
                <button 
                  className="retake-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                    setAnalysisResult(null);
                    setRecognizedFoods([]);
                  }}
                >
                  {t('dietAnalysis.upload.retake')}
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icons">
                  <Upload size={48} />
                  <Camera size={48} />
                  <FileImage size={48} />
                </div>
                <h3>{t('dietAnalysis.upload.title')}</h3>
                <p>{t('dietAnalysis.upload.subtitle')}</p>
                <div className="upload-buttons">
                  <button 
                    className="upload-btn primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileImage size={20} />
                    {t('dietAnalysis.upload.selectImage')}
                  </button>
                  <button 
                    className="upload-btn secondary"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera size={20} />
                    {t('dietAnalysis.upload.takePhoto')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <input
            type="file"
            ref={cameraRef}
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            style={{ display: 'none' }}
          />
        </div>

        {/* Analysis button */}
        {selectedImage && (
          <div className="analyze-section">
            <button 
              className={`analyze-btn ${isAnalyzing ? 'analyzing' : ''}`}
              onClick={analyzeDiet}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner"></div>
                  {t('dietAnalysis.analysis.analyzing')}
                </>
              ) : (
                <>
                  <Zap size={20} />
                  {t('dietAnalysis.analysis.startAnalysis')}
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-message">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {/* Recognition results */}
        {recognizedFoods.length > 0 && (
          <div className="recognition-results">
            <h3>{t('dietAnalysis.results.foodItems')}</h3>
            <div className="food-items">
              {recognizedFoods.map((food, index) => (
                <div key={index} className="food-item">
                  <div className="food-info">
                    <h4>{food.name}</h4>
                    <p>{t('dietAnalysis.nutrition.servingSize')}: {food.servingSize}</p>
                    <p>{t('dietAnalysis.nutrition.confidence')}: {(food.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="food-nutrition">
                    <div className="nutrition-item">
                      <Flame size={16} />
                      <span>{food.calories} {t('dietAnalysis.nutrition.calories')}</span>
                    </div>
                    <div className="nutrition-item">
                      <Droplets size={16} />
                      <span>{t('dietAnalysis.nutrition.carbs')}: {food.carbs}g</span>
                    </div>
                    <div className="nutrition-item">
                      <Star size={16} />
                      <span>{t('dietAnalysis.nutrition.glycemicIndex')}: {food.glycemicIndex}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis results */}
        {analysisResult && (
          <div className="analysis-results">
            <h3>{t('dietAnalysis.results.title')}</h3>
            
            {/* AI Analysis Results */}
            {analysisResult.aiAnalysis && (
              <div className="ai-analysis">
                <h4>🤖 AI 分析结果</h4>
                <div className="ai-analysis-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysisResult.aiAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}
            
            {/* Nutrition Summary - Only show if data exists */}
            {analysisResult.totalCalories && (
              <div className="nutrition-summary">
                <h4>📊 营养分析</h4>
                <div className="nutrition-grid">
                  {analysisResult.totalCalories && (
                    <div className="nutrition-card">
                      <Flame size={24} />
                      <div>
                        <h4>{t('dietAnalysis.nutrition.totalCalories')}</h4>
                        <p>{analysisResult.totalCalories} kcal</p>
                      </div>
                    </div>
                  )}
                  {analysisResult.totalCarbs && (
                    <div className="nutrition-card">
                      <Droplets size={24} />
                      <div>
                        <h4>{t('dietAnalysis.nutrition.totalCarbs')}</h4>
                        <p>{analysisResult.totalCarbs}g</p>
                      </div>
                    </div>
                  )}
                  {analysisResult.totalProtein && (
                    <div className="nutrition-card">
                      <Heart size={24} />
                      <div>
                        <h4>{t('dietAnalysis.nutrition.totalProtein')}</h4>
                        <p>{analysisResult.totalProtein}g</p>
                      </div>
                    </div>
                  )}
                  {analysisResult.averageGlycemicIndex && (
                    <div className="nutrition-card">
                      <Clock size={24} />
                      <div>
                        <h4>{t('dietAnalysis.nutrition.averageGlycemicIndex')}</h4>
                        <p>{analysisResult.averageGlycemicIndex}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Diabetes Analysis - Only show if data exists */}
            {analysisResult.diabetesRisk && (
              <div className="diabetes-analysis">
                <h3>{t('dietAnalysis.diabetes.title')}</h3>
                
                <div className="risk-assessment">
                  <div className="risk-indicator" style={{ backgroundColor: getRiskColor(analysisResult.diabetesRisk) }}>
                    <CheckCircle size={20} />
                    <span>{t('dietAnalysis.diabetes.riskLevel')}: {getRiskText(analysisResult.diabetesRisk)}</span>
                  </div>
                  
                  {analysisResult.estimatedBloodSugarImpact && (
                    <div className="blood-sugar-impact">
                      <h4>{t('dietAnalysis.diabetes.bloodSugarImpact')}</h4>
                      <p>{analysisResult.estimatedBloodSugarImpact}</p>
                    </div>
                  )}
                </div>

                {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h4>{t('dietAnalysis.diabetes.healthAdvice')}</h4>
                    <ul>
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index}>
                          <CheckCircle size={16} />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Analysis Metadata */}
            <div className="analysis-metadata">
              <h4>📋 分析信息</h4>
              <div className="metadata-grid">
                {analysisResult.analysisTimestamp && (
                  <div className="metadata-item">
                    <span className="label">分析时间:</span>
                    <span className="value">{new Date(analysisResult.analysisTimestamp).toLocaleString()}</span>
                  </div>
                )}
                {analysisResult.analysisType && (
                  <div className="metadata-item">
                    <span className="label">分析类型:</span>
                    <span className="value">{analysisResult.analysisType}</span>
                  </div>
                )}
                {analysisResult.imageSize && (
                  <div className="metadata-item">
                    <span className="label">图片大小:</span>
                    <span className="value">{(analysisResult.imageSize / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage instructions */}
        <div className="usage-tips">
          <h3>{t('dietAnalysis.usage.title')}</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <Info size={20} />
              <div>
                <h4>{t('dietAnalysis.usage.photoTips.title')}</h4>
                <p>{t('dietAnalysis.usage.photoTips.description')}</p>
              </div>
            </div>
            <div className="tip-item">
              <AlertTriangle size={20} />
              <div>
                <h4>{t('dietAnalysis.usage.diabetesNotes.title')}</h4>
                <p>{t('dietAnalysis.usage.diabetesNotes.description')}</p>
              </div>
            </div>
            <div className="tip-item">
              <CheckCircle size={20} />
              <div>
                <h4>{t('dietAnalysis.usage.healthAdvice.title')}</h4>
                <p>{t('dietAnalysis.usage.healthAdvice.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietAnalysisPage; 