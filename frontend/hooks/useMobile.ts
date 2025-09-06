import { useState, useEffect } from 'react'

interface MobileInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
  isOnline: boolean
  isPWA: boolean
  canInstall: boolean
}

export const useMobile = (): MobileInfo => {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: 'landscape',
    isOnline: navigator.onLine,
    isPWA: false,
    canInstall: false,
  })

  useEffect(() => {
    const updateMobileInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobileDevice = width <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isTabletDevice = width > 768 && width <= 1024
      const isDesktopDevice = width > 1024
      const orientation = height > width ? 'portrait' : 'landscape'
      
      // 检测PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      
      // 检测是否可以安装PWA
      const canInstall = 'serviceWorker' in navigator && 'PushManager' in window

      setMobileInfo({
        isMobile: isMobileDevice,
        isTablet: isTabletDevice,
        isDesktop: isDesktopDevice,
        screenWidth: width,
        screenHeight: height,
        orientation,
        isOnline: navigator.onLine,
        isPWA,
        canInstall,
      })
    }

    // 初始检测
    updateMobileInfo()

    // 监听窗口大小变化
    window.addEventListener('resize', updateMobileInfo)
    
    // 监听网络状态变化
    window.addEventListener('online', () => setMobileInfo(prev => ({ ...prev, isOnline: true })))
    window.addEventListener('offline', () => setMobileInfo(prev => ({ ...prev, isOnline: false })))

    // 监听PWA安装状态变化
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handlePWAChange = () => {
      setMobileInfo(prev => ({
        ...prev,
        isPWA: mediaQuery.matches || (window.navigator as any).standalone
      }))
    }
    mediaQuery.addEventListener('change', handlePWAChange)

    return () => {
      window.removeEventListener('resize', updateMobileInfo)
      window.removeEventListener('online', () => setMobileInfo(prev => ({ ...prev, isOnline: true })))
      window.removeEventListener('offline', () => setMobileInfo(prev => ({ ...prev, isOnline: false })))
      mediaQuery.removeEventListener('change', handlePWAChange)
    }
  }, [])

  return mobileInfo
}

// 移动端手势支持
export const useMobileGestures = () => {
  const [gesture, setGesture] = useState<{
    type: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | null
    direction: string | null
  }>({ type: null, direction: null })

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!e.changedTouches[0]) return

      const touch = e.changedTouches[0]
      const endX = touch.clientX
      const endY = touch.clientY
      const endTime = Date.now()

      const deltaX = endX - startX
      const deltaY = endY - startY
      const deltaTime = endTime - startTime

      // 最小滑动距离和最大时间
      const minDistance = 50
      const maxTime = 300

      if (deltaTime > maxTime) return

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > minDistance) {
          setGesture({
            type: deltaX > 0 ? 'swipe-right' : 'swipe-left',
            direction: deltaX > 0 ? 'right' : 'left'
          })
        }
      } else {
        // 垂直滑动
        if (Math.abs(deltaY) > minDistance) {
          setGesture({
            type: deltaY > 0 ? 'swipe-down' : 'swipe-up',
            direction: deltaY > 0 ? 'down' : 'up'
          })
        }
      }

      // 重置手势状态
      setTimeout(() => {
        setGesture({ type: null, direction: null })
      }, 100)
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return gesture
}

// 移动端通知支持
export const useMobileNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported('Notification' in window)
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted' || !isSupported) return

    try {
      const notification = new Notification(title, {
        icon: '/icon.svg',
        badge: '/icon.svg',
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification
  }
}

