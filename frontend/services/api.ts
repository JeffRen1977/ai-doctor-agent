import axios from 'axios'
import { getApiBaseUrl } from '../utils/apiConfig'

const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for API requests
})

// Token刷新函数
const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No token found')
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
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
    
    // 429：后端限流。把 Retry-After 换算成用户看得懂的提示，
    // 不要让它掉进通用的「网络错误」里，否则用户会不停重试、把额度耗得更快。
    if (error.response?.status === 429) {
      const retryAfterSec = Number(
        error.response.data?.retryAfter ?? error.response.headers?.['retry-after']
      )
      const wait = Number.isFinite(retryAfterSec) && retryAfterSec > 0
        ? `请在 ${Math.ceil(retryAfterSec / 60)} 分钟后重试。`
        : '请稍后重试。'
      error.friendlyMessage = `${error.response.data?.error || '请求过于频繁。'}${wait}`
      return Promise.reject(error)
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

// Risk Monitoring API
export const riskMonitoringAPI = {
  // Process stream data
  processStreamData: async (deviceType: string, data: any) => {
    const response = await api.post('/risk-monitoring/process-stream', { deviceType, data });
    return response.data;
  },

  // Detect anomalies
  detectAnomalies: async (dataStream: any[]) => {
    const response = await api.post('/risk-monitoring/detect-anomalies', { dataStream });
    return response.data;
  },

  // Predict hypoglycemia
  predictHypoglycemia: async (glucoseData: any[]) => {
    const response = await api.post('/risk-monitoring/predict-hypoglycemia', { glucoseData });
    return response.data;
  },

  // Analyze HRV trend
  analyzeHRV: async (heartRateData: any[]) => {
    const response = await api.post('/risk-monitoring/analyze-hrv', { heartRateData });
    return response.data;
  },

  // Get monitoring status
  getStatus: async () => {
    const response = await api.get('/risk-monitoring/status');
    return response.data;
  },

  // Get recent alerts
  getAlerts: async (limit: number = 20) => {
    const response = await api.get(`/risk-monitoring/alerts?limit=${limit}`);
    return response.data;
  },

  // Acknowledge alert
  acknowledgeAlert: async (alertId: string) => {
    const response = await api.post(`/risk-monitoring/alerts/${alertId}/acknowledge`);
    return response.data;
  }
};

export const digitalTwinAPI = {
  getHealthSummary: () => api.get('/digital-twin/health-summary').then(res => res.data),
  refreshHealthSummary: () => api.post('/digital-twin/health-summary/refresh').then(res => res.data)
};

// Intervention Engine API
export const interventionEngineAPI = {
  // Get medication management
  getMedication: async () => {
    const response = await api.get('/intervention/medication');
    return response.data;
  },

  // Add or update medication
  addOrUpdateMedication: async (medication: any) => {
    const response = await api.post('/intervention/medication/add', { medication });
    return response.data;
  },

  // Record medication history
  recordMedicationHistory: async (medicationId: string, date: string, time: string, status: 'taken' | 'missed', notes?: string) => {
    const response = await api.post('/intervention/medication/record', {
      medicationId,
      date,
      time,
      status,
      notes
    });
    return response.data;
  },

  // Analyze medication effectiveness
  analyzeMedicationEffectiveness: async (medication: string, timeframe: string) => {
    const response = await api.post('/intervention/medication/effectiveness', {
      medication,
      timeframe
    });
    return response.data;
  },

  // Generate nutrition advice (uses diet analysis)
  generateNutritionAdvice: async (imageFile: File, currentMetrics?: any) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (currentMetrics) {
      formData.append('currentMetrics', JSON.stringify(currentMetrics));
    }
    
    const response = await api.post('/intervention/nutrition', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Generate exercise plan
  generateExercisePlan: async (healthState?: any) => {
    const response = await api.post('/intervention/exercise', { healthState: healthState || {} });
    return response.data;
  },

  // Get current exercise plan
  getExercisePlan: async () => {
    const response = await api.get('/intervention/exercise');
    return response.data;
  },

  // Adjust intervention
  adjustIntervention: async (feedback: any) => {
    const response = await api.post('/intervention/adjust', { feedback });
    return response.data;
  },

  // Initialize intervention structure
  initIntervention: async () => {
    const response = await api.post('/intervention/init');
    return response.data;
  }
};

// Rehabilitation Assistant API
export const rehabilitationAssistantAPI = {
  // Explain clinical metrics
  explainMetrics: async (metrics: any) => {
    const response = await api.post('/rehabilitation/explain-metrics', { metrics });
    return response.data;
  },

  // Provide emotional support
  provideEmotionalSupport: async (context: any) => {
    const response = await api.post('/rehabilitation/emotional-support', { context });
    return response.data;
  },

  // Guide meditation
  guideMeditation: async (type: string = 'breathing') => {
    const response = await api.post('/rehabilitation/meditation', { type });
    return response.data;
  },

  // Provide CBT support
  provideCBT: async (situation: any) => {
    const response = await api.post('/rehabilitation/cbt', { situation });
    return response.data;
  },

  // Answer health questions
  answerHealthQuestion: async (question: string) => {
    const response = await api.post('/rehabilitation/answer', { question });
    return response.data;
  },

  // Get rehabilitation records
  getRecords: async (options?: { type?: string; subtype?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.subtype) params.append('subtype', options.subtype);
    if (options?.limit) params.append('limit', options.limit.toString());
    const response = await api.get(`/rehabilitation/records?${params.toString()}`);
    return response.data;
  },

  // Get user context
  getContext: async () => {
    const response = await api.get('/rehabilitation/context');
    return response.data;
  },

  // Submit feedback
  submitFeedback: async (recordId: string, feedback: { effectiveness: number; helpful?: boolean; comments?: string }) => {
    const response = await api.post('/rehabilitation/feedback', {
      recordId,
      ...feedback
    });
    return response.data;
  }
};

// Clinical Collaboration API (医患协作)
export const collaborationAPI = {
  // Appointments
  getAppointments: async (filters?: { status?: string; type?: string; startDate?: string; endDate?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const response = await api.get(`/appointments?${params.toString()}`);
    return response.data;
  },

  getUpcomingAppointments: async (days: number = 7) => {
    const response = await api.get(`/appointments/upcoming?days=${days}`);
    return response.data;
  },

  getAppointment: async (appointmentId: string) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  createAppointment: async (appointmentData: any) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  updateAppointment: async (appointmentId: string, appointmentData: any) => {
    const response = await api.put(`/appointments/${appointmentId}`, appointmentData);
    return response.data;
  },

  deleteAppointment: async (appointmentId: string) => {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Clinical Reports
  generateReport: async (options: { reportType: string; period?: string; title?: string }) => {
    const endpoint = options.reportType === 'comprehensive' 
      ? '/reports/comprehensive' 
      : '/reports/health-assessment';
    const response = await api.post(endpoint, {
      title: options.title,
      period: options.period
    });
    return response.data;
  },

  getReports: async (filters?: { reportType?: string; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.reportType) params.append('reportType', filters.reportType);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const response = await api.get(`/reports?${params.toString()}`);
    return response.data;
  },

  getReport: async (reportId: string) => {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  // Emergency
  setupEmergencyContact: async (contactInfo: any) => {
    const response = await api.post('/emergency/contacts', contactInfo);
    return response.data;
  },

  getEmergencyContacts: async () => {
    const response = await api.get('/emergency/contacts');
    return response.data;
  },

  triggerEmergencyAlert: async (eventType: string, location?: any) => {
    const response = await api.post('/emergency/alert', { eventType, location });
    return response.data;
  },

  sendEmergencyMessage: async (messageData: any) => {
    const response = await api.post('/emergency/message', messageData);
    return response.data;
  }
};
