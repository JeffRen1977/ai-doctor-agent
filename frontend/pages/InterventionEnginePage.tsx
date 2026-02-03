import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tabs, 
  Button, 
  Typography,
  Space,
  Tag,
  List,
  Avatar,
  Progress,
  Alert,
  Statistic,
  Timeline,
  Divider,
  Input,
  Select,
  DatePicker,
  Table,
  Badge
} from 'antd';
import { 
  MedicineBoxOutlined, 
  AppleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BellOutlined,
  BarChartOutlined,
  HeartOutlined,
  FlagOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  adherence: number;
  effectiveness: 'good' | 'fair' | 'poor';
  nextDose: string;
  status: 'taken' | 'pending' | 'missed';
}

interface NutritionAdvice {
  id: string;
  meal: string;
  timestamp: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  recommendation: string;
  status: 'followed' | 'partial' | 'ignored';
}

interface HealthPlan {
  id: string;
  type: 'medication' | 'nutrition' | 'exercise' | 'lifestyle';
  title: string;
  description: string;
  target: string;
  progress: number;
  status: 'active' | 'completed' | 'paused';
  startDate: string;
  endDate: string;
}

const InterventionEnginePage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [activeTab, setActiveTab] = useState('medication');
  
  // Mock data - 在实际应用中这些数据会从后端API获取
  const [medications] = useState<Medication[]>([
    {
      id: '1',
      name: language === 'zh' ? '二甲双胍' : 'Metformin',
      dosage: '500mg',
      frequency: language === 'zh' ? '每日2次' : 'Twice daily',
      time: '08:00, 20:00',
      adherence: 95,
      effectiveness: 'good',
      nextDose: '2024-01-15 20:00',
      status: 'pending'
    },
    {
      id: '2',
      name: language === 'zh' ? '阿司匹林' : 'Aspirin',
      dosage: '100mg',
      frequency: language === 'zh' ? '每日1次' : 'Once daily',
      time: '08:00',
      adherence: 88,
      effectiveness: 'fair',
      nextDose: '2024-01-16 08:00',
      status: 'taken'
    }
  ]);

  const [nutritionAdvice] = useState<NutritionAdvice[]>([
    {
      id: '1',
      meal: language === 'zh' ? '早餐' : 'Breakfast',
      timestamp: '2024-01-15 08:30',
      carbs: 45,
      protein: 20,
      fat: 15,
      calories: 380,
      recommendation: language === 'zh' 
        ? '该餐碳水适中，建议餐后30分钟进行15分钟散步' 
        : 'Carbs are moderate, suggest 15-min walk 30 mins after meal',
      status: 'followed'
    },
    {
      id: '2',
      meal: language === 'zh' ? '午餐' : 'Lunch',
      timestamp: '2024-01-15 12:45',
      carbs: 65,
      protein: 30,
      fat: 25,
      calories: 580,
      recommendation: language === 'zh' 
        ? '该餐碳水偏高，建议餐后增加20分钟散步' 
        : 'Carbs are high, suggest 20-min walk after meal',
      status: 'partial'
    }
  ]);

  const [healthPlans] = useState<HealthPlan[]>([
    {
      id: '1',
      type: 'medication',
      title: language === 'zh' ? '血糖控制计划' : 'Blood Glucose Control Plan',
      description: language === 'zh' 
        ? '通过规律服药和监测，将HbA1c控制在7%以下' 
        : 'Control HbA1c below 7% through regular medication and monitoring',
      target: 'HbA1c < 7%',
      progress: 75,
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-04-01'
    },
    {
      id: '2',
      type: 'exercise',
      title: language === 'zh' ? '每日运动计划' : 'Daily Exercise Plan',
      description: language === 'zh' 
        ? '每天快走30分钟，每周至少5天' 
        : '30-min brisk walk daily, at least 5 days per week',
      target: '150 min/week',
      progress: 60,
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-03-31'
    }
  ]);

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'good': return 'success';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'taken': return 'success';
      case 'pending': return 'processing';
      case 'missed': return 'error';
      case 'followed': return 'success';
      case 'partial': return 'warning';
      case 'ignored': return 'error';
      default: return 'default';
    }
  };

  const medicationColumns = [
    {
      title: language === 'zh' ? '药物名称' : 'Medication',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: language === 'zh' ? '剂量' : 'Dosage',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: language === 'zh' ? '服药时间' : 'Schedule',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: language === 'zh' ? '依从性' : 'Adherence',
      dataIndex: 'adherence',
      key: 'adherence',
      render: (value: number) => (
        <Progress percent={value} size="small" status={value >= 90 ? 'success' : value >= 70 ? 'normal' : 'exception'} />
      ),
    },
    {
      title: language === 'zh' ? '效果评估' : 'Effectiveness',
      dataIndex: 'effectiveness',
      key: 'effectiveness',
      render: (value: string) => (
        <Tag color={getEffectivenessColor(value)}>
          {value === 'good' ? (language === 'zh' ? '良好' : 'Good') :
           value === 'fair' ? (language === 'zh' ? '一般' : 'Fair') :
           (language === 'zh' ? '较差' : 'Poor')}
        </Tag>
      ),
    },
    {
      title: language === 'zh' ? '下次服药' : 'Next Dose',
      dataIndex: 'nextDose',
      key: 'nextDose',
    },
    {
      title: language === 'zh' ? '操作' : 'Action',
      key: 'action',
      render: (_: any, record: Medication) => (
        <Space>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
            {language === 'zh' ? '已服药' : 'Taken'}
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            {language === 'zh' ? '报告' : 'Report'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <ThunderboltOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        {language === 'zh' ? '精准干预引擎' : 'Precision Intervention Engine'}
      </Title>
      
      <Paragraph style={{ marginBottom: '24px', fontSize: '16px', color: '#666' }}>
        {language === 'zh' 
          ? 'AI驱动的个性化健康管理引擎，根据实时数据动态调整用药、营养和运动建议，实现精准干预。'
          : 'AI-driven personalized health management engine that dynamically adjusts medication, nutrition, and exercise recommendations based on real-time data for precision intervention.'}
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '活跃计划' : 'Active Plans'}
              value={healthPlans.filter(p => p.status === 'active').length}
              prefix={<FlagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '平均依从性' : 'Avg Adherence'}
              value={Math.round(medications.reduce((sum, m) => sum + m.adherence, 0) / medications.length)}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '今日建议' : 'Today\'s Advice'}
              value={nutritionAdvice.length}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '完成率' : 'Completion Rate'}
              value={75}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 智能用药管理 */}
          <TabPane 
            tab={
              <span>
                <MedicineBoxOutlined />
                {language === 'zh' ? '智能用药管理' : 'Smart Medication Management'}
              </span>
            } 
            key="medication"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '用药管理说明' : 'Medication Management'}
                description={
                  language === 'zh' 
                    ? '监测服药依从性，并在服药后通过传感器数据闭环评估药效。如果发现某种药物在特定时间段效果不佳，AI可生成简报建议医生调整方案。'
                    : 'Monitor medication adherence and evaluate effectiveness through sensor data. If a medication shows poor effectiveness at specific times, AI can generate reports suggesting dosage adjustments to your doctor.'}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Table
                dataSource={medications}
                columns={medicationColumns}
                rowKey="id"
                pagination={false}
              />

              <Divider>{language === 'zh' ? '用药时间线' : 'Medication Timeline'}</Divider>
              
              <Timeline>
                {medications.map((med) => (
                  <Timeline.Item
                    key={med.id}
                    color={med.status === 'taken' ? 'green' : med.status === 'missed' ? 'red' : 'blue'}
                  >
                    <Space direction="vertical" size="small">
                      <Text strong>{med.name} - {med.dosage}</Text>
                      <Text type="secondary">
                        {med.status === 'taken' ? (language === 'zh' ? '已服药' : 'Taken') :
                         med.status === 'pending' ? (language === 'zh' ? '待服药' : 'Pending') :
                         (language === 'zh' ? '已错过' : 'Missed')}
                      </Text>
                      <Text type="secondary">{med.nextDose}</Text>
                    </Space>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Space>
          </TabPane>

          {/* 动态营养分析 */}
          <TabPane 
            tab={
              <span>
                <AppleOutlined />
                {language === 'zh' ? '动态营养分析' : 'Dynamic Nutrition Analysis'}
              </span>
            } 
            key="nutrition"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '营养分析说明' : 'Nutrition Analysis'}
                description={
                  language === 'zh' 
                    ? '通过拍摄食物照片，AI识别热量与成分，并结合当前的血糖/血压状态给出即时反馈和建议。'
                    : 'Take photos of your meals, and AI will identify calories and nutrients, providing instant feedback and recommendations based on your current blood glucose/blood pressure status.'}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <List
                itemLayout="vertical"
                dataSource={nutritionAdvice}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          icon={<AppleOutlined />} 
                          style={{ backgroundColor: getStatusColor(item.status) === 'success' ? '#52c41a' : 
                                   getStatusColor(item.status) === 'warning' ? '#faad14' : '#ff4d4f' }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{item.meal}</Text>
                          <Tag color={getStatusColor(item.status)}>
                            {item.status === 'followed' ? (language === 'zh' ? '已遵循' : 'Followed') :
                             item.status === 'partial' ? (language === 'zh' ? '部分遵循' : 'Partial') :
                             (language === 'zh' ? '未遵循' : 'Ignored')}
                          </Tag>
                          <Text type="secondary">{item.timestamp}</Text>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                          <Row gutter={16}>
                            <Col span={6}>
                              <Text type="secondary">{language === 'zh' ? '碳水' : 'Carbs'}: </Text>
                              <Text strong>{item.carbs}g</Text>
                            </Col>
                            <Col span={6}>
                              <Text type="secondary">{language === 'zh' ? '蛋白质' : 'Protein'}: </Text>
                              <Text strong>{item.protein}g</Text>
                            </Col>
                            <Col span={6}>
                              <Text type="secondary">{language === 'zh' ? '脂肪' : 'Fat'}: </Text>
                              <Text strong>{item.fat}g</Text>
                            </Col>
                            <Col span={6}>
                              <Text type="secondary">{language === 'zh' ? '卡路里' : 'Calories'}: </Text>
                              <Text strong>{item.calories}kcal</Text>
                            </Col>
                          </Row>
                          <Alert
                            message={item.recommendation}
                            type={item.status === 'followed' ? 'success' : item.status === 'partial' ? 'warning' : 'info'}
                            showIcon
                            style={{ marginTop: '8px' }}
                          />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />

              <Button type="primary" size="large" icon={<AppleOutlined />} block>
                {language === 'zh' ? '拍摄食物照片进行分析' : 'Take Photo for Analysis'}
              </Button>
            </Space>
          </TabPane>

          {/* 个性化健康计划 */}
          <TabPane 
            tab={
              <span>
                <FlagOutlined />
                {language === 'zh' ? '个性化健康计划' : 'Personalized Health Plans'}
              </span>
            } 
            key="plans"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '健康计划说明' : 'Health Plans'}
                description={
                  language === 'zh' 
                    ? '基于强化学习模型，根据用户反馈和效果动态调整健康计划，支持多目标优化（血糖控制、体重管理、心血管健康）。'
                    : 'Based on reinforcement learning models, dynamically adjust health plans based on user feedback and effectiveness, supporting multi-objective optimization (blood glucose control, weight management, cardiovascular health).'}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Row gutter={[16, 16]}>
                {healthPlans.map((plan) => (
                  <Col xs={24} sm={12} key={plan.id}>
                    <Card
                      title={
                        <Space>
                          <Badge status={plan.status === 'active' ? 'processing' : plan.status === 'completed' ? 'success' : 'default'} />
                          <Text strong>{plan.title}</Text>
                        </Space>
                      }
                      extra={
                        <Tag color={plan.status === 'active' ? 'blue' : plan.status === 'completed' ? 'green' : 'default'}>
                          {plan.status === 'active' ? (language === 'zh' ? '进行中' : 'Active') :
                           plan.status === 'completed' ? (language === 'zh' ? '已完成' : 'Completed') :
                           (language === 'zh' ? '已暂停' : 'Paused')}
                        </Tag>
                      }
                    >
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Paragraph>{plan.description}</Paragraph>
                        <div>
                          <Text type="secondary">{language === 'zh' ? '目标' : 'Target'}: </Text>
                          <Text strong>{plan.target}</Text>
                        </div>
                        <Progress 
                          percent={plan.progress} 
                          status={plan.progress >= 80 ? 'success' : plan.progress >= 50 ? 'active' : 'exception'}
                        />
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {language === 'zh' ? '开始日期' : 'Start'}: {plan.startDate} | 
                            {language === 'zh' ? ' 结束日期' : ' End'}: {plan.endDate}
                          </Text>
                        </div>
                        <Button type="primary" block>
                          {language === 'zh' ? '查看详情' : 'View Details'}
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>

              <Button type="dashed" size="large" icon={<PlusOutlined />} block>
                {language === 'zh' ? '创建新计划' : 'Create New Plan'}
              </Button>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default InterventionEnginePage;
