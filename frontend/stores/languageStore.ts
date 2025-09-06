import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Language, getTranslation } from '../locales'

interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
  initLanguage: () => void
  refreshLanguage: () => void
  forceUpdate: () => void
  t: (key: string) => string
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'zh',
      setLanguage: (language: Language) => {
        set({ language })
        // 同时保存到localStorage作为备份
        localStorage.setItem('selectedLanguage', language)
        console.log('🌐 Language set to:', language)
        
        // 触发自定义事件，通知其他组件语言已变化
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }))
        
        // 强制更新所有使用语言store的组件
        setTimeout(() => {
          get().forceUpdate()
        }, 100)
      },
      initLanguage: () => {
        // 优先从localStorage读取语言设置
        const savedLanguage = localStorage.getItem('selectedLanguage') as Language
        console.log('🌐 Initializing language, saved language:', savedLanguage)
        
        if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
          set({ language: savedLanguage })
          console.log('🌐 Language restored to:', savedLanguage)
        } else {
          console.log('🌐 Using default language: zh')
        }
      },
      refreshLanguage: () => {
        // 强制从localStorage重新读取语言设置
        const savedLanguage = localStorage.getItem('selectedLanguage') as Language
        console.log('🌐 Refreshing language, saved language:', savedLanguage)
        
        if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
          set({ language: savedLanguage })
          console.log('🌐 Language refreshed to:', savedLanguage)
        }
      },
      forceUpdate: () => {
        // 强制更新语言状态
        const currentLanguage = get().language
        set({ language: currentLanguage === 'zh' ? 'en' : 'zh' })
        setTimeout(() => {
          set({ language: currentLanguage })
        }, 10)
      },
      t: (key: string) => {
        const currentLanguage = get().language
        return getTranslation(currentLanguage, key)
      },
    }),
    {
      name: 'language-storage',
      partialize: (state) => ({ language: state.language }),
    }
  )
) 