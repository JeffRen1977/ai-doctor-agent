import React, { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Divider, Button } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CalendarOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  CameraOutlined,
  SettingOutlined,
  GlobalOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getTranslation } from '@/locales'
import './Sidebar.css'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { language, setLanguage } = useLanguageStore()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const t = (key: string) => getTranslation(language, key)

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    setLanguage(newLanguage)
    // 强制重新渲染
    window.location.reload()
  }

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileOpen(false)
  }

  const handleMenuClick = (key: string) => {
    if (key !== 'divider1' && key !== 'divider2') {
      navigate(key)
      // Close mobile menu after navigation
      closeMobileMenu()
    }
  }

  const mainMenuItems = [
    {
      key: '/dashboard',
      icon: React.createElement(DashboardOutlined),
      label: t('sidebar.menu.dashboard'),
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: t('sidebar.menu.aiChat'),
    },
    {
      key: '/health-records',
      icon: <FileTextOutlined />,
      label: t('sidebar.menu.healthRecords'),
    },
  ]

  const analysisMenuItems = [
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: t('sidebar.menu.healthAnalytics'),
    },
    {
      key: '/diet-analysis',
      icon: <CameraOutlined />,
      label: t('sidebar.menu.dietAnalysis'),
    },
  ]

  const managementMenuItems = [
    {
      key: '/appointments',
      icon: <CalendarOutlined />,
      label: t('sidebar.menu.appointments'),
    },
    {
      key: '/devices',
      icon: <SyncOutlined />,
      label: t('sidebar.menu.deviceSync'),
    },
    {
      key: '/emergency',
      icon: <ExclamationCircleOutlined />,
      label: t('sidebar.menu.emergency'),
    },
  ]

  const userMenuItems = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: t('sidebar.menu.profile'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.menu.settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('sidebar.menu.logout'),
      onClick: () => {
        logout()
        navigate('/login')
      },
    },
  ]

  // 合并所有菜单项，添加分组
  const allMenuItems = [
    ...mainMenuItems,
    { type: 'divider', key: 'divider1' },
    ...analysisMenuItems,
    { type: 'divider', key: 'divider2' },
    ...managementMenuItems,
  ]

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <MenuOutlined />
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'active' : ''}`} 
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <Sider 
        width={250} 
        className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Mobile Close Button */}
        <div className="mobile-close-button" onClick={closeMobileMenu}>
          <CloseOutlined />
        </div>

        <div className="logo">
          <h2>{t('sidebar.logo.title')}</h2>
          <p className="logo-subtitle">{t('sidebar.logo.subtitle')}</p>
        </div>
        
        <div className="menu-container">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={allMenuItems}
            onClick={({ key }) => handleMenuClick(key)}
            className="sidebar-menu"
          />
        </div>

        <div className="user-section">
          <div className="user-info-container">
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    logout()
                    navigate('/login')
                  } else if (key !== 'divider') {
                    navigate(key)
                  }
                },
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="user-info">
                <Avatar 
                  size={40} 
                  icon={<UserOutlined />} 
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }} 
                />
                <div className="user-details">
                  <span className="user-name">{user?.name || (language === 'zh' ? '用户' : 'User')}</span>
                  <span className="user-role">{t('sidebar.user.role')}</span>
                </div>
              </div>
            </Dropdown>
            
            {/* 添加语言切换按钮 */}
            <div className="language-switch-container">
              <Button
                type="text"
                icon={<GlobalOutlined />}
                size="small"
                onClick={() => handleLanguageChange(language === 'zh' ? 'en' : 'zh')}
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginTop: '8px'
                }}
              >
                {language === 'zh' ? 'EN' : '中文'}
              </Button>
            </div>
          </div>
        </div>
      </Sider>
    </>
  )
}

export default Sidebar 