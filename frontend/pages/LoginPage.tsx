import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './LoginPage.css'

interface LoginForm {
  email: string
  password: string
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

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
      message.success('登录成功！')
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>AI个人医生助理</h1>
          <p>您的智能健康管理伙伴</p>
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
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="login-footer">
          <p>演示账号：demo@example.com / 密码：123456</p>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage 