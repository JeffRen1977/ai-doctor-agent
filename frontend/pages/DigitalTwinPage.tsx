import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Alert,
  Grid,
  Row,
  Col,
  Statistic,
  Typography,
  Timeline,
  Progress,
  Divider,
  InputNumber,
  Spin,
  Empty
} from 'antd';
import type { TabsProps } from 'antd';
import {
  BuildOutlined,
  SyncOutlined,
  WarningOutlined,
  LineChartOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useLanguageStore } from '../stores/languageStore';

const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Title, Text, Paragraph } = Typography;

interface DigitalTwin {
  userId: string;
  profile: any;
  currentState: any;
  model: {
    cardiovascular?: any;
    diabetes?: any;
    metabolic?: any;
    overallHealthScore?: number;
    keyRiskFactors?: string[];
    personalizedRecommendations?: string[];
  };
  lastUpdated: string;
  version: number;
}

interface SimulationResult {
  scenario: any;
  result: {
    shortTermImpact?: any;
    mediumTermImpact?: any;
    longTermImpact?: any;
    overallRisk?: any;
    recommendations?: string[];
  };
  timestamp: string;
}

interface RiskAssessment {
  condition: string;
  timeframe: number;
  assessment: {
    riskLevel?: string;
    riskScore?: number;
    riskFactors?: string[];
    preventionMeasures?: string[];
    monitoringIndicators?: string[];
  };
  timestamp: string;
}

interface HealthProjection {
  timeframe: number;
  projection: {
    keyMetrics?: any;
    riskTrends?: any[];
    milestones?: any[];
    recommendations?: string[];
    confidence?: number;
  };
  timestamp: string;
}

