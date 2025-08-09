import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Row, Col, message } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getTranslation } from '@/locales'
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
  const { language } = useLanguageStore()
  const t = (key: string) => getTranslation(language, key)
  
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
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

  // 获取用户资料
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.email) return;
      
      try {
        setProfileLoading(true);
        const response = await fetch(`/api/auth/profile/${encodeURIComponent(user.email)}`);
        
        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;
          
          // 更新表单初始值
          form.setFieldsValue({
            name: profile.name || user?.name || '',
            email: profile.email || user?.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            age: profile.age || '',
            gender: profile.gender || '',
            emergencyContact: profile.emergencyContact || '',
            emergencyPhone: profile.emergencyPhone || '',
          });
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        // 如果获取失败，使用默认值
        form.setFieldsValue(initialValues);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.email, form]);

  const handleSubmit = async (values: ProfileForm) => {
    if (!user?.email) {
      message.error(t('profile.userNotLoggedIn'));
      return;
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/auth/profile/${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 更新本地用户信息
        if (user) {
          login({
            ...user,
            name: values.name,
          })
        }
        
        message.success(t('profile.profileUpdateSuccess'));
      } else {
        message.error(t('profile.profileUpdateFailed'));
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error(t('profile.profileUpdateFailed'));
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="profile-page">
        <Card title={t('profile.title')} loading={true} />
      </div>
    )
  }

  return (
    <div className="profile-page">
      <Card title={t('profile.title')}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialValues}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('profile.name')}
                rules={[{ required: true, message: t('profile.pleaseEnterName') }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder={t('profile.enterYourName')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={t('profile.email')}
                rules={[
                  { required: true, message: t('profile.pleaseEnterEmail') },
                  { type: 'email', message: t('profile.pleaseEnterValidEmail') }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder={t('profile.enterYourEmail')}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t('profile.phone')}
                rules={[{ required: true, message: t('profile.pleaseEnterPhone') }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder={t('profile.enterYourPhone')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="age"
                label={t('profile.dateOfBirth')}
                rules={[{ required: true, message: t('profile.pleaseEnterAge') }]}
              >
                <Input 
                  placeholder={t('profile.enterYourAge')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="gender"
                label={t('profile.gender')}
                rules={[{ required: true, message: t('profile.pleaseSelectGender') }]}
              >
                <Input placeholder={t('profile.enterYourGender')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="emergencyContact"
                label={t('profile.emergencyContact')}
                rules={[{ required: true, message: t('profile.pleaseEnterEmergencyContact') }]}
              >
                <Input placeholder={t('profile.enterEmergencyContact')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="emergencyPhone"
                label={t('profile.emergencyPhone')}
                rules={[{ required: true, message: t('profile.pleaseEnterEmergencyPhone') }]}
              >
                <Input placeholder={t('profile.enterEmergencyPhone')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label={t('profile.address')}
                rules={[{ required: true, message: t('profile.pleaseEnterAddress') }]}
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder={t('profile.enterYourAddress')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
            >
              {t('profile.saveChanges')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ProfilePage 