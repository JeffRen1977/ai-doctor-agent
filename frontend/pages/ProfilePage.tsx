import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Avatar, Row, Col, message, Grid, Divider, Typography } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { getTranslation } from '@/locales'
import './ProfilePage.css'

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint()
  const t = (key: string) => getTranslation(language, key)
  
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [editing, setEditing] = useState(false)
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
          });
        }
        
        message.success(language === 'zh' ? '个人资料更新成功' : 'Profile updated successfully');
        setEditing(false);
      } else {
        const errorData = await response.json();
        message.error(errorData.message || (language === 'zh' ? '更新失败' : 'Update failed'));
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error(language === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEditing(false);
  };

  if (profileLoading) {
    return (
      <div style={{ 
        padding: screens.xs ? '16px' : '24px', 
        textAlign: 'center',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Text>{language === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: screens.xs ? '8px' : '24px' }}>
      <Card 
        title={t('profile.title')} 
        size={screens.xs ? 'small' : 'default'}
        extra={
          !editing ? (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setEditing(true)}
              size={screens.xs ? 'small' : 'default'}
            >
              {language === 'zh' ? '编辑' : 'Edit'}
            </Button>
          ) : null
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={!editing}
          style={{ marginTop: screens.xs ? '8px' : '16px' }}
        >
          {/* Profile Header */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: screens.xs ? '16px' : '24px',
            padding: screens.xs ? '8px' : '16px',
            backgroundColor: '#fafafa',
            borderRadius: '8px'
          }}>
            <Avatar 
              size={screens.xs ? 64 : 80} 
              icon={<UserOutlined />} 
              style={{ marginBottom: '12px' }}
            />
            <Title level={screens.xs ? 4 : 3} style={{ margin: '8px 0' }}>
              {user?.name || (language === 'zh' ? '用户' : 'User')}
            </Title>
            <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
              {user?.email}
            </Text>
          </div>

          {/* Personal Information */}
          <div style={{ marginBottom: screens.xs ? '16px' : '24px' }}>
            <Title level={screens.xs ? 5 : 4} style={{ marginBottom: '16px' }}>
              {language === 'zh' ? '基本信息' : 'Basic Information'}
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label={language === 'zh' ? '姓名' : 'Name'}
                  rules={[{ required: true, message: language === 'zh' ? '请输入姓名' : 'Please enter your name' }]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder={language === 'zh' ? '请输入您的姓名' : 'Enter your name'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label={language === 'zh' ? '邮箱' : 'Email'}
                  rules={[
                    { required: true, message: language === 'zh' ? '请输入邮箱' : 'Please enter your email' },
                    { type: 'email', message: language === 'zh' ? '请输入有效的邮箱地址' : 'Please enter a valid email address' }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined />} 
                    placeholder={language === 'zh' ? '请输入您的邮箱' : 'Enter your email'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="phone"
                  label={language === 'zh' ? '电话' : 'Phone'}
                >
                  <Input 
                    prefix={<PhoneOutlined />} 
                    placeholder={language === 'zh' ? '请输入您的电话号码' : 'Enter your phone number'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="age"
                  label={language === 'zh' ? '年龄' : 'Age'}
                >
                  <Input 
                    placeholder={language === 'zh' ? '请输入您的年龄' : 'Enter your age'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24}>
                <Form.Item
                  name="address"
                  label={language === 'zh' ? '地址' : 'Address'}
                >
                  <Input 
                    prefix={<HomeOutlined />} 
                    placeholder={language === 'zh' ? '请输入您的地址' : 'Enter your address'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider style={{ margin: screens.xs ? '16px 0' : '24px 0' }} />

          {/* Emergency Contact */}
          <div style={{ marginBottom: screens.xs ? '16px' : '24px' }}>
            <Title level={screens.xs ? 5 : 4} style={{ marginBottom: '16px' }}>
              {language === 'zh' ? '紧急联系人' : 'Emergency Contact'}
            </Title>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="emergencyContact"
                  label={language === 'zh' ? '联系人姓名' : 'Contact Name'}
                >
                  <Input 
                    placeholder={language === 'zh' ? '请输入紧急联系人姓名' : 'Enter emergency contact name'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="emergencyPhone"
                  label={language === 'zh' ? '联系人电话' : 'Contact Phone'}
                >
                  <Input 
                    prefix={<PhoneOutlined />} 
                    placeholder={language === 'zh' ? '请输入紧急联系人电话' : 'Enter emergency contact phone'}
                    size={screens.xs ? 'middle' : 'default'}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: screens.xs ? 'stretch' : 'flex-end',
              marginTop: '24px'
            }}>
              <Button 
                onClick={handleCancel}
                size={screens.xs ? 'middle' : 'default'}
                block={screens.xs}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size={screens.xs ? 'middle' : 'default'}
                block={screens.xs}
              >
                {language === 'zh' ? '保存' : 'Save'}
              </Button>
            </div>
          )}
        </Form>
      </Card>
    </div>
  )
}

export default ProfilePage 