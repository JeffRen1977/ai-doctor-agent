import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token刷新函数
const refreshToken = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      throw new Error('No user data found')
    }
    
    const user = JSON.parse(userStr)
    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
      userId: user.id,
      email: user.email
    })
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      return response.data.token
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    // 清除无效的认证信息
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw error
  }
}

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
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // 尝试刷新token
        const newToken = await refreshToken()
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // 刷新失败，重定向到登录页
        return Promise.reject(refreshError)
      }
    }
    
    if (error.response?.status === 403) {
      // Token无效，清除认证信息并重定向
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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

// Wearable devices API
export const wearablesAPI = {
  // Get device connection status
  getStatus: async () => {
    const response = await api.get('/wearables/status');
    return response.data;
  },

  // Start Fitbit authorization
  startFitbitAuth: async () => {
    const response = await api.get('/wearables/fitbit/auth');
    return response.data;
  },

  // Complete Fitbit authentication
  completeFitbitAuth: async (code: string) => {
    const response = await api.post('/wearables/fitbit/complete-auth', { code });
    return response.data;
  },

  // Get Fitbit data
  getFitbitData: async () => {
    const response = await api.get('/wearables/fitbit/data');
    return response.data;
  },

  // Sync all connected devices
  syncDevices: async (useMock: boolean = false) => {
    const response = await api.post('/wearables/sync', { useMock });
    return response.data;
  },

  // Upload Apple Health data
  uploadAppleHealth: async (healthData: any) => {
    const response = await api.post('/wearables/apple/upload', { healthData });
    return response.data;
  },

  // Get wearable data summary
  getSummary: async (days: number = 7, useMock: boolean = false) => {
    const response = await api.get(`/wearables/summary?days=${days}&useMock=${useMock}`);
    return response.data;
  },

  // Generate mock wearable data
  generateMockData: async (deviceType: string = 'fitbit') => {
    const response = await api.post('/wearables/mock/generate', { deviceType });
    return response.data;
  },

  // Get mock health summary
  getMockSummary: async () => {
    const response = await api.get('/wearables/mock/summary');
    return response.data;
  }
}; 