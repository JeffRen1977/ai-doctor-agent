import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  DatePicker, 
  Button, 
  Table, 
  Tag, 
  Progress,
  Typography,
  Space,
  Alert,
  Statistic,
  Divider,
  List,
  Avatar
} from 'antd';
import { 
  HeartOutlined, 
  MedicineBoxOutlined, 
  CalendarOutlined, 
  BellOutlined,
  RiseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface HealthRisk {
  level: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  recommendation: string;
}

interface HealthGoal {
  name: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  status: 'on-track' | 'behind' | 'ahead';
}

const HealthAnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetrics, setSelectedMetrics] = useState(['heart_rate', 'blood_pressure']);

  const healthRisks: HealthRisk[] = [
    {
      level: 'low',
      category: '心血管健康',
      description: '血压略有波动，建议继续监测',
      recommendation: '保持规律运动，控制盐分摄入'
    },
    {
      level: 'medium',
      category: '睡眠质量',
      description: '睡眠时长不足，质量有待改善',
      recommendation: '建立规律作息，避免睡前使用电子设备'
    },
    {
      level: 'high',
      category: '血糖控制',
      description: '血糖水平偏高，需要重点关注',
      recommendation: '控制饮食，增加运动，定期监测血糖'
    }
  ];

  const healthGoals: HealthGoal[] = [
    {
      name: '每日步数',
      target: 10000,
      current: 8234,
      unit: '步',
      progress: 82,
      status: 'on-track'
    },
    {
      name: '睡眠时长',
      target: 8,
      current: 7.5,
      unit: '小时',
      progress: 94,
      status: 'behind'
    },
    {
      name: '体重管理',
      target: 70,
      current: 72.5,
      unit: 'kg',
      progress: 75,
      status: 'behind'
    }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#52c41a';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return '#52c41a';
      case 'behind': return '#faad14';
      case 'ahead': return '#1890ff';
      default: return '#52c41a';
    }
  };

  const columns = [
    {
      title: '指标',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: '当前值',
      dataIndex: 'current',
      key: 'current',
    },
    {
      title: '正常范围',
      dataIndex: 'normalRange',
      key: 'normalRange',
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag color={trend === 'improving' ? 'green' : trend === 'stable' ? 'blue' : 'red'}>
          {trend === 'improving' ? '改善' : trend === 'stable' ? '稳定' : '恶化'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'normal' ? 'green' : status === 'warning' ? 'orange' : 'red'}>
          {status === 'normal' ? '正常' : status === 'warning' ? '注意' : '异常'}
        </Tag>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      metric: '心率',
      current: '72 bpm',
      normalRange: '60-100 bpm',
      trend: 'stable',
      status: 'normal',
    },
    {
      key: '2',
      metric: '血压',
      current: '120/80 mmHg',
      normalRange: '<140/90 mmHg',
      trend: 'improving',
      status: 'normal',
    },
    {
      key: '3',
      metric: '血糖',
      current: '95 mg/dL',
      normalRange: '70-100 mg/dL',
      trend: 'stable',
      status: 'normal',
    },
    {
      key: '4',
      metric: '体温',
      current: '36.8°C',
      normalRange: '36.1-37.2°C',
      trend: 'stable',
      status: 'normal',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>健康数据分析</Title>
      
      {/* 筛选器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Text strong>时间范围：</Text>
            <Select 
              value={timeRange} 
              onChange={setTimeRange}
              style={{ width: 120, marginLeft: 8 }}
            >
              <Option value="7d">最近7天</Option>
              <Option value="30d">最近30天</Option>
              <Option value="90d">最近90天</Option>
              <Option value="1y">最近1年</Option>
            </Select>
          </Col>
          <Col>
            <Text strong>指标选择：</Text>
            <Select
              mode="multiple"
              value={selectedMetrics}
              onChange={setSelectedMetrics}
              style={{ width: 300, marginLeft: 8 }}
            >
              <Option value="heart_rate">心率</Option>
              <Option value="blood_pressure">血压</Option>
              <Option value="blood_sugar">血糖</Option>
              <Option value="temperature">体温</Option>
              <Option value="weight">体重</Option>
              <Option value="sleep">睡眠</Option>
            </Select>
          </Col>
          <Col>
            <Button type="primary">更新分析</Button>
          </Col>
        </Row>
      </Card>

      {/* 健康概览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="健康评分"
              value={85}
              suffix="/100"
              prefix={<HeartOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={85} size="small" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="异常指标"
              value={1}
              suffix="项"
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="改善趋势"
              value={3}
              suffix="项"
              prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="目标完成度"
              value={78}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress percent={78} size="small" />
          </Card>
        </Col>
      </Row>

      {/* 健康趋势图表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="心率趋势分析">
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '150px' }}>
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
          <Card title="血压分布">
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: '150px' }}>
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

      {/* 健康风险评估 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="健康风险评估" extra={<Button type="link">查看详情</Button>}>
            <List
              dataSource={healthRisks}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: getRiskColor(item.level) }}
                        icon={<WarningOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text>{item.category}</Text>
                        <Tag color={getRiskColor(item.level)}>
                          {item.level === 'low' ? '低风险' : 
                           item.level === 'medium' ? '中风险' : '高风险'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph style={{ marginBottom: 8 }}>{item.description}</Paragraph>
                        <Text type="secondary">建议：{item.recommendation}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="健康目标跟踪" extra={<Button type="link">设置目标</Button>}>
            {healthGoals.map((goal, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text>{goal.name}</Text>
                  <Space>
                    <Text>{goal.current}/{goal.target} {goal.unit}</Text>
                    <Tag color={getGoalStatusColor(goal.status)}>
                      {goal.status === 'on-track' ? '正常' : 
                       goal.status === 'behind' ? '落后' : '超前'}
                    </Tag>
                  </Space>
                </div>
                <Progress percent={goal.progress} size="small" />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 详细指标表格 */}
      <Card title="详细健康指标" style={{ marginBottom: '24px' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          size="small"
        />
      </Card>

      {/* 健康建议 */}
      <Card title="个性化健康建议">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Alert
              message="饮食建议"
              description="建议增加蔬菜水果摄入，减少盐分和糖分摄入"
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Alert
              message="运动建议"
              description="建议每周进行150分钟中等强度有氧运动"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Alert
              message="睡眠建议"
              description="建议保持规律作息，每晚7-8小时睡眠"
              type="warning"
              showIcon
              icon={<BellOutlined />}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default HealthAnalyticsPage; 