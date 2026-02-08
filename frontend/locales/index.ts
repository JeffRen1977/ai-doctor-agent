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
    healthAnalysis: {
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
  sidebar: {
    logo: {
      title: string
      subtitle: string
    }
    menu: {
      dashboard: string
      aiChat: string
      healthRecords: string
      healthAnalytics: string
      healthAnalysis: string
      dietAnalysis: string
      appointments: string
      deviceSync: string
      emergency: string
      profile: string
      settings: string
      logout: string
      digitalTwin: string
      riskMonitoring: string
      interventionEngine: string
      clinicalReports: string
      rehabilitationAssistant: string
    }
    user: {
      role: string
    }
  }
  dashboard: {
    title: string
    welcome: string
    quickActions: {
      title: string
      chat: string
      records: string
      analysis: string
      appointment: string
    }
    healthSummary: {
      title: string
      heartRate: string
      bloodPressure: string
      weight: string
      steps: string
    }
    recentActivity: {
      title: string
      noActivity: string
    }
  }
  chat: {
    title: string
    placeholder: string
    sendButton: string
    thinking: string
    newChat: string
    chatHistory: string
    noHistory: string
  }
  healthRecords: {
    title: string
    addRecord: string
    editRecord: string
    deleteRecord: string
    recordType: string
    date: string
    description: string
    attachments: string
    save: string
    cancel: string
    noRecords: string
    confirmDeleteTitle: string
    confirmDeleteContent: string
    deleteSuccess: string
    updateSuccess: string
    addSuccess: string
    fetchingFhirRecords: string
    noNewRecordsFound: string
    allFetchedRecordsExist: string
    successFetchedAndAddedRecords: string
    fetchFhirRecordsFailed: string
    uploadingFile: string
    uploadSuccess: string
    uploadFailed: string
    pleaseLoginToUpload: string
    clickOrDragFileHere: string
    supportedFileTypesHint: string
    recordsList: string
    healthRecords: string
    fetchFromFhir: string
    uploadFile: string
    uploadNewHealthRecordFile: string
    editHealthRecord: string
    addHealthRecord: string
    symptomType: string
    detailedDescription: string
    severity: string
    status: string
    pleaseSelectDate: string
    pleaseEnterSymptomType: string
    e_g_headache_cold_fever: string
    pleaseEnterDetailedDescription: string
    pleaseSelectSeverity: string
    pleaseSelectStatus: string
    low: string
    medium: string
    high: string
    active: string
    resolved: string
  }
  dietAnalysis: {
    title: string
    uploadImage: string
    analyzeButton: string
    results: {
      title: string
      foodItems: string
      nutrition: string
      recommendations: string
    }
    noImage: string
    processing: string
    header: {
      title: string
      subtitle: string
    }
    upload: {
      title: string
      subtitle: string
      selectImage: string
      takePhoto: string
      retake: string
    }
    analysis: {
      analyzing: string
      startAnalysis: string
    }
    foodDatabase: {
      rice: string
      noodles: string
      vegetables: string
      meat: string
      fish: string
      bread: string
      fruit: string
    }
    nutrition: {
      calories: string
      carbs: string
      protein: string
      fat: string
      fiber: string
      glycemicIndex: string
      servingSize: string
      confidence: string
      totalCalories: string
      totalCarbs: string
      totalProtein: string
      totalFat: string
      totalFiber: string
      averageGlycemicIndex: string
    }
    diabetes: {
      title: string
      riskLevel: string
      bloodSugarImpact: string
      healthAdvice: string
      lowRisk: string
      mediumRisk: string
      highRisk: string
    }
    usage: {
      title: string
      photoTips: {
        title: string
        description: string
      }
      diabetesNotes: {
        title: string
        description: string
      }
      healthAdvice: {
        title: string
        description: string
      }
    }
    errors: {
      selectValidImage: string
      uploadImageFirst: string
      analysisFailed: string
      analysisError: string
      unauthorized: string
      forbidden: string
      rateLimit: string
      networkError: string
    }
  }
  healthAnalytics: {
    title: string
    timeRange: string
    metrics: {
      heartRate: string
      bloodPressure: string
      weight: string
      activity: string
    }
    trends: string
    insights: string
  }
  appointments: {
    title: string
    upcoming: string
    past: string
    bookNew: string
    doctor: string
    dateTime: string
    type: string
    status: string
    actions: string
    noAppointments: string
    calendar: string
    list: string
    quickActions: string
    newAppointment: string
    onlineConsultation: string
    messageCenter: string
    todayAppointments: string
    doctorList: string
    rating: string
    bookConsultation: string
    notAvailable: string
    createAppointment: string
    selectDoctor: string
    consultationType: string
    appointmentDate: string
    appointmentTime: string
    notes: string
    confirmAppointment: string
    cancel: string
    edit: string
    delete: string
    scheduled: string
    completed: string
    cancelled: string
    inPerson: string
    videoConsultation: string
    phoneConsultation: string
    pleaseSelectDoctor: string
    pleaseSelectConsultationType: string
    pleaseSelectDate: string
    pleaseSelectTime: string
    pleaseDescribeSymptoms: string
    appointmentCreatedSuccess: string
    appointmentCreatedFailed: string
    department: string
    available: string
    unavailable: string
    pleaseRetry: string
    symptoms: string
    needs: string
    followUp: string
    bloodPressureCheck: string
    diabetesManagement: string
    cardiology: string
    endocrinology: string
    neurology: string
    hypertension: string
    coronaryHeartDisease: string
    arrhythmia: string
    thyroidDisease: string
    obesity: string
    headache: string
    dizziness: string
    epilepsy: string
    chiefPhysician: string
    associateChiefPhysician: string
    attendingPhysician: string
  }
  deviceSync: {
    title: string
    connectedDevices: string
    syncNow: string
    lastSync: string
    noDevices: string
    addDevice: string
    header: {
      title: string
      subtitle: string
    }
    deviceStatus: {
      title: string
      connected: string
      disconnected: string
      lastSync: string
      sync: string
      connect: string
      uploadData: string
    }
    summary: {
      title: string
      totalSteps: string
      totalCalories: string
      averageHeartRate: string
      totalSleepHours: string
      hours: string
      dataSource: string
      lastSync: string
    }
    mockData: {
      title: string
      description: string
      generateButton: string
      loadSummaryButton: string
      currentIndicator: string
    }
    manualSync: {
      title: string
      syncAllDevices: string
      syncing: string
      description: string
      autoSave: string
    }
    loading: string
    errors: {
      loadStatusFailed: string
    }
  }
  emergency: {
    title: string
    emergencyContact: string
    callNow: string
    location: string
    medicalInfo: string
    sos: string
  }
  profile: {
    title: string
    personalInfo: string
    name: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    address: string
    saveChanges: string
    changePassword: string
    userNotLoggedIn: string
    profileUpdateSuccess: string
    profileUpdateFailed: string
    pleaseEnterName: string
    enterYourName: string
    pleaseEnterEmail: string
    pleaseEnterValidEmail: string
    enterYourEmail: string
    pleaseEnterPhone: string
    enterYourPhone: string
    pleaseEnterAge: string
    enterYourAge: string
    pleaseSelectGender: string
    enterYourGender: string
    emergencyContact: string
    pleaseEnterEmergencyContact: string
    enterEmergencyContact: string
    emergencyPhone: string
    pleaseEnterEmergencyPhone: string
    enterEmergencyPhone: string
    pleaseEnterAddress: string
    enterYourAddress: string
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
      healthAnalysis: {
        title: '健康档案分析',
        description: 'AI分析医疗文档，生成个人健康报告'
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
    },
    sidebar: {
      logo: {
        title: 'AI医生助理',
        subtitle: '您的健康管理专家'
      },
      menu: {
        dashboard: '健康仪表板',
        aiChat: 'AI医生对话',
        healthRecords: '健康档案',
        healthAnalytics: '健康分析',
        healthAnalysis: '健康档案分析',
        dietAnalysis: '饮食分析',
        appointments: '预约管理',
        deviceSync: '设备同步',
        emergency: '紧急求助',
        profile: '个人资料',
        settings: '设置',
        logout: '退出登录',
        digitalTwin: '智能数字孪生',
        riskMonitoring: '实时风险监测',
        interventionEngine: '精准干预引擎',
        clinicalReports: '临床报告',
        rehabilitationAssistant: '生成式AI康复助理',
        clinicalCollaboration: '医患协作'
      },
      user: {
        role: '健康管理师'
      }
    },
    dashboard: {
      title: '健康仪表板',
      welcome: '欢迎回来',
      quickActions: {
        title: '快速操作',
        chat: '开始对话',
        records: '查看档案',
        analysis: '健康分析',
        appointment: '预约医生'
      },
      healthSummary: {
        title: '健康概览',
        heartRate: '心率',
        bloodPressure: '血压',
        weight: '体重',
        steps: '步数'
      },
      recentActivity: {
        title: '最近活动',
        noActivity: '暂无活动记录'
      }
    },
    chat: {
      title: 'AI医生对话',
      placeholder: '请描述您的症状或健康问题...',
      sendButton: '发送',
      thinking: 'AI医生正在思考...',
      newChat: '新对话',
      chatHistory: '对话历史',
      noHistory: '暂无对话记录'
    },
    healthRecords: {
      title: '健康档案',
      addRecord: '添加记录',
      editRecord: '编辑记录',
      deleteRecord: '删除记录',
      recordType: '记录类型',
      date: '日期',
      description: '描述',
      attachments: '附件',
      save: '保存',
      cancel: '取消',
      noRecords: '暂无健康记录',
      confirmDeleteTitle: '确认删除',
      confirmDeleteContent: '您确定要删除此记录吗？此操作不可逆。',
      deleteSuccess: '记录删除成功！',
      updateSuccess: '记录更新成功！',
      addSuccess: '记录添加成功！',
      fetchingFhirRecords: '正在从FHIR服务器获取记录...',
      noNewRecordsFound: '未找到新的记录。',
      allFetchedRecordsExist: '所有记录已存在。',
      successFetchedAndAddedRecords: '成功从FHIR服务器获取并添加记录。',
      fetchFhirRecordsFailed: '从FHIR服务器获取记录失败。',
      uploadingFile: '正在上传文件...',
      uploadSuccess: '文件上传成功！',
      uploadFailed: '文件上传失败。',
      pleaseLoginToUpload: '请先登录以上传文件。',
      clickOrDragFileHere: '点击或拖拽文件到这里',
      supportedFileTypesHint: '支持的文件类型：.pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .gif',
      recordsList: '记录列表',
      healthRecords: '健康记录',
      fetchFromFhir: '从FHIR服务器获取',
      uploadFile: '上传文件',
      uploadNewHealthRecordFile: '上传新的健康记录文件',
      editHealthRecord: '编辑健康记录',
      addHealthRecord: '添加健康记录',
      symptomType: '症状类型',
      detailedDescription: '详细描述',
      severity: '严重程度',
      status: '状态',
      pleaseSelectDate: '请选择日期',
      pleaseEnterSymptomType: '请输入症状类型',
      e_g_headache_cold_fever: '例如：头痛、感冒、发烧',
      pleaseEnterDetailedDescription: '请输入详细描述',
      pleaseSelectSeverity: '请选择严重程度',
      pleaseSelectStatus: '请选择状态',
      low: '低',
      medium: '中',
      high: '高',
      active: '活跃',
      resolved: '已解决'
    },
    dietAnalysis: {
      title: '饮食分析',
      uploadImage: '上传食物图片',
      analyzeButton: '开始分析',
      results: {
        title: '分析结果',
        foodItems: '识别到的食物',
        nutrition: '营养成分',
        recommendations: '健康建议'
      },
      noImage: '请先上传图片',
      processing: '正在分析中...',
      header: {
        title: '饮食分析',
        subtitle: '通过图片识别食物，获取营养成分和健康建议'
      },
      upload: {
        title: '上传食物图片',
        subtitle: '点击或拖拽图片到此处，或点击“拍照”',
        selectImage: '选择图片',
        takePhoto: '拍照',
        retake: '重拍'
      },
      analysis: {
        analyzing: '正在分析中...',
        startAnalysis: '开始分析'
      },
      foodDatabase: {
        rice: '米饭',
        noodles: '面条',
        vegetables: '蔬菜',
        meat: '肉类',
        fish: '鱼类',
        bread: '面包',
        fruit: '水果'
      },
      nutrition: {
        calories: '卡路里',
        carbs: '碳水化合物',
        protein: '蛋白质',
        fat: '脂肪',
        fiber: '纤维',
        glycemicIndex: '血糖生成指数',
        servingSize: '份量',
        confidence: '置信度',
        totalCalories: '总卡路里',
        totalCarbs: '总碳水化合物',
        totalProtein: '总蛋白质',
        totalFat: '总脂肪',
        totalFiber: '总纤维',
        averageGlycemicIndex: '平均血糖生成指数'
      },
      diabetes: {
        title: '糖尿病风险评估',
        riskLevel: '风险等级',
        bloodSugarImpact: '血糖影响',
        healthAdvice: '健康建议',
        lowRisk: '低风险',
        mediumRisk: '中风险',
        highRisk: '高风险'
      },
      usage: {
        title: '使用说明',
        photoTips: {
          title: '拍照小贴士',
          description: '确保光线充足，避免阴影，清晰拍摄食物'
        },
        diabetesNotes: {
          title: '糖尿病患者注意事项',
          description: '请在专业医生指导下使用，避免空腹或餐后立即使用'
        },
        healthAdvice: {
          title: '健康建议',
          description: '本应用提供的营养成分和健康建议仅供参考，不构成医疗诊断或治疗建议'
        }
      },
      errors: {
        selectValidImage: '请选择有效的图片文件',
        uploadImageFirst: '请先上传图片',
        analysisFailed: '分析失败，请重试',
        analysisError: '分析过程中发生错误',
        unauthorized: '认证失败，请重新登录',
        forbidden: '访问被拒绝，请检查您的权限',
        rateLimit: 'AI服务配额已用完，请稍后再试',
        networkError: '网络连接错误，请检查您的网络连接'
      }
    },
    healthAnalytics: {
      title: '健康分析',
      timeRange: '时间范围',
      metrics: {
        heartRate: '心率',
        bloodPressure: '血压',
        weight: '体重',
        activity: '活动量'
      },
      trends: '趋势分析',
      insights: '健康洞察'
    },
    appointments: {
      title: '预约管理',
      upcoming: '即将到来',
      past: '历史记录',
      bookNew: '预约新医生',
      doctor: '医生',
      dateTime: '日期时间',
      type: '类型',
      status: '状态',
      actions: '操作',
      noAppointments: '暂无预约',
      calendar: '日历',
      list: '列表',
      quickActions: '快速操作',
      newAppointment: '新预约',
      onlineConsultation: '在线咨询',
      messageCenter: '消息中心',
      todayAppointments: '今日预约',
      doctorList: '医生列表',
      rating: '评分',
      bookConsultation: '预约咨询',
      notAvailable: '不可用',
      createAppointment: '创建预约',
      selectDoctor: '选择医生',
      consultationType: '咨询类型',
      appointmentDate: '预约日期',
      appointmentTime: '预约时间',
      notes: '备注',
      confirmAppointment: '确认预约',
      cancel: '取消',
      edit: '编辑',
      delete: '删除',
      scheduled: '已安排',
      completed: '已完成',
      cancelled: '已取消',
      inPerson: '面对面',
      videoConsultation: '视频咨询',
      phoneConsultation: '电话咨询',
      pleaseSelectDoctor: '请选择医生',
      pleaseSelectConsultationType: '请选择咨询类型',
      pleaseSelectDate: '请选择日期',
      pleaseSelectTime: '请选择时间',
      pleaseDescribeSymptoms: '请描述症状',
      appointmentCreatedSuccess: '预约创建成功！',
      appointmentCreatedFailed: '预约创建失败。',
      department: '科室',
      available: '可用',
      unavailable: '不可用',
      pleaseRetry: '请重试',
      symptoms: '症状',
      needs: '需求',
      followUp: '随访',
      bloodPressureCheck: '血压检查',
      diabetesManagement: '糖尿病管理',
      cardiology: '心脏病科',
      endocrinology: '内分泌科',
      neurology: '神经科',
      hypertension: '高血压',
      coronaryHeartDisease: '冠心病',
      arrhythmia: '心律失常',
      thyroidDisease: '甲状腺疾病',
      obesity: '肥胖',
      headache: '头痛',
      dizziness: '头晕',
      epilepsy: '癫痫',
      chiefPhysician: '主任医师',
      associateChiefPhysician: '副主任医师',
      attendingPhysician: '主治医师'
    },
    deviceSync: {
      title: '设备同步',
      connectedDevices: '已连接设备',
      syncNow: '立即同步',
      lastSync: '最后同步时间',
      noDevices: '暂无连接设备',
      addDevice: '添加设备',
      header: {
        title: '设备同步',
        subtitle: '同步您的健康数据'
      },
      deviceStatus: {
        title: '设备状态',
        connected: '已连接',
        disconnected: '未连接',
        lastSync: '最后同步',
        sync: '同步中',
        connect: '连接',
        uploadData: '上传数据'
      },
      summary: {
        title: '数据概览',
        totalSteps: '总步数',
        totalCalories: '总卡路里',
        averageHeartRate: '平均心率',
        totalSleepHours: '总睡眠时长',
        hours: '小时',
        dataSource: '数据来源',
        lastSync: '最后同步'
      },
      mockData: {
        title: '模拟数据',
        description: '点击“生成模拟数据”按钮，模拟设备同步过程。',
        generateButton: '生成模拟数据',
        loadSummaryButton: '加载数据概览',
        currentIndicator: '当前模拟状态'
      },
      manualSync: {
        title: '手动同步',
        syncAllDevices: '同步所有设备',
        syncing: '正在同步...',
        description: '手动触发所有已连接设备的同步。',
        autoSave: '自动保存'
      },
      loading: '加载中...',
      errors: {
        loadStatusFailed: '加载设备状态失败'
      }
    },
    emergency: {
      title: '紧急求助',
      emergencyContact: '紧急联系人',
      callNow: '立即拨打',
      location: '当前位置',
      medicalInfo: '医疗信息',
      sos: '紧急求助'
    },
    profile: {
      title: '个人资料',
      personalInfo: '个人信息',
      name: '姓名',
      email: '邮箱',
      phone: '电话',
      dateOfBirth: '出生日期',
      gender: '性别',
      address: '地址',
      saveChanges: '保存更改',
      changePassword: '修改密码',
      userNotLoggedIn: '用户未登录',
      profileUpdateSuccess: '个人资料更新成功！',
      profileUpdateFailed: '个人资料更新失败。',
      pleaseEnterName: '请输入姓名',
      enterYourName: '您的姓名',
      pleaseEnterEmail: '请输入邮箱',
      pleaseEnterValidEmail: '请输入有效的邮箱地址',
      enterYourEmail: '您的邮箱',
      pleaseEnterPhone: '请输入电话',
      enterYourPhone: '您的电话',
      pleaseEnterAge: '请输入年龄',
      enterYourAge: '您的年龄',
      pleaseSelectGender: '请选择性别',
      enterYourGender: '您的性别',
      emergencyContact: '紧急联系人',
      pleaseEnterEmergencyContact: '请输入紧急联系人',
      enterEmergencyContact: '您的紧急联系人',
      emergencyPhone: '紧急电话',
      pleaseEnterEmergencyPhone: '请输入紧急电话',
      enterEmergencyPhone: '您的紧急电话',
      pleaseEnterAddress: '请输入地址',
      enterYourAddress: '您的地址'
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
      healthAnalysis: {
        title: 'Health Document Analysis',
        description: 'AI analysis of medical documents, generate personal health reports'
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
    },
    sidebar: {
      logo: {
        title: 'AI Health Assistant',
        subtitle: 'Your Health Management Expert'
      },
      menu: {
        dashboard: 'Health Dashboard',
        aiChat: 'AI Doctor Chat',
        healthRecords: 'Health Records',
        healthAnalytics: 'Health Analytics',
        healthAnalysis: 'Health Document Analysis',
        dietAnalysis: 'Diet Analysis',
        appointments: 'Appointments',
        deviceSync: 'Device Sync',
        emergency: 'Emergency Help',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        digitalTwin: 'Digital Twin',
        riskMonitoring: 'Risk Monitoring',
        interventionEngine: 'Intervention Engine',
        clinicalReports: 'Clinical Reports',
        rehabilitationAssistant: 'Rehabilitation Assistant',
        clinicalCollaboration: 'Clinical Collaboration'
      },
      user: {
        role: 'Health Manager'
      }
    },
    dashboard: {
      title: 'Health Dashboard',
      welcome: 'Welcome back',
      quickActions: {
        title: 'Quick Actions',
        chat: 'Start Chat',
        records: 'View Records',
        analysis: 'Health Analysis',
        appointment: 'Book Appointment'
      },
      healthSummary: {
        title: 'Health Summary',
        heartRate: 'Heart Rate',
        bloodPressure: 'Blood Pressure',
        weight: 'Weight',
        steps: 'Steps'
      },
      recentActivity: {
        title: 'Recent Activity',
        noActivity: 'No recent activity'
      }
    },
    chat: {
      title: 'AI Doctor Chat',
      placeholder: 'Please describe your symptoms or health concerns...',
      sendButton: 'Send',
      thinking: 'AI doctor is thinking...',
      newChat: 'New Chat',
      chatHistory: 'Chat History',
      noHistory: 'No chat history'
    },
    healthRecords: {
      title: 'Health Records',
      addRecord: 'Add Record',
      editRecord: 'Edit Record',
      deleteRecord: 'Delete Record',
      recordType: 'Record Type',
      date: 'Date',
      description: 'Description',
      attachments: 'Attachments',
      save: 'Save',
      cancel: 'Cancel',
      noRecords: 'No health records found',
      confirmDeleteTitle: 'Confirm Delete',
      confirmDeleteContent: 'Are you sure you want to delete this record? This action cannot be undone.',
      deleteSuccess: 'Record deleted successfully!',
      updateSuccess: 'Record updated successfully!',
      addSuccess: 'Record added successfully!',
      fetchingFhirRecords: 'Fetching records from FHIR server...',
      noNewRecordsFound: 'No new records found.',
      allFetchedRecordsExist: 'All records already exist.',
      successFetchedAndAddedRecords: 'Successfully fetched and added records from FHIR server.',
      fetchFhirRecordsFailed: 'Failed to fetch records from FHIR server.',
      uploadingFile: 'Uploading file...',
      uploadSuccess: 'File uploaded successfully!',
      uploadFailed: 'File upload failed.',
      pleaseLoginToUpload: 'Please log in to upload files.',
      clickOrDragFileHere: 'Click or drag files here',
      supportedFileTypesHint: 'Supported file types: .pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png, .gif',
      recordsList: 'Records List',
      healthRecords: 'Health Records',
      fetchFromFhir: 'Fetch from FHIR',
      uploadFile: 'Upload File',
      uploadNewHealthRecordFile: 'Upload New Health Record File',
      editHealthRecord: 'Edit Health Record',
      addHealthRecord: 'Add Health Record',
      symptomType: 'Symptom Type',
      detailedDescription: 'Detailed Description',
      severity: 'Severity',
      status: 'Status',
      pleaseSelectDate: 'Please select date',
      pleaseEnterSymptomType: 'Please enter symptom type',
      e_g_headache_cold_fever: 'e.g., headache, cold, fever',
      pleaseEnterDetailedDescription: 'Please enter detailed description',
      pleaseSelectSeverity: 'Please select severity',
      pleaseSelectStatus: 'Please select status',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      active: 'Active',
      resolved: 'Resolved'
    },
    dietAnalysis: {
      title: 'Diet Analysis',
      uploadImage: 'Upload Food Image',
      analyzeButton: 'Start Analysis',
      results: {
        title: 'Analysis Results',
        foodItems: 'Identified Foods',
        nutrition: 'Nutrition Facts',
        recommendations: 'Health Recommendations'
      },
      noImage: 'Please upload an image first',
      processing: 'Analyzing...',
      header: {
        title: 'Diet Analysis',
        subtitle: 'Identify food through images to get nutrition and health recommendations'
      },
      upload: {
        title: 'Upload Food Image',
        subtitle: 'Click or drag an image here, or click "Take Photo"',
        selectImage: 'Select Image',
        takePhoto: 'Take Photo',
        retake: 'Retake'
      },
      analysis: {
        analyzing: 'Analyzing...',
        startAnalysis: 'Start Analysis'
      },
      foodDatabase: {
        rice: 'Rice',
        noodles: 'Noodles',
        vegetables: 'Vegetables',
        meat: 'Meat',
        fish: 'Fish',
        bread: 'Bread',
        fruit: 'Fruit'
      },
      nutrition: {
        calories: 'Calories',
        carbs: 'Carbs',
        protein: 'Protein',
        fat: 'Fat',
        fiber: 'Fiber',
        glycemicIndex: 'Glycemic Index',
        servingSize: 'Serving Size',
        confidence: 'Confidence',
        totalCalories: 'Total Calories',
        totalCarbs: 'Total Carbs',
        totalProtein: 'Total Protein',
        totalFat: 'Total Fat',
        totalFiber: 'Total Fiber',
        averageGlycemicIndex: 'Average Glycemic Index'
      },
      diabetes: {
        title: 'Diabetes Risk Assessment',
        riskLevel: 'Risk Level',
        bloodSugarImpact: 'Blood Sugar Impact',
        healthAdvice: 'Health Advice',
        lowRisk: 'Low Risk',
        mediumRisk: 'Medium Risk',
        highRisk: 'High Risk'
      },
      usage: {
        title: 'Usage Instructions',
        photoTips: {
          title: 'Photo Tips',
          description: 'Ensure sufficient lighting, avoid shadows, and take clear photos of the food'
        },
        diabetesNotes: {
          title: 'Diabetes Patient Notes',
          description: 'Please use this application under the guidance of a professional doctor, and avoid using it immediately before or after meals'
        },
        healthAdvice: {
          title: 'Health Advice',
          description: 'The nutritional information and health recommendations provided by this application are for reference only and do not constitute medical diagnosis or treatment advice'
        }
      },
      errors: {
        selectValidImage: 'Please select a valid image file',
        uploadImageFirst: 'Please upload an image first',
        analysisFailed: 'Analysis failed, please try again',
        analysisError: 'An error occurred during analysis',
        unauthorized: 'Authentication failed, please login again',
        forbidden: 'Access denied, please check your permissions',
        rateLimit: 'AI service quota exceeded, please try again later',
        networkError: 'Network connection error, please check your connection'
      }
    },
    healthAnalytics: {
      title: 'Health Analytics',
      timeRange: 'Time Range',
      metrics: {
        heartRate: 'Heart Rate',
        bloodPressure: 'Blood Pressure',
        weight: 'Weight',
        activity: 'Activity Level'
      },
      trends: 'Trend Analysis',
      insights: 'Health Insights'
    },
    appointments: {
      title: 'Appointments',
      upcoming: 'Upcoming Appointments',
      past: 'Past Appointments',
      bookNew: 'Book New Appointment',
      doctor: 'Doctor',
      dateTime: 'Date & Time',
      type: 'Type',
      status: 'Status',
      actions: 'Actions',
      noAppointments: 'No appointments found',
      calendar: 'Calendar',
      list: 'List',
      quickActions: 'Quick Actions',
      newAppointment: 'New Appointment',
      onlineConsultation: 'Online Consultation',
      messageCenter: 'Message Center',
      todayAppointments: 'Today\'s Appointments',
      doctorList: 'Doctor List',
      rating: 'Rating',
      bookConsultation: 'Book Consultation',
      notAvailable: 'Not Available',
      createAppointment: 'Create Appointment',
      selectDoctor: 'Select Doctor',
      consultationType: 'Consultation Type',
      appointmentDate: 'Appointment Date',
      appointmentTime: 'Appointment Time',
      notes: 'Notes',
      confirmAppointment: 'Confirm Appointment',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      scheduled: 'Scheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      inPerson: 'In-Person',
      videoConsultation: 'Video Consultation',
      phoneConsultation: 'Phone Consultation',
      pleaseSelectDoctor: 'Please select a doctor',
      pleaseSelectConsultationType: 'Please select a consultation type',
      pleaseSelectDate: 'Please select a date',
      pleaseSelectTime: 'Please select a time',
      pleaseDescribeSymptoms: 'Please describe your symptoms',
      appointmentCreatedSuccess: 'Appointment created successfully!',
      appointmentCreatedFailed: 'Appointment creation failed.',
      department: 'Department',
      available: 'Available',
      unavailable: 'Unavailable',
      pleaseRetry: 'Please retry',
      symptoms: 'Symptoms',
      needs: 'Needs',
      followUp: 'Follow-up',
      bloodPressureCheck: 'Blood Pressure Check',
      diabetesManagement: 'Diabetes Management',
      cardiology: 'Cardiology',
      endocrinology: 'Endocrinology',
      neurology: 'Neurology',
      hypertension: 'Hypertension',
      coronaryHeartDisease: 'Coronary Heart Disease',
      arrhythmia: 'Arrhythmia',
      thyroidDisease: 'Thyroid Disease',
      obesity: 'Obesity',
      headache: 'Headache',
      dizziness: 'Dizziness',
      epilepsy: 'Epilepsy',
      chiefPhysician: 'Chief Physician',
      associateChiefPhysician: 'Associate Chief Physician',
      attendingPhysician: 'Attending Physician'
    },
    deviceSync: {
      title: 'Device Sync',
      connectedDevices: 'Connected Devices',
      syncNow: 'Sync Now',
      lastSync: 'Last Sync',
      noDevices: 'No devices connected',
      addDevice: 'Add Device',
      header: {
        title: 'Device Sync',
        subtitle: 'Sync Your Health Data'
      },
      deviceStatus: {
        title: 'Device Status',
        connected: 'Connected',
        disconnected: 'Disconnected',
        lastSync: 'Last Sync',
        sync: 'Syncing',
        connect: 'Connect',
        uploadData: 'Upload Data'
      },
      summary: {
        title: 'Data Overview',
        totalSteps: 'Total Steps',
        totalCalories: 'Total Calories',
        averageHeartRate: 'Average Heart Rate',
        totalSleepHours: 'Total Sleep Hours',
        hours: 'Hours',
        dataSource: 'Data Source',
        lastSync: 'Last Sync'
      },
      mockData: {
        title: 'Mock Data',
        description: 'Click the "Generate Mock Data" button to simulate the device sync process.',
        generateButton: 'Generate Mock Data',
        loadSummaryButton: 'Load Data Overview',
        currentIndicator: 'Current Mock Status'
      },
      manualSync: {
        title: 'Manual Sync',
        syncAllDevices: 'Sync All Devices',
        syncing: 'Syncing...',
        description: 'Manually trigger sync for all connected devices.',
        autoSave: 'Auto Save'
      },
      loading: 'Loading...',
      errors: {
        loadStatusFailed: 'Failed to load device status'
      }
    },
    emergency: {
      title: 'Emergency Help',
      emergencyContact: 'Emergency Contact',
      callNow: 'Call Now',
      location: 'Current Location',
      medicalInfo: 'Medical Information',
      sos: 'Emergency SOS'
    },
    profile: {
      title: 'Profile',
      personalInfo: 'Personal Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      address: 'Address',
      saveChanges: 'Save Changes',
      changePassword: 'Change Password',
      userNotLoggedIn: 'User not logged in',
      profileUpdateSuccess: 'Profile updated successfully!',
      profileUpdateFailed: 'Profile update failed.',
      pleaseEnterName: 'Please enter name',
      enterYourName: 'Your name',
      pleaseEnterEmail: 'Please enter email',
      pleaseEnterValidEmail: 'Please enter a valid email address',
      enterYourEmail: 'Your email',
      pleaseEnterPhone: 'Please enter phone',
      enterYourPhone: 'Your phone',
      pleaseEnterAge: 'Please enter age',
      enterYourAge: 'Your age',
      pleaseSelectGender: 'Please select gender',
      enterYourGender: 'Your gender',
      emergencyContact: 'Emergency Contact',
      pleaseEnterEmergencyContact: 'Please enter emergency contact',
      enterEmergencyContact: 'Your emergency contact',
      emergencyPhone: 'Emergency Phone',
      pleaseEnterEmergencyPhone: 'Please enter emergency phone',
      enterEmergencyPhone: 'Your emergency phone',
      pleaseEnterAddress: 'Please enter address',
      enterYourAddress: 'Your address'
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