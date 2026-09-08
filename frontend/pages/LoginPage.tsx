import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message, Row, Col, Typography, Checkbox } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined, MessageOutlined, FileTextOutlined, CameraOutlined, BarChartOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getTranslation } from '../locales'
import { getApiBaseUrl } from '../utils/apiConfig'
import { useSearchParams } from 'react-router-dom'
import './LoginPage.css'

const { Title, Paragraph } = Typography

interface LoginForm {
  email: string
  password: string
}

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  name: string
  acceptTerms: boolean
  acceptHealthAi: boolean
  acceptCrossBorder?: boolean
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')
  const [searchParams, setSearchParams] = useSearchParams()
  const resetToken = searchParams.get('resetToken') || ''
  const { language, setLanguage, initLanguage } = useLanguageStore()
  const { login } = useAuthStore()

  // 初始化语言设置
  useEffect(() => {
    initLanguage()
  }, [initLanguage])

  useEffect(() => {
    if (resetToken) setAuthView('reset')
  }, [resetToken])

  const t = (key: string) => getTranslation(language, key)

  const toggleLanguage = () => {
    const newLanguage = language === 'zh' ? 'en' : 'zh'
    setLanguage(newLanguage)
    // 保存到localStorage
    localStorage.setItem('selectedLanguage', newLanguage)
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLanguage }))
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    setAuthView(!isLoginMode ? 'login' : 'register')
  }

  const goToLogin = () => {
    setIsLoginMode(true)
    setAuthView('login')
    if (resetToken) {
      searchParams.delete('resetToken')
      setSearchParams(searchParams, { replace: true })
    }
  }

  const onFinish = async (values: LoginForm | RegisterForm) => {
    setLoading(true)
    try {
      if (isLoginMode) {
        // Login mode
        console.log('🔐 Attempting login with:', values.email)
        
        const apiBaseUrl = getApiBaseUrl()
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: values.email,
            password: values.password
          })
        })

        const data = await response.json()
        console.log('📡 Login response:', data)

        if (response.ok && data.user && data.token) {
          const user = data.user
          console.log('✅ Login successful, user:', user)
          
          // 存储token和用户信息到localStorage
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(user))
          
          // 确保语言设置被保存
          localStorage.setItem('selectedLanguage', language)
          console.log('🌐 Language saved to localStorage:', language)
          
          // 同步语言设置到后端用户设置
          try {
            await fetch(`${getApiBaseUrl()}/user-settings/ai`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.token}`
              },
              body: JSON.stringify({
                language: language
              })
            })
            console.log('🌐 Language setting synced to backend on login:', language)
          } catch (syncError) {
            console.warn('⚠️ Failed to sync language setting on login:', syncError)
          }
          
          // 显示成功消息
          message.success(language === 'zh' ? '登录成功！' : 'Login successful!')
          
          // 延迟一下再调用login，确保语言设置已经保存
          setTimeout(() => {
            login(user)
          }, 100)
        } else {
          console.error('❌ Login failed:', data.error)
          message.error(data.error || (language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again'))
        }
      } else {
        // Register mode
        const registerValues = values as RegisterForm
        console.log('📝 Attempting registration with:', registerValues.email)
        
        if (registerValues.password !== registerValues.confirmPassword) {
          message.error(language === 'zh' ? '密码确认不匹配！' : 'Password confirmation does not match!')
          return
        }
        
        const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: registerValues.email,
            password: registerValues.password,
            name: registerValues.name,
            acceptTerms: !!registerValues.acceptTerms,
            acceptHealthAi: !!registerValues.acceptHealthAi,
            acceptCrossBorder: !!registerValues.acceptCrossBorder
          })
        })

        const data = await response.json()
        console.log('📡 Registration response:', data)

        if (response.ok && data.user && data.token) {
          message.success(language === 'zh' ? '注册成功！请登录' : 'Registration successful! Please login')
          setIsLoginMode(true) // Switch back to login mode
        } else {
          console.error('❌ Registration failed:', data.error)
          message.error(data.error || (language === 'zh' ? '注册失败，请重试' : 'Registration failed, please try again'))
        }
      }
    } catch (error) {
      console.error('💥 Error:', error)
      const errorMessage = isLoginMode 
        ? (language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')
        : (language === 'zh' ? '注册失败，请重试' : 'Registration failed, please try again')
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const onForgotFinish = async (values: { email: string }) => {
    setLoading(true)
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email })
      })
      const data = await response.json()
      if (response.ok) {
        message.success(data.message || t('login.resetEmailSent'))
        goToLogin()
      } else {
        message.error(data.error || (language === 'zh' ? '发送失败，请稍后重试' : 'Failed to send, please try again'))
      }
    } catch (error) {
      message.error(language === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const onResetFinish = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error(language === 'zh' ? '密码确认不匹配！' : 'Password confirmation does not match!')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: values.password })
      })
      const data = await response.json()
      if (response.ok) {
        message.success(data.message || t('login.resetSuccess'))
        goToLogin()
      } else {
        message.error(data.error || (language === 'zh' ? '重置失败' : 'Reset failed'))
      }
    } catch (error) {
      message.error(language === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="language-switch">
        <Button 
          type="text" 
          icon={<GlobalOutlined />}
          onClick={toggleLanguage}
        >
          {language === 'zh' ? 'EN' : '中文'}
        </Button>
      </div>
      
      <div className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <Title level={2}>
              {authView === 'forgot'
                ? t('login.forgotPassword')
                : authView === 'reset'
                  ? t('login.resetPassword')
                  : isLoginMode ? t('login.title') : (language === 'zh' ? '用户注册' : 'User Registration')}
            </Title>
            <Paragraph type="secondary">
              {isLoginMode ? t('login.subtitle') : (language === 'zh' ? '创建新账户以开始使用AI医生服务' : 'Create a new account to start using AI Doctor services')}
            </Paragraph>
          </div>
          
          {authView === 'forgot' ? (
            <Form name="forgot" onFinish={onForgotFinish} autoComplete="off" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: language === 'zh' ? '请输入邮箱!' : 'Please enter your email!' },
                  { type: 'email', message: language === 'zh' ? '请输入有效的邮箱地址!' : 'Please enter a valid email address!' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder={t('login.email')} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  {t('login.sendResetLink')}
                </Button>
              </Form.Item>
              <Form.Item>
                <Button type="link" onClick={goToLogin} block>
                  {t('login.backToLogin')}
                </Button>
              </Form.Item>
            </Form>
          ) : authView === 'reset' ? (
            <Form name="reset" onFinish={onResetFinish} autoComplete="off" size="large">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: language === 'zh' ? '请输入新密码!' : 'Please enter a new password!' },
                  { min: 8, message: language === 'zh' ? '密码至少 8 位' : 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('login.newPassword')} />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                rules={[
                  { required: true, message: language === 'zh' ? '请确认密码!' : 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve()
                      return Promise.reject(new Error(language === 'zh' ? '密码确认不匹配！' : 'Password confirmation does not match!'))
                    }
                  })
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('login.confirmNewPassword')} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  {t('login.resetPassword')}
                </Button>
              </Form.Item>
              <Form.Item>
                <Button type="link" onClick={goToLogin} block>
                  {t('login.backToLogin')}
                </Button>
              </Form.Item>
            </Form>
          ) : (
          <Form
            name={isLoginMode ? "login" : "register"}
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            {!isLoginMode && (
              <Form.Item
                name="name"
                rules={[{ required: true, message: language === 'zh' ? '请输入姓名!' : 'Please enter your name!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder={language === 'zh' ? '姓名' : 'Full Name'}
                />
              </Form.Item>
            )}
            
            <Form.Item
              name="email"
              rules={[
                { required: true, message: language === 'zh' ? '请输入邮箱!' : 'Please enter your email!' },
                { type: 'email', message: language === 'zh' ? '请输入有效的邮箱地址!' : 'Please enter a valid email address!' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t('login.email')}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: language === 'zh' ? '请输入密码!' : 'Please enter your password!' },
                ...(!isLoginMode ? [{ min: 8, message: language === 'zh' ? '密码至少 8 位' : 'Password must be at least 8 characters' }] : [])
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('login.password')}
              />
            </Form.Item>

            {!isLoginMode && (
              <Form.Item
                name="confirmPassword"
                rules={[
                  { required: true, message: language === 'zh' ? '请确认密码!' : 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(language === 'zh' ? '密码确认不匹配！' : 'Password confirmation does not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={language === 'zh' ? '确认密码' : 'Confirm Password'}
                />
              </Form.Item>
            )}

            {!isLoginMode && (
              <>
                <Form.Item
                  name="acceptTerms"
                  valuePropName="checked"
                  rules={[{
                    validator: (_, v) => v
                      ? Promise.resolve()
                      : Promise.reject(new Error(language === 'zh' ? '请阅读并同意用户协议和隐私政策' : 'Please accept the terms and privacy policy'))
                  }]}
                >
                  <Checkbox>
                    {language === 'zh' ? '我已阅读并同意' : 'I agree to the '}
                    <a href="/terms" target="_blank" rel="noreferrer">{language === 'zh' ? '用户协议' : 'Terms'}</a>
                    {language === 'zh' ? '和' : ' and '}
                    <a href="/privacy" target="_blank" rel="noreferrer">{language === 'zh' ? '隐私政策' : 'Privacy Policy'}</a>
                  </Checkbox>
                </Form.Item>
                <Form.Item
                  name="acceptHealthAi"
                  valuePropName="checked"
                  rules={[{
                    validator: (_, v) => v
                      ? Promise.resolve()
                      : Promise.reject(new Error(language === 'zh' ? '请单独同意处理健康数据并用于 AI 解读' : 'Separate consent is required to process health data for AI'))
                  }]}
                >
                  <Checkbox>
                    {language === 'zh'
                      ? '我单独同意处理健康数据（病历、穿戴、用药）并用于 AI 解读。可在设置中撤回。'
                      : 'I separately consent to processing health data for AI interpretation. You can withdraw this in Settings.'}
                  </Checkbox>
                </Form.Item>
                <Form.Item name="acceptCrossBorder" valuePropName="checked">
                  <Checkbox>
                    {language === 'zh'
                      ? '我单独同意将健康内容发送至境外模型（OpenAI / Gemini）。不勾选则仅使用国内模型。'
                      : 'I separately consent to sending health content to overseas models (OpenAI / Gemini). Leave unchecked to use domestic models only.'}
                  </Checkbox>
                </Form.Item>
              </>
            )}

            {isLoginMode && (
              <Form.Item style={{ marginBottom: 8 }}>
                <Button type="link" onClick={() => setAuthView('forgot')} style={{ padding: 0 }}>
                  {t('login.forgotPassword')}
                </Button>
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                {isLoginMode ? t('login.loginButton') : (language === 'zh' ? '注册' : 'Register')}
              </Button>
            </Form.Item>

            <Form.Item>
              <Button
                type="link"
                onClick={toggleMode}
                block
              >
                {isLoginMode 
                  ? (language === 'zh' ? '没有账户？点击注册' : 'No account? Click to register')
                  : (language === 'zh' ? '已有账户？点击登录' : 'Have an account? Click to login')
                }
              </Button>
            </Form.Item>
          </Form>
          )}

          <div className="login-footer">
            <Paragraph type="secondary">
              <strong>{t('login.demoAccount')}：</strong>
              {t('login.demoCredentials')}
            </Paragraph>
          </div>
        </Card>
        
        <div className="features-section">
          <Title level={3} className="features-title">
            {t('features.title')}
          </Title>
          
          <Row gutter={[16, 16]} className="features-grid">
            <Col xs={24} sm={12} md={8}>
              <div className="feature-item">
                <div className="feature-icon">
                  <MessageOutlined />
                </div>
                <div className="feature-content">
                  <Title level={4}>{t('features.aiChat.title')}</Title>
                  <Paragraph type="secondary">{t('features.aiChat.description')}</Paragraph>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div className="feature-item">
                <div className="feature-icon">
                  <FileTextOutlined />
                </div>
                <div className="feature-content">
                  <Title level={4}>{t('features.healthRecords.title')}</Title>
                  <Paragraph type="secondary">{t('features.healthRecords.description')}</Paragraph>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div className="feature-item">
                <div className="feature-icon">
                  <CameraOutlined />
                </div>
                <div className="feature-content">
                  <Title level={4}>{t('features.dietAnalysis.title')}</Title>
                  <Paragraph type="secondary">{t('features.dietAnalysis.description')}</Paragraph>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div className="feature-item">
                <div className="feature-icon">
                  <BarChartOutlined />
                </div>
                <div className="feature-content">
                  <Title level={4}>{t('features.healthAnalytics.title')}</Title>
                  <Paragraph type="secondary">{t('features.healthAnalytics.description')}</Paragraph>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div className="feature-item">
                <div className="feature-icon">
                  <CalendarOutlined />
                </div>
                <div className="feature-content">
                  <Title level={4}>{t('features.appointments.title')}</Title>
                  <Paragraph type="secondary">{t('features.appointments.description')}</Paragraph>
                </div>
              </div>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <div className="feature-item">
                <div className="feature-icon">
                  <ExclamationCircleOutlined />
                </div>
                <div className="feature-content">
                  <Title level={4}>{t('features.emergency.title')}</Title>
                  <Paragraph type="secondary">{t('features.emergency.description')}</Paragraph>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 