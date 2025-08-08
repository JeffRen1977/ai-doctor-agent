import React, { useState } from 'react'
import { Card, Form, Input, Button, Avatar, Row, Col, message } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import './ProfilePage.css'

interface ProfileForm {
  name: string
  email: string
  phone: string
  address: string
  age: string
  gender: string
  emergencyContact: string
  emergencyPhone: string
}

const ProfilePage: React.FC = () => {
  const { user, login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const initialValues: ProfileForm = {
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    age: '',
    gender: '',
    emergencyContact: '',
    emergencyPhone: '',
  }

  const handleSubmit = async (values: ProfileForm) => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新用户信息
      if (user) {
        login({
          ...user,
          name: values.name,
          email: values.email,
        })
      }
      
      message.success('个人资料更新成功！')
    } catch (error) {
      message.error('更新失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <Row gutter={24}>
        <Col span={8}>
          <Card title="个人信息" className="profile-card">
            <div className="avatar-section">
              <Avatar size={80} icon={<UserOutlined />} />
              <h3>{user?.name || '用户'}</h3>
              <p>{user?.email}</p>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-number">12</div>
                <div className="stat-label">健康记录</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5</div>
                <div className="stat-label">咨询次数</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">30</div>
                <div className="stat-label">使用天数</div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col span={16}>
          <Card title="编辑个人资料" className="profile-card">
            <Form
              form={form}
              layout="vertical"
              initialValues={initialValues}
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号码"
                    rules={[{ required: true, message: '请输入手机号码' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="age"
                    label="年龄"
                    rules={[{ required: true, message: '请输入年龄' }]}
                  >
                    <Input placeholder="请输入年龄" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Input placeholder="请输入性别" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="emergencyContact"
                    label="紧急联系人"
                    rules={[{ required: true, message: '请输入紧急联系人' }]}
                  >
                    <Input placeholder="请输入紧急联系人姓名" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="居住地址"
                rules={[{ required: true, message: '请输入居住地址' }]}
              >
                <Input prefix={<HomeOutlined />} placeholder="请输入居住地址" />
              </Form.Item>

              <Form.Item
                name="emergencyPhone"
                label="紧急联系人电话"
                rules={[{ required: true, message: '请输入紧急联系人电话' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入紧急联系人电话" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProfilePage 