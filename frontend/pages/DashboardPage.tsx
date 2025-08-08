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
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([
    { name: '心率', value: 72, unit: 'bpm', status: 'normal', trend: 'stable' },
    { name: '血压', value: 120, unit: 'mmHg', status: 'normal', trend: 'down' },
    { name: '血糖', value: 95, unit: 'mg/dL', status: 'normal', trend: 'stable' },
    { name: '体温', value: 36.8, unit: '°C', status: 'normal', trend: 'up' },
  ]);

  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      type: 'medication',
      title: '服用降压药',
      time: '08:00',
      description: '缬沙坦 80mg',
      completed: false
    },
    {
      id: '2',
      type: 'appointment',
      title: '复诊预约',
      time: '14:30',
      description: '心血管科 - 张医生',
      completed: false
    },
    {
      id: '3',
      type: 'checkup',
      title: '年度体检',
      time: '09:00',
      description: '全面健康检查',
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>健康仪表板</Title>
      
      {/* 健康概览卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日步数"
              value={8234}
              suffix="步"
              prefix={<HeartOutlined style={{ color: '#1890ff' }} />}
            />
            <Progress percent={82} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="睡眠时长"
              value={7.5}
              suffix="小时"
              prefix={<MedicineBoxOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={75} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="水分摄入"
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
              title="卡路里消耗"
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
          <Card title="关键健康指标" extra={<Button type="link">查看详情</Button>}>
            {healthMetrics.map((metric, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>{metric.name}</Text>
                  <Space>
                    <Text strong>{metric.value} {metric.unit}</Text>
                    <Tag color={getStatusColor(metric.status)}>
                      {metric.status === 'normal' ? '正常' : 
                       metric.status === 'warning' ? '注意' : '异常'}
                    </Tag>
                    <Text>{getTrendIcon(metric.trend)}</Text>
                  </Space>
                </div>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="今日提醒" extra={<Button type="link">管理提醒</Button>}>
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
                      完成
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
          <Card title="快速操作">
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<MessageOutlined />}
                  block
                  onClick={() => window.location.href = '/chat'}
                >
                  AI 问诊
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  size="large" 
                  icon={<CalendarOutlined />}
                  block
                  onClick={() => window.location.href = '/appointments'}
                >
                  预约管理
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  size="large" 
                  icon={<FileTextOutlined />}
                  block
                  onClick={() => window.location.href = '/health-records'}
                >
                  健康档案
                </Button>
              </Col>
              <Col span={6}>
                <Button 
                  size="large" 
                  icon={<SyncOutlined />}
                  block
                  onClick={() => window.location.href = '/devices'}
                >
                  设备同步
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 健康趋势图 - 使用简单的进度条替代复杂图表 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="心率趋势 (7天)">
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>周一</Text>
                <Text>周二</Text>
                <Text>周三</Text>
                <Text>周四</Text>
                <Text>周五</Text>
                <Text>周六</Text>
                <Text>周日</Text>
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
                <Text type="secondary">平均心率: 72 bpm</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="血压记录 (7天)">
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text>周一</Text>
                <Text>周二</Text>
                <Text>周三</Text>
                <Text>周四</Text>
                <Text>周五</Text>
                <Text>周六</Text>
                <Text>周日</Text>
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
                <Text type="secondary">平均血压: 120/80 mmHg</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 紧急情况提醒 */}
      <Alert
        message="紧急情况"
        description="如果遇到紧急医疗情况，请立即点击紧急按钮或拨打急救电话 120"
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        action={
          <Button 
            size="small" 
            danger 
            onClick={() => window.location.href = '/emergency'}
          >
            紧急求助
          </Button>
        }
        style={{ marginTop: '24px' }}
      />
    </div>
  );
};

export default DashboardPage; 