import React from 'react'
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
  const { language } = useLanguageStore()

  const t = (key: string) => getTranslation(language, key)

  const mainMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
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
    <Sider width={250} className="sidebar">
      <div className="logo">
        <h2>{t('sidebar.logo.title')}</h2>
        <p className="logo-subtitle">{t('sidebar.logo.subtitle')}</p>
      </div>
      
      <div className="menu-container">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={allMenuItems}
          onClick={({ key }) => {
            if (key !== 'divider1' && key !== 'divider2') {
              navigate(key)
            }
          }}
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
        </div>
      </div>
    </Sider>
  )
}

export default Sidebar 