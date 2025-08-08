export type Language = 'zh' | 'en'

export interface Translations {
  login: {
    title: string
    subtitle: string
    email: string
    password: string
    loginButton: string
    demoAccount: string
    demoCredentials: string
  }
  features: {
    title: string
    aiChat: {
      title: string
      description: string
    }
    healthRecords: {
      title: string
      description: string
    }
    dietAnalysis: {
      title: string
      description: string
    }
    healthAnalytics: {
      title: string
      description: string
    }
    appointments: {
      title: string
      description: string
    }
    emergency: {
      title: string
      description: string
    }
  }
  common: {
    language: string
    switchLanguage: string
  }
}

export const translations: Record<Language, Translations> = {
  zh: {
    login: {
      title: 'AI个人医生助理',
      subtitle: '您的智能健康管理伙伴',
      email: '邮箱',
      password: '密码',
      loginButton: '登录',
      demoAccount: '演示账号',
      demoCredentials: 'demo@example.com / 密码：123456'
    },
    features: {
      title: '核心功能',
      aiChat: {
        title: 'AI医生对话',
        description: '智能健康咨询，24小时在线问诊'
      },
      healthRecords: {
        title: '健康档案',
        description: '个人健康数据管理，病史记录'
      },
      dietAnalysis: {
        title: '饮食分析',
        description: '图片识别食物，营养分析，糖尿病健康评估'
      },
      healthAnalytics: {
        title: '健康分析',
        description: '数据可视化，健康趋势分析'
      },
      appointments: {
        title: '预约管理',
        description: '在线预约医生，就诊提醒'
      },
      emergency: {
        title: '紧急求助',
        description: '一键紧急联系，快速响应'
      }
    },
    common: {
      language: '语言',
      switchLanguage: '切换语言'
    }
  },
  en: {
    login: {
      title: 'AI Personal Health Assistant',
      subtitle: 'Your Intelligent Health Management Partner',
      email: 'Email',
      password: 'Password',
      loginButton: 'Login',
      demoAccount: 'Demo Account',
      demoCredentials: 'demo@example.com / Password: 123456'
    },
    features: {
      title: 'Core Features',
      aiChat: {
        title: 'AI Doctor Chat',
        description: 'Intelligent health consultation, 24/7 online consultation'
      },
      healthRecords: {
        title: 'Health Records',
        description: 'Personal health data management, medical history'
      },
      dietAnalysis: {
        title: 'Diet Analysis',
        description: 'Image recognition for food, nutrition analysis, diabetes health assessment'
      },
      healthAnalytics: {
        title: 'Health Analytics',
        description: 'Data visualization, health trend analysis'
      },
      appointments: {
        title: 'Appointment Management',
        description: 'Online doctor booking, appointment reminders'
      },
      emergency: {
        title: 'Emergency Help',
        description: 'One-click emergency contact, rapid response'
      }
    },
    common: {
      language: 'Language',
      switchLanguage: 'Switch Language'
    }
  }
}

export const getTranslation = (lang: Language, key: string): string => {
  const keys = key.split('.')
  let value: any = translations[lang]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  return value || key
} 