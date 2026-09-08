import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, message, Row, Col, Typography, Divider, Switch, Space, Alert, Modal, Input } from 'antd';
import { SettingOutlined, SaveOutlined, ReloadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
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
  privacy?: {
    analytics?: boolean;
  };
}

interface ConsentStatus {
  granted: boolean;
  policyVersion: string | null;
  timestamp: string | null;
  currentPolicyVersion: string;
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
  const [consents, setConsents] = useState<Record<string, ConsentStatus>>({});
  const [policyVersion, setPolicyVersion] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

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
  const fetchConsents = async () => {
    try {
      const response = await api.get('/privacy/consents');
      if (response.data.success) {
        setConsents(response.data.consents || {});
        setPolicyVersion(response.data.policyVersion || '');
      }
    } catch (error) {
      console.error('Failed to fetch consents:', error);
    }
  };

  const updateConsent = async (purpose: string, granted: boolean) => {
    try {
      const response = await api.post('/privacy/consents', { purpose, granted });
      if (response.data.success) {
        setConsents(response.data.consents || {});
        message.success(language === 'zh' ? '同意状态已更新' : 'Consent updated');
      }
    } catch (error) {
      message.error(language === 'zh' ? '更新同意失败' : 'Failed to update consent');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await api.post('/privacy/export');
      const blob = new Blob([JSON.stringify(response.data.data || response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-theron-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success(language === 'zh' ? '导出已下载' : 'Export downloaded');
    } catch (error) {
      message.error(language === 'zh' ? '导出失败' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await api.post('/privacy/delete-account', {
        password: deletePassword,
        confirmEmail: deleteEmail
      });
      message.success(language === 'zh' ? '账号已申请注销' : 'Account deletion submitted');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error || (language === 'zh' ? '注销失败' : 'Deletion failed'));
    } finally {
      setDeleting(false);
    }
  };

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
    fetchConsents();
  }, []);

  if (loading) {
    return (
      <div className="app-page-shell" style={{ textAlign: 'center' }}>
        <Text>{language === 'zh' ? '加载中...' : 'Loading...'}</Text>
      </div>
    );
  }

  return (
    <div className="app-page-shell" style={{ maxWidth: '800px' }}>
      <Card className="app-surface-card">
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

          {/* 隐私与同意 */}
          <Card size="small" title={language === 'zh' ? '隐私与同意' : 'Privacy and consent'} style={{ marginBottom: '24px' }}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={language === 'zh' ? `当前政策版本 ${policyVersion || '—'}` : `Policy version ${policyVersion || '—'}`}
              description={
                language === 'zh'
                  ? '撤回「健康存储」后不能再写入病历/穿戴；撤回「AI 解读」后对话与分析会停止。本产品不会把数据交给厂商做训练。'
                  : 'Withdrawing health storage blocks new writes. Withdrawing AI inference stops model calls. We do not share data with vendors for training.'
              }
            />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Space>
                  <Switch
                    checked={!!consents.ai_inference?.granted}
                    onChange={(checked) => updateConsent('ai_inference', checked)}
                  />
                  <Text>{language === 'zh' ? 'AI 解读' : 'AI inference'}</Text>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <Switch
                    checked={!!consents.health_storage?.granted}
                    onChange={(checked) => updateConsent('health_storage', checked)}
                  />
                  <Text>{language === 'zh' ? '健康数据存储' : 'Health storage'}</Text>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <Switch
                    checked={!!consents.cross_border?.granted}
                    onChange={(checked) => updateConsent('cross_border', checked)}
                  />
                  <Text>{language === 'zh' ? '出境（OpenAI / Gemini）' : 'Cross-border (OpenAI / Gemini)'}</Text>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <Switch
                    checked={!!consents.analytics?.granted}
                    onChange={(checked) => updateConsent('analytics', checked)}
                  />
                  <Text>{language === 'zh' ? '产品统计' : 'Analytics'}</Text>
                </Space>
              </Col>
            </Row>
            <Divider />
            <Space wrap>
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>
                {language === 'zh' ? '导出我的数据' : 'Export my data'}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => {
                setDeleteEmail(user?.email || '');
                setDeleteOpen(true);
              }}>
                {language === 'zh' ? '注销账号' : 'Delete account'}
              </Button>
              <a href="/privacy" target="_blank" rel="noreferrer">{language === 'zh' ? '隐私政策' : 'Privacy policy'}</a>
              <a href="/third-parties" target="_blank" rel="noreferrer">{language === 'zh' ? '第三方' : 'Third parties'}</a>
            </Space>
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
      <Modal
        title={language === 'zh' ? '确认注销账号' : 'Confirm account deletion'}
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onOk={handleDeleteAccount}
        confirmLoading={deleting}
        okButtonProps={{ danger: true, disabled: !deletePassword || !deleteEmail }}
        okText={language === 'zh' ? '注销' : 'Delete'}
      >
        <Paragraph>
          {language === 'zh'
            ? '注销后健康档案会被删除或匿名化。已发送到大模型的内容无法追回。请输入邮箱和密码确认。'
            : 'Health records will be deleted or anonymized. Content already sent to model providers cannot be recalled. Confirm with email and password.'}
        </Paragraph>
        <Input
          style={{ marginBottom: 8 }}
          placeholder={language === 'zh' ? '确认邮箱' : 'Confirm email'}
          value={deleteEmail}
          onChange={(e) => setDeleteEmail(e.target.value)}
        />
        <Input.Password
          placeholder={language === 'zh' ? '当前密码' : 'Current password'}
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default UserSettingsPage;
