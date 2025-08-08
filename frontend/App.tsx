import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import HealthRecordsPage from './pages/HealthRecordsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import AppointmentPage from './pages/AppointmentPage'
import DeviceSyncPage from './pages/DeviceSyncPage'
import HealthAnalyticsPage from './pages/HealthAnalyticsPage'
import EmergencyPage from './pages/EmergencyPage'
import DietAnalysisPage from './pages/DietAnalysisPage'
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
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/health-records" element={<HealthRecordsPage />} />
            <Route path="/analytics" element={<HealthAnalyticsPage />} />
            <Route path="/appointments" element={<AppointmentPage />} />
            <Route path="/devices" element={<DeviceSyncPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/diet-analysis" element={<DietAnalysisPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App 