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
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

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
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetrics, setSelectedMetrics] = useState(['heart_rate', 'blood_pressure']);

  // 获取风险等级文本的翻译
  const getRiskLevelText = (level: string) => {
    if (language === 'zh') {
      switch (level) {
        case 'low': return '低风险';
        case 'medium': return '中风险';
        case 'high': return '高风险';
        default: return '低风险';
      }
    } else {
      switch (level) {
        case 'low': return 'Low Risk';
        case 'medium': return 'Medium Risk';
        case 'high': return 'High Risk';
        default: return 'Low Risk';
      }
    }
  };

  // 获取目标状态文本的翻译
  const getGoalStatusText = (status: string) => {
    if (language === 'zh') {
      switch (status) {
        case 'on-track': return '正常';
        case 'behind': return '落后';
        case 'ahead': return '超前';
        default: return '正常';
      }
    } else {
      switch (status) {
        case 'on-track': return 'On Track';
        case 'behind': return 'Behind';
        case 'ahead': return 'Ahead';
        default: return 'On Track';
      }
    }
  };

  // 获取趋势文本的翻译
  const getTrendText = (trend: string) => {
    if (language === 'zh') {
      switch (trend) {
        case 'improving': return '改善';
        case 'stable': return '稳定';
        case 'worsening': return '恶化';
        default: return '稳定';
      }
    } else {
      switch (trend) {
        case 'improving': return 'Improving';
        case 'stable': return 'Stable';
        case 'worsening': return 'Worsening';
        default: return 'Stable';
      }
    }
  };

  // 获取状态文本的翻译
  const getStatusText = (status: string) => {
    if (language === 'zh') {
      switch (status) {
        case 'normal': return '正常';
        case 'warning': return '注意';
        case 'abnormal': return '异常';
        default: return '正常';
      }
    } else {
      switch (status) {
        case 'normal': return 'Normal';
        case 'warning': return 'Warning';
        case 'abnormal': return 'Abnormal';
        default: return 'Normal';
      }
    }
  };

  const healthRisks: HealthRisk[] = [
    {
      level: 'low',
      category: language === 'zh' ? '心血管健康' : 'Cardiovascular Health',
      description: language === 'zh' ? '血压略有波动，建议继续监测' : 'Blood pressure fluctuates slightly, continue monitoring recommended',
      recommendation: language === 'zh' ? '保持规律运动，控制盐分摄入' : 'Maintain regular exercise, control salt intake'
    },
    {
      level: 'medium',
      category: language === 'zh' ? '睡眠质量' : 'Sleep Quality',
      description: language === 'zh' ? '睡眠时长不足，质量有待改善' : 'Insufficient sleep duration, quality needs improvement',
      recommendation: language === 'zh' ? '建立规律作息，避免睡前使用电子设备' : 'Establish regular sleep schedule, avoid electronic devices before bed'
    },
    {
      level: 'high',
      category: language === 'zh' ? '血糖控制' : 'Blood Sugar Control',
      description: language === 'zh' ? '血糖水平偏高，需要重点关注' : 'Blood sugar levels are high, requires attention',
      recommendation: language === 'zh' ? '控制饮食，增加运动，定期监测血糖' : 'Control diet, increase exercise, monitor blood sugar regularly'
    }
  ];

  const healthGoals: HealthGoal[] = [
    {
      name: language === 'zh' ? '每日步数' : 'Daily Steps',
      target: 10000,
      current: 8234,
      unit: language === 'zh' ? '步' : 'steps',
      progress: 82,
      status: 'on-track'
    },
    {
      name: language === 'zh' ? '睡眠时长' : 'Sleep Duration',
      target: 8,
      current: 7.5,
      unit: language === 'zh' ? '小时' : 'hours',
      progress: 94,
      status: 'behind'
    },
    {
      name: language === 'zh' ? '体重管理' : 'Weight Management',
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
      title: language === 'zh' ? '指标' : 'Metric',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: language === 'zh' ? '当前值' : 'Current Value',
      dataIndex: 'current',
      key: 'current',
    },
    {
      title: language === 'zh' ? '正常范围' : 'Normal Range',
      dataIndex: 'normalRange',
      key: 'normalRange',
    },
    {
      title: language === 'zh' ? '趋势' : 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag color={trend === 'improving' ? 'green' : trend === 'stable' ? 'blue' : 'red'}>
          {getTrendText(trend)}
        </Tag>
      ),
    },
    {
      title: language === 'zh' ? '状态' : 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'normal' ? 'green' : status === 'warning' ? 'orange' : 'red'}>
          {getStatusText(status)}
        </Tag>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      metric: language === 'zh' ? '心率' : 'Heart Rate',
      current: '72 bpm',
      normalRange: '60-100 bpm',
      trend: 'stable',
      status: 'normal',
    },
    {
      key: '2',
      metric: language === 'zh' ? '血压' : 'Blood Pressure',
      current: '120/80 mmHg',
      normalRange: '<140/90 mmHg',
      trend: 'improving',
      status: 'normal',
    },
    {
      key: '3',
      metric: language === 'zh' ? '血糖' : 'Blood Sugar',
      current: '95 mg/dL',
      normalRange: '70-100 mg/dL',
      trend: 'stable',
      status: 'normal',
    },
    {
      key: '4',
      metric: language === 'zh' ? '体温' : 'Temperature',
      current: '36.8°C',
      normalRange: '36.1-37.2°C',
      trend: 'stable',
      status: 'normal',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{language === 'zh' ? '健康数据分析' : 'Health Data Analysis'}</Title>
      
      {/* 筛选器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Text strong>{language === 'zh' ? '时间范围：' : 'Time Range:'}</Text>
            <Select 
              value={timeRange} 
              onChange={setTimeRange}
              style={{ width: 120, marginLeft: 8 }}
            >
              <Option value="7d">{language === 'zh' ? '最近7天' : 'Last 7 Days'}</Option>
              <Option value="30d">{language === 'zh' ? '最近30天' : 'Last 30 Days'}</Option>
              <Option value="90d">{language === 'zh' ? '最近90天' : 'Last 90 Days'}</Option>
              <Option value="1y">{language === 'zh' ? '最近1年' : 'Last 1 Year'}</Option>
            </Select>
          </Col>
          <Col>
            <Text strong>{language === 'zh' ? '指标选择：' : 'Metrics:'}</Text>
            <Select
              mode="multiple"
              value={selectedMetrics}
              onChange={setSelectedMetrics}
              style={{ width: 300, marginLeft: 8 }}
            >
              <Option value="heart_rate">{language === 'zh' ? '心率' : 'Heart Rate'}</Option>
              <Option value="blood_pressure">{language === 'zh' ? '血压' : 'Blood Pressure'}</Option>
              <Option value="blood_sugar">{language === 'zh' ? '血糖' : 'Blood Sugar'}</Option>
              <Option value="temperature">{language === 'zh' ? '体温' : 'Temperature'}</Option>
              <Option value="weight">{language === 'zh' ? '体重' : 'Weight'}</Option>
              <Option value="sleep">{language === 'zh' ? '睡眠' : 'Sleep'}</Option>
            </Select>
          </Col>
          <Col>
            <Button type="primary">{language === 'zh' ? '更新分析' : 'Update Analysis'}</Button>
          </Col>
        </Row>
      </Card>

      {/* 健康概览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '健康评分' : 'Health Score'}
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
              title={language === 'zh' ? '异常指标' : 'Abnormal Metrics'}
              value={1}
              suffix={language === 'zh' ? '项' : 'items'}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '改善趋势' : 'Improving Trends'}
              value={3}
              suffix={language === 'zh' ? '项' : 'items'}
              prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '目标完成度' : 'Goal Completion'}
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
          <Card title={language === 'zh' ? '心率趋势分析' : 'Heart Rate Trend Analysis'}>
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
                <Text type="secondary">{language === 'zh' ? '平均心率: 72 bpm' : 'Average Heart Rate: 72 bpm'}</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={language === 'zh' ? '血压分布' : 'Blood Pressure Distribution'}>
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
                <Text type="secondary">{language === 'zh' ? '平均血压: 120/80 mmHg' : 'Average BP: 120/80 mmHg'}</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 健康风险评估 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title={language === 'zh' ? '健康风险评估' : 'Health Risk Assessment'} extra={<Button type="link">{language === 'zh' ? '查看详情' : 'View Details'}</Button>}>
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
                          {getRiskLevelText(item.level)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph style={{ marginBottom: 8 }}>{item.description}</Paragraph>
                        <Text type="secondary">{language === 'zh' ? '建议：' : 'Recommendation: '}{item.recommendation}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={language === 'zh' ? '健康目标跟踪' : 'Health Goal Tracking'} extra={<Button type="link">{language === 'zh' ? '设置目标' : 'Set Goals'}</Button>}>
            {healthGoals.map((goal, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text>{goal.name}</Text>
                  <Space>
                    <Text>{goal.current}/{goal.target} {goal.unit}</Text>
                    <Tag color={getGoalStatusColor(goal.status)}>
                      {getGoalStatusText(goal.status)}
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
      <Card title={language === 'zh' ? '详细健康指标' : 'Detailed Health Metrics'} style={{ marginBottom: '24px' }}>
        <Table 
          columns={columns} 
          dataSource={data} 
          pagination={false}
          size="small"
        />
      </Card>

      {/* 健康建议 */}
      <Card title={language === 'zh' ? '个性化健康建议' : 'Personalized Health Recommendations'}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Alert
              message={language === 'zh' ? '饮食建议' : 'Diet Recommendations'}
              description={language === 'zh' ? '建议增加蔬菜水果摄入，减少盐分和糖分摄入' : 'Recommend increasing vegetable and fruit intake, reducing salt and sugar intake'}
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Alert
              message={language === 'zh' ? '运动建议' : 'Exercise Recommendations'}
              description={language === 'zh' ? '建议每周进行150分钟中等强度有氧运动' : 'Recommend 150 minutes of moderate aerobic exercise per week'}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Alert
              message={language === 'zh' ? '睡眠建议' : 'Sleep Recommendations'}
              description={language === 'zh' ? '建议保持规律作息，每晚7-8小时睡眠' : 'Recommend maintaining regular sleep schedule, 7-8 hours per night'}
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