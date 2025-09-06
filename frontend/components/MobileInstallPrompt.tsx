import React, { useState, useEffect } from 'react'
import { Button, Modal, Space, Typography, Card } from 'antd'
import { 
  DownloadOutlined, 
  CloseOutlined, 
  MobileOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useMobile } from '../hooks/useMobile'
import './MobileInstallPrompt.css'

const { Title, Text } = Typography

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const MobileInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const { isMobile, isPWA, canInstall } = useMobile()

  useEffect(() => {
    // 监听PWA安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // 延迟显示安装提示，避免过于频繁
      setTimeout(() => {
        if (!isPWA && !isInstalled) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // 监听PWA安装完成事件
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // 检查是否已经安装
    if (isPWA) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isPWA, isInstalled])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA安装被接受')
        setIsInstalled(true)
      } else {
        console.log('PWA安装被拒绝')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('PWA安装失败:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // 记住用户的选择，避免重复提示
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // 如果已经安装或者是桌面端，不显示提示
  if (isInstalled || !isMobile || !canInstall) {
    return null
  }

  // 检查用户是否已经拒绝过
  if (localStorage.getItem('pwa-install-dismissed') === 'true') {
    return null
  }

  return (
    <Modal
      open={showPrompt}
      onCancel={handleDismiss}
      footer={null}
      centered
      className="mobile-install-modal"
      closable={false}
      width={320}
    >
      <Card className="install-prompt-card">
        <div className="install-prompt-content">
          <div className="install-icon">
            <MobileOutlined />
          </div>
          
          <Title level={4} className="install-title">
            安装AI医生助理
          </Title>
          
          <Text className="install-description">
            将应用添加到主屏幕，获得更好的使用体验：
          </Text>
          
          <ul className="install-benefits">
            <li>📱 快速访问，无需打开浏览器</li>
            <li>🔔 接收健康提醒和通知</li>
            <li>⚡ 更快的加载速度</li>
            <li>📶 离线使用部分功能</li>
          </ul>
          
          <Space direction="vertical" size="middle" className="install-actions">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleInstall}
              block
              size="large"
              className="install-button"
            >
              立即安装
            </Button>
            
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleDismiss}
              block
              className="dismiss-button"
            >
              稍后再说
            </Button>
          </Space>
        </div>
      </Card>
    </Modal>
  )
}

export default MobileInstallPrompt

