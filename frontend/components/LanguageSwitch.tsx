import React from 'react'
import { Button, Dropdown } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useLanguageStore } from '@/stores/languageStore'
import { Language } from '@/locales'

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguageStore()

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
    // 强制重新渲染
    window.location.reload()
  }

  const languageOptions = [
    {
      key: 'zh',
      label: '中文',
      onClick: () => handleLanguageChange('zh')
    },
    {
      key: 'en',
      label: 'English',
      onClick: () => handleLanguageChange('en')
    }
  ]

  return (
    <Dropdown
      menu={{ items: languageOptions }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button 
        type="text" 
        icon={<GlobalOutlined />}
        style={{ color: 'rgba(255, 255, 255, 0.85)' }}
      >
        {language === 'zh' ? 'EN' : '中文'}
      </Button>
    </Dropdown>
  )
}

export default LanguageSwitch 