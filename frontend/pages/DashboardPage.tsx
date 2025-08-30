import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Button, 
  List, 
  Avatar, 
  Tag, 
  Alert,
  Typography,
  Space,
  Divider,
  Badge,
  Grid
} from 'antd';
import { 
  HeartOutlined, 
  MedicineBoxOutlined, 
  CalendarOutlined, 
  BellOutlined,
  PlusOutlined,
  MessageOutlined,
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'stable';
}

interface Reminder {
  id: string;
  type: 'medication' | 'appointment' | 'checkup';
  title: string;
  time: string;
  description: string;
  completed: boolean;
}

const DashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const screens = useBreakpoint();
  
  const t = (key: string) => getTranslation(language, key);

  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([
    { name: language === 'zh' ? '心率' : 'Heart Rate', value: 72, unit: 'bpm', status: 'normal', trend: 'stable' },
    { name: language === 'zh' ? '血压' : 'Blood Pressure', value: 120, unit: 'mmHg', status: 'normal', trend: 'down' },
    { name: language === 'zh' ? '血糖' : 'Blood Sugar', value: 95, unit: 'mg/dL', status: 'normal', trend: 'stable' },
    { name: language === 'zh' ? '体温' : 'Temperature', value: 36.8, unit: '°C', status: 'normal', trend: 'up' },
  ]);

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      type: 'medication',
      title: language === 'zh' ? '服用降压药' : 'Take Blood Pressure Medicine',
      time: '08:00',
      description: language === 'zh' ? '缬沙坦 80mg' : 'Valsartan 80mg',
      completed: false
    },
    {
      id: '2',
      type: 'appointment',
      title: language === 'zh' ? '复诊预约' : 'Follow-up Appointment',
      time: '14:30',
      description: language === 'zh' ? '心血管科 - 张医生' : 'Cardiology - Dr. Zhang',
      completed: false
    },
    {
      id: '3',
      type: 'checkup',
      title: language === 'zh' ? '年度体检' : 'Annual Checkup',
      time: '09:00',
      description: language === 'zh' ? '全面健康检查' : 'Comprehensive Health Check',
      completed: false
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#52c41a';
      case 'warning': return '#faad14';
      case 'danger': return '#ff4d4f';
      default: return '#52c41a';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const handleReminderComplete = (id: string) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id 
          ? { ...reminder, completed: true }
          : reminder
      )
    );
  };

  // Responsive column spans
  const getColSpan = (defaultSpan: number) => {
    if (screens.xs) return 24; // Mobile: full width
    if (screens.sm) return 12; // Small tablet: half width
    if (screens.md) return defaultSpan; // Medium: original span
    return defaultSpan; // Large: original span
  };

  const getQuickActionSpan = () => {
    if (screens.xs) return 12; // Mobile: 2 columns
    if (screens.sm) return 8; // Small tablet: 3 columns
    if (screens.md) return 6; // Medium: 4 columns
    return 6; // Large: 4 columns
  };

  return (
    <div style={{ padding: screens.xs ? '12px' : '24px' }}>
      <Title level={screens.xs ? 3 : 2} style={{ marginBottom: '24px', textAlign: screens.xs ? 'center' : 'left' }}>
        {t('dashboard.title')}
      </Title>

      {/* 健康指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card title={language === 'zh' ? '健康指标' : 'Health Metrics'} size={screens.xs ? 'small' : 'default'}>
            {healthMetrics.map((metric, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text strong>{metric.name}</Text>
                  <Space>
                    <Tag color={getStatusColor(metric.status)}>
                      {metric.status === 'normal' ? (language === 'zh' ? '正常' : 'Normal') :
                       metric.status === 'warning' ? (language === 'zh' ? '警告' : 'Warning') :
                       (language === 'zh' ? '危险' : 'Danger')}
                    </Tag>
                    <Text>{getTrendIcon(metric.trend)}</Text>
                  </Space>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: screens.xs ? '16px' : '20px', fontWeight: 'bold' }}>
                    {metric.value} {metric.unit}
                  </Text>
                  <Progress 
                    percent={metric.status === 'normal' ? 80 : metric.status === 'warning' ? 60 : 40} 
                    size={screens.xs ? 'small' : 'default'}
                    strokeColor={getStatusColor(metric.status)}
                    showInfo={false}
                  />
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card title={language === 'zh' ? '今日提醒' : 'Today Reminders'} 
                extra={<Button type="link" size={screens.xs ? 'small' : 'default'}>{language === 'zh' ? '管理提醒' : 'Manage Reminders'}</Button>}
                size={screens.xs ? 'small' : 'default'}>
            <List
              dataSource={reminders.filter(r => !r.completed)}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small" 
                      type="primary"
                      onClick={() => handleReminderComplete(item.id)}
                    >
                      {language === 'zh' ? '完成' : 'Complete'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={
                          item.type === 'medication' ? <MedicineBoxOutlined /> :
                          item.type === 'appointment' ? <CalendarOutlined /> :
                          <FileTextOutlined />
                        }
                        style={{ backgroundColor: '#1890ff' }}
                        size={screens.xs ? 'small' : 'default'}
                      />
                    }
                    title={<Text style={{ fontSize: screens.xs ? '14px' : '16px' }}>{item.title}</Text>}
                    description={<Text style={{ fontSize: screens.xs ? '12px' : '14px' }}>{`${item.time} - ${item.description}`}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title={t('dashboard.quickActions.title')} size={screens.xs ? 'small' : 'default'}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Button 
                  type="primary" 
                  size={screens.xs ? 'middle' : 'large'} 
                  icon={<MessageOutlined />}
                  block
                  onClick={() => window.location.href = '/chat'}
                >
                  {screens.xs ? (language === 'zh' ? '聊天' : 'Chat') : t('dashboard.quickActions.chat')}
                </Button>
              </Col>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Button 
                  size={screens.xs ? 'middle' : 'large'} 
                  icon={<CalendarOutlined />}
                  block
                  onClick={() => window.location.href = '/appointments'}
                >
                  {screens.xs ? (language === 'zh' ? '预约' : 'Appt') : t('dashboard.quickActions.appointment')}
                </Button>
              </Col>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Button 
                  size={screens.xs ? 'middle' : 'large'} 
                  icon={<FileTextOutlined />}
                  block
                  onClick={() => window.location.href = '/health-records'}
                >
                  {screens.xs ? (language === 'zh' ? '记录' : 'Records') : t('dashboard.quickActions.records')}
                </Button>
              </Col>
              <Col xs={12} sm={8} md={6} lg={6}>
                <Button 
                  size={screens.xs ? 'middle' : 'large'} 
                  icon={<SyncOutlined />}
                  block
                  onClick={() => window.location.href = '/devices'}
                >
                  {screens.xs ? (language === 'zh' ? '设备' : 'Devices') : t('dashboard.quickActions.analysis')}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 健康趋势图 - 使用简单的进度条替代复杂图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card title={language === 'zh' ? '心率趋势 (7天)' : 'Heart Rate Trend (7 days)'} size={screens.xs ? 'small' : 'default'}>
            <div style={{ padding: screens.xs ? '10px 0' : '20px 0' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: screens.xs ? '10px' : '14px'
              }}>
                <Text>{language === 'zh' ? '周一' : 'Mon'}</Text>
                <Text>{language === 'zh' ? '周二' : 'Tue'}</Text>
                <Text>{language === 'zh' ? '周三' : 'Wed'}</Text>
                <Text>{language === 'zh' ? '周四' : 'Thu'}</Text>
                <Text>{language === 'zh' ? '周五' : 'Fri'}</Text>
                <Text>{language === 'zh' ? '周六' : 'Sat'}</Text>
                <Text>{language === 'zh' ? '周日' : 'Sun'}</Text>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'end', 
                height: screens.xs ? '60px' : '100px' 
              }}>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '80%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '50%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '70%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '55%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '75%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                  {language === 'zh' ? '平均心率: 72 bpm' : 'Average Heart Rate: 72 bpm'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12}>
          <Card title={language === 'zh' ? '血压记录 (7天)' : 'Blood Pressure Record (7 days)'} size={screens.xs ? 'small' : 'default'}>
            <div style={{ padding: screens.xs ? '10px 0' : '20px 0' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: screens.xs ? '10px' : '14px'
              }}>
                <Text>{language === 'zh' ? '周一' : 'Mon'}</Text>
                <Text>{language === 'zh' ? '周二' : 'Tue'}</Text>
                <Text>{language === 'zh' ? '周三' : 'Wed'}</Text>
                <Text>{language === 'zh' ? '周四' : 'Thu'}</Text>
                <Text>{language === 'zh' ? '周五' : 'Fri'}</Text>
                <Text>{language === 'zh' ? '周六' : 'Sat'}</Text>
                <Text>{language === 'zh' ? '周日' : 'Sun'}</Text>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'end', 
                height: screens.xs ? '60px' : '100px' 
              }}>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '55%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '65%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '58%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '62%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '54%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                  {language === 'zh' ? '平均血压: 120/80 mmHg' : 'Average BP: 120/80 mmHg'}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 紧急情况提醒 */}
      <Alert
        message={language === 'zh' ? '紧急情况' : 'Emergency'}
        description={language === 'zh' ? '如果遇到紧急医疗情况，请立即点击紧急按钮或拨打急救电话 120' : 'If you encounter an emergency medical situation, please immediately click the emergency button or call emergency number 120'}
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        action={
          <Button 
            size={screens.xs ? 'small' : 'default'} 
            danger 
            onClick={() => window.location.href = '/emergency'}
          >
            {t('sidebar.menu.emergency')}
          </Button>
        }
        style={{ marginTop: '24px' }}
      />
    </div>
  );
};

export default DashboardPage; 