import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  Bell,
  Heart,
  Activity,
  TrendingUp,
  Clock,
  Shield,
  Info,
  Play
} from 'lucide-react';
import { riskMonitoringAPI } from '../services/api';
import { useLanguageStore } from '@/stores/languageStore';
import { Card, Button, Input, Table, Tag, Space, Alert, Statistic, Row, Col, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import './DeviceSyncPage.css';

interface AlertItem {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  details?: any;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

interface MonitoringStatus {
  success: boolean;
  status: {
    riskLevel: string;
    isMonitoring: boolean;
    activeAlerts: AlertItem[];
    lastDataPoint?: string;
    metrics?: {
      heartRate?: number;
      glucose?: number;
      hrv?: number;
      steps?: number;
      bloodPressure?: {
        systolic: number;
        diastolic: number;
      };
    };
  };
}

const DeviceSyncPage: React.FC = () => {
  const { language } = useLanguageStore();
  
  // Risk monitoring state
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isDetectingAnomalies, setIsDetectingAnomalies] = useState(false);
  
  // Hypoglycemia prediction state
  const [glucoseData, setGlucoseData] = useState<Array<{timestamp: string; value: number; unit?: string}>>([]);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [glucoseInput, setGlucoseInput] = useState('');
  const [glucoseTimeInput, setGlucoseTimeInput] = useState('');
  
  // HRV analysis state
  const [heartRateData, setHeartRateData] = useState<Array<{timestamp: string; value: number}>>([]);
  const [hrvResult, setHrvResult] = useState<any>(null);
  const [isAnalyzingHRV, setIsAnalyzingHRV] = useState(false);
  const [hrInput, setHrInput] = useState('');
  const [hrTimeInput, setHrTimeInput] = useState('');

  // Load monitoring data on component mount
  useEffect(() => {
    loadMonitoringStatus();
    loadAlerts();
  }, []);

  // Auto-refresh monitoring data
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadMonitoringStatus();
      loadAlerts();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadMonitoringStatus = async () => {
    try {
      setIsLoadingMonitoring(true);
      const response = await riskMonitoringAPI.getStatus();
      if (response.success) {
        setMonitoringStatus(response);
      }
    } catch (err: any) {
      console.error('Error loading monitoring status:', err);
      message.error(language === 'zh' ? '加载监测状态失败' : 'Failed to load monitoring status');
    } finally {
      setIsLoadingMonitoring(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await riskMonitoringAPI.getAlerts(20);
      if (response.success) {
        setAlerts(response.alerts || []);
      }
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  };

  const handleDetectAnomalies = async () => {
    try {
      setIsDetectingAnomalies(true);
      const response = await riskMonitoringAPI.detectAnomalies([]);
      if (response.success) {
        if (response.hasAnomaly) {
          message.warning(
            language === 'zh' 
              ? `检测到 ${response.anomalies?.length || 0} 个异常` 
              : `${response.anomalies?.length || 0} anomalies detected`
          );
        } else {
          message.success(language === 'zh' ? '未检测到异常' : 'No anomalies detected');
        }
        // Reload alerts if any were generated
        if (response.alerts && response.alerts.length > 0) {
          await loadAlerts();
        }
      }
    } catch (err: any) {
      console.error('Error detecting anomalies:', err);
      message.error(language === 'zh' ? '检测异常失败' : 'Failed to detect anomalies');
    } finally {
      setIsDetectingAnomalies(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await riskMonitoringAPI.acknowledgeAlert(alertId);
      message.success(language === 'zh' ? '预警已确认' : 'Alert acknowledged');
      await loadAlerts();
    } catch (err: any) {
      console.error('Error acknowledging alert:', err);
      message.error(language === 'zh' ? '确认预警失败' : 'Failed to acknowledge alert');
    }
  };

  const handleAddGlucoseData = () => {
    if (!glucoseInput || !glucoseTimeInput) {
      message.warning(language === 'zh' ? '请输入血糖值和时间' : 'Please enter glucose value and time');
      return;
    }
    
    const value = parseFloat(glucoseInput);
    if (isNaN(value) || value <= 0) {
      message.warning(language === 'zh' ? '请输入有效的血糖值' : 'Please enter a valid glucose value');
      return;
    }

    const timestamp = new Date(glucoseTimeInput).toISOString();
    if (isNaN(new Date(glucoseTimeInput).getTime())) {
      message.warning(language === 'zh' ? '请输入有效的时间' : 'Please enter a valid time');
      return;
    }

    setGlucoseData([...glucoseData, { timestamp, value, unit: 'mg/dL' }]);
    setGlucoseInput('');
    setGlucoseTimeInput('');
    message.success(language === 'zh' ? '血糖数据已添加' : 'Glucose data added');
  };

  const handlePredictHypoglycemia = async () => {
    if (glucoseData.length < 2) {
      message.warning(language === 'zh' ? '至少需要2个血糖数据点' : 'At least 2 glucose data points required');
      return;
    }

    try {
      setIsPredicting(true);
      const response = await riskMonitoringAPI.predictHypoglycemia(glucoseData);
      if (response.success) {
        setPredictionResult(response);
        if (response.alert) {
          await loadAlerts();
        }
      } else {
        message.error(response.error || (language === 'zh' ? '预测失败' : 'Prediction failed'));
      }
    } catch (err: any) {
      console.error('Error predicting hypoglycemia:', err);
      message.error(language === 'zh' ? '预测失败' : 'Prediction failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleAddHeartRateData = () => {
    if (!hrInput || !hrTimeInput) {
      message.warning(language === 'zh' ? '请输入心率值和时间' : 'Please enter heart rate value and time');
      return;
    }
    
    const value = parseFloat(hrInput);
    if (isNaN(value) || value <= 0) {
      message.warning(language === 'zh' ? '请输入有效的心率值' : 'Please enter a valid heart rate value');
      return;
    }

    const timestamp = new Date(hrTimeInput).toISOString();
    if (isNaN(new Date(hrTimeInput).getTime())) {
      message.warning(language === 'zh' ? '请输入有效的时间' : 'Please enter a valid time');
      return;
    }

    setHeartRateData([...heartRateData, { timestamp, value }]);
    setHrInput('');
    setHrTimeInput('');
    message.success(language === 'zh' ? '心率数据已添加' : 'Heart rate data added');
  };

  const handleAnalyzeHRV = async () => {
    if (heartRateData.length < 5) {
      message.warning(language === 'zh' ? '至少需要5个心率数据点' : 'At least 5 heart rate data points required');
      return;
    }

    try {
      setIsAnalyzingHRV(true);
      const response = await riskMonitoringAPI.analyzeHRV(heartRateData);
      if (response.success) {
        setHrvResult(response);
        if (response.alert) {
          await loadAlerts();
        }
      } else {
        message.error(response.error || (language === 'zh' ? '分析失败' : 'Analysis failed'));
      }
    } catch (err: any) {
      console.error('Error analyzing HRV:', err);
      message.error(language === 'zh' ? '分析失败' : 'Analysis failed');
    } finally {
      setIsAnalyzingHRV(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    const labels: { [key: string]: { zh: string; en: string } } = {
      hypoglycemia: { zh: '低血糖预警', en: 'Hypoglycemia Alert' },
      cardiacFatigue: { zh: '心脏疲劳预警', en: 'Cardiac Fatigue Alert' },
      arrhythmia: { zh: '心律失常预警', en: 'Arrhythmia Alert' },
      hypertension: { zh: '高血压预警', en: 'Hypertension Alert' },
      sleepDisorder: { zh: '睡眠异常预警', en: 'Sleep Disorder Alert' },
      activityAnomaly: { zh: '活动异常预警', en: 'Activity Anomaly Alert' }
    };
    return labels[alertType] || { zh: alertType, en: alertType };
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return language === 'zh' ? '从未' : 'Never';
    return new Date(dateString).toLocaleString();
  };

  const alertColumns: ColumnsType<AlertItem> = [
    {
      title: language === 'zh' ? '类型' : 'Type',
      dataIndex: 'alertType',
      key: 'alertType',
      render: (type: string) => {
        const label = getAlertTypeLabel(type);
        return <span>{language === 'zh' ? label.zh : label.en}</span>;
      }
    },
    {
      title: language === 'zh' ? '严重程度' : 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)} style={{ fontWeight: 'bold' }}>
          {severity?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: language === 'zh' ? '消息' : 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: language === 'zh' ? '时间' : 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => formatTime(timestamp)
    },
    {
      title: language === 'zh' ? '状态' : 'Status',
      dataIndex: 'acknowledged',
      key: 'acknowledged',
      render: (acknowledged: boolean) => (
        <Tag color={acknowledged ? 'green' : 'orange'}>
          {acknowledged 
            ? (language === 'zh' ? '已确认' : 'Acknowledged')
            : (language === 'zh' ? '未确认' : 'Unacknowledged')
          }
        </Tag>
      )
    },
    {
      title: language === 'zh' ? '操作' : 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          {!record.acknowledged && (
            <Button
              type="primary"
              size="small"
              onClick={() => acknowledgeAlert(record.id)}
            >
              {language === 'zh' ? '确认' : 'Acknowledge'}
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="device-sync-page app-page-shell">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          {language === 'zh' ? '实时风险监测' : 'Real-time Risk Monitoring'}
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          {language === 'zh' 
            ? '实时监测您的健康指标，提前预警潜在风险' 
            : 'Monitor your health metrics in real-time and get early warnings for potential risks'}
        </p>
      </div>

      {/* Monitoring Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type="primary"
              icon={<Play />}
              loading={isDetectingAnomalies}
              onClick={handleDetectAnomalies}
            >
              {language === 'zh' ? '手动触发异常检测' : 'Manual Anomaly Detection'}
            </Button>
            <Button
              icon={<RefreshCw className={isLoadingMonitoring ? 'spinning' : ''} />}
              loading={isLoadingMonitoring}
              onClick={() => {
                loadMonitoringStatus();
                loadAlerts();
              }}
            >
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>
          </Space>
          <Space>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>{language === 'zh' ? '自动刷新（30秒）' : 'Auto Refresh (30s)'}</span>
            </label>
          </Space>
        </Space>
      </Card>

      {/* Monitoring Status */}
      {monitoringStatus?.status && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={language === 'zh' ? '整体风险等级' : 'Overall Risk Level'}
                value={monitoringStatus.status.riskLevel?.toUpperCase() || 'UNKNOWN'}
                valueStyle={{ color: getRiskLevelColor(monitoringStatus.status.riskLevel) }}
                prefix={<Shield />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={language === 'zh' ? '活跃预警' : 'Active Alerts'}
                value={monitoringStatus.status.activeAlerts?.length || 0}
                prefix={<Bell />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={language === 'zh' ? '监测状态' : 'Monitoring Status'}
                value={monitoringStatus.status.isMonitoring 
                  ? (language === 'zh' ? '运行中' : 'Active')
                  : (language === 'zh' ? '未运行' : 'Inactive')
                }
                prefix={<Activity />}
                valueStyle={{ 
                  color: monitoringStatus.status.isMonitoring ? '#10b981' : '#6b7280',
                  fontSize: '20px'
                }}
              />
            </Card>
          </Col>
          {monitoringStatus.status.lastDataPoint && (
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title={language === 'zh' ? '最后数据点' : 'Last Data Point'}
                  value={formatTime(monitoringStatus.status.lastDataPoint)}
                  prefix={<Clock />}
                  valueStyle={{ fontSize: '14px' }}
                />
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Current Metrics */}
      {monitoringStatus?.status?.metrics && (
        <Card 
          title={
            <Space>
              <Activity />
              <span>{language === 'zh' ? '当前健康指标' : 'Current Health Metrics'}</span>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={[16, 16]}>
            {monitoringStatus.status.metrics.heartRate && (
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={language === 'zh' ? '心率' : 'Heart Rate'}
                  value={monitoringStatus.status.metrics.heartRate}
                  suffix="bpm"
                  prefix={<Heart style={{ color: '#ef4444' }} />}
                />
              </Col>
            )}
            {monitoringStatus.status.metrics.glucose && (
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={language === 'zh' ? '血糖' : 'Glucose'}
                  value={monitoringStatus.status.metrics.glucose}
                  suffix="mg/dL"
                  prefix={<Activity style={{ color: '#10b981' }} />}
                />
              </Col>
            )}
            {monitoringStatus.status.metrics.hrv && (
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={language === 'zh' ? '心率变异性' : 'HRV'}
                  value={monitoringStatus.status.metrics.hrv}
                  suffix="ms"
                  prefix={<TrendingUp style={{ color: '#3b82f6' }} />}
                />
              </Col>
            )}
            {monitoringStatus.status.metrics.bloodPressure && (
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={language === 'zh' ? '血压' : 'Blood Pressure'}
                  value={`${monitoringStatus.status.metrics.bloodPressure.systolic}/${monitoringStatus.status.metrics.bloodPressure.diastolic}`}
                  suffix="mmHg"
                  prefix={<Heart style={{ color: '#8b5cf6' }} />}
                />
              </Col>
            )}
            {monitoringStatus.status.metrics.steps && (
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={language === 'zh' ? '步数' : 'Steps'}
                  value={monitoringStatus.status.metrics.steps}
                  prefix={<Activity style={{ color: '#f59e0b' }} />}
                />
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Alerts Section */}
      <Card 
        title={
          <Space>
            <Bell />
            <span>{language === 'zh' ? '预警通知' : 'Alert Notifications'}</span>
            {alerts.filter(a => !a.acknowledged).length > 0 && (
              <Tag color="red">{alerts.filter(a => !a.acknowledged).length}</Tag>
            )}
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        {alerts.length > 0 ? (
          <Table
            columns={alertColumns}
            dataSource={alerts}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            rowClassName={(record) => record.acknowledged ? 'acknowledged-row' : ''}
          />
        ) : (
          <Alert
            message={language === 'zh' ? '暂无预警' : 'No active alerts'}
            description={language === 'zh' ? '当前没有需要关注的预警信息' : 'There are no alerts that require attention at this time'}
            type="success"
            icon={<CheckCircle />}
            showIcon
          />
        )}
      </Card>

      {/* Hypoglycemia Prediction */}
      <Card 
        title={
          <Space>
            <AlertTriangle style={{ color: '#f59e0b' }} />
            <span>{language === 'zh' ? '低血糖预测' : 'Hypoglycemia Prediction'}</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message={language === 'zh' ? '使用说明' : 'Instructions'}
          description={
            language === 'zh'
              ? '输入至少2个血糖数据点（按时间顺序），系统将预测未来15-30分钟内发生低血糖的风险'
              : 'Enter at least 2 glucose data points (in chronological order), and the system will predict the risk of hypoglycemia in the next 15-30 minutes'
          }
          type="info"
          icon={<Info />}
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Input
              placeholder={language === 'zh' ? '血糖值 (mg/dL)' : 'Glucose value (mg/dL)'}
              value={glucoseInput}
              onChange={(e) => setGlucoseInput(e.target.value)}
              type="number"
              style={{ width: '200px' }}
            />
            <Input
              placeholder={language === 'zh' ? '时间' : 'Time'}
              value={glucoseTimeInput}
              onChange={(e) => setGlucoseTimeInput(e.target.value)}
              type="datetime-local"
              style={{ width: '250px' }}
            />
            <Button onClick={handleAddGlucoseData}>
              {language === 'zh' ? '添加数据点' : 'Add Data Point'}
            </Button>
          </Space>

          {glucoseData.length > 0 && (
            <div>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                {language === 'zh' ? '已添加的数据点：' : 'Added data points:'} {glucoseData.length}
              </p>
              <Table
                dataSource={glucoseData.map((item, index) => ({ ...item, key: index }))}
                columns={[
                  { title: language === 'zh' ? '时间' : 'Time', dataIndex: 'timestamp', render: (t) => formatTime(t) },
                  { title: language === 'zh' ? '血糖值' : 'Glucose', dataIndex: 'value', render: (v) => `${v} mg/dL` }
                ]}
                pagination={false}
                size="small"
              />
              <Button
                type="primary"
                loading={isPredicting}
                onClick={handlePredictHypoglycemia}
                style={{ marginTop: '12px' }}
              >
                {language === 'zh' ? '开始预测' : 'Start Prediction'}
              </Button>
              <Button
                onClick={() => {
                  setGlucoseData([]);
                  setPredictionResult(null);
                }}
                style={{ marginTop: '12px', marginLeft: '8px' }}
              >
                {language === 'zh' ? '清空' : 'Clear'}
              </Button>
            </div>
          )}

          {predictionResult && (
            <Alert
              message={
                <Space>
                  <span>{language === 'zh' ? '预测结果' : 'Prediction Result'}</span>
                  <Tag color={getRiskLevelColor(predictionResult.prediction.riskLevel)}>
                    {predictionResult.prediction.riskLevel?.toUpperCase()}
                  </Tag>
                </Space>
              }
              description={
                <div>
                  <p><strong>{language === 'zh' ? '预测血糖值：' : 'Predicted Glucose: '}</strong>
                    {predictionResult.prediction.predictedGlucose} mg/dL
                  </p>
                  <p><strong>{language === 'zh' ? '时间窗口：' : 'Time Window: '}</strong>
                    {predictionResult.prediction.timeWindow}
                  </p>
                  <p><strong>{language === 'zh' ? '置信度：' : 'Confidence: '}</strong>
                    {(predictionResult.prediction.confidence * 100).toFixed(1)}%
                  </p>
                  <p><strong>{language === 'zh' ? '建议：' : 'Recommendation: '}</strong>
                    {predictionResult.prediction.recommendation}
                  </p>
                  {predictionResult.alert && (
                    <Alert
                      message={language === 'zh' ? '已生成预警' : 'Alert Generated'}
                      description={predictionResult.alert.message}
                      type="warning"
                      style={{ marginTop: '12px' }}
                    />
                  )}
                </div>
              }
              type={predictionResult.prediction.riskLevel === 'high' ? 'error' : predictionResult.prediction.riskLevel === 'medium' ? 'warning' : 'success'}
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* HRV Analysis */}
      <Card 
        title={
          <Space>
            <Heart style={{ color: '#ef4444' }} />
            <span>{language === 'zh' ? '心率变异性分析' : 'HRV Trend Analysis'}</span>
          </Space>
        }
      >
        <Alert
          message={language === 'zh' ? '使用说明' : 'Instructions'}
          description={
            language === 'zh'
              ? '输入至少5个心率数据点（按时间顺序），系统将分析心率变异性趋势，检测心脏疲劳风险'
              : 'Enter at least 5 heart rate data points (in chronological order), and the system will analyze HRV trends and detect cardiac fatigue risks'
          }
          type="info"
          icon={<Info />}
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Input
              placeholder={language === 'zh' ? '心率值 (bpm)' : 'Heart Rate (bpm)'}
              value={hrInput}
              onChange={(e) => setHrInput(e.target.value)}
              type="number"
              style={{ width: '200px' }}
            />
            <Input
              placeholder={language === 'zh' ? '时间' : 'Time'}
              value={hrTimeInput}
              onChange={(e) => setHrTimeInput(e.target.value)}
              type="datetime-local"
              style={{ width: '250px' }}
            />
            <Button onClick={handleAddHeartRateData}>
              {language === 'zh' ? '添加数据点' : 'Add Data Point'}
            </Button>
          </Space>

          {heartRateData.length > 0 && (
            <div>
              <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                {language === 'zh' ? '已添加的数据点：' : 'Added data points:'} {heartRateData.length}
              </p>
              <Table
                dataSource={heartRateData.map((item, index) => ({ ...item, key: index }))}
                columns={[
                  { title: language === 'zh' ? '时间' : 'Time', dataIndex: 'timestamp', render: (t) => formatTime(t) },
                  { title: language === 'zh' ? '心率' : 'Heart Rate', dataIndex: 'value', render: (v) => `${v} bpm` }
                ]}
                pagination={false}
                size="small"
              />
              <Button
                type="primary"
                loading={isAnalyzingHRV}
                onClick={handleAnalyzeHRV}
                style={{ marginTop: '12px' }}
              >
                {language === 'zh' ? '开始分析' : 'Start Analysis'}
              </Button>
              <Button
                onClick={() => {
                  setHeartRateData([]);
                  setHrvResult(null);
                }}
                style={{ marginTop: '12px', marginLeft: '8px' }}
              >
                {language === 'zh' ? '清空' : 'Clear'}
              </Button>
            </div>
          )}

          {hrvResult && (
            <Alert
              message={language === 'zh' ? '分析结果' : 'Analysis Result'}
              description={
                <div>
                  <p><strong>{language === 'zh' ? '趋势：' : 'Trend: '}</strong>
                    {hrvResult.trend || 'N/A'}
                  </p>
                  <p><strong>{language === 'zh' ? '下降速率：' : 'Decline Rate: '}</strong>
                    {hrvResult.declineRate || 0}
                  </p>
                  <p><strong>{language === 'zh' ? '严重程度：' : 'Severity: '}</strong>
                    <Tag color={getSeverityColor(hrvResult.severity)}>
                      {hrvResult.severity?.toUpperCase()}
                    </Tag>
                  </p>
                  <p><strong>{language === 'zh' ? '建议：' : 'Recommendation: '}</strong>
                    {hrvResult.recommendation}
                  </p>
                  {hrvResult.alert && (
                    <Alert
                      message={language === 'zh' ? '已生成预警' : 'Alert Generated'}
                      description={hrvResult.alert.message}
                      type="warning"
                      style={{ marginTop: '12px' }}
                    />
                  )}
                </div>
              }
              type={hrvResult.severity === 'high' || hrvResult.severity === 'critical' ? 'error' : hrvResult.severity === 'medium' ? 'warning' : 'success'}
              showIcon
            />
          )}
        </Space>
      </Card>
    </div>
  );
};

export default DeviceSyncPage;
