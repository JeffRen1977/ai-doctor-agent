import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  initAuth: () => void
  refreshToken: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => {
    console.log('🔑 Login called with user:', user)
    set({ user, isAuthenticated: true })
    console.log('Auth state updated, isAuthenticated should be true')
    
    // 登录成功后，确保语言设置立即生效
    // 这里不需要直接调用语言初始化，因为App.tsx中的useEffect会处理
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  },
  // Token刷新方法
  refreshToken: async () => {
    try {
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        return false
      }
      
      const user = JSON.parse(userStr)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: '123456' // 使用默认密码重新登录
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        console.log('✅ Token refreshed successfully')
        return true
      } else {
        console.error('❌ Token refresh failed')
        return false
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error)
      return false
    }
  },
  // Initialize auth state from localStorage
  initAuth: () => {
    console.log('🔐 Initializing auth state...')
    const token = localStorage.getItem('token')
    console.log('Token found:', !!token)
    
    if (token) {
      // If token exists, try to get user info from localStorage or set as authenticated
      const userStr = localStorage.getItem('user')
      console.log('User data found:', !!userStr)
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          console.log('Setting authenticated user:', user.name)
          set({ user, isAuthenticated: true })
          
          // 设置定时器，在token过期前1小时刷新
          setTimeout(() => {
            get().refreshToken()
          }, 6 * 60 * 60 * 1000) // 6小时后刷新（7天token，提前1天刷新）
          
        } catch (e) {
          console.error('Error parsing user data:', e)
          // If user data is corrupted, clear everything
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } else {
        // Token exists but no user data, set as authenticated (user will be fetched later)
        console.log('Token exists, setting authenticated state')
        set({ isAuthenticated: true })
      }
    } else {
      console.log('No token found, user not authenticated')
    }
  },
})) 