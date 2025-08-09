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
  Badge
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

  const getStatusText = (status: string) => {
    if (language === 'zh') {
      switch (status) {
        case 'normal': return '正常';
        case 'warning': return '注意';
        case 'danger': return '异常';
        default: return '正常';
      }
    } else {
      switch (status) {
        case 'normal': return 'Normal';
        case 'warning': return 'Warning';
        case 'danger': return 'Danger';
        default: return 'Normal';
      }
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{t('dashboard.title')}</Title>
      
      {/* 健康概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '今日步数' : 'Today Steps'}
              value={8234}
              suffix={language === 'zh' ? '步' : 'steps'}
              prefix={<HeartOutlined style={{ color: '#1890ff' }} />}
            />
            <Progress percent={82} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '睡眠时长' : 'Sleep Duration'}
              value={7.5}
              suffix={language === 'zh' ? '小时' : 'hours'}
              prefix={<MedicineBoxOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={75} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '水分摄入' : 'Water Intake'}
              value={1.8}
              suffix="L"
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
            />
            <Progress percent={90} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '卡路里消耗' : 'Calories Burned'}
              value={1250}
              suffix="kcal"
              prefix={<BellOutlined style={{ color: '#fa8c16' }} />}
            />
            <Progress percent={65} size="small" />
          </Card>
        </Col>
      </Row>

      {/* 健康指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title={language === 'zh' ? '关键健康指标' : 'Key Health Metrics'} extra={<Button type="link">{language === 'zh' ? '查看详情' : 'View Details'}</Button>}>
            {healthMetrics.map((metric, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{metric.name}</Text>
                  <Space>
                    <Text strong>{metric.value} {metric.unit}</Text>
                    <Tag color={getStatusColor(metric.status)}>
                      {getStatusText(metric.status)}
                    </Tag>
                    <Text>{getTrendIcon(metric.trend)}</Text>
                  </Space>
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title={language === 'zh' ? '今日提醒' : 'Today Reminders'} extra={<Button type="link">{language === 'zh' ? '管理提醒' : 'Manage Reminders'}</Button>}>
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
                      />
                    }
                    title={item.title}
                    description={`${item.time} - ${item.description}`}
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
          <Card title={t('dashboard.quickActions.title')}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<MessageOutlined />}
                  block
                  onClick={() => window.location.href = '/chat'}
                >
                  {t('dashboard.quickActions.chat')}
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  size="large" 
                  icon={<CalendarOutlined />}
                  block
                  onClick={() => window.location.href = '/appointments'}
                >
                  {t('dashboard.quickActions.appointment')}
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  size="large" 
                  icon={<FileTextOutlined />}
                  block
                  onClick={() => window.location.href = '/health-records'}
                >
                  {t('dashboard.quickActions.records')}
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  size="large" 
                  icon={<SyncOutlined />}
                  block
                  onClick={() => window.location.href = '/devices'}
                >
                  {t('dashboard.quickActions.analysis')}
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 健康趋势图 - 使用简单的进度条替代复杂图表 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={language === 'zh' ? '心率趋势 (7天)' : 'Heart Rate Trend (7 days)'}>
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>{language === 'zh' ? '周一' : 'Mon'}</Text>
                <Text>{language === 'zh' ? '周二' : 'Tue'}</Text>
                <Text>{language === 'zh' ? '周三' : 'Wed'}</Text>
                <Text>{language === 'zh' ? '周四' : 'Thu'}</Text>
                <Text>{language === 'zh' ? '周五' : 'Fri'}</Text>
                <Text>{language === 'zh' ? '周六' : 'Sat'}</Text>
                <Text>{language === 'zh' ? '周日' : 'Sun'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '100px' }}>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '80%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '50%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '70%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '55%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '75%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <Text type="secondary">{language === 'zh' ? '平均心率: 72 bpm' : 'Average Heart Rate: 72 bpm'}</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={language === 'zh' ? '血压记录 (7天)' : 'Blood Pressure Record (7 days)'}>
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>{language === 'zh' ? '周一' : 'Mon'}</Text>
                <Text>{language === 'zh' ? '周二' : 'Tue'}</Text>
                <Text>{language === 'zh' ? '周三' : 'Wed'}</Text>
                <Text>{language === 'zh' ? '周四' : 'Thu'}</Text>
                <Text>{language === 'zh' ? '周五' : 'Fri'}</Text>
                <Text>{language === 'zh' ? '周六' : 'Sat'}</Text>
                <Text>{language === 'zh' ? '周日' : 'Sun'}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '100px' }}>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '55%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '65%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '58%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '62%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '54%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
                <div style={{ width: '12%', height: '60%', backgroundColor: '#52c41a', borderRadius: '2px' }}></div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <Text type="secondary">{language === 'zh' ? '平均血压: 120/80 mmHg' : 'Average BP: 120/80 mmHg'}</Text>
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
            size="small" 
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