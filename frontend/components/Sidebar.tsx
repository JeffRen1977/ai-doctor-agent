import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Divider } from 'antd'
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
import './Sidebar.css'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const mainMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '健康仪表板',
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'AI医生对话',
    },
    {
      key: '/health-records',
      icon: <FileTextOutlined />,
      label: '健康档案',
    },
  ]

  const analysisMenuItems = [
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '健康分析',
    },
    {
      key: '/diet-analysis',
      icon: <CameraOutlined />,
      label: '饮食分析',
    },
  ]

  const managementMenuItems = [
    {
      key: '/appointments',
      icon: <CalendarOutlined />,
      label: '预约管理',
    },
    {
      key: '/devices',
      icon: <SyncOutlined />,
      label: '设备同步',
    },
    {
      key: '/emergency',
      icon: <ExclamationCircleOutlined />,
      label: '紧急求助',
    },
  ]

  const userMenuItems = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
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
        <h2>AI医生助理</h2>
        <p className="logo-subtitle">您的健康管理专家</p>
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
              <span className="user-name">{user?.name || '用户'}</span>
              <span className="user-role">健康管理师</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </Sider>
  )
}

export default Sidebar 