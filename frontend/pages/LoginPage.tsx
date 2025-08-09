import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Row, Col, Typography, Space } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined, MessageOutlined, FileTextOutlined, CameraOutlined, BarChartOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { translations, getTranslation, Language } from '../locales'
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
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [language, setLanguage] = useState<Language>('zh')
  const { login } = useAuthStore()

  const t = (key: string) => getTranslation(language, key)

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
  }

  const onFinish = async (values: LoginForm | RegisterForm) => {
    setLoading(true)
    try {
      if (isLoginMode) {
        // Login mode
        console.log('🔐 Attempting login with:', values.email)
        
        const response = await fetch('/api/auth/login', {
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
          
          login(user)
          message.success(language === 'zh' ? '登录成功！' : 'Login successful!')
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
        
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: registerValues.email,
            password: registerValues.password,
            name: registerValues.name
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
            <Title level={2}>{isLoginMode ? t('login.title') : (language === 'zh' ? '用户注册' : 'User Registration')}</Title>
            <Paragraph type="secondary">
              {isLoginMode ? t('login.subtitle') : (language === 'zh' ? '创建新账户以开始使用AI医生服务' : 'Create a new account to start using AI Doctor services')}
            </Paragraph>
          </div>
          
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
              rules={[{ required: true, message: language === 'zh' ? '请输入密码!' : 'Please enter your password!' }]}
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