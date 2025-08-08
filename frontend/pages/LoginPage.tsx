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

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<Language>('zh')
  const { login } = useAuthStore()

  const t = (key: string) => getTranslation(language, key)

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh')
  }

  const onFinish = async (values: LoginForm) => {
    setLoading(true)
    try {
      // 模拟登录API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟用户数据
      const user = {
        id: '1',
        name: '张三',
        email: values.email,
      }
      
      login(user)
      message.success(language === 'zh' ? '登录成功！' : 'Login successful!')
    } catch (error) {
      message.error(language === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')
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
            <Title level={2}>{t('login.title')}</Title>
            <Paragraph type="secondary">{t('login.subtitle')}</Paragraph>
          </div>
          
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
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

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                {t('login.loginButton')}
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