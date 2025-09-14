# 语言切换功能说明

## 功能概述

本应用支持中英文双语切换，并在用户登录后保持界面语言与登录时选择的语言一致。

## 实现原理

### 1. 语言状态管理
- 使用 Zustand 状态管理库管理语言设置
- 语言设置同时保存到 Zustand store 和 localStorage
- 支持持久化存储，页面刷新后保持语言设置

### 2. 语言切换流程
1. 用户在登录页面选择语言（中文/英文）
2. 语言设置保存到 localStorage
3. 用户登录成功后，应用自动读取保存的语言设置
4. 所有界面组件使用对应的语言显示

### 3. 关键组件

#### LanguageStore (`stores/languageStore.ts`)
```typescript
interface LanguageState {
  language: Language
  setLanguage: (language: Language) => void
  initLanguage: () => void
  refreshLanguage: () => void
}
```

- `setLanguage`: 设置新语言并保存到 localStorage
- `initLanguage`: 初始化时从 localStorage 读取语言设置
- `refreshLanguage`: 强制刷新语言设置（用于登录后）

#### App.tsx
- 在应用启动时初始化语言设置
- 在用户认证状态变化时刷新语言设置
- 确保登录后的语言一致性

#### LoginPage.tsx
- 提供语言切换按钮
- 登录成功时保存语言设置到 localStorage

#### Sidebar.tsx
- 显示当前语言状态
- 提供语言切换功能

## 使用方法

### 1. 切换语言
- 在登录页面：点击右上角的语言切换按钮
- 在应用内：点击侧边栏底部的语言切换按钮

### 2. 语言设置持久化
- 语言选择会自动保存到浏览器本地存储
- 下次访问应用时会自动应用上次选择的语言
- 登录后界面语言与登录时选择的语言保持一致

## 技术细节

### 1. 语言存储
```typescript
// 保存语言设置
localStorage.setItem('selectedLanguage', language)

// 读取语言设置
const savedLanguage = localStorage.getItem('selectedLanguage') as Language
```

### 2. 状态同步
```typescript
// 登录成功后刷新语言设置
useEffect(() => {
  if (isAuthenticated) {
    refreshLanguage()
  }
}, [isAuthenticated, refreshLanguage])
```

### 3. 组件语言获取
```typescript
const { language } = useLanguageStore()
const t = (key: string) => getTranslation(language, key)
```

## 注意事项

1. 语言设置仅在当前浏览器中有效
2. 清除浏览器数据会重置语言设置
3. 不同设备间语言设置不会同步
4. 确保所有文本都使用翻译函数包装

## 扩展功能

### 1. 添加新语言
1. 在 `locales/index.ts` 中添加新语言类型
2. 在 `translations` 对象中添加对应翻译
3. 更新 `Language` 类型定义

### 2. 添加新翻译键
1. 在 `Translations` 接口中添加新键
2. 在所有语言对象中添加对应翻译
3. 在组件中使用 `t('new.key')` 获取翻译

## 故障排除

### 1. 语言设置不生效
- 检查 localStorage 中是否有 `selectedLanguage` 键
- 确认语言值是否为 'zh' 或 'en'
- 查看控制台日志确认语言初始化过程

### 2. 登录后语言不一致
- 检查登录时是否正确保存了语言设置
- 确认 App.tsx 中的 useEffect 是否正确触发
- 验证 refreshLanguage 方法是否被调用

### 3. 组件显示原始键名
- 确认组件中使用了 `t()` 函数
- 检查翻译键是否在 locales 文件中定义
- 验证语言类型是否正确 