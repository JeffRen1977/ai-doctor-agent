import React from 'react'
import { Layout, Menu, Avatar, Dropdown } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  MessageOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './Sidebar.css'

const { Sider } = Layout

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const menuItems = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: 'AI医生对话',
    },
    {
      key: '/health-records',
      icon: <FileTextOutlined />,
      label: '健康记录',
    },
  ]

  const userMenuItems = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人资料',
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

  return (
    <Sider width={250} className="sidebar">
      <div className="logo">
        <h2>AI医生助理</h2>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className="sidebar-menu"
      />

      <div className="user-section">
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === 'logout') {
                logout()
                navigate('/login')
              } else {
                navigate(key)
              }
            },
          }}
          placement="bottomRight"
        >
          <div className="user-info">
            <Avatar size={40} icon={<UserOutlined />} />
            <span className="user-name">{user?.name || '用户'}</span>
          </div>
        </Dropdown>
      </div>
    </Sider>
  )
}

export default Sidebar 