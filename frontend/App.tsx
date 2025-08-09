import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import HealthRecordsPage from './pages/HealthRecordsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import AppointmentPage from './pages/AppointmentPage'
import DeviceSyncPage from './pages/DeviceSyncPage'
import HealthAnalyticsPage from './pages/HealthAnalyticsPage'
import EmergencyPage from './pages/EmergencyPage'
import DietAnalysisPage from './pages/DietAnalysisPage'
import { useAuthStore } from './stores/authStore'
import { useLanguageStore } from './stores/languageStore'
import './App.css'

const { Content } = Layout

function App() {
  const { isAuthenticated, initAuth } = useAuthStore()
  const { initLanguage, refreshLanguage, language } = useLanguageStore()

  // Initialize authentication state and language settings on component mount
  useEffect(() => {
    console.log('🚀 App component mounting, initializing...')
    initAuth()
    initLanguage()
  }, [initAuth, initLanguage])

  // 当认证状态变化时，确保语言设置正确
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔐 User authenticated, ensuring language consistency...')
      // 使用refreshLanguage方法，确保登录后的语言一致性
      refreshLanguage()
    }
  }, [isAuthenticated, refreshLanguage])

  // 监听语言变化事件
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('🌐 Language change detected in App component')
      refreshLanguage()
    }

    window.addEventListener('languageChanged', handleLanguageChange)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [refreshLanguage])

  console.log('🌐 Current language:', language, 'Authenticated:', isAuthenticated)

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content style={{ padding: '24px', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/health-records" element={<HealthRecordsPage />} />
            <Route path="/analytics" element={<HealthAnalyticsPage />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/devices" element={<DeviceSyncPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/diet-analysis" element={<DietAnalysisPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 