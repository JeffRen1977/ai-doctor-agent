import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/Sidebar'
import MobileApp from './components/MobileApp'
import DashboardPage from './pages/DashboardPage'
import HealthRecordsPage from './pages/HealthRecordsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import DeviceSyncPage from './pages/DeviceSyncPage'
import UserSettingsPage from './pages/UserSettingsPage'
import InterventionEnginePage from './pages/InterventionEnginePage'
import DigitalTwinPage from './pages/DigitalTwinPage'
import RehabilitationAssistantPage from './pages/RehabilitationAssistantPage'
import CollaborationPage from './pages/CollaborationPage'
import { useAuthStore } from './stores/authStore'
import { useLanguageStore } from './stores/languageStore'
import './App.css'

const { Content } = Layout

function App() {
  const { isAuthenticated, initAuth } = useAuthStore()
  const { initLanguage, refreshLanguage } = useLanguageStore()
  const [isMobile, setIsMobile] = useState(false)

  // 检测设备类型
  useEffect(() => {
    const checkDevice = () => {
      const isMobileDevice = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }

    // 延迟检测，确保DOM完全加载
    setTimeout(checkDevice, 100)
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Initialize authentication state and language settings on component mount
  useEffect(() => {
    initAuth()
    initLanguage()
  }, [initAuth, initLanguage])

  // 当认证状态变化时，确保语言设置正确
  useEffect(() => {
    if (isAuthenticated) {
      refreshLanguage()
    }
  }, [isAuthenticated, refreshLanguage])

  // 监听语言变化事件
  useEffect(() => {
    const handleLanguageChange = () => {
      refreshLanguage()
    }

    window.addEventListener('languageChanged', handleLanguageChange)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [refreshLanguage])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  // 移动端使用移动端布局
  if (isMobile) {
    return <MobileApp />
  }

  // 桌面端使用原有布局
  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content style={{ padding: '24px', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<Navigate to="/rehabilitation" replace />} />
            <Route path="/rehabilitation" element={<RehabilitationAssistantPage />} />
            <Route path="/health-records" element={<HealthRecordsPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/collaboration" element={<CollaborationPage />} />
            <Route path="/appointments" element={<Navigate to="/collaboration?tab=appointments" replace />} />
            <Route path="/emergency" element={<Navigate to="/collaboration?tab=emergency" replace />} />
            <Route path="/clinical-reports" element={<Navigate to="/collaboration?tab=reports" replace />} />
            <Route path="/devices" element={<DeviceSyncPage />} />
            <Route path="/diet-analysis" element={<Navigate to="/intervention" replace />} />
            <Route path="/intervention" element={<InterventionEnginePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<UserSettingsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 