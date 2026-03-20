import React, { useState, useEffect } from 'react';
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
  Grid,
  Timeline,
  Empty,
  Spin,
  message
} from 'antd';
import { 
  HeartOutlined, 
  MedicineBoxOutlined, 
  CalendarOutlined, 
  PlusOutlined,
  MessageOutlined,
  FileTextOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AppleOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';
import { useNavigate } from 'react-router-dom';
import { interventionEngineAPI, collaborationAPI, riskMonitoringAPI, digitalTwinAPI } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import './DashboardPage.css';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface HealthMetric {
  name: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'warning' | 'danger';
  trend: 'up' | 'down' | 'stable';
  timestamp?: string;
}

interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  time: string;
  completed: boolean;
}

interface RecentActivity {
  id: string;
  type: 'medication' | 'measurement' | 'appointment' | 'report';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
}

const DashboardPage: React.FC = () => {
  const { language } = useLanguageStore();
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const t = (key: string) => getTranslation(language, key);

  const [loading, setLoading] = useState(true);
  const [medicationData, setMedicationData] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<number>(75);
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [healthSummary, setHealthSummary] = useState<string>('');
  const [healthSummaryLoading, setHealthSummaryLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 加载用药数据
      const medResponse = await interventionEngineAPI.getMedication();
      if (medResponse.success) {
        setMedicationData(medResponse);
        // 生成今日用药提醒
        const today = new Date().toISOString().split('T')[0];
        const reminders: MedicationReminder[] = (medResponse.medications || [])
          .filter((med: any) => med.status === 'pending')
          .map((med: any) => ({
            id: med.id,
            name: med.name,
            dosage: med.dosage,
            time: med.nextDose || '08:00',
            completed: false
          }));
        setMedicationReminders(reminders);
      }

      // 加载健康指标（从风险监测获取）
      let metrics: HealthMetric[] = [];
      const statusResponse = await riskMonitoringAPI.getStatus();
      if (statusResponse.success && statusResponse.lastDataPoint) {
        const data = statusResponse.lastDataPoint;
        
        if (data.heartRate) {
          metrics.push({
            name: language === 'zh' ? '心率' : 'Heart Rate',
            value: data.heartRate,
            unit: 'bpm',
            status: data.heartRate > 100 || data.heartRate < 60 ? 'warning' : 'normal',
            trend: 'stable',
            timestamp: data.timestamp
          });
        }
        if (data.bloodPressure) {
          const bp = data.bloodPressure;
          const systolic = typeof bp === 'object' ? bp.systolic : parseInt(bp.split('/')[0]);
          metrics.push({
            name: language === 'zh' ? '血压' : 'Blood Pressure',
            value: typeof bp === 'object' ? `${bp.systolic}/${bp.diastolic}` : bp,
            unit: 'mmHg',
            status: systolic > 140 ? 'warning' : 'normal',
            trend: 'stable',
            timestamp: data.timestamp
          });
        }
        if (data.glucose) {
          metrics.push({
            name: language === 'zh' ? '血糖' : 'Blood Glucose',
            value: data.glucose,
            unit: 'mg/dL',
            status: data.glucose > 140 || data.glucose < 70 ? 'warning' : 'normal',
            trend: 'stable',
            timestamp: data.timestamp
          });
        }
        setHealthMetrics(metrics);
      }

      // 加载最近警报
      const alertsResponse = await riskMonitoringAPI.getAlerts(5);
      if (alertsResponse.success) {
        setRiskAlerts(alertsResponse.alerts || []);
        // 根据警报设置风险等级
        const highRiskAlerts = (alertsResponse.alerts || []).filter((a: any) => a.severity === 'high');
        if (highRiskAlerts.length > 0) {
          setRiskLevel('high');
        } else if ((alertsResponse.alerts || []).length > 0) {
          setRiskLevel('medium');
        } else {
          setRiskLevel('low');
        }
      }

      // 加载即将到来的预约
      const appointmentsResponse = await collaborationAPI.getUpcomingAppointments(7);
      let appointments: any[] = [];
      if (appointmentsResponse.success) {
        appointments = appointmentsResponse.appointments || [];
        setUpcomingAppointments(appointments);
      }

      // 生成最近活动（需要预约数据，所以在这里调用）
      generateRecentActivities(medResponse, appointments);

      // 加载健康总结（AI 生成，用于总览展示）
      loadHealthSummary();

      // 计算健康评分（基于用药依从性和指标状态）
      if (medResponse.adherence) {
        const adherence = medResponse.adherence.overall || 0;
        const metricsScore = metrics.length > 0 
          ? metrics.filter(m => m.status === 'normal').length / metrics.length * 100
          : 80;
        setHealthScore(Math.round((adherence * 0.6 + metricsScore * 0.4)));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      message.error(language === 'zh' ? '加载数据失败' : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadHealthSummary = async () => {
    setHealthSummaryLoading(true);
    try {
      const res = await digitalTwinAPI.getHealthSummary();
      if (res.success && res.data) setHealthSummary(res.data.summary ?? '');
    } catch (e) {
      console.error('Failed to load health summary', e);
    } finally {
      setHealthSummaryLoading(false);
    }
  };

  const handleRefreshHealthSummary = async () => {
    setHealthSummaryLoading(true);
    try {
      const res = await digitalTwinAPI.refreshHealthSummary();
      if (res.success && res.data) {
        setHealthSummary(res.data.summary ?? '');
        message.success(language === 'zh' ? '健康总结已更新' : 'Health summary updated');
      } else {
        message.error(res?.error || (language === 'zh' ? '生成失败' : 'Failed to generate'));
      }
    } catch (e) {
      console.error('Failed to refresh health summary', e);
      message.error(language === 'zh' ? '生成失败' : 'Failed to generate');
    } finally {
      setHealthSummaryLoading(false);
    }
  };

  const generateRecentActivities = (medData: any, appointments: any[] = []) => {
    const activities: RecentActivity[] = [];
    
    // 从用药历史生成活动
    if (medData.medications) {
      medData.medications.forEach((med: any) => {
        if (med.history && med.history.length > 0) {
          const lastRecord = med.history[med.history.length - 1];
          activities.push({
            id: `med-${med.id}-${lastRecord.date}`,
            type: 'medication',
            title: language === 'zh' ? `服用 ${med.name}` : `Took ${med.name}`,
            description: `${med.dosage} - ${lastRecord.status === 'taken' ? (language === 'zh' ? '已服用' : 'Taken') : (language === 'zh' ? '未服用' : 'Missed')}`,
            timestamp: lastRecord.date,
            icon: <MedicineBoxOutlined />
          });
        }
      });
    }

    // 从预约生成活动
    appointments.slice(0, 3).forEach((apt: any) => {
      activities.push({
        id: `apt-${apt.appointmentId}`,
        type: 'appointment',
        title: language === 'zh' ? '预约复诊' : 'Appointment Scheduled',
        description: `${apt.provider?.name || ''} - ${dayjs(apt.scheduledDateTime).format('MM-DD HH:mm')}`,
        timestamp: apt.scheduledDateTime,
        icon: <CalendarOutlined />
      });
    });

    // 按时间排序
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivities(activities.slice(0, 5));
  };

  const handleMedicationComplete = async (reminderId: string) => {
    const reminder = medicationReminders.find(r => r.id === reminderId);
    if (!reminder) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0].substring(0, 5);
      
      await interventionEngineAPI.recordMedicationHistory(
        reminderId,
        today,
        now,
        'taken'
      );
      
      setMedicationReminders(prev => 
        prev.map(r => r.id === reminderId ? { ...r, completed: true } : r)
      );
      message.success(language === 'zh' ? '用药记录已保存' : 'Medication recorded');
      loadDashboardData(); // 重新加载数据
    } catch (error) {
      message.error(language === 'zh' ? '记录失败' : 'Failed to record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#52c41a';
      case 'warning': return '#faad14';
      case 'danger': return '#ff4d4f';
      default: return '#52c41a';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#faad14';
    }
  };

  const getRiskLevelText = (level: string) => {
    if (language === 'zh') {
      switch (level) {
        case 'low': return '低风险';
        case 'medium': return '中风险';
        case 'high': return '高风险';
        default: return '中风险';
      }
    } else {
      switch (level) {
        case 'low': return 'Low Risk';
        case 'medium': return 'Medium Risk';
        case 'high': return 'High Risk';
        default: return 'Medium Risk';
      }
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />;
      case 'down': return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
      case 'stable': return <MinusOutlined style={{ color: '#1890ff' }} />;
      default: return <MinusOutlined />;
    }
  };

  const medicationAdherence = medicationData?.adherence?.overall || 0;

  return (
    <div className="app-page-shell">
      <Spin spinning={loading}>
        <div style={{ marginBottom: 24, textAlign: screens.xs ? 'center' : 'left' }}>
          <Title level={screens.xs ? 3 : 2} style={{ marginBottom: 4 }}>
            {t('dashboard.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            {language === 'zh' ? '个人健康总览与智能建议' : 'Personal health overview and AI-assisted insights'}
          </Text>
        </div>

        {/* 健康总结（AI 生成） */}
        <Card
          title={language === 'zh' ? '健康总结' : 'Health Summary'}
          loading={healthSummaryLoading}
          className="app-surface-card"
          style={{ marginBottom: '24px' }}
          extra={
            healthSummary ? (
              <Button type="link" size="small" icon={<SyncOutlined />} onClick={handleRefreshHealthSummary}>
                {language === 'zh' ? '刷新' : 'Refresh'}
              </Button>
            ) : null
          }
        >
          {healthSummary ? (
            <div className="health-summary-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {healthSummary}
              </ReactMarkdown>
            </div>
          ) : (
            !healthSummaryLoading && (
              <Empty
                description={language === 'zh' ? '暂无健康总结，点击下方按钮生成' : 'No health summary yet. Click below to generate.'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<SyncOutlined />} onClick={handleRefreshHealthSummary}>
                  {language === 'zh' ? '生成健康总结' : 'Generate Health Summary'}
                </Button>
              </Empty>
            )
          )}
        </Card>

        {/* 关键指标卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title={t('dashboard.keyMetrics.medicationAdherence')}
                value={medicationAdherence}
                suffix="%"
                valueStyle={{ color: medicationAdherence >= 90 ? '#52c41a' : medicationAdherence >= 70 ? '#faad14' : '#ff4d4f' }}
                prefix={<MedicineBoxOutlined />}
              />
              <Progress 
                percent={medicationAdherence} 
                strokeColor={medicationAdherence >= 90 ? '#52c41a' : medicationAdherence >= 70 ? '#faad14' : '#ff4d4f'}
                size="small"
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
          
          {healthMetrics.slice(0, 2).map((metric, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card>
                <Statistic
                  title={metric.name}
                  value={metric.value}
                  suffix={metric.unit}
                  valueStyle={{ color: getStatusColor(metric.status) }}
                  prefix={metric.name.includes('Heart') || metric.name.includes('心率') ? <HeartOutlined /> : <ThunderboltOutlined />}
                />
                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color={getStatusColor(metric.status)}>
                    {metric.status === 'normal' ? (language === 'zh' ? '正常' : 'Normal') :
                     metric.status === 'warning' ? (language === 'zh' ? '警告' : 'Warning') :
                     (language === 'zh' ? '危险' : 'Danger')}
                  </Tag>
                  {getTrendIcon(metric.trend)}
                </div>
              </Card>
            </Col>
          ))}

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title={t('dashboard.keyMetrics.healthScore')}
                value={healthScore}
                suffix="/100"
                valueStyle={{ color: healthScore >= 80 ? '#52c41a' : healthScore >= 60 ? '#faad14' : '#ff4d4f' }}
                prefix={<BarChartOutlined />}
              />
              <Progress 
                percent={healthScore} 
                strokeColor={healthScore >= 80 ? '#52c41a' : healthScore >= 60 ? '#faad14' : '#ff4d4f'}
                size="small"
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title={t('dashboard.keyMetrics.riskLevel')}
                value={getRiskLevelText(riskLevel)}
                valueStyle={{ color: getRiskLevelColor(riskLevel) }}
                prefix={<WarningOutlined />}
              />
              <Tag color={getRiskLevelColor(riskLevel)} style={{ marginTop: '8px', width: '100%', textAlign: 'center' }}>
                {riskLevel === 'low' ? (language === 'zh' ? '低风险' : 'Low Risk') :
                 riskLevel === 'medium' ? (language === 'zh' ? '中风险' : 'Medium Risk') :
                 (language === 'zh' ? '高风险' : 'High Risk')}
              </Tag>
            </Card>
          </Col>
        </Row>

        {/* 今日重点关注 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card 
              title={t('dashboard.todayFocus.medicationReminders')}
              extra={<Button type="link" size="small" onClick={() => navigate('/intervention')}>
                {language === 'zh' ? '管理' : 'Manage'}
              </Button>}
            >
              {medicationReminders.length > 0 ? (
                <List
                  size="small"
                  dataSource={medicationReminders.filter(r => !r.completed)}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button 
                          size="small" 
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => handleMedicationComplete(item.id)}
                        >
                          {language === 'zh' ? '完成' : 'Done'}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                        title={<Text strong>{item.name}</Text>}
                        description={
                          <Space>
                            <ClockCircleOutlined />
                            <Text>{item.time}</Text>
                            <Text type="secondary">{item.dosage}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  description={language === 'zh' ? '今日无用药提醒' : 'No medication reminders today'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={6}>
            <Card title={t('dashboard.todayFocus.measurementTasks')}>
              <List
                size="small"
                dataSource={healthMetrics.slice(0, 3)}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      {item.name.includes('Heart') || item.name.includes('心率') ? <HeartOutlined /> : 
                       item.name.includes('Blood') || item.name.includes('血压') ? <ThunderboltOutlined /> :
                       <BarChartOutlined />}
                      <Text>{item.name}</Text>
                      <Tag color={getStatusColor(item.status)} size="small">
                        {item.value} {item.unit}
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
              <Button 
                type="dashed" 
                block 
                icon={<PlusOutlined />}
                style={{ marginTop: '8px' }}
                onClick={() => navigate('/devices')}
              >
                {language === 'zh' ? '记录测量' : 'Record Measurement'}
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={6}>
            <Card title={t('dashboard.todayFocus.dietAdvice')}>
              <Alert
                message={language === 'zh' ? '今日饮食建议' : 'Today\'s Diet Advice'}
                description={language === 'zh' 
                  ? '建议控制糖分摄入，增加蔬菜和全谷物'
                  : 'Recommend controlling sugar intake, increase vegetables and whole grains'}
                type="info"
                showIcon
                style={{ marginBottom: '8px' }}
              />
              <Button 
                type="primary" 
                block 
                icon={<AppleOutlined />}
                onClick={() => navigate('/intervention?tab=nutrition')}
              >
                {language === 'zh' ? '上传食物照片' : 'Upload Food Photo'}
              </Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={12} lg={6}>
            <Card title={t('dashboard.todayFocus.exerciseAdvice')}>
              <Alert
                message={language === 'zh' ? '今日运动建议' : 'Today\'s Exercise Advice'}
                description={language === 'zh' 
                  ? '建议进行30分钟中等强度有氧运动'
                  : 'Recommend 30 minutes of moderate-intensity aerobic exercise'}
                type="success"
                showIcon
                style={{ marginBottom: '8px' }}
              />
              <Button 
                block 
                icon={<ThunderboltOutlined />}
                onClick={() => navigate('/intervention?tab=exercise')}
              >
                {language === 'zh' ? '查看运动计划' : 'View Exercise Plan'}
              </Button>
            </Card>
          </Col>
        </Row>

        {/* 健康趋势和智能提醒 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title={t('dashboard.healthTrends.title')}>
              <div style={{ padding: '20px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <Text key={day} type="secondary">
                      {language === 'zh' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day)] : day}
                    </Text>
                  ))}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'end', 
                  height: '100px' 
                }}>
                  {[60, 80, 50, 70, 55, 75, 60].map((height, index) => (
                    <div 
                      key={index}
                      style={{ 
                        width: '12%', 
                        height: `${height}%`, 
                        backgroundColor: '#1890ff', 
                        borderRadius: '2px' 
                      }}
                    />
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <Text type="secondary">
                    {t('dashboard.healthTrends.medicationAdherence')}: {medicationAdherence}%
                  </Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title={t('dashboard.smartAlerts.title')}>
              {riskAlerts.length > 0 ? (
                <List
                  size="small"
                  dataSource={riskAlerts.slice(0, 3)}
                  renderItem={(alert) => (
                    <List.Item>
                      <Alert
                        message={alert.type}
                        description={alert.message || alert.description}
                        type={alert.severity === 'high' ? 'error' : 'warning'}
                        showIcon
                        style={{ width: '100%' }}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Alert
                  message={language === 'zh' ? '暂无风险预警' : 'No Risk Alerts'}
                  description={language === 'zh' ? '您的健康状况良好' : 'Your health status is good'}
                  type="success"
                  showIcon
                />
              )}
              <Button 
                type="link" 
                block 
                style={{ marginTop: '8px' }}
                onClick={() => navigate('/devices')}
              >
                {language === 'zh' ? '查看详细预警' : 'View Detailed Alerts'}
              </Button>
            </Card>
          </Col>
        </Row>

        {/* 近期活动和快速操作 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title={t('dashboard.recentActivity.title')}>
              {recentActivities.length > 0 ? (
                <Timeline>
                  {recentActivities.map((activity) => (
                    <Timeline.Item 
                      key={activity.id}
                      dot={activity.icon}
                    >
                      <Text strong>{activity.title}</Text>
                      <br />
                      <Text type="secondary">{activity.description}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(activity.timestamp).format('MM-DD HH:mm')}
                      </Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty 
                  description={t('dashboard.recentActivity.noActivity')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title={t('dashboard.quickActions.title')}>
              <Row gutter={[8, 8]}>
                <Col xs={12} sm={12} md={12}>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<MessageOutlined />}
                    block
                    onClick={() => navigate('/rehabilitation')}
                  >
                    {t('dashboard.quickActions.chat')}
                  </Button>
                </Col>
                <Col xs={12} sm={12} md={12}>
                  <Button 
                    size="large" 
                    icon={<MedicineBoxOutlined />}
                    block
                    onClick={() => navigate('/intervention?tab=medication')}
                  >
                    {t('dashboard.quickActions.records')}
                  </Button>
                </Col>
                <Col xs={12} sm={12} md={12}>
                  <Button 
                    size="large" 
                    icon={<SyncOutlined />}
                    block
                    onClick={() => navigate('/devices')}
                  >
                    {t('dashboard.quickActions.analysis')}
                  </Button>
                </Col>
                <Col xs={12} sm={12} md={12}>
                  <Button 
                    size="large" 
                    icon={<AppleOutlined />}
                    block
                    onClick={() => navigate('/intervention?tab=nutrition')}
                  >
                    {t('dashboard.quickActions.appointment')}
                  </Button>
                </Col>
                <Col xs={24}>
                  <Button 
                    size="large" 
                    icon={<FileTextOutlined />}
                    block
                    onClick={() => navigate('/collaboration?tab=reports')}
                  >
                    {t('dashboard.quickActions.viewReports')}
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 下次重要事项 */}
        {upcomingAppointments.length > 0 && (
          <Card title={t('dashboard.upcomingEvents.title')} style={{ marginBottom: '24px' }}>
            <List
              dataSource={upcomingAppointments.slice(0, 3)}
              renderItem={(appointment) => (
                <List.Item
                  actions={[
                    <Button 
                      size="small"
                      onClick={() => navigate('/collaboration?tab=appointments')}
                    >
                      {language === 'zh' ? '查看详情' : 'View Details'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={
                      <Space>
                        <Text strong>{t('dashboard.upcomingEvents.nextAppointment')}</Text>
                        <Tag color="blue">
                          {dayjs(appointment.scheduledDateTime).format('MM-DD HH:mm')}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="small">
                        <Text>{appointment.provider?.name || ''} - {appointment.location?.name || ''}</Text>
                        <Text type="secondary">
                          {language === 'zh' ? '距离' : 'In'} {dayjs(appointment.scheduledDateTime).diff(dayjs(), 'day')} {language === 'zh' ? '天' : 'days'}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 紧急情况提醒 */}
        <Alert
          message={language === 'zh' ? '紧急情况' : 'Emergency'}
          description={language === 'zh' 
            ? '如果遇到紧急医疗情况，请立即点击紧急按钮或拨打急救电话 120'
            : 'If you encounter an emergency medical situation, please immediately click the emergency button or call emergency number 120'}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button 
              size={screens.xs ? 'small' : 'default'} 
              danger 
              onClick={() => navigate('/collaboration?tab=emergency')}
            >
              {language === 'zh' ? '紧急求助' : 'Emergency Help'}
            </Button>
          }
          style={{ marginTop: '24px' }}
        />
      </Spin>
    </div>
  );
};

export default DashboardPage;
