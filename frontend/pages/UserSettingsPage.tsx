import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, message, Row, Col, Typography, Divider, Switch, Space, Alert } from 'antd';
import { SettingOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface UserSettings {
  aiProvider: string;
  aiModel: string;
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    analysisComplete: boolean;
  };
  privacy: {
    dataSharing: boolean;
    analytics: boolean;
  };
}

interface AIService {
  name: string;
  models: string[];
  provider: string;
}

const UserSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiServices, setAiServices] = useState<Record<string, AIService>>({});
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // 获取用户设置
  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user-settings');
      if (response.data.success) {
        setSettings(response.data.data);
        form.setFieldsValue(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user settings:', error);
      message.error(language === 'zh' ? '获取用户设置失败' : 'Failed to fetch user settings');
    } finally {
      setLoading(false);
    }
  };

  // 获取可用的AI服务
  const fetchAiServices = async () => {
    try {
      const response = await api.get('/health-analysis/ai-services');
      if (response.data.success) {
        setAiServices(response.data.data.services);
      }
    } catch (error) {
      console.error('Failed to fetch AI services:', error);
    }
  };

  // 保存用户设置
  const handleSave = async (values: UserSettings) => {
    try {
      setSaving(true);
      const response = await api.put('/user-settings', values);
      if (response.data.success) {
        setSettings(values);
        message.success(language === 'zh' ? '设置保存成功' : 'Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save user settings:', error);
      message.error(language === 'zh' ? '保存设置失败' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // 重置设置
  const handleReset = async () => {
    try {
      setSaving(true);
      const response = await api.post('/user-settings/reset');
      if (response.data.success) {
        setSettings(response.data.data);
        form.setFieldsValue(response.data.data);
        message.success(language === 'zh' ? '设置已重置为默认值' : 'Settings reset to default');
      }
    } catch (error) {
      console.error('Failed to reset user settings:', error);
      message.error(language === 'zh' ? '重置设置失败' : 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // 处理AI服务提供商变化
  const handleProviderChange = (provider: string) => {
    const service = aiServices[provider];
    if (service && service.models.length > 0) {
      // 自动选择第一个可用模型
      form.setFieldsValue({ aiModel: service.models[0] });
    } else {
      form.setFieldsValue({ aiModel: '' });
    }
  };

  useEffect(() => {
    fetchUserSettings();
    fetchAiServices();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>{language === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingOutlined />
            {language === 'zh' ? '用户设置' : 'User Settings'}
          </Title>
          <Text type="secondary">
            {language === 'zh' ? '管理您的个人偏好和AI服务设置' : 'Manage your personal preferences and AI service settings'}
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={settings}
        >
          {/* AI服务设置 */}
          <Card size="small" title={language === 'zh' ? 'AI服务设置' : 'AI Service Settings'} style={{ marginBottom: '24px' }}>
            <Alert
              message={language === 'zh' ? 'AI服务设置说明' : 'AI Service Settings'}
              description={
                language === 'zh' 
                  ? '选择您偏好的AI服务提供商。这将影响聊天功能和健康分析功能。' 
                  : 'Choose your preferred AI service provider. This will affect chat and health analysis features.'
              }
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="aiProvider"
                  label={language === 'zh' ? 'AI服务提供商' : 'AI Service Provider'}
                  rules={[{ required: true, message: language === 'zh' ? '请选择AI服务提供商' : 'Please select AI service provider' }]}
                >
                  <Select
                    placeholder={language === 'zh' ? '选择AI服务提供商' : 'Select AI service provider'}
                    onChange={handleProviderChange}
                  >
                    {Object.keys(aiServices).map(provider => (
                      <Option key={provider} value={provider}>
                        {aiServices[provider]?.name || provider}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="aiModel"
                  label={language === 'zh' ? 'AI模型' : 'AI Model'}
                >
                  <Select
                    placeholder={language === 'zh' ? '选择AI模型（可选）' : 'Select AI model (optional)'}
                    allowClear
                  >
                    {aiServices[form.getFieldValue('aiProvider')]?.models?.map((model: string) => (
                      <Option key={model} value={model}>
                        {model}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 界面设置 */}
          <Card size="small" title={language === 'zh' ? '界面设置' : 'Interface Settings'} style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="language"
                  label={language === 'zh' ? '语言' : 'Language'}
                >
                  <Select>
                    <Option value="zh">中文</Option>
                    <Option value="en">English</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name="theme"
                  label={language === 'zh' ? '主题' : 'Theme'}
                >
                  <Select>
                    <Option value="light">{language === 'zh' ? '浅色' : 'Light'}</Option>
                    <Option value="dark">{language === 'zh' ? '深色' : 'Dark'}</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 通知设置 */}
          <Card size="small" title={language === 'zh' ? '通知设置' : 'Notification Settings'} style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name={['notifications', 'email']}
                  label={language === 'zh' ? '邮件通知' : 'Email Notifications'}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={8}>
                <Form.Item
                  name={['notifications', 'push']}
                  label={language === 'zh' ? '推送通知' : 'Push Notifications'}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={8}>
                <Form.Item
                  name={['notifications', 'analysisComplete']}
                  label={language === 'zh' ? '分析完成通知' : 'Analysis Complete Notifications'}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 隐私设置 */}
          <Card size="small" title={language === 'zh' ? '隐私设置' : 'Privacy Settings'} style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name={['privacy', 'dataSharing']}
                  label={language === 'zh' ? '数据共享' : 'Data Sharing'}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12}>
                <Form.Item
                  name={['privacy', 'analytics']}
                  label={language === 'zh' ? '分析数据收集' : 'Analytics Data Collection'}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 操作按钮 */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Space size="middle">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                size="large"
              >
                {language === 'zh' ? '保存设置' : 'Save Settings'}
              </Button>
              
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                loading={saving}
                size="large"
              >
                {language === 'zh' ? '重置为默认' : 'Reset to Default'}
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default UserSettingsPage;
