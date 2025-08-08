import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  FileImage, 
  InfoCircle, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Fire,
  Droplet,
  Activity
} from 'lucide-react';
import { dietAnalysisAPI } from '../services/api';
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
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  totalFiber: number;
  averageGlycemicIndex: number;
  estimatedBloodSugarImpact: string;
  recommendations: string[];
  diabetesRisk: 'low' | 'medium' | 'high';
}

const DietAnalysisPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DietAnalysis | null>(null);
  const [recognizedFoods, setRecognizedFoods] = useState<FoodItem[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // 模拟食物数据库
  const foodDatabase: { [key: string]: FoodItem } = {
    'rice': {
      name: '白米饭',
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
      name: '面条',
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
      name: '蔬菜',
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
      name: '肉类',
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
      name: '鱼类',
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
      name: '面包',
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
      name: '水果',
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
        setError('请选择有效的图片文件');
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
      setError('请先上传或拍摄食物图片');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 调用后端API进行饮食分析
      const response = await dietAnalysisAPI.analyzeDiet(selectedImage);
      
      if (response.success) {
        setRecognizedFoods(response.data.recognizedFoods);
        setAnalysisResult(response.data.analysis);
      } else {
        setError(response.message || '分析失败');
      }
    } catch (err: any) {
      console.error('饮食分析错误:', err);
      setError(err.response?.data?.message || '分析过程中出现错误，请重试');
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
      case 'low': return '低风险';
      case 'medium': return '中等风险';
      case 'high': return '高风险';
    }
  };

  return (
    <div className="diet-analysis-page">
      <div className="diet-analysis-header">
        <h1>饮食分析助手</h1>
        <p>上传食物图片，获取详细的营养分析和糖尿病健康建议</p>
      </div>

      <div className="diet-analysis-container">
        {/* 图片上传区域 */}
        <div className="upload-section">
          <div className="upload-area">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="食物图片" />
                <button 
                  className="retake-btn"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview('');
                    setAnalysisResult(null);
                    setRecognizedFoods([]);
                  }}
                >
                  重新选择
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icons">
                  <Upload size={48} />
                  <Camera size={48} />
                  <FileImage size={48} />
                </div>
                <h3>上传食物图片</h3>
                <p>支持拍照或从相册选择图片</p>
                <div className="upload-buttons">
                  <button 
                    className="upload-btn primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileImage size={20} />
                    选择图片
                  </button>
                  <button 
                    className="upload-btn secondary"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera size={20} />
                    拍照
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

        {/* 分析按钮 */}
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
                  正在分析...
                </>
              ) : (
                <>
                  <Activity size={20} />
                  开始分析
                </>
              )}
            </button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* 识别结果 */}
        {recognizedFoods.length > 0 && (
          <div className="recognition-results">
            <h3>识别到的食物</h3>
            <div className="food-items">
              {recognizedFoods.map((food, index) => (
                <div key={index} className="food-item">
                  <div className="food-info">
                    <h4>{food.name}</h4>
                    <p>份量: {food.servingSize}</p>
                    <p>置信度: {(food.confidence * 100).toFixed(1)}%</p>
                  </div>
                  <div className="food-nutrition">
                    <div className="nutrition-item">
                      <Fire size={16} />
                      <span>{food.calories} 卡路里</span>
                    </div>
                    <div className="nutrition-item">
                      <Droplet size={16} />
                      <span>碳水: {food.carbs}g</span>
                    </div>
                    <div className="nutrition-item">
                      <Activity size={16} />
                      <span>升糖指数: {food.glycemicIndex}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 分析结果 */}
        {analysisResult && (
          <div className="analysis-results">
            <h3>营养分析结果</h3>
            
            <div className="nutrition-summary">
              <div className="nutrition-card">
                <Fire size={24} />
                <div>
                  <h4>总卡路里</h4>
                  <p>{analysisResult.totalCalories} kcal</p>
                </div>
              </div>
              <div className="nutrition-card">
                <Droplet size={24} />
                <div>
                  <h4>碳水化合物</h4>
                  <p>{analysisResult.totalCarbs}g</p>
                </div>
              </div>
              <div className="nutrition-card">
                <Activity size={24} />
                <div>
                  <h4>蛋白质</h4>
                  <p>{analysisResult.totalProtein}g</p>
                </div>
              </div>
              <div className="nutrition-card">
                <Clock size={24} />
                <div>
                  <h4>平均升糖指数</h4>
                  <p>{analysisResult.averageGlycemicIndex}</p>
                </div>
              </div>
            </div>

            <div className="diabetes-analysis">
              <h3>糖尿病健康评估</h3>
              
              <div className="risk-assessment">
                <div className="risk-indicator" style={{ backgroundColor: getRiskColor(analysisResult.diabetesRisk) }}>
                  <CheckCircle size={20} />
                  <span>风险等级: {getRiskText(analysisResult.diabetesRisk)}</span>
                </div>
                
                <div className="blood-sugar-impact">
                  <h4>血糖影响评估</h4>
                  <p>{analysisResult.estimatedBloodSugarImpact}</p>
                </div>
              </div>

              <div className="recommendations">
                <h4>健康建议</h4>
                <ul>
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index}>
                      <CheckCircle size={16} />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="usage-tips">
          <h3>使用说明</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <InfoCircle size={20} />
              <div>
                <h4>拍照技巧</h4>
                <p>确保食物清晰可见，光线充足，避免阴影遮挡</p>
              </div>
            </div>
            <div className="tip-item">
              <AlertCircle size={20} />
              <div>
                <h4>糖尿病注意事项</h4>
                <p>重点关注碳水化合物含量和升糖指数，合理控制餐量</p>
              </div>
            </div>
            <div className="tip-item">
              <CheckCircle size={20} />
              <div>
                <h4>健康建议</h4>
                <p>结合运动，定期监测血糖，保持均衡饮食</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietAnalysisPage; 