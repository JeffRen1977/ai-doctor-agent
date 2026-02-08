import React from 'react'
import { Drawer, Button, Menu, Avatar, Typography } from 'antd'
import { 
  CloseOutlined,
  HomeOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import LanguageSwitch from './LanguageSwitch'
import './MobileMenu.css'

const { Text } = Typography

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { t } = useLanguageStore()

  // 按最新设计组织菜单，与桌面端保持一致
  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: t('sidebar.menu.dashboard'),
    },
    {
      key: '/health-records',
      icon: <FileTextOutlined />,
      label: t('sidebar.menu.healthRecords'),
    },
    {
      key: '/digital-twin',
      icon: <BarChartOutlined />,
      label: t('sidebar.menu.digitalTwin'),
    },
    {
      key: '/devices',
      icon: <ExclamationCircleOutlined />,
      label: t('sidebar.menu.riskMonitoring'),
    },
    {
      key: '/intervention',
      icon: <ThunderboltOutlined />,
      label: t('sidebar.menu.interventionEngine'),
    },
    {
      key: '/rehabilitation',
      icon: <MessageOutlined />,
      label: t('sidebar.menu.rehabilitationAssistant'),
    },
    {
      key: '/collaboration',
      icon: <CalendarOutlined />,
      label: t('sidebar.menu.clinicalCollaboration'),
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: t('sidebar.menu.profile'),
    },
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
    onClose()
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  return (
    <Drawer
      title={null}
      placement="left"
      closable={false}
      onClose={onClose}
      open={isOpen}
      width={280}
      className="mobile-menu-drawer"
      bodyStyle={{ padding: 0 }}
    >
      <div className="mobile-menu-container">
        {/* Header */}
        <div className="mobile-menu-header">
          <div className="mobile-menu-logo">
            <h2>AI Doctor</h2>
            <Text type="secondary" className="logo-subtitle">
              {t('sidebar.logo.subtitle')}
            </Text>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="mobile-menu-close"
          />
        </div>

        {/* User Info */}
        <div className="mobile-menu-user">
          <Avatar size={48} icon={<UserOutlined />} />
          <div className="user-info">
            <Text strong>{user?.name || 'User'}</Text>
            <Text type="secondary" className="user-role">
              {t('sidebar.user.role')}
            </Text>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="mobile-menu-content">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
            className="mobile-menu-list"
          />
        </div>

        {/* Language Switch */}
        <div className="mobile-menu-footer">
          <div className="language-switch-section">
            <LanguageSwitch />
          </div>
          
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="logout-button"
            block
          >
            {t('sidebar.menu.logout')}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}

export default MobileMenu

