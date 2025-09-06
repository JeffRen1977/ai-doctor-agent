import React from 'react'
import { Drawer, Button, Menu, Avatar, Typography } from 'antd'
import { 
  CloseOutlined,
  HomeOutlined,
  MessageOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CalendarOutlined,
  MobileOutlined,
  ExclamationCircleOutlined,
  AppleOutlined,
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

  const menuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
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
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: t('sidebar.menu.healthAnalytics'),
    },
    {
      key: '/appointments',
      icon: <CalendarOutlined />,
      label: t('sidebar.menu.appointments'),
    },
    {
      key: '/devices',
      icon: <MobileOutlined />,
      label: t('sidebar.menu.deviceSync'),
    },
    {
      key: '/diet-analysis',
      icon: <AppleOutlined />,
      label: t('sidebar.menu.dietAnalysis'),
    },
    {
      key: '/emergency',
      icon: <ExclamationCircleOutlined />,
      label: t('sidebar.menu.emergency'),
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

