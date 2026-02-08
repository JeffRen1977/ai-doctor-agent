import React, { useState, useEffect } from 'react'
import { Layout, Button, FloatButton } from 'antd'
import { 
  MenuOutlined, 
  MessageOutlined, 
  PhoneOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  MobileOutlined
} from '@ant-design/icons'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import MobileMenu from './MobileMenu'
import MobileInstallPrompt from './MobileInstallPrompt'
import DashboardPage from '../pages/DashboardPage'
import HealthRecordsPage from '../pages/HealthRecordsPage'
import ProfilePage from '../pages/ProfilePage'
import DeviceSyncPage from '../pages/DeviceSyncPage'
import HealthAnalyticsPage from '../pages/HealthAnalyticsPage'
import InterventionEnginePage from '../pages/InterventionEnginePage'
import CollaborationPage from '../pages/CollaborationPage'
import DigitalTwinPage from '../pages/DigitalTwinPage'
import RehabilitationAssistantPage from '../pages/RehabilitationAssistantPage'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { useMobile, useMobileNotifications } from '../hooks/useMobile'
import { getTranslation } from '../locales'
import './MobileApp.css'

const { Content } = Layout

const MobileApp: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { language } = useLanguageStore()
  const t = (key: string) => getTranslation(language, key)
  const { isOnline, isPWA } = useMobile()
  const { requestPermission, showNotification } = useMobileNotifications()

  // 注册Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  // 请求通知权限
  useEffect(() => {
    if (isAuthenticated) {
      requestPermission()
    }
  }, [isAuthenticated, requestPermission])

  // 显示欢迎通知
  useEffect(() => {
    if (isAuthenticated && isPWA) {
      setTimeout(() => {
        showNotification('欢迎使用AI医生助理', {
          body: '您的个人健康管理助手已准备就绪',
          tag: 'welcome'
        })
      }, 2000)
    }
  }, [isAuthenticated, isPWA, showNotification])

  // 登录后自动跳转到dashboard
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate('/dashboard')
    }
  }, [isAuthenticated, location.pathname, navigate])

  // 移动端组件不需要重复检查认证状态，因为App.tsx已经处理了
  // if (!isAuthenticated) {
  //   return <LoginPage />
  // }

  const isEmergencyPage = location.pathname === '/collaboration' && new URLSearchParams(location.search).get('tab') === 'emergency'

  console.log('📱 MobileApp rendering:', {
    isAuthenticated,
    location: location.pathname,
    isOnline,
    isPWA
  })

  return (
    <Layout className="mobile-app">
      {/* 移动端顶部导航栏 */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setIsMenuOpen(true)}
            className="mobile-menu-button"
          />
          <h1 className="mobile-title">
            {location.pathname === '/dashboard' && t('sidebar.menu.dashboard')}
            {location.pathname === '/chat' && t('sidebar.menu.aiChat')}
            {location.pathname === '/health-records' && t('sidebar.menu.healthRecords')}
            {location.pathname === '/analytics' && t('sidebar.menu.healthAnalytics')}
            {location.pathname === '/collaboration' && t('sidebar.menu.clinicalCollaboration')}
            {location.pathname === '/devices' && t('sidebar.menu.deviceSync')}
            {location.pathname === '/intervention' && t('sidebar.menu.interventionEngine')}
            {location.pathname === '/profile' && t('sidebar.menu.profile')}
          </h1>
        </div>
        
        <div className="mobile-header-right">
          {!isOnline && (
            <div className="offline-indicator">
              <span>●</span>
            </div>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <Content className="mobile-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<Navigate to="/rehabilitation" replace />} />
          <Route path="/health-records" element={<HealthRecordsPage />} />
          <Route path="/analytics" element={<HealthAnalyticsPage />} />
          <Route path="/digital-twin" element={<DigitalTwinPage />} />
          <Route path="/collaboration" element={<CollaborationPage />} />
          <Route path="/appointments" element={<Navigate to="/collaboration?tab=appointments" replace />} />
          <Route path="/emergency" element={<Navigate to="/collaboration?tab=emergency" replace />} />
          <Route path="/clinical-reports" element={<Navigate to="/collaboration?tab=reports" replace />} />
          <Route path="/devices" element={<DeviceSyncPage />} />
          <Route path="/diet-analysis" element={<Navigate to="/intervention" replace />} />
          <Route path="/intervention" element={<InterventionEnginePage />} />
          <Route path="/rehabilitation" element={<RehabilitationAssistantPage />} />
          <Route path="/chat" element={<RehabilitationAssistantPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Content>

      {/* 移动端底部导航栏 */}
      <div className="mobile-bottom-nav">
        <Button
          type="text"
          icon={<HomeOutlined />}
          className={`nav-button ${location.pathname === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          {t('sidebar.menu.dashboard')}
        </Button>
        <Button
          type="text"
          icon={<MessageOutlined />}
          className={`nav-button ${location.pathname === '/chat' ? 'active' : ''}`}
          onClick={() => navigate('/chat')}
        >
          {t('sidebar.menu.aiChat')}
        </Button>
        <Button
          type="text"
          icon={<ThunderboltOutlined />}
          className={`nav-button ${location.pathname === '/intervention' ? 'active' : ''}`}
          onClick={() => navigate('/intervention')}
        >
          {t('sidebar.menu.interventionEngine')}
        </Button>
        <Button
          type="text"
          icon={<MobileOutlined />}
          className={`nav-button ${location.pathname === '/devices' ? 'active' : ''}`}
          onClick={() => navigate('/devices')}
        >
          {t('sidebar.menu.deviceSync')}
        </Button>
      </div>

      {/* 移动端菜单抽屉 */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />

      {/* 浮动操作按钮 */}
      {!isEmergencyPage && (
        <FloatButton.Group
          shape="circle"
          style={{ right: 24, bottom: 100 }}
          icon={<MessageOutlined />}
        >
          <FloatButton
            icon={<MessageOutlined />}
            tooltip={t('sidebar.menu.aiChat')}
            onClick={() => navigate('/chat')}
          />
          <FloatButton
            icon={<PhoneOutlined />}
            tooltip={t('sidebar.menu.emergency')}
            onClick={() => navigate('/collaboration?tab=emergency')}
            type="primary"
            style={{ backgroundColor: '#ff4d4f' }}
          />
        </FloatButton.Group>
      )}

      {/* 离线提示 */}
      {!isOnline && (
        <div className="offline-banner">
          <span>📡 {t('common.offline')}</span>
        </div>
      )}

      {/* PWA安装提示 */}
      <MobileInstallPrompt />
    </Layout>
  )
}

export default MobileApp
