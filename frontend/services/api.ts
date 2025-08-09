import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// 饮食分析相关接口
export const dietAnalysisAPI = {
  // 上传图片并分析饮食
  analyzeDiet: async (imageFile: File) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const response = await api.post('/diet-analysis/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 获取食物数据库
  getFoods: async () => {
    const response = await api.get('/diet-analysis/foods')
    return response.data
  },

  // 获取饮食建议
  getRecommendations: async () => {
    const response = await api.get('/diet-analysis/recommendations')
    return response.data
  },
}

// Health Records (FHIR)
export const getFhirPatientRecords = async (patientId: string) => {
  // Using the existing 'api' axios instance
  const response = await api.get(`/health-records/fhir/${patientId}`);
  return response.data;
}; 