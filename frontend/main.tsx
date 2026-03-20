import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import App from './App'
import { appTheme } from './theme/designTokens'
import './index.css'

// 创建一个包装组件来处理动态语言切换
const AppWithLocale: React.FC = () => {
  const [locale, setLocale] = React.useState(zhCN)
  
  // 监听localStorage中的语言变化
  React.useEffect(() => {
    const handleLanguageChange = () => {
      const savedLanguage = localStorage.getItem('selectedLanguage')
      if (savedLanguage === 'en') {
        setLocale(enUS)
      } else {
        setLocale(zhCN)
      }
    }
    
    // 初始设置
    handleLanguageChange()
    
    // 监听storage事件
    window.addEventListener('storage', handleLanguageChange)
    
    // 自定义事件监听
    window.addEventListener('languageChanged', handleLanguageChange)
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange)
      window.removeEventListener('languageChanged', handleLanguageChange)
    }
  }, [])
  
  return (
    <ConfigProvider locale={locale} theme={appTheme}>
      <App />
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppWithLocale />
    </BrowserRouter>
  </React.StrictMode>,
) 