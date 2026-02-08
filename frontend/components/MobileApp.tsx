import React, { useState, useEffect } from 'react'
import { Layout, FloatButton } from 'antd'
import { 
  MenuOutlined, 
  MessageOutlined, 
  PhoneOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import MobileMenu from './MobileMenu'
import MobileInstallPrompt from './MobileInstallPrompt'
import DashboardPage from '../pages/DashboardPage'
import HealthRecordsPage from '../pages/HealthRecordsPage'
import ProfilePage from '../pages/ProfilePage'
import DeviceSyncPage from '../pages/DeviceSyncPage'
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
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service Worker registration failed, silently fail
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

  const isEmergencyPage = location.pathname === '/collaboration' && new URLSearchParams(location.search).get('tab') === 'emergency'

  return (
    <Layout className="mobile-app">
      {/* 主要内容区域 - 全屏显示，无固定头部和底部栏 */}
      <Content className="mobile-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<Navigate to="/rehabilitation" replace />} />
          <Route path="/health-records" element={<HealthRecordsPage />} />
          <Route path="/digital-twin" element={<DigitalTwinPage />} />
          <Route path="/collaboration" element={<CollaborationPage />} />
          <Route path="/appointments" element={<Navigate to="/collaboration?tab=appointments" replace />} />
          <Route path="/emergency" element={<Navigate to="/collaboration?tab=emergency" replace />} />
          <Route path="/clinical-reports" element={<Navigate to="/collaboration?tab=reports" replace />} />
          <Route path="/devices" element={<DeviceSyncPage />} />
          <Route path="/diet-analysis" element={<Navigate to="/intervention" replace />} />
          <Route path="/intervention" element={<InterventionEnginePage />} />
          <Route path="/rehabilitation" element={<RehabilitationAssistantPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Content>

      {/* 移动端菜单抽屉 */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />

      {/* 浮动菜单按钮 - 固定在左上角 */}
      <FloatButton
        icon={<MenuOutlined />}
        type="primary"
        style={{ 
          left: 16, 
          top: 16,
          width: 48,
          height: 48
        }}
        onClick={() => setIsMenuOpen(true)}
        tooltip={language === 'zh' ? '菜单' : 'Menu'}
      />

      {/* 浮动操作按钮组 - 固定在右下角 */}
      {!isEmergencyPage && (
        <FloatButton.Group
          shape="circle"
          style={{ right: 16, bottom: 16 }}
          icon={<MessageOutlined />}
          trigger="hover"
        >
          <FloatButton
            icon={<HomeOutlined />}
            tooltip={t('sidebar.menu.dashboard')}
            onClick={() => navigate('/dashboard')}
          />
          <FloatButton
            icon={<MessageOutlined />}
            tooltip={t('sidebar.menu.rehabilitationAssistant')}
            onClick={() => navigate('/rehabilitation')}
          />
          <FloatButton
            icon={<ThunderboltOutlined />}
            tooltip={t('sidebar.menu.interventionEngine')}
            onClick={() => navigate('/intervention')}
          />
          <FloatButton
            icon={<ExclamationCircleOutlined />}
            tooltip={t('sidebar.menu.riskMonitoring')}
            onClick={() => navigate('/devices')}
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

      {/* 离线提示 - 浮动显示 */}
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