const DigitalTwinPage: React.FC = () => {
  const { language } = useLanguageStore();
  const screens = useBreakpoint();

  const [digitalTwin, setDigitalTwin] = useState<DigitalTwin | null>(null);
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [healthProjection, setHealthProjection] = useState<HealthProjection | null>(null);
  const [simulationModalVisible, setSimulationModalVisible] = useState(false);
  const [riskModalVisible, setRiskModalVisible] = useState(false);
  const [projectionModalVisible, setProjectionModalVisible] = useState(false);
  const [simulationForm] = Form.useForm();
  const [riskForm] = Form.useForm();
  const [projectionForm] = Form.useForm();

  // 获取数字孪生模型
  const fetchDigitalTwin = async () => {
    try {
      setLoading(true);
      const response = await api.get('/digital-twin');
      
      if (response.data.success) {
        setDigitalTwin(response.data.data);
        message.success(language === 'zh' ? '数字孪生模型加载成功' : 'Digital twin loaded successfully');
      } else if (response.data.needsBuild) {
        message.info(language === 'zh' ? '请先构建数字孪生模型' : 'Please build digital twin first');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        message.info(language === 'zh' ? '数字孪生模型不存在，请先构建' : 'Digital twin not found, please build first');
      } else {
        message.error(language === 'zh' ? '加载数字孪生模型失败' : 'Failed to load digital twin');
      }
    } finally {
      setLoading(false);
    }
  };

  // 构建数字孪生模型
  const buildDigitalTwin = async () => {
    try {
      setBuilding(true);
      const response = await api.post('/digital-twin/build');
      
      if (response.data.success) {
        setDigitalTwin(response.data.data);
        message.success(language === 'zh' ? '数字孪生模型构建成功' : 'Digital twin built successfully');
      } else {
        message.error(response.data.error || (language === 'zh' ? '构建失败' : 'Build failed'));
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 
        error.message || 
        (language === 'zh' ? '构建数字孪生模型失败' : 'Failed to build digital twin')
      );
    } finally {
      setBuilding(false);
    }
  };

  // 运行模拟
  const runSimulation = async (values: any) => {
    try {
      setLoading(true);
      const response = await api.post('/digital-twin/simulate', {
        scenario: values
      });
      
      if (response.data.success) {
        setSimulationResult(response.data.data);
        setSimulationModalVisible(false);
        simulationForm.resetFields();
        message.success(language === 'zh' ? '模拟完成' : 'Simulation completed');
      } else {
        message.error(response.data.error || (language === 'zh' ? '模拟失败' : 'Simulation failed'));
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 
        error.message || 
        (language === 'zh' ? '模拟失败' : 'Simulation failed')
      );
    } finally {
      setLoading(false);
    }
  };

  // 风险评估
  const assessRisk = async (values: any) => {
    try {
      setLoading(true);
      const response = await api.post('/digital-twin/assess-risk', {
        condition: values.condition,
        timeframe: values.timeframe || 12
      });
      
      if (response.data.success) {
        setRiskAssessment(response.data.data);
        setRiskModalVisible(false);
        riskForm.resetFields();
        message.success(language === 'zh' ? '风险评估完成' : 'Risk assessment completed');
      } else {
        message.error(response.data.error || (language === 'zh' ? '风险评估失败' : 'Risk assessment failed'));
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 
        error.message || 
        (language === 'zh' ? '风险评估失败' : 'Risk assessment failed')
      );
    } finally {
      setLoading(false);
    }
  };

  // 健康趋势预测
  const generateProjection = async (values: any) => {
    try {
      setLoading(true);
      const response = await api.post('/digital-twin/project', {
        timeframe: values.timeframe || 6
      });
      
      if (response.data.success) {
        setHealthProjection(response.data.data);
        setProjectionModalVisible(false);
        projectionForm.resetFields();
        message.success(language === 'zh' ? '健康趋势预测完成' : 'Health projection completed');
      } else {
        message.error(response.data.error || (language === 'zh' ? '预测失败' : 'Projection failed'));
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 
        error.message || 
        (language === 'zh' ? '预测失败' : 'Projection failed')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigitalTwin();
  }, []);

  const getRiskLevelColor = (level?: string) => {
    if (level === 'low') return 'green';
    if (level === 'medium') return 'orange';
    if (level === 'high') return 'red';
    return 'default';
  };

  const getRiskLevelText = (level?: string) => {
    if (level === 'low') return language === 'zh' ? '低风险' : 'Low Risk';
    if (level === 'medium') return language === 'zh' ? '中风险' : 'Medium Risk';
    if (level === 'high') return language === 'zh' ? '高风险' : 'High Risk';
    return language === 'zh' ? '未知' : 'Unknown';
  };

  const items: TabsProps['items'] = [
    {
      key: 'overview',
      label: language === 'zh' ? '模型概览' : 'Model Overview',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          {!digitalTwin ? (
            <Card>
              <Empty
                description={language === 'zh' ? '数字孪生模型尚未构建' : 'Digital twin not built yet'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  type="primary"
                  icon={<BuildOutlined />}
                  loading={building}
                  onClick={buildDigitalTwin}
                  size="large"
                >
                  {language === 'zh' ? '构建数字孪生模型' : 'Build Digital Twin'}
                </Button>
              </Empty>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title={language === 'zh' ? '整体健康评分' : 'Overall Health Score'}
                    value={digitalTwin.model?.overallHealthScore || 0}
                    suffix="/ 100"
                    valueStyle={{ color: (digitalTwin.model?.overallHealthScore || 0) >= 70 ? '#3f8600' : '#cf1322' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title={language === 'zh' ? '模型版本' : 'Model Version'}
                    value={digitalTwin.version || 1}
                    prefix={<InfoCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card>
                  <Statistic
                    title={language === 'zh' ? '最后更新' : 'Last Updated'}
                    value={digitalTwin.lastUpdated ? new Date(digitalTwin.lastUpdated).toLocaleDateString() : '-'}
                    prefix={<SyncOutlined />}
                  />
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title={language === 'zh' ? '心血管系统模型' : 'Cardiovascular Model'}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>{language === 'zh' ? '风险等级：' : 'Risk Level: '}</Text>
                      <Tag color={getRiskLevelColor(digitalTwin.model?.cardiovascular?.riskLevel)}>
                        {getRiskLevelText(digitalTwin.model?.cardiovascular?.riskLevel)}
                      </Tag>
                    </div>
                    {digitalTwin.model?.cardiovascular?.recommendations && (
                      <div>
                        <Text strong>{language === 'zh' ? '建议：' : 'Recommendations:'}</Text>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          {digitalTwin.model.cardiovascular.recommendations.map((rec: string, index: number) => (
                            <li key={index} style={{ marginBottom: '4px' }}>
                              <Text>{rec}</Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card title={language === 'zh' ? '代谢系统模型' : 'Metabolic Model'}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>{language === 'zh' ? '风险等级：' : 'Risk Level: '}</Text>
                      <Tag color={getRiskLevelColor(digitalTwin.model?.metabolic?.riskLevel)}>
                        {getRiskLevelText(digitalTwin.model?.metabolic?.riskLevel)}
                      </Tag>
                    </div>
                    {digitalTwin.model?.metabolic?.recommendations && (
                      <div>
                        <Text strong>{language === 'zh' ? '建议：' : 'Recommendations:'}</Text>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                          {digitalTwin.model.metabolic.recommendations.map((rec: string, index: number) => (
                            <li key={index} style={{ marginBottom: '4px' }}>
                              <Text>{rec}</Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>

              <Col xs={24}>
                <Card title={language === 'zh' ? '关键风险因素' : 'Key Risk Factors'}>
                  <Space wrap>
                    {digitalTwin.model?.keyRiskFactors?.map((factor: string, index: number) => (
                      <Tag key={index} color="orange" icon={<WarningOutlined />}>
                        {factor}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              </Col>

              <Col xs={24}>
                <Card title={language === 'zh' ? '个性化建议' : 'Personalized Recommendations'}>
                  <Timeline
                    items={digitalTwin.model?.personalizedRecommendations?.map((rec: string) => ({
                      dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                      children: <Text>{rec}</Text>
                    }))}
                  />
                </Card>
              </Col>
            </Row>
          )}
        </div>
      ),
    },
    {
      key: 'simulation',
      label: language === 'zh' ? 'What-if 模拟' : 'What-if Simulation',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? 'What-if 模拟' : 'What-if Simulation'}
            description={language === 'zh' 
              ? '模拟不同场景对您健康的影响，帮助您做出更好的健康决策。'
              : 'Simulate the impact of different scenarios on your health to help you make better health decisions.'}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Card
            title={language === 'zh' ? '运行模拟' : 'Run Simulation'}
            extra={
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => setSimulationModalVisible(true)}
                disabled={!digitalTwin}
              >
                {language === 'zh' ? '新建模拟' : 'New Simulation'}
              </Button>
            }
          >
            {simulationResult ? (
              <div>
                <Title level={4}>{language === 'zh' ? '模拟结果' : 'Simulation Results'}</Title>
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card size="small" title={language === 'zh' ? '短期影响 (1-3个月)' : 'Short-term (1-3 months)'}>
                      <Paragraph>
                        {simulationResult.result.shortTermImpact?.description || '-'}
                      </Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title={language === 'zh' ? '中期影响 (3-6个月)' : 'Medium-term (3-6 months)'}>
                      <Paragraph>
                        {simulationResult.result.mediumTermImpact?.description || '-'}
                      </Paragraph>
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card size="small" title={language === 'zh' ? '长期影响 (6-12个月)' : 'Long-term (6-12 months)'}>
                      <Paragraph>
                        {simulationResult.result.longTermImpact?.description || '-'}
                      </Paragraph>
                    </Card>
                  </Col>
                  
                  <Col xs={24}>
                    <Card size="small" title={language === 'zh' ? '整体风险评估' : 'Overall Risk Assessment'}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text strong>{language === 'zh' ? '风险等级：' : 'Risk Level: '}</Text>
                          <Tag color={getRiskLevelColor(simulationResult.result.overallRisk?.level)}>
                            {getRiskLevelText(simulationResult.result.overallRisk?.level)}
                          </Tag>
                        </div>
                        {simulationResult.result.recommendations && (
                          <div>
                            <Text strong>{language === 'zh' ? '建议：' : 'Recommendations:'}</Text>
                            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                              {simulationResult.result.recommendations.map((rec: string, index: number) => (
                                <li key={index} style={{ marginBottom: '4px' }}>
                                  <Text>{rec}</Text>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty
                description={language === 'zh' ? '暂无模拟结果，请运行新的模拟' : 'No simulation results, please run a new simulation'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'risk',
      label: language === 'zh' ? '风险评估' : 'Risk Assessment',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '并发症风险评估' : 'Complication Risk Assessment'}
            description={language === 'zh' 
              ? '评估您在指定时间范围内发生特定并发症的风险。'
              : 'Assess your risk of developing specific complications within a specified timeframe.'}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Card
            title={language === 'zh' ? '风险评估' : 'Risk Assessment'}
            extra={
              <Button
                type="primary"
                icon={<WarningOutlined />}
                onClick={() => setRiskModalVisible(true)}
                disabled={!digitalTwin}
              >
                {language === 'zh' ? '新建评估' : 'New Assessment'}
              </Button>
            }
          >
            {riskAssessment ? (
              <div>
                <Title level={4}>
                  {language === 'zh' ? '评估结果' : 'Assessment Results'}
                  <Tag color="blue" style={{ marginLeft: '16px' }}>
                    {riskAssessment.condition}
                  </Tag>
                  <Tag color="green" style={{ marginLeft: '8px' }}>
                    {riskAssessment.timeframe} {language === 'zh' ? '个月' : 'months'}
                  </Tag>
                </Title>
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small">
                      <Statistic
                        title={language === 'zh' ? '风险评分' : 'Risk Score'}
                        value={riskAssessment.assessment.riskScore || 0}
                        suffix="/ 100"
                        valueStyle={{ 
                          color: (riskAssessment.assessment.riskScore || 0) >= 70 ? '#cf1322' : 
                                 (riskAssessment.assessment.riskScore || 0) >= 40 ? '#faad14' : '#3f8600'
                        }}
                      />
                      <Progress
                        percent={riskAssessment.assessment.riskScore || 0}
                        status={(riskAssessment.assessment.riskScore || 0) >= 70 ? 'exception' : 'active'}
                        style={{ marginTop: '16px' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small">
                      <div>
                        <Text strong>{language === 'zh' ? '风险等级：' : 'Risk Level: '}</Text>
                        <Tag color={getRiskLevelColor(riskAssessment.assessment.riskLevel)}>
                          {getRiskLevelText(riskAssessment.assessment.riskLevel)}
                        </Tag>
                      </div>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card size="small" title={language === 'zh' ? '主要风险因素' : 'Key Risk Factors'}>
                      <Space wrap>
                        {riskAssessment.assessment.riskFactors?.map((factor: string, index: number) => (
                          <Tag key={index} color="orange">
                            {factor}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card size="small" title={language === 'zh' ? '预防措施' : 'Prevention Measures'}>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {riskAssessment.assessment.preventionMeasures?.map((measure: string, index: number) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            <Text>{measure}</Text>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </Col>
                  
                  <Col xs={24}>
                    <Card size="small" title={language === 'zh' ? '监测指标建议' : 'Monitoring Indicators'}>
                      <Space wrap>
                        {riskAssessment.assessment.monitoringIndicators?.map((indicator: string, index: number) => (
                          <Tag key={index} color="blue">
                            {indicator}
                          </Tag>
                        ))}
                      </Space>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty
                description={language === 'zh' ? '暂无风险评估结果' : 'No risk assessment results'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'projection',
      label: language === 'zh' ? '健康预测' : 'Health Projection',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '健康趋势预测' : 'Health Trend Projection'}
            description={language === 'zh' 
              ? '基于您的数字孪生模型和历史数据，预测未来的健康趋势。'
              : 'Based on your digital twin model and historical data, predict future health trends.'}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          
          <Card
            title={language === 'zh' ? '健康趋势预测' : 'Health Trend Projection'}
            extra={
              <Button
                type="primary"
                icon={<LineChartOutlined />}
                onClick={() => setProjectionModalVisible(true)}
                disabled={!digitalTwin}
              >
                {language === 'zh' ? '生成预测' : 'Generate Projection'}
              </Button>
            }
          >
            {healthProjection ? (
              <div>
                <Title level={4}>
                  {language === 'zh' ? '预测结果' : 'Projection Results'}
                  <Tag color="blue" style={{ marginLeft: '16px' }}>
                    {healthProjection.timeframe} {language === 'zh' ? '个月' : 'months'}
                  </Tag>
                  <Tag color="green" style={{ marginLeft: '8px' }}>
                    {language === 'zh' ? '置信度：' : 'Confidence: '}
                    {((healthProjection.projection.confidence || 0) * 100).toFixed(0)}%
                  </Tag>
                </Title>
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Card size="small" title={language === 'zh' ? '关键指标预测' : 'Key Metrics Projection'}>
                      <Row gutter={[16, 16]}>
                        {Object.entries(healthProjection.projection.keyMetrics || {}).map(([key, value]: [string, any]) => (
                          <Col xs={24} sm={12} md={8} key={key}>
                            <Card size="small">
                              <Statistic
                                title={key}
                                value={value?.projected || '-'}
                                suffix={value?.unit || ''}
                                valueStyle={{ color: value?.trend === 'up' ? '#cf1322' : '#3f8600' }}
                              />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {language === 'zh' ? '当前：' : 'Current: '}{value?.current || '-'}
                              </Text>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card size="small" title={language === 'zh' ? '风险趋势' : 'Risk Trends'}>
                      <Timeline
                        items={healthProjection.projection.riskTrends?.map((trend: any) => ({
                          color: trend.level === 'high' ? 'red' : trend.level === 'medium' ? 'orange' : 'green',
                          children: (
                            <div>
                              <Text strong>{trend.name}</Text>
                              <br />
                              <Text type="secondary">{trend.description}</Text>
                            </div>
                          )
                        }))}
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Card size="small" title={language === 'zh' ? '里程碑事件' : 'Milestones'}>
                      <Timeline
                        items={healthProjection.projection.milestones?.map((milestone: any) => ({
                          dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                          children: (
                            <div>
                              <Text strong>{milestone.name}</Text>
                              <br />
                              <Text type="secondary">{milestone.date || milestone.description}</Text>
                            </div>
                          )
                        }))}
                      />
                    </Card>
                  </Col>
                  
                  <Col xs={24}>
                    <Card size="small" title={language === 'zh' ? '建议' : 'Recommendations'}>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {healthProjection.projection.recommendations?.map((rec: string, index: number) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            <Text>{rec}</Text>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty
                description={language === 'zh' ? '暂无预测结果' : 'No projection results'}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: screens.xs ? '8px' : '24px' }}>
      <Card
        title={
          <Space>
            <BuildOutlined />
            <span>{language === 'zh' ? '智能数字孪生' : 'Digital Twin'}</span>
          </Space>
        }
        size={screens.xs ? 'small' : 'default'}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDigitalTwin}
              loading={loading}
            >
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>
            {!digitalTwin && (
              <Button
                type="primary"
                icon={<BuildOutlined />}
                onClick={buildDigitalTwin}
                loading={building}
              >
                {language === 'zh' ? '构建模型' : 'Build Model'}
              </Button>
            )}
          </Space>
        }
      >
        <Spin spinning={loading || building}>
          <Tabs
            items={items}
            size={screens.xs ? 'small' : 'large'}
            tabPosition={screens.xs ? 'top' : 'top'}
          />
        </Spin>
      </Card>

      {/* 模拟模态框 */}
      <Modal
        title={language === 'zh' ? 'What-if 模拟' : 'What-if Simulation'}
        open={simulationModalVisible}
        onCancel={() => {
          setSimulationModalVisible(false);
          simulationForm.resetFields();
        }}
        footer={null}
        width={screens.xs ? '95%' : 700}
      >
        <Form
          form={simulationForm}
          layout="vertical"
          onFinish={runSimulation}
        >
          <Form.Item
            name="type"
            label={language === 'zh' ? '模拟类型' : 'Simulation Type'}
            rules={[{ required: true, message: language === 'zh' ? '请选择模拟类型' : 'Please select simulation type' }]}
          >
            <Select placeholder={language === 'zh' ? '请选择模拟类型' : 'Select simulation type'}>
              <Option value="lifestyle">{language === 'zh' ? '生活方式改变' : 'Lifestyle Change'}</Option>
              <Option value="medication">{language === 'zh' ? '用药调整' : 'Medication Adjustment'}</Option>
              <Option value="exercise">{language === 'zh' ? '运动计划' : 'Exercise Plan'}</Option>
              <Option value="diet">{language === 'zh' ? '饮食调整' : 'Diet Adjustment'}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={language === 'zh' ? '模拟场景描述' : 'Scenario Description'}
            rules={[{ required: true, message: language === 'zh' ? '请输入模拟场景' : 'Please enter scenario' }]}
          >
            <TextArea
              rows={6}
              placeholder={language === 'zh' ? '请详细描述您想要模拟的场景，例如：如果每天增加30分钟有氧运动，对健康的影响如何？' : 'Please describe the scenario you want to simulate, e.g., What would be the health impact of adding 30 minutes of aerobic exercise daily?'}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setSimulationModalVisible(false);
                simulationForm.resetFields();
              }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {language === 'zh' ? '运行模拟' : 'Run Simulation'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 风险评估模态框 */}
      <Modal
        title={language === 'zh' ? '并发症风险评估' : 'Complication Risk Assessment'}
        open={riskModalVisible}
        onCancel={() => {
          setRiskModalVisible(false);
          riskForm.resetFields();
        }}
        footer={null}
        width={screens.xs ? '95%' : 600}
      >
        <Form
          form={riskForm}
          layout="vertical"
          onFinish={assessRisk}
        >
          <Form.Item
            name="condition"
            label={language === 'zh' ? '疾病/并发症' : 'Condition/Complication'}
            rules={[{ required: true, message: language === 'zh' ? '请输入疾病或并发症名称' : 'Please enter condition name' }]}
          >
            <Input placeholder={language === 'zh' ? '例如：糖尿病、高血压、心脏病等' : 'e.g., Diabetes, Hypertension, Heart Disease'} />
          </Form.Item>

          <Form.Item
            name="timeframe"
            label={language === 'zh' ? '时间范围（月）' : 'Timeframe (months)'}
            initialValue={12}
          >
            <InputNumber
              min={1}
              max={60}
              style={{ width: '100%' }}
              placeholder={language === 'zh' ? '请输入时间范围' : 'Enter timeframe'}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setRiskModalVisible(false);
                riskForm.resetFields();
              }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {language === 'zh' ? '开始评估' : 'Start Assessment'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 健康预测模态框 */}
      <Modal
        title={language === 'zh' ? '健康趋势预测' : 'Health Trend Projection'}
        open={projectionModalVisible}
        onCancel={() => {
          setProjectionModalVisible(false);
          projectionForm.resetFields();
        }}
        footer={null}
        width={screens.xs ? '95%' : 500}
      >
        <Form
          form={projectionForm}
          layout="vertical"
          onFinish={generateProjection}
        >
          <Form.Item
            name="timeframe"
            label={language === 'zh' ? '预测时间范围（月）' : 'Projection Timeframe (months)'}
            initialValue={6}
            rules={[{ required: true, message: language === 'zh' ? '请输入时间范围' : 'Please enter timeframe' }]}
          >
            <InputNumber
              min={1}
              max={24}
              style={{ width: '100%' }}
              placeholder={language === 'zh' ? '请输入预测时间范围' : 'Enter projection timeframe'}
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setProjectionModalVisible(false);
                projectionForm.resetFields();
              }}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {language === 'zh' ? '生成预测' : 'Generate Projection'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DigitalTwinPage;
