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
  Avatar,
  Grid
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
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
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
        case 'up': return '上升';
        case 'down': return '下降';
        case 'stable': return '稳定';
        default: return '稳定';
      }
    } else {
      switch (trend) {
        case 'up': return 'Up';
        case 'down': return 'Down';
        case 'stable': return 'Stable';
        default: return 'Stable';
      }
    }
  };

  const healthRisks: HealthRisk[] = [
    {
      level: 'medium',
      category: language === 'zh' ? '心血管健康' : 'Cardiovascular Health',
      description: language === 'zh' ? '血压略高，建议定期监测' : 'Blood pressure slightly elevated, recommend regular monitoring',
      recommendation: language === 'zh' ? '减少盐分摄入，增加运动' : 'Reduce salt intake, increase exercise'
    },
    {
      level: 'low',
      category: language === 'zh' ? '血糖控制' : 'Blood Sugar Control',
      description: language === 'zh' ? '血糖水平正常' : 'Blood sugar levels are normal',
      recommendation: language === 'zh' ? '继续保持健康饮食习惯' : 'Continue maintaining healthy eating habits'
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
      status: 'ahead'
    },
    {
      name: language === 'zh' ? '水分摄入' : 'Water Intake',
      target: 2.5,
      current: 1.8,
      unit: 'L',
      progress: 72,
      status: 'behind'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return '#52c41a';
      case 'behind': return '#faad14';
      case 'ahead': return '#1890ff';
      default: return '#52c41a';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#52c41a';
    }
  };

  return (
    <div style={{ padding: screens.xs ? '8px' : '24px' }}>
      <Title level={screens.xs ? 3 : 2} style={{ marginBottom: '24px', textAlign: screens.xs ? 'center' : 'left' }}>
        {t('healthAnalytics.title')}
      </Title>

      {/* 控制面板 */}
      <Card 
        title={language === 'zh' ? '分析控制' : 'Analysis Controls'} 
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: screens.xs ? '16px' : '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: screens.xs ? '8px' : '12px' }}>
              <Text strong>{language === 'zh' ? '时间范围' : 'Time Range'}</Text>
            </div>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: '100%' }}
              size={screens.xs ? 'middle' : 'default'}
            >
              <Option value="7d">{language === 'zh' ? '最近7天' : 'Last 7 Days'}</Option>
              <Option value="30d">{language === 'zh' ? '最近30天' : 'Last 30 Days'}</Option>
              <Option value="90d">{language === 'zh' ? '最近90天' : 'Last 90 Days'}</Option>
              <Option value="1y">{language === 'zh' ? '最近1年' : 'Last 1 Year'}</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: screens.xs ? '8px' : '12px' }}>
              <Text strong>{language === 'zh' ? '指标选择' : 'Metrics Selection'}</Text>
            </div>
            <Select
              mode="multiple"
              value={selectedMetrics}
              onChange={setSelectedMetrics}
              style={{ width: '100%' }}
              size={screens.xs ? 'middle' : 'default'}
              placeholder={language === 'zh' ? '选择要分析的指标' : 'Select metrics to analyze'}
            >
              <Option value="heart_rate">{language === 'zh' ? '心率' : 'Heart Rate'}</Option>
              <Option value="blood_pressure">{language === 'zh' ? '血压' : 'Blood Pressure'}</Option>
              <Option value="blood_sugar">{language === 'zh' ? '血糖' : 'Blood Sugar'}</Option>
              <Option value="temperature">{language === 'zh' ? '体温' : 'Temperature'}</Option>
              <Option value="steps">{language === 'zh' ? '步数' : 'Steps'}</Option>
              <Option value="sleep">{language === 'zh' ? '睡眠' : 'Sleep'}</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <div style={{ marginBottom: screens.xs ? '8px' : '12px' }}>
              <Text strong>{language === 'zh' ? '自定义日期' : 'Custom Date Range'}</Text>
            </div>
            <RangePicker 
              style={{ width: '100%' }} 
              size={screens.xs ? 'middle' : 'default'}
            />
          </Col>
        </Row>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button 
              type="primary" 
              icon={<RiseOutlined />}
              size={screens.xs ? 'middle' : 'default'}
              block={screens.xs}
            >
              {language === 'zh' ? '生成报告' : 'Generate Report'}
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button 
              icon={<MedicineBoxOutlined />}
              size={screens.xs ? 'middle' : 'default'}
              block={screens.xs}
            >
              {language === 'zh' ? '导出数据' : 'Export Data'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 健康概览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card size={screens.xs ? 'small' : 'default'}>
            <Statistic
              title={language === 'zh' ? '平均心率' : 'Avg Heart Rate'}
              value={72}
              suffix="bpm"
              prefix={<HeartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ fontSize: screens.xs ? '20px' : '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size={screens.xs ? 'small' : 'default'}>
            <Statistic
              title={language === 'zh' ? '平均血压' : 'Avg Blood Pressure'}
              value={120}
              suffix="mmHg"
              prefix={<MedicineBoxOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: screens.xs ? '20px' : '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size={screens.xs ? 'small' : 'default'}>
            <Statistic
              title={language === 'zh' ? '平均血糖' : 'Avg Blood Sugar'}
              value={95}
              suffix="mg/dL"
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ fontSize: screens.xs ? '20px' : '24px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size={screens.xs ? 'small' : 'default'}>
            <Statistic
              title={language === 'zh' ? '平均体温' : 'Avg Temperature'}
              value={36.8}
              suffix="°C"
              prefix={<BellOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ fontSize: screens.xs ? '20px' : '24px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 健康目标进度 */}
      <Card 
        title={language === 'zh' ? '健康目标进度' : 'Health Goals Progress'} 
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '24px' }}
      >
        {screens.xs ? (
          // 移动端列表视图
          <List
            dataSource={healthGoals}
            renderItem={(goal) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<CheckCircleOutlined />} 
                      style={{ backgroundColor: getStatusColor(goal.status) }}
                      size={screens.xs ? 'small' : 'default'}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: screens.xs ? '14px' : '16px', fontWeight: 'bold' }}>
                        {goal.name}
                      </span>
                      <Tag color={getStatusColor(goal.status)} size="small">
                        {getGoalStatusText(goal.status)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: '8px' }}>
                        <Text style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                          {goal.current} / {goal.target} {goal.unit}
                        </Text>
                      </div>
                      <Progress 
                        percent={goal.progress} 
                        size={screens.xs ? 'small' : 'default'}
                        strokeColor={getStatusColor(goal.status)}
                        showInfo={false}
                      />
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          // 桌面端网格视图
          <Row gutter={[16, 16]}>
            {healthGoals.map((goal, index) => (
              <Col span={8} key={index}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong>{goal.name}</Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {goal.current} / {goal.target}
                      </Text>
                      <Text type="secondary"> {goal.unit}</Text>
                    </div>
                    <Progress 
                      percent={goal.progress} 
                      strokeColor={getStatusColor(goal.status)}
                      showInfo={false}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <Tag color={getStatusColor(goal.status)}>
                        {getGoalStatusText(goal.status)}
                      </Tag>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 健康风险评估 */}
      <Card 
        title={language === 'zh' ? '健康风险评估' : 'Health Risk Assessment'} 
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '24px' }}
      >
        {screens.xs ? (
          // 移动端列表视图
          <List
            dataSource={healthRisks}
            renderItem={(risk, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<WarningOutlined />} 
                      style={{ backgroundColor: getRiskColor(risk.level) }}
                      size={screens.xs ? 'small' : 'default'}
                    />
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: screens.xs ? '14px' : '16px', fontWeight: 'bold' }}>
                        {risk.category}
                      </span>
                      <Tag color={getRiskColor(risk.level)} size="small">
                        {getRiskLevelText(risk.level)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: '8px', fontSize: screens.xs ? '12px' : '14px' }}>
                        {risk.description}
                      </div>
                      <div style={{ fontSize: screens.xs ? '11px' : '13px', color: '#666' }}>
                        <Text strong>{language === 'zh' ? '建议：' : 'Recommendation: '}</Text>
                        {risk.recommendation}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          // 桌面端网格视图
          <Row gutter={[16, 16]}>
            {healthRisks.map((risk, index) => (
              <Col span={12} key={index}>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Avatar 
                      icon={<WarningOutlined />} 
                      style={{ backgroundColor: getRiskColor(risk.level) }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <Text strong>{risk.category}</Text>
                        <Tag color={getRiskColor(risk.level)}>
                          {getRiskLevelText(risk.level)}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                        {risk.description}
                      </Text>
                      <div>
                        <Text strong>{language === 'zh' ? '建议：' : 'Recommendation: '}</Text>
                        <Text type="secondary">{risk.recommendation}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 趋势分析 */}
      <Card 
        title={language === 'zh' ? '趋势分析' : 'Trend Analysis'} 
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message={language === 'zh' ? '趋势分析功能' : 'Trend Analysis Feature'}
          description={language === 'zh' 
            ? '基于您选择的时间范围和指标，系统将生成详细的趋势分析图表。点击"生成报告"按钮开始分析。'
            : 'Based on your selected time range and metrics, the system will generate detailed trend analysis charts. Click "Generate Report" to start analysis.'
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
        
        <div style={{ 
          textAlign: 'center', 
          padding: screens.xs ? '20px' : '40px',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          border: '2px dashed #d9d9d9'
        }}>
          <InfoCircleOutlined style={{ fontSize: screens.xs ? '32px' : '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Text type="secondary" style={{ fontSize: screens.xs ? '14px' : '16px' }}>
            {language === 'zh' 
              ? '选择指标和时间范围后，点击"生成报告"查看详细趋势分析'
              : 'Select metrics and time range, then click "Generate Report" to view detailed trend analysis'
            }
          </Text>
        </div>
      </Card>

      {/* 智能建议 */}
      <Card 
        title={language === 'zh' ? '智能健康建议' : 'Smart Health Recommendations'} 
        size={screens.xs ? 'small' : 'default'}
      >
        <Alert
          message={language === 'zh' ? '个性化建议' : 'Personalized Recommendations'}
          description={language === 'zh' 
            ? '基于您的健康数据分析，我们为您提供个性化的健康建议和改善方案。'
            : 'Based on your health data analysis, we provide personalized health recommendations and improvement plans.'
          }
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
        
        <div style={{ 
          textAlign: 'center', 
          padding: screens.xs ? '20px' : '40px',
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          border: '1px solid #b7eb8f'
        }}>
          <CheckCircleOutlined style={{ fontSize: screens.xs ? '32px' : '48px', color: '#52c41a', marginBottom: '16px' }} />
          <Text style={{ fontSize: screens.xs ? '14px' : '16px', color: '#52c41a' }}>
            {language === 'zh' 
              ? '生成报告后将显示详细的健康建议'
              : 'Detailed health recommendations will be displayed after generating the report'
            }
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default HealthAnalyticsPage; 