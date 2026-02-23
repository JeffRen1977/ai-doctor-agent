import React, { useState, useEffect } from 'react';
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
  Divider,
  Input,
  Select,
  Table,
  Form,
  Radio,
  Checkbox,
  Spin,
  message,
  Empty,
  Descriptions,
  Modal,
  DatePicker,
  Collapse
} from 'antd';
import { 
  MedicineBoxOutlined, 
  AppleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BellOutlined,
  ReloadOutlined,
  ExperimentOutlined,
  FireOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { interventionEngineAPI, riskMonitoringAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const InterventionEnginePage: React.FC = () => {
  const { language } = useLanguageStore();
  
  const [activeTab, setActiveTab] = useState('medication');
  
  // Medication management state
  const [medicationData, setMedicationData] = useState<any>(null);
  const [medicationLoading, setMedicationLoading] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [medicationForm] = Form.useForm();
  const [medicationSubmitLoading, setMedicationSubmitLoading] = useState(false);
  
  // Medication effectiveness state
  const [effectivenessForm] = Form.useForm();
  const [effectivenessResult, setEffectivenessResult] = useState<any>(null);
  const [effectivenessLoading, setEffectivenessLoading] = useState(false);
  
  // Nutrition analysis state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isAnalyzingNutrition, setIsAnalyzingNutrition] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<any>(null);
  const [nutritionError, setNutritionError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  
  // Exercise plan state
  const [exerciseForm] = Form.useForm();
  const [exercisePlan, setExercisePlan] = useState<any>(null);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  
  // Intervention adjustment state
  const [adjustmentForm] = Form.useForm();
  const [adjustmentResult, setAdjustmentResult] = useState<any>(null);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);

  // Load medication data on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'medication') {
      loadMedicationData();
    } else if (activeTab === 'exercise') {
      loadExercisePlan();
    }
  }, [activeTab]);

  const loadExercisePlan = async () => {
    setExerciseLoading(true);
    try {
      const response = await interventionEngineAPI.getExercisePlan();
      if (response?.success) {
        setExercisePlan(response.plan ?? null);
      } else {
        setExercisePlan(null);
      }
    } catch (error: any) {
      console.error('Load exercise plan error:', error);
      setExercisePlan(null);
    } finally {
      setExerciseLoading(false);
    }
  };

  const loadMedicationData = async () => {
    setMedicationLoading(true);
    try {
      const response = await interventionEngineAPI.getMedication();
      if (response.success) {
        setMedicationData(response);
      } else {
        message.error(response.error || (language === 'zh' ? '加载用药数据失败' : 'Failed to load medication data'));
      }
    } catch (error: any) {
      console.error('Load medication error:', error);
      message.error(error.message || (language === 'zh' ? '加载用药数据出错' : 'Error loading medication data'));
    } finally {
      setMedicationLoading(false);
    }
  };

  const handleRecordMedication = async (medicationId: string, time: string) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const timeStr = time.split('T')[1]?.split(':').slice(0, 2).join(':') || time;
      
      const response = await interventionEngineAPI.recordMedicationHistory(
        medicationId,
        today,
        timeStr,
        'taken'
      );
      
      if (response.success) {
        message.success(language === 'zh' ? '已记录服药' : 'Medication recorded');
        loadMedicationData();
      } else {
        message.error(response.error || (language === 'zh' ? '记录失败' : 'Failed to record'));
      }
    } catch (error: any) {
      console.error('Record medication error:', error);
      message.error(error.message || (language === 'zh' ? '记录出错' : 'Error recording'));
    }
  };

  const openAddMedicationModal = () => {
    setEditingMedication(null);
    medicationForm.resetFields();
    medicationForm.setFieldsValue({ startDate: dayjs(), status: 'active' });
    setMedicationModalVisible(true);
  };

  const openEditMedicationModal = (record: any) => {
    setEditingMedication(record);
    medicationForm.setFieldsValue({
      name: record.name,
      dosage: record.dosage,
      frequency: record.frequency,
      time: record.time && record.time.length ? record.time.join(', ') : '',
      purpose: record.purpose || '',
      prescribingDoctor: record.prescribingDoctor || '',
    });
    if (record.startDate) medicationForm.setFieldsValue({ startDate: dayjs(record.startDate) });
    if (record.endDate) medicationForm.setFieldsValue({ endDate: dayjs(record.endDate) });
    setMedicationModalVisible(true);
  };

  const handleMedicationModalCancel = () => {
    setMedicationModalVisible(false);
    setEditingMedication(null);
    medicationForm.resetFields();
  };

  const handleMedicationModalSubmit = async (values: any) => {
    const timeArray = values.time
      ? (typeof values.time === 'string' ? values.time.split(',') : values.time).map((s: string) => s.trim()).filter(Boolean)
      : [];
    const medication: any = {
      name: values.name.trim(),
      dosage: values.dosage.trim(),
      frequency: values.frequency,
      time: timeArray.length ? timeArray : ['08:00', '20:00'],
      startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      status: 'active',
      purpose: values.purpose?.trim() || undefined,
      prescribingDoctor: values.prescribingDoctor?.trim() || undefined,
    };
    if (values.endDate) medication.endDate = dayjs(values.endDate).format('YYYY-MM-DD');
    if (editingMedication?.id) medication.id = editingMedication.id;
    setMedicationSubmitLoading(true);
    try {
      const response = await interventionEngineAPI.addOrUpdateMedication(medication);
      if (response.success) {
        message.success(language === 'zh' ? (editingMedication ? '已更新药品' : '已添加药品') : (editingMedication ? 'Medication updated' : 'Medication added'));
        handleMedicationModalCancel();
        loadMedicationData();
      } else {
        message.error(response.error || (language === 'zh' ? '保存失败' : 'Save failed'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '保存出错' : 'Error saving'));
    } finally {
      setMedicationSubmitLoading(false);
    }
  };

  const handleAnalyzeEffectiveness = async (values: any) => {
    setEffectivenessLoading(true);
    setEffectivenessResult(null);
    try {
      const response = await interventionEngineAPI.analyzeMedicationEffectiveness(
        values.medication,
        values.timeframe
      );
      
      if (response.success) {
        setEffectivenessResult(response);
        message.success(language === 'zh' ? '药效评估完成' : 'Effectiveness analysis completed');
      } else {
        message.error(response.error || (language === 'zh' ? '评估失败' : 'Analysis failed'));
      }
    } catch (error: any) {
      console.error('Effectiveness analysis error:', error);
      message.error(error.message || (language === 'zh' ? '评估出错' : 'Analysis error'));
    } finally {
      setEffectivenessLoading(false);
    }
  };

  const handleAnalyzeNutrition = async () => {
    if (!selectedImage) {
      setNutritionError(language === 'zh' ? '请先上传图片' : 'Please upload an image first');
      return;
    }

    setIsAnalyzingNutrition(true);
    setNutritionError('');
    setNutritionResult(null);

    try {
      let currentMetrics: { glucose?: number; bloodPressure?: { systolic: number; diastolic: number } } = {
        glucose: 120,
        bloodPressure: { systolic: 120, diastolic: 80 }
      };
      try {
        const statusRes = await riskMonitoringAPI.getStatus();
        if (statusRes?.success && statusRes?.lastDataPoint) {
          const dp = statusRes.lastDataPoint as any;
          if (dp.glucose != null) currentMetrics.glucose = Number(dp.glucose);
          if (dp.bloodPressure != null) {
            if (typeof dp.bloodPressure === 'object' && dp.bloodPressure.systolic != null) {
              currentMetrics.bloodPressure = { systolic: Number(dp.bloodPressure.systolic), diastolic: Number(dp.bloodPressure.diastolic ?? 80) };
            } else if (typeof dp.bloodPressure === 'string') {
              const [s, d] = dp.bloodPressure.split('/').map(Number);
              if (!isNaN(s)) currentMetrics.bloodPressure = { systolic: s, diastolic: !isNaN(d) ? d : 80 };
            }
          }
        }
      } catch (_) {
        // 使用默认值，不打断分析流程
      }

      const response = await interventionEngineAPI.generateNutritionAdvice(
        selectedImage,
        currentMetrics
      );

      if (response.success) {
        setNutritionResult(response);
        setNutritionError('');
      } else {
        setNutritionError(response.error || (language === 'zh' ? '分析失败' : 'Analysis failed'));
      }
    } catch (err: any) {
      console.error('Nutrition analysis error:', err);
      setNutritionError(err.message || (language === 'zh' ? '分析出错' : 'Analysis error'));
    } finally {
      setIsAnalyzingNutrition(false);
    }
  };

  const handleGenerateExercisePlan = async (values: any) => {
    setExerciseLoading(true);
    setExercisePlan(null);
    try {
      const healthState = {
        currentFitness: values.currentFitness,
        healthConditions: values.healthConditions || [],
        goals: values.goals || [],
        preferences: values.preferences || [],
        limitations: values.limitations || [],
        availableTime: values.availableTime
      };
      
      const response = await interventionEngineAPI.generateExercisePlan(healthState);
      
      if (response.success) {
        setExercisePlan(response.plan);
        message.success(language === 'zh' ? '运动计划生成成功' : 'Exercise plan generated successfully');
      } else {
        message.error(response.error || (language === 'zh' ? '生成失败' : 'Generation failed'));
      }
    } catch (error: any) {
      console.error('Exercise plan error:', error);
      message.error(error.message || (language === 'zh' ? '生成出错' : 'Generation error'));
    } finally {
      setExerciseLoading(false);
    }
  };

  const handleAdjustIntervention = async (values: any) => {
    setAdjustmentLoading(true);
    setAdjustmentResult(null);
    try {
      const feedback = {
        type: values.type,
        content: values.content,
        effectiveness: values.effectiveness,
        issues: values.issues || [],
        suggestions: values.suggestions ? values.suggestions.split('\n').filter((s: string) => s.trim()) : [],
        metrics: {
          glucose: values.glucose,
          bloodPressure: values.bloodPressure ? {
            systolic: parseInt(values.bloodPressure.split('/')[0]),
            diastolic: parseInt(values.bloodPressure.split('/')[1])
          } : undefined,
          weight: values.weight
        }
      };
      
      const response = await interventionEngineAPI.adjustIntervention(feedback);
      
      if (response.success) {
        setAdjustmentResult(response);
        message.success(language === 'zh' ? '干预方案调整成功' : 'Intervention adjusted successfully');
        adjustmentForm.resetFields();
      } else {
        message.error(response.error || (language === 'zh' ? '调整失败' : 'Adjustment failed'));
      }
    } catch (error: any) {
      console.error('Adjust intervention error:', error);
      message.error(error.message || (language === 'zh' ? '调整出错' : 'Adjustment error'));
    } finally {
      setAdjustmentLoading(false);
    }
  };

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
      render: (times: string[]) => times ? times.join(', ') : '-',
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
      title: language === 'zh' ? '状态' : 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'taken' ? (language === 'zh' ? '已服药' : 'Taken') :
           status === 'pending' ? (language === 'zh' ? '待服药' : 'Pending') :
           (language === 'zh' ? '已错过' : 'Missed')}
        </Tag>
      ),
    },
    {
      title: language === 'zh' ? '下次服药' : 'Next Dose',
      dataIndex: 'nextDose',
      key: 'nextDose',
      render: (nextDose: string) => nextDose ? dayjs(nextDose).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: language === 'zh' ? '操作' : 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => openEditMedicationModal(record)}
          >
            {language === 'zh' ? '编辑' : 'Edit'}
          </Button>
          {record.status === 'pending' && record.nextDose && (
            <Button 
              size="small" 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => handleRecordMedication(record.id, record.nextDose)}
            >
              {language === 'zh' ? '已服药' : 'Taken'}
            </Button>
          )}
          <Button 
            size="small" 
            icon={<ExperimentOutlined />}
            onClick={() => {
              setActiveTab('effectiveness');
              effectivenessForm.setFieldsValue({ medication: record.name });
            }}
          >
            {language === 'zh' ? '评估' : 'Evaluate'}
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
            <Spin spinning={medicationLoading}>
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
                  action={
                    <Space>
                      <Button size="small" type="primary" icon={<PlusOutlined />} onClick={openAddMedicationModal}>
                        {language === 'zh' ? '添加药品' : 'Add Medication'}
                      </Button>
                      <Button size="small" icon={<ReloadOutlined />} onClick={loadMedicationData}>
                        {language === 'zh' ? '刷新' : 'Refresh'}
                      </Button>
                    </Space>
                  }
                />
                
                {medicationData ? (
                  <>
                    {/* Adherence Statistics */}
                    {medicationData.adherence && (
                      <Row gutter={16} style={{ marginBottom: '16px' }}>
                        <Col span={12}>
                          <Card>
                            <Statistic
                              title={language === 'zh' ? '总体依从性' : 'Overall Adherence'}
                              value={medicationData.adherence.overall}
                              suffix="%"
                              valueStyle={{ color: medicationData.adherence.overall >= 90 ? '#52c41a' : medicationData.adherence.overall >= 70 ? '#faad14' : '#ff4d4f' }}
                            />
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card>
                            <Title level={5}>{language === 'zh' ? '各药物依从性' : 'Medication Adherence'}</Title>
                            <List
                              size="small"
                              dataSource={medicationData.adherence.byMedication || []}
                              renderItem={(item: any) => (
                                <List.Item>
                                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Text>{item.medication}</Text>
                                    <Progress 
                                      percent={item.adherence} 
                                      size="small" 
                                      style={{ width: '100px' }}
                                      status={item.adherence >= 90 ? 'success' : item.adherence >= 70 ? 'normal' : 'exception'}
                                    />
                                    <Text type="secondary">{item.adherence}%</Text>
                                  </Space>
                                </List.Item>
                              )}
                            />
                          </Card>
                        </Col>
                      </Row>
                    )}

                    {/* Medications Table */}
                    <Table
                      dataSource={medicationData.medications || []}
                      columns={medicationColumns}
                      rowKey="id"
                      pagination={false}
                    />

                    {/* Reminders */}
                    {medicationData.reminders && medicationData.reminders.length > 0 && (
                      <>
                        <Divider>{language === 'zh' ? '用药提醒' : 'Medication Reminders'}</Divider>
                        <List
                          dataSource={medicationData.reminders}
                          renderItem={(reminder: any) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar icon={<BellOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                                title={
                                  <Space>
                                    <Text strong>{reminder.medication}</Text>
                                    <Text type="secondary">{reminder.dosage}</Text>
                                  </Space>
                                }
                                description={
                                  <Space>
                                    <ClockCircleOutlined />
                                    <Text>{dayjs(reminder.time).format('YYYY-MM-DD HH:mm')}</Text>
                                    <Text type="secondary">{reminder.message}</Text>
                                  </Space>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </>
                    )}
                  </>
                ) : (
                  !medicationLoading && (
                    <Empty 
                      description={language === 'zh' ? '暂无用药记录' : 'No medication records'}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={openAddMedicationModal}>
                        {language === 'zh' ? '添加第一项药品' : 'Add your first medication'}
                      </Button>
                    </Empty>
                  )
                )}
              </Space>
            </Spin>
          </TabPane>

          {/* 药效评估 */}
          <TabPane 
            tab={
              <span>
                <ExperimentOutlined />
                {language === 'zh' ? '药效评估' : 'Medication Effectiveness'}
              </span>
            } 
            key="effectiveness"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '药效评估说明' : 'Effectiveness Analysis'}
                description={
                  language === 'zh' 
                    ? '基于可穿戴设备数据和用药记录，使用AI分析药物效果，评估药物是否有效，是否需要调整剂量或更换药物。'
                    : 'Based on wearable device data and medication records, use AI to analyze medication effectiveness, evaluate whether medications are effective, and determine if dosage adjustments or medication changes are needed.'}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Card title={language === 'zh' ? '评估参数' : 'Analysis Parameters'}>
                <Form
                  form={effectivenessForm}
                  layout="vertical"
                  onFinish={handleAnalyzeEffectiveness}
                >
                  <Form.Item
                    name="medication"
                    label={language === 'zh' ? '药物名称' : 'Medication'}
                    rules={[{ required: true, message: language === 'zh' ? '请选择药物' : 'Please select medication' }]}
                  >
                    <Select
                      placeholder={language === 'zh' ? '请选择药物' : 'Select medication'}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {medicationData?.medications?.map((med: any) => (
                        <Option key={med.id} value={med.name}>{med.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="timeframe"
                    label={language === 'zh' ? '评估时间段' : 'Timeframe'}
                    rules={[{ required: true, message: language === 'zh' ? '请选择时间段' : 'Please select timeframe' }]}
                  >
                    <Select placeholder={language === 'zh' ? '请选择时间段' : 'Select timeframe'}>
                      <Option value={language === 'zh' ? '最近7天' : 'Last 7 days'}>{language === 'zh' ? '最近7天' : 'Last 7 days'}</Option>
                      <Option value={language === 'zh' ? '最近30天' : 'Last 30 days'}>{language === 'zh' ? '最近30天' : 'Last 30 days'}</Option>
                      <Option value={language === 'zh' ? '最近90天' : 'Last 90 days'}>{language === 'zh' ? '最近90天' : 'Last 90 days'}</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={effectivenessLoading} block>
                      {language === 'zh' ? '开始评估' : 'Start Analysis'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {/* Effectiveness Results */}
              {effectivenessResult && effectivenessResult.effectiveness && (
                <Card title={language === 'zh' ? '评估结果' : 'Analysis Results'}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Score and Level */}
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title={language === 'zh' ? '效果评分' : 'Effectiveness Score'}
                            value={effectivenessResult.effectiveness.score || 0}
                            suffix="/100"
                            valueStyle={{ color: effectivenessResult.effectiveness.score >= 80 ? '#52c41a' : effectivenessResult.effectiveness.score >= 60 ? '#faad14' : '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title={language === 'zh' ? '效果等级' : 'Effectiveness Level'}
                            value={
                              effectivenessResult.effectiveness.level === 'good' ? (language === 'zh' ? '良好' : 'Good') :
                              effectivenessResult.effectiveness.level === 'fair' ? (language === 'zh' ? '一般' : 'Fair') :
                              (language === 'zh' ? '较差' : 'Poor')
                            }
                            valueStyle={{ color: getEffectivenessColor(effectivenessResult.effectiveness.level) === 'success' ? '#52c41a' : getEffectivenessColor(effectivenessResult.effectiveness.level) === 'warning' ? '#faad14' : '#ff4d4f' }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title={language === 'zh' ? '依从性' : 'Adherence'}
                            value={effectivenessResult.effectiveness.adherence || 0}
                            suffix="%"
                            valueStyle={{ color: '#1890ff' }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Trends Analysis */}
                    {effectivenessResult.effectiveness.trends && (
                      <Card title={language === 'zh' ? '趋势分析' : 'Trends Analysis'}>
                        <Descriptions bordered column={3}>
                          {effectivenessResult.effectiveness.trends.before && (
                            <>
                              <Descriptions.Item label={language === 'zh' ? '用药前血糖' : 'Glucose (Before)'}>
                                {effectivenessResult.effectiveness.trends.before.glucose || '-'} mg/dL
                              </Descriptions.Item>
                              <Descriptions.Item label={language === 'zh' ? '用药后血糖' : 'Glucose (After)'}>
                                {effectivenessResult.effectiveness.trends.after?.glucose || '-'} mg/dL
                              </Descriptions.Item>
                              <Descriptions.Item label={language === 'zh' ? '改善' : 'Improvement'}>
                                {effectivenessResult.effectiveness.trends.improvement?.glucose || 0}%
                              </Descriptions.Item>
                            </>
                          )}
                        </Descriptions>
                      </Card>
                    )}

                    {/* Analysis Text */}
                    {effectivenessResult.effectiveness.analysis && (
                      <Card title={language === 'zh' ? '效果分析' : 'Effectiveness Analysis'}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {effectivenessResult.effectiveness.analysis}
                        </ReactMarkdown>
                      </Card>
                    )}

                    {/* Recommendations */}
                    {effectivenessResult.effectiveness.recommendations && effectivenessResult.effectiveness.recommendations.length > 0 && (
                      <Card title={language === 'zh' ? '调整建议' : 'Recommendations'}>
                        <List
                          dataSource={effectivenessResult.effectiveness.recommendations}
                          renderItem={(rec: any) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                                title={rec.type ? (
                                  <Tag color="blue">
                                    {rec.type === 'dose' ? (language === 'zh' ? '剂量调整' : 'Dose Adjustment') :
                                     rec.type === 'timing' ? (language === 'zh' ? '时间调整' : 'Timing Adjustment') :
                                     rec.type === 'medication' ? (language === 'zh' ? '药物更换' : 'Medication Change') :
                                     (language === 'zh' ? '生活方式' : 'Lifestyle')}
                                  </Tag>
                                ) : null}
                                description={
                                  <div>
                                    <Text strong>{rec.suggestion || rec}</Text>
                                    {rec.reason && (
                                      <div style={{ marginTop: '8px' }}>
                                        <Text type="secondary">{language === 'zh' ? '原因：' : 'Reason: '}{rec.reason}</Text>
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </Space>
                </Card>
              )}
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

              {/* Image Upload Section */}
              <Card title={language === 'zh' ? '上传食物照片' : 'Upload Food Photo'}>
                {imagePreview ? (
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <img 
                      src={imagePreview} 
                      alt="Food preview" 
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
                    />
                    <div style={{ marginTop: '16px' }}>
                      <Button 
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview('');
                          setNutritionResult(null);
                          setNutritionError('');
                        }}
                      >
                        {language === 'zh' ? '重新选择' : 'Reselect'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #d9d9d9', borderRadius: '8px' }}>
                    <AppleOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <div style={{ marginBottom: '16px' }}>
                      <Button 
                        type="primary" 
                        icon={<AppleOutlined />}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ marginRight: '8px' }}
                      >
                        {language === 'zh' ? '选择图片' : 'Select Image'}
                      </Button>
                      <Button 
                        icon={<AppleOutlined />}
                        onClick={() => cameraRef.current?.click()}
                      >
                        {language === 'zh' ? '拍照' : 'Take Photo'}
                      </Button>
                    </div>
                    <Text type="secondary">
                      {language === 'zh' ? '支持 JPG、PNG 格式，最大 10MB' : 'Supports JPG, PNG, max 10MB'}
                    </Text>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      setNutritionError('');
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImagePreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  ref={cameraRef}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      setNutritionError('');
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setImagePreview(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </Card>

              {/* Analyze Button */}
              {selectedImage && (
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<AppleOutlined />} 
                  block
                  loading={isAnalyzingNutrition}
                  onClick={handleAnalyzeNutrition}
                >
                  {isAnalyzingNutrition 
                    ? (language === 'zh' ? '分析中...' : 'Analyzing...')
                    : (language === 'zh' ? '开始分析' : 'Start Analysis')
                  }
                </Button>
              )}

              {/* Error Message */}
              {nutritionError && (
                <Alert
                  message={nutritionError}
                  type="error"
                  showIcon
                  closable
                  onClose={() => setNutritionError('')}
                />
              )}

              {/* Analysis Results */}
              {nutritionResult && (
                <Card title={language === 'zh' ? '分析结果' : 'Analysis Results'}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Instant Feedback */}
                    {nutritionResult.instantFeedback && (
                      <Alert
                        message={language === 'zh' ? '即时反馈' : 'Instant Feedback'}
                        description={
                          <div>
                            <Text strong>{nutritionResult.instantFeedback.message}</Text>
                            {nutritionResult.instantFeedback.recommendations && nutritionResult.instantFeedback.recommendations.length > 0 && (
                              <List
                                size="small"
                                style={{ marginTop: '8px' }}
                                dataSource={nutritionResult.instantFeedback.recommendations}
                                renderItem={(rec: any) => (
                                  <List.Item>
                                    <Space>
                                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                      <Text>{typeof rec === 'string' ? rec : rec.action}</Text>
                                      {typeof rec === 'object' && rec.reason && (
                                        <Text type="secondary">({rec.reason})</Text>
                                      )}
                                    </Space>
                                  </List.Item>
                                )}
                              />
                            )}
                          </div>
                        }
                        type={nutritionResult.instantFeedback.status === 'warning' ? 'warning' : 
                              nutritionResult.instantFeedback.status === 'caution' ? 'warning' : 'success'}
                        showIcon
                      />
                    )}

                    {/* Nutrition Details */}
                    {nutritionResult.nutrition && (
                      <>
                        {/* Foods List */}
                        {nutritionResult.nutrition.foods && nutritionResult.nutrition.foods.length > 0 && (
                          <Card title={language === 'zh' ? '识别的食物' : 'Recognized Foods'} size="small">
                            <List
                              dataSource={nutritionResult.nutrition.foods}
                              renderItem={(food: any) => (
                                <List.Item>
                                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                    <Text strong>{food.name}</Text>
                                    <Text type="secondary">{food.quantity}</Text>
                                  </Space>
                                </List.Item>
                              )}
                            />
                          </Card>
                        )}

                        {/* Total Nutrition */}
                        {nutritionResult.nutrition.total && (
                          <Card title={language === 'zh' ? '总营养成分' : 'Total Nutrition'}>
                            <Row gutter={[16, 16]}>
                              <Col xs={12} sm={8} md={6}>
                                <Statistic
                                  title={language === 'zh' ? '卡路里' : 'Calories'}
                                  value={nutritionResult.nutrition.total.calories ?? 0}
                                  suffix="kcal"
                                />
                              </Col>
                              <Col xs={12} sm={8} md={6}>
                                <Statistic
                                  title={language === 'zh' ? '碳水' : 'Carbs'}
                                  value={nutritionResult.nutrition.total.carbs ?? 0}
                                  suffix="g"
                                />
                              </Col>
                              <Col xs={12} sm={8} md={6}>
                                <Statistic
                                  title={language === 'zh' ? '蛋白质' : 'Protein'}
                                  value={nutritionResult.nutrition.total.protein ?? 0}
                                  suffix="g"
                                />
                              </Col>
                              <Col xs={12} sm={8} md={6}>
                                <Statistic
                                  title={language === 'zh' ? '脂肪' : 'Fat'}
                                  value={nutritionResult.nutrition.total.fat ?? 0}
                                  suffix="g"
                                />
                              </Col>
                              {(typeof nutritionResult.nutrition.total.fiber === 'number' || typeof nutritionResult.nutrition.total.sugar === 'number') && (
                                <>
                                  <Col xs={12} sm={8} md={6}>
                                    <Statistic
                                      title={language === 'zh' ? '膳食纤维' : 'Fiber'}
                                      value={nutritionResult.nutrition.total.fiber ?? 0}
                                      suffix="g"
                                    />
                                  </Col>
                                  <Col xs={12} sm={8} md={6}>
                                    <Statistic
                                      title={language === 'zh' ? '糖' : 'Sugars'}
                                      value={nutritionResult.nutrition.total.sugar ?? 0}
                                      suffix="g"
                                    />
                                  </Col>
                                </>
                              )}
                            </Row>
                          </Card>
                        )}

                        {/* Blood Sugar Impact */}
                        {nutritionResult.nutrition.bloodSugarImpact && (
                          <Card title={language === 'zh' ? '血糖影响评估' : 'Blood Sugar Impact'}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Tag color={
                                nutritionResult.nutrition.bloodSugarImpact.level === 'high' ? 'red' :
                                nutritionResult.nutrition.bloodSugarImpact.level === 'medium' ? 'orange' : 'green'
                              }>
                                {language === 'zh' ? '影响等级：' : 'Impact Level: '}
                                {nutritionResult.nutrition.bloodSugarImpact.level === 'high' ? (language === 'zh' ? '高' : 'High') :
                                 nutritionResult.nutrition.bloodSugarImpact.level === 'medium' ? (language === 'zh' ? '中' : 'Medium') :
                                 (language === 'zh' ? '低' : 'Low')}
                              </Tag>
                              {nutritionResult.nutrition.bloodSugarImpact.estimatedGlucose && (
                                <Text>
                                  {language === 'zh' ? '预估血糖：' : 'Estimated Glucose: '}
                                  <Text strong>{nutritionResult.nutrition.bloodSugarImpact.estimatedGlucose} mg/dL</Text>
                                </Text>
                              )}
                              {nutritionResult.nutrition.bloodSugarImpact.timeToPeak && (
                                <Text>
                                  {language === 'zh' ? '峰值时间：' : 'Time to Peak: '}
                                  <Text strong>{nutritionResult.nutrition.bloodSugarImpact.timeToPeak}</Text>
                                </Text>
                              )}
                              {nutritionResult.nutrition.bloodSugarImpact.recommendation && (
                                <div>
                                  <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                                    {language === 'zh' ? '建议' : 'Recommendation'}
                                  </Text>
                                  <Text>{nutritionResult.nutrition.bloodSugarImpact.recommendation}</Text>
                                </div>
                              )}
                            </Space>
                          </Card>
                        )}

                        {/* 即时反馈 - 与血糖建议不同时重复展示 */}
                        {nutritionResult.nutrition.immediateFeedback?.advice &&
                         nutritionResult.nutrition.immediateFeedback.advice !== nutritionResult.nutrition.bloodSugarImpact?.recommendation && (
                          <Card title={language === 'zh' ? '即时反馈' : 'Immediate Feedback'}>
                            <Typography.Paragraph style={{ marginBottom: 0 }}>
                              {nutritionResult.nutrition.immediateFeedback.advice}
                            </Typography.Paragraph>
                          </Card>
                        )}

                        {/* 改进建议（若与血糖建议相同则不重复展示） */}
                        {nutritionResult.nutrition.improvementSuggestions?.advice &&
                         nutritionResult.nutrition.improvementSuggestions.advice !== nutritionResult.nutrition.bloodSugarImpact?.recommendation && (
                          <Card title={language === 'zh' ? '饮食建议' : 'Improvement Suggestions'}>
                            <Typography.Paragraph style={{ marginBottom: 0 }}>
                              {nutritionResult.nutrition.improvementSuggestions.advice}
                            </Typography.Paragraph>
                          </Card>
                        )}
                      </>
                    )}

                    {/* 原始 AI 分析（折叠，仅当有原始数据且用户可能需查看时展示） */}
                    {nutritionResult.aiAnalysis && (
                      <Collapse
                        size="small"
                        items={[{
                          key: 'raw',
                          label: language === 'zh' ? '查看原始分析数据' : 'View raw analysis data',
                          children: (
                            <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', maxHeight: 320 }}>
                              {typeof nutritionResult.aiAnalysis === 'string'
                                ? nutritionResult.aiAnalysis
                                : JSON.stringify(nutritionResult.aiAnalysis, null, 2)}
                            </pre>
                          )
                        }]}
                      />
                    )}
                  </Space>
                </Card>
              )}
            </Space>
          </TabPane>

          {/* 个性化运动计划 */}
          <TabPane 
            tab={
              <span>
                <FireOutlined />
                {language === 'zh' ? '个性化运动计划' : 'Personalized Exercise Plan'}
              </span>
            } 
            key="exercise"
          >
            <Spin spinning={exerciseLoading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '运动计划说明' : 'Exercise Plan'}
                description={
                  language === 'zh' 
                    ? '基于用户健康状态和历史数据，使用AI生成个性化的运动计划，考虑多个健康目标（血糖控制、体重管理、心血管健康等）。'
                    : 'Based on user health status and historical data, use AI to generate personalized exercise plans, considering multiple health goals (blood glucose control, weight management, cardiovascular health, etc.).'}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              {!exercisePlan ? (
                <Card title={language === 'zh' ? '健康状态（可选）' : 'Health State (Optional)'}>
                  <Form
                    form={exerciseForm}
                    layout="vertical"
                    onFinish={handleGenerateExercisePlan}
                  >
                    <Form.Item
                      name="currentFitness"
                      label={language === 'zh' ? '当前体能水平' : 'Current Fitness Level'}
                    >
                      <Radio.Group>
                        <Radio value="low">{language === 'zh' ? '低' : 'Low'}</Radio>
                        <Radio value="medium">{language === 'zh' ? '中' : 'Medium'}</Radio>
                        <Radio value="high">{language === 'zh' ? '高' : 'High'}</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      name="goals"
                      label={language === 'zh' ? '运动目标' : 'Exercise Goals'}
                    >
                      <Checkbox.Group>
                        <Checkbox value="weight_loss">{language === 'zh' ? '减重' : 'Weight Loss'}</Checkbox>
                        <Checkbox value="blood_sugar_control">{language === 'zh' ? '血糖控制' : 'Blood Sugar Control'}</Checkbox>
                        <Checkbox value="cardiovascular_health">{language === 'zh' ? '心血管健康' : 'Cardiovascular Health'}</Checkbox>
                        <Checkbox value="muscle_strength">{language === 'zh' ? '肌肉力量' : 'Muscle Strength'}</Checkbox>
                      </Checkbox.Group>
                    </Form.Item>

                    <Form.Item
                      name="preferences"
                      label={language === 'zh' ? '运动偏好' : 'Exercise Preferences'}
                    >
                      <Checkbox.Group>
                        <Checkbox value="walking">{language === 'zh' ? '快走' : 'Walking'}</Checkbox>
                        <Checkbox value="running">{language === 'zh' ? '跑步' : 'Running'}</Checkbox>
                        <Checkbox value="swimming">{language === 'zh' ? '游泳' : 'Swimming'}</Checkbox>
                        <Checkbox value="cycling">{language === 'zh' ? '骑行' : 'Cycling'}</Checkbox>
                        <Checkbox value="yoga">{language === 'zh' ? '瑜伽' : 'Yoga'}</Checkbox>
                      </Checkbox.Group>
                    </Form.Item>

                    <Form.Item
                      name="availableTime"
                      label={language === 'zh' ? '每周可用时间（小时）' : 'Available Time per Week (hours)'}
                    >
                      <Input type="number" min={0} max={40} />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={exerciseLoading} block>
                        {language === 'zh' ? '生成运动计划' : 'Generate Exercise Plan'}
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              ) : (
                <Card 
                  title={language === 'zh' ? '运动计划' : 'Exercise Plan'}
                  extra={
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={() => {
                        setExercisePlan(null);
                        exerciseForm.resetFields();
                      }}
                    >
                      {language === 'zh' ? '重新生成' : 'Regenerate'}
                    </Button>
                  }
                >
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Exercise Types */}
                    {exercisePlan.exerciseTypes && exercisePlan.exerciseTypes.length > 0 && (
                      <Card title={language === 'zh' ? '推荐的运动类型' : 'Recommended Exercise Types'} size="small">
                        <List
                          dataSource={exercisePlan.exerciseTypes}
                          renderItem={(exercise: any) => {
                            const item = typeof exercise === 'object' ? exercise : { type: String(exercise) };
                            const benefits = Array.isArray(item.benefits) ? item.benefits : (item.benefits != null ? [String(item.benefits)] : []);
                            const titleText = [item.type, item.name].find(Boolean) || (typeof exercise === 'string' ? exercise : '');
                            return (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar icon={<FireOutlined />} style={{ backgroundColor: '#ff4d4f' }} />}
                                title={<Text strong>{titleText}</Text>}
                                description={
                                  <div>
                                    {(item.description != null && item.description !== '') && (
                                      <Text>{typeof item.description === 'string' ? item.description : String(item.description)}</Text>
                                    )}
                                    {benefits.length > 0 && (
                                      <div style={{ marginTop: '8px' }}>
                                        <Text type="secondary">{language === 'zh' ? '益处：' : 'Benefits: '}</Text>
                                        {benefits.map((benefit: any, idx: number) => (
                                          <Tag key={idx} color="blue" style={{ marginTop: '4px' }}>{typeof benefit === 'string' ? benefit : String(benefit)}</Tag>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                            );
                          }}
                        />
                      </Card>
                    )}

                    {/* Weekly Plan */}
                    {exercisePlan.weeklyPlan && exercisePlan.weeklyPlan.length > 0 && (
                      <Card title={language === 'zh' ? '每周运动计划' : 'Weekly Exercise Plan'}>
                        <List
                          dataSource={exercisePlan.weeklyPlan}
                          renderItem={(day: any) => (
                            <List.Item>
                              <List.Item.Meta
                                title={<Text strong>{day.day}</Text>}
                                description={
                                  <div>
                                    {day.exercises && day.exercises.map((ex: any, idx: number) => (
                                      <div key={idx} style={{ marginTop: idx > 0 ? '8px' : 0 }}>
                                        <Space>
                                          <Text strong>{ex.type}</Text>
                                          <Text type="secondary">{ex.duration} {language === 'zh' ? '分钟' : 'min'}</Text>
                                          <Tag color="orange">{ex.intensity}</Tag>
                                          {ex.time && <Text type="secondary">{ex.time}</Text>}
                                        </Space>
                                        {ex.notes && (
                                          <div style={{ marginTop: '4px' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>{ex.notes}</Text>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {day.totalDuration && (
                                      <div style={{ marginTop: '8px' }}>
                                        <Text type="secondary">
                                          {language === 'zh' ? '总时长：' : 'Total Duration: '}
                                          <Text strong>{day.totalDuration} {language === 'zh' ? '分钟' : 'min'}</Text>
                                        </Text>
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}

                    {/* Plan Summary */}
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title={language === 'zh' ? '运动强度' : 'Intensity'}
                            value={exercisePlan.intensity || 'medium'}
                            valueStyle={{ textTransform: 'capitalize' }}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title={language === 'zh' ? '每次时长' : 'Duration per Session'}
                            value={exercisePlan.duration || 0}
                            suffix={language === 'zh' ? '分钟' : 'min'}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title={language === 'zh' ? '每周次数' : 'Frequency'}
                            value={exercisePlan.frequency || 0}
                            suffix={language === 'zh' ? '次/周' : '/week'}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Progression */}
                    {exercisePlan.progression && Object.keys(exercisePlan.progression).length > 0 && (
                      <Card title={language === 'zh' ? '进阶计划' : 'Progression Plan'}>
                        <Descriptions bordered column={1}>
                          {Object.entries(exercisePlan.progression).map(([period, plan]: [string, any]) => (
                            <Descriptions.Item key={period} label={period}>
                              <Space>
                                <Text>{language === 'zh' ? '强度：' : 'Intensity: '}{plan.intensity}</Text>
                                <Text>{language === 'zh' ? '时长：' : 'Duration: '}{plan.duration} {language === 'zh' ? '分钟' : 'min'}</Text>
                                <Text>{language === 'zh' ? '频率：' : 'Frequency: '}{plan.frequency} {language === 'zh' ? '次/周' : '/week'}</Text>
                              </Space>
                            </Descriptions.Item>
                          ))}
                        </Descriptions>
                      </Card>
                    )}

                    {/* Precautions */}
                    {exercisePlan.precautions && exercisePlan.precautions.length > 0 && (
                      <Card title={language === 'zh' ? '注意事项' : 'Precautions'}>
                        <List
                          dataSource={exercisePlan.precautions}
                          renderItem={(precaution: any) => (
                            <List.Item>
                              <Alert
                                message={precaution.condition || precaution}
                                description={
                                  typeof precaution === 'object' ? (
                                    <div>
                                      {precaution.warning && <Text type="danger">{precaution.warning}</Text>}
                                      {precaution.recommendation && (
                                        <div style={{ marginTop: '8px' }}>
                                          <Text>{precaution.recommendation}</Text>
                                        </div>
                                      )}
                                    </div>
                                  ) : null
                                }
                                type="warning"
                                showIcon
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}

                    {/* Target Goals */}
                    {exercisePlan.targetGoals && Object.keys(exercisePlan.targetGoals).length > 0 && (
                      <Card title={language === 'zh' ? '目标设定' : 'Target Goals'}>
                        <List
                          dataSource={Object.entries(exercisePlan.targetGoals)}
                          renderItem={([goal, details]: [string, any]) => (
                            <List.Item>
                              <List.Item.Meta
                                title={
                                  <Text strong>
                                    {goal === 'bloodSugarControl' ? (language === 'zh' ? '血糖控制' : 'Blood Sugar Control') :
                                     goal === 'weightManagement' ? (language === 'zh' ? '体重管理' : 'Weight Management') :
                                     goal === 'cardiovascularHealth' ? (language === 'zh' ? '心血管健康' : 'Cardiovascular Health') :
                                     goal}
                                  </Text>
                                }
                                description={
                                  <div>
                                    {details.target && (
                                      <Text>{language === 'zh' ? '目标：' : 'Target: '}{details.target}</Text>
                                    )}
                                    {details.expectedImprovement && (
                                      <div style={{ marginTop: '4px' }}>
                                        <Text type="secondary">{language === 'zh' ? '预期改善：' : 'Expected Improvement: '}{details.expectedImprovement}</Text>
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    )}
                  </Space>
                </Card>
              )}
            </Space>
            </Spin>
          </TabPane>

          {/* 动态调整干预方案 */}
          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                {language === 'zh' ? '动态调整干预方案' : 'Dynamic Intervention Adjustment'}
              </span>
            } 
            key="adjustment"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '干预调整说明' : 'Intervention Adjustment'}
                description={
                  language === 'zh' 
                    ? '根据用户反馈和干预效果，使用AI动态调整干预方案（用药、营养、运动），优化干预策略。'
                    : 'Based on user feedback and intervention effectiveness, use AI to dynamically adjust intervention plans (medication, nutrition, exercise) and optimize intervention strategies.'}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              {!adjustmentResult ? (
                <Card title={language === 'zh' ? '反馈信息' : 'Feedback Information'}>
                  <Form
                    form={adjustmentForm}
                    layout="vertical"
                    onFinish={handleAdjustIntervention}
                  >
                    <Form.Item
                      name="type"
                      label={language === 'zh' ? '反馈类型' : 'Feedback Type'}
                      rules={[{ required: true, message: language === 'zh' ? '请选择反馈类型' : 'Please select feedback type' }]}
                    >
                      <Radio.Group>
                        <Radio value="medication">{language === 'zh' ? '用药' : 'Medication'}</Radio>
                        <Radio value="nutrition">{language === 'zh' ? '营养' : 'Nutrition'}</Radio>
                        <Radio value="exercise">{language === 'zh' ? '运动' : 'Exercise'}</Radio>
                        <Radio value="overall">{language === 'zh' ? '整体' : 'Overall'}</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      name="effectiveness"
                      label={language === 'zh' ? '效果评价' : 'Effectiveness'}
                      rules={[{ required: true, message: language === 'zh' ? '请选择效果评价' : 'Please select effectiveness' }]}
                    >
                      <Radio.Group>
                        <Radio value="good">{language === 'zh' ? '良好' : 'Good'}</Radio>
                        <Radio value="fair">{language === 'zh' ? '一般' : 'Fair'}</Radio>
                        <Radio value="poor">{language === 'zh' ? '较差' : 'Poor'}</Radio>
                      </Radio.Group>
                    </Form.Item>

                    <Form.Item
                      name="content"
                      label={language === 'zh' ? '反馈内容' : 'Feedback Content'}
                      rules={[{ required: true, message: language === 'zh' ? '请输入反馈内容' : 'Please enter feedback content' }]}
                    >
                      <TextArea rows={4} placeholder={language === 'zh' ? '请描述您的反馈...' : 'Please describe your feedback...'} />
                    </Form.Item>

                    <Form.Item
                      name="issues"
                      label={language === 'zh' ? '遇到的问题' : 'Issues Encountered'}
                    >
                      <Checkbox.Group>
                        <Checkbox value="side_effects">{language === 'zh' ? '副作用' : 'Side Effects'}</Checkbox>
                        <Checkbox value="difficulty_following">{language === 'zh' ? '难以遵循' : 'Difficulty Following'}</Checkbox>
                        <Checkbox value="no_improvement">{language === 'zh' ? '没有改善' : 'No Improvement'}</Checkbox>
                        <Checkbox value="too_strict">{language === 'zh' ? '过于严格' : 'Too Strict'}</Checkbox>
                      </Checkbox.Group>
                    </Form.Item>

                    <Form.Item
                      name="suggestions"
                      label={language === 'zh' ? '您的建议' : 'Your Suggestions'}
                    >
                      <TextArea rows={3} placeholder={language === 'zh' ? '每行一个建议...' : 'One suggestion per line...'} />
                    </Form.Item>

                    <Divider>{language === 'zh' ? '相关指标变化（可选）' : 'Related Metrics Changes (Optional)'}</Divider>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="glucose"
                          label={language === 'zh' ? '血糖 (mg/dL)' : 'Glucose (mg/dL)'}
                        >
                          <Input type="number" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="bloodPressure"
                          label={language === 'zh' ? '血压 (mmHg)' : 'Blood Pressure (mmHg)'}
                        >
                          <Input placeholder="120/80" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name="weight"
                          label={language === 'zh' ? '体重 (kg)' : 'Weight (kg)'}
                        >
                          <Input type="number" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={adjustmentLoading} block>
                        {language === 'zh' ? '提交反馈并调整' : 'Submit Feedback and Adjust'}
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              ) : (
                <Card 
                  title={language === 'zh' ? '调整结果' : 'Adjustment Results'}
                  extra={
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={() => {
                        setAdjustmentResult(null);
                        adjustmentForm.resetFields();
                      }}
                    >
                      {language === 'zh' ? '重新调整' : 'Readjust'}
                    </Button>
                  }
                >
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {/* Adjustment Summary */}
                    {adjustmentResult.adjustments && (
                      <>
                        {adjustmentResult.adjustments.summary && (
                          <Alert
                            message={language === 'zh' ? '调整摘要' : 'Adjustment Summary'}
                            description={adjustmentResult.adjustments.summary}
                            type="info"
                            showIcon
                          />
                        )}

                        {/* Changes */}
                        {adjustmentResult.adjustments.changes && adjustmentResult.adjustments.changes.length > 0 && (
                          <Card title={language === 'zh' ? '具体变化' : 'Specific Changes'} size="small">
                            <List
                              dataSource={adjustmentResult.adjustments.changes}
                              renderItem={(change: any) => (
                                <List.Item>
                                  <List.Item.Meta
                                    avatar={<Avatar icon={<SettingOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                                    title={
                                      <Tag color="blue">
                                        {change.category === 'medication' ? (language === 'zh' ? '用药' : 'Medication') :
                                         change.category === 'nutrition' ? (language === 'zh' ? '营养' : 'Nutrition') :
                                         change.category === 'exercise' ? (language === 'zh' ? '运动' : 'Exercise') :
                                         change.category}
                                      </Tag>
                                    }
                                    description={
                                      <div>
                                        <Text strong>{change.change}</Text>
                                        {change.reason && (
                                          <div style={{ marginTop: '4px' }}>
                                            <Text type="secondary">{language === 'zh' ? '原因：' : 'Reason: '}{change.reason}</Text>
                                          </div>
                                        )}
                                      </div>
                                    }
                                  />
                                </List.Item>
                              )}
                            />
                          </Card>
                        )}

                        {/* Expected Outcomes */}
                        {adjustmentResult.adjustments.expectedOutcomes && (
                          <Card title={language === 'zh' ? '预期效果' : 'Expected Outcomes'}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {adjustmentResult.adjustments.expectedOutcomes.shortTerm && (
                                <Alert
                                  message={language === 'zh' ? '短期预期' : 'Short-term Expected'}
                                  description={adjustmentResult.adjustments.expectedOutcomes.shortTerm}
                                  type="success"
                                  showIcon
                                />
                              )}
                              {adjustmentResult.adjustments.expectedOutcomes.longTerm && (
                                <Alert
                                  message={language === 'zh' ? '长期预期' : 'Long-term Expected'}
                                  description={adjustmentResult.adjustments.expectedOutcomes.longTerm}
                                  type="info"
                                  showIcon
                                />
                              )}
                            </Space>
                          </Card>
                        )}
                      </>
                    )}

                    {/* Updated Intervention */}
                    {adjustmentResult.intervention && (
                      <Card title={language === 'zh' ? '更新后的干预方案' : 'Updated Intervention Plan'}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {JSON.stringify(adjustmentResult.intervention, null, 2)}
                        </ReactMarkdown>
                      </Card>
                    )}
                  </Space>
                </Card>
              )}
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* 添加/编辑药品 Modal */}
      <Modal
        title={editingMedication ? (language === 'zh' ? '编辑药品' : 'Edit Medication') : (language === 'zh' ? '添加药品' : 'Add Medication')}
        open={medicationModalVisible}
        onCancel={handleMedicationModalCancel}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={medicationForm}
          layout="vertical"
          onFinish={handleMedicationModalSubmit}
          initialValues={{ frequency: '每日2次', time: '08:00, 20:00' }}
        >
          <Form.Item
            name="name"
            label={language === 'zh' ? '药物名称' : 'Medication Name'}
            rules={[{ required: true, message: language === 'zh' ? '请输入药物名称' : 'Please enter medication name' }]}
          >
            <Input placeholder={language === 'zh' ? '如：阿司匹林' : 'e.g. Aspirin'} />
          </Form.Item>
          <Form.Item
            name="dosage"
            label={language === 'zh' ? '剂量' : 'Dosage'}
            rules={[{ required: true, message: language === 'zh' ? '请输入剂量' : 'Please enter dosage' }]}
          >
            <Input placeholder={language === 'zh' ? '如：100mg' : 'e.g. 100mg'} />
          </Form.Item>
          <Form.Item
            name="frequency"
            label={language === 'zh' ? '频率' : 'Frequency'}
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="每日1次">{language === 'zh' ? '每日1次' : 'Once daily'}</Option>
              <Option value="每日2次">{language === 'zh' ? '每日2次' : 'Twice daily'}</Option>
              <Option value="每日3次">{language === 'zh' ? '每日3次' : 'Three times daily'}</Option>
              <Option value="每日4次">{language === 'zh' ? '每日4次' : 'Four times daily'}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="time"
            label={language === 'zh' ? '服药时间（多个用英文逗号分隔）' : 'Time (comma-separated, e.g. 08:00, 20:00)'}
          >
            <Input placeholder="08:00, 20:00" />
          </Form.Item>
          <Form.Item
            name="startDate"
            label={language === 'zh' ? '开始日期' : 'Start Date'}
            rules={[{ required: !editingMedication, message: language === 'zh' ? '请选择开始日期' : 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label={language === 'zh' ? '结束日期（可选）' : 'End Date (optional)'}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="purpose" label={language === 'zh' ? '用途（可选）' : 'Purpose (optional)'}>
            <Input placeholder={language === 'zh' ? '如：降压' : 'e.g. Blood pressure'} />
          </Form.Item>
          <Form.Item name="prescribingDoctor" label={language === 'zh' ? '开药医生（可选）' : 'Prescribing Doctor (optional)'}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={medicationSubmitLoading}>
                {language === 'zh' ? '保存' : 'Save'}
              </Button>
              <Button onClick={handleMedicationModalCancel}>{language === 'zh' ? '取消' : 'Cancel'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InterventionEnginePage;
