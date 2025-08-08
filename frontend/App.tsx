import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/Sidebar'
import ChatPage from './pages/ChatPage'
import HealthRecordsPage from './pages/HealthRecordsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import { useAuthStore } from './stores/authStore'
import './App.css'

const { Content } = Layout

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content style={{ padding: '24px', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<ChatPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/health-records" element={<HealthRecordsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 