import React, { useState, useEffect } from 'react';
import { 
  Watch, 
  Activity, 
  Heart, 
  Zap, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  Upload,
  Download,
  Smartphone,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  Bell,
  TrendingDown,
  Activity as ActivityIcon
} from 'lucide-react';
import { wearablesAPI, riskMonitoringAPI } from '../services/api';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';
import './DeviceSyncPage.css';

interface DeviceStatus {
  fitbit: {
    connected: boolean;
    lastSync: string | null;
    dataAvailable: boolean;
  };
  apple: {
    connected: boolean;
    lastSync: string | null;
    dataAvailable: boolean;
  };
}

interface WearableSummary {
  totalSteps: number;
  totalCalories: number;
  averageHeartRate: number;
  totalSleepHours: number;
  lastSync: string | null;
  devices: string[];
  isMock?: boolean;
}

const DeviceSyncPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [summary, setSummary] = useState<WearableSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState(7);
  const [isMockData, setIsMockData] = useState(false);
  
  // Risk monitoring state
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoadingMonitoring, setIsLoadingMonitoring] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'devices' | 'monitoring'>('devices');

  // Check for authorization code in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const provider = urlParams.get('provider');
    
    if (code && provider === 'fitbit') {
      completeFitbitAuth(code);
    }
  }, []);

  // Load device status on component mount
  useEffect(() => {
    loadDeviceStatus();
    loadSummary();
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

  const loadDeviceStatus = async () => {
    try {
      setIsLoading(true);
      const response = await wearablesAPI.getStatus();
      if (response.success) {
        setDeviceStatus(response.data);
      }
    } catch (err: any) {
      console.error('Error loading device status:', err);
      setError(t('deviceSync.errors.loadStatusFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await wearablesAPI.getSummary(selectedDays);
      if (response.success) {
        // Ensure all required properties have default values
        const safeSummary: WearableSummary = {
          totalSteps: response.data.totalSteps || 0,
          totalCalories: response.data.totalCalories || 0,
          averageHeartRate: response.data.averageHeartRate || 0,
          totalSleepHours: response.data.totalSleepHours || 0,
          lastSync: response.data.lastSync || null,
          devices: response.data.devices || [],
          isMock: response.data.isMock || false
        };
        setSummary(safeSummary);
        setIsMockData(safeSummary.isMock || false);
      }
    } catch (err: any) {
      console.error('Error loading summary:', err);
    }
  };

  const startFitbitAuth = async () => {
    try {
      setError('');
      setSuccess('');
      // This will redirect to Fitbit
      window.location.href = '/api/wearables/fitbit/auth';
    } catch (err: any) {
      setError('Failed to start Fitbit authorization');
    }
  };

  const completeFitbitAuth = async (code: string) => {
    try {
      setIsLoading(true);
      const response = await wearablesAPI.completeFitbitAuth(code);
      if (response.success) {
        setSuccess('Fitbit connected successfully!');
        // Clear URL params
        window.history.replaceState({}, document.title, '/devices');
        // Reload device status
        await loadDeviceStatus();
        await loadSummary();
      }
    } catch (err: any) {
      setError('Failed to complete Fitbit authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const syncDevices = async () => {
    try {
      setIsSyncing(true);
      setError('');
      setSuccess('');
      
      const response = await wearablesAPI.syncDevices();
      if (response.success) {
        setSuccess('Device sync completed successfully!');
        setIsMockData(response.data.fitbit?.isMock || response.data.apple?.isMock || false);
        // Reload data
        await loadDeviceStatus();
        await loadSummary();
      }
    } catch (err: any) {
      setError('Failed to sync devices');
    } finally {
      setIsSyncing(false);
    }
  };

  const generateMockData = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      // Generate mock data for both devices
      await Promise.all([
        wearablesAPI.generateMockData('fitbit'),
        wearablesAPI.generateMockData('apple')
      ]);
      
      setSuccess('Mock data generated successfully!');
      setIsMockData(true);
      
      // Reload data
      await loadDeviceStatus();
      await loadSummary();
    } catch (err: any) {
      setError('Failed to generate mock data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockSummary = async () => {
    try {
      setIsLoading(true);
      const response = await wearablesAPI.getMockSummary();
      if (response.success) {
        setSummary(response.data);
        setIsMockData(true);
        setSuccess('Mock health summary loaded successfully!');
      }
    } catch (err: any) {
      setError('Failed to load mock summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleHealthUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Read the file content
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          // Parse CSV content (you might want to use a CSV parser library)
          const healthData = parseCSVHealthData(content);
          
          const response = await wearablesAPI.uploadAppleHealth(healthData);
          if (response.success) {
            setSuccess('Apple Health data uploaded successfully!');
            await loadDeviceStatus();
            await loadSummary();
          }
        } catch (err: any) {
          setError('Failed to process Apple Health data');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      setError('Failed to read file');
      setIsLoading(false);
    }
  };

  const parseCSVHealthData = (csvContent: string) => {
    // Simple CSV parsing - you might want to use a library like 'papaparse'
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim();
      });
      return row;
    });
    return data;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString();
  };

  const loadMonitoringStatus = async () => {
    try {
      setIsLoadingMonitoring(true);
      const response = await riskMonitoringAPI.getStatus();
      if (response.success) {
        setMonitoringStatus(response.status);
      }
    } catch (err: any) {
      console.error('Error loading monitoring status:', err);
    } finally {
      setIsLoadingMonitoring(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await riskMonitoringAPI.getAlerts(10);
      if (response.success) {
        setAlerts(response.alerts || []);
      }
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await riskMonitoringAPI.acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (err: any) {
      console.error('Error acknowledging alert:', err);
      setError('Failed to acknowledge alert');
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#eab308';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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
      arrhythmia: { zh: '心律失常预警', en: 'Arrhythmia Alert' }
    };
    return labels[alertType] || { zh: alertType, en: alertType };
  };

  if (isLoading) {
    return (
      <div className="device-sync-page">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" />
          <p>{t('deviceSync.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="device-sync-page">
      <div className="device-sync-header">
        <h1>{t('deviceSync.header.title')}</h1>
        <p>{t('deviceSync.header.subtitle')}</p>
      </div>

      <div className="device-sync-container">
        {/* Tab Navigation */}
        <div className="page-tabs">
          <button
            className={`tab-button ${activeTab === 'devices' ? 'active' : ''}`}
            onClick={() => setActiveTab('devices')}
          >
            <Watch size={20} />
            {language === 'zh' ? '设备同步' : 'Device Sync'}
          </button>
          <button
            className={`tab-button ${activeTab === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoring')}
          >
            <AlertTriangle size={20} />
            {language === 'zh' ? '实时风险监测' : 'Risk Monitoring'}
            {alerts.length > 0 && (
              <span className="alert-badge">{alerts.filter(a => !a.acknowledged).length}</span>
            )}
          </button>
        </div>

        {/* Device Sync Tab */}
        {activeTab === 'devices' && (
          <>
            {/* Device Status Cards */}
            <div className="device-status-section">
          <h2>{t('deviceSync.deviceStatus.title')}</h2>
          <div className="device-cards">
            {/* Fitbit Card */}
            <div className={`device-card ${deviceStatus?.fitbit.connected ? 'connected' : 'disconnected'}`}>
              <div className="device-icon">
                <Watch size={32} />
              </div>
              <div className="device-info">
                <h3>Fitbit</h3>
                <p className="status">
                  {deviceStatus?.fitbit.connected ? (
                    <><CheckCircle size={16} /> {t('deviceSync.deviceStatus.connected')}</>
                  ) : (
                    <><XCircle size={16} /> {t('deviceSync.deviceStatus.disconnected')}</>
                  )}
                </p>
                <p className="last-sync">
                  {t('deviceSync.deviceStatus.lastSync')}: {formatDate(deviceStatus?.fitbit.lastSync)}
                </p>
              </div>
              <div className="device-actions">
                {deviceStatus?.fitbit.connected ? (
                  <button 
                    className="sync-btn"
                    onClick={syncDevices}
                    disabled={isSyncing}
                  >
                    {isSyncing ? <RefreshCw size={16} className="spinning" /> : <RefreshCw size={16} />}
                    {t('deviceSync.deviceStatus.sync')}
                  </button>
                ) : (
                  <button 
                    className="connect-btn"
                    onClick={startFitbitAuth}
                    disabled={isLoading}
                  >
                    {t('deviceSync.deviceStatus.connect')}
                  </button>
                )}
              </div>
            </div>

            {/* Apple Health Card */}
            <div className={`device-card ${deviceStatus?.apple.connected ? 'connected' : 'disconnected'}`}>
              <div className="device-icon">
                <Smartphone size={32} />
              </div>
              <div className="device-info">
                <h3>Apple Health</h3>
                <p className="status">
                  {deviceStatus?.apple.connected ? (
                    <><CheckCircle size={16} /> {t('deviceSync.deviceStatus.connected')}</>
                  ) : (
                    <><XCircle size={16} /> {t('deviceSync.deviceStatus.disconnected')}</>
                  )}
                </p>
                <p className="last-sync">
                  {t('deviceSync.deviceStatus.lastSync')}: {formatDate(deviceStatus?.apple.lastSync)}
                </p>
              </div>
              <div className="device-actions">
                {deviceStatus?.apple.connected ? (
                  <button 
                    className="sync-btn"
                    onClick={syncDevices}
                    disabled={isSyncing}
                  >
                    {isSyncing ? <RefreshCw size={16} className="spinning" /> : <RefreshCw size={16} />}
                    {t('deviceSync.deviceStatus.sync')}
                  </button>
                ) : (
                  <label className="upload-btn">
                    <Upload size={16} />
                    {t('deviceSync.deviceStatus.uploadData')}
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleAppleHealthUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mock Data Section */}
        <div className="mock-data-section">
          <h2>{t('deviceSync.mockData.title')}</h2>
          <p className="mock-description">
            {t('deviceSync.mockData.description')}
          </p>
          
          <div className="mock-actions">
            <button 
              className="mock-generate-btn"
              onClick={generateMockData}
              disabled={isLoading}
            >
              {isLoading ? <RefreshCw size={20} className="spinning" /> : <Activity size={20} />}
              {t('deviceSync.mockData.generateButton')}
            </button>
            
            <button 
              className="mock-summary-btn"
              onClick={loadMockSummary}
              disabled={isLoading}
            >
              <TrendingUp size={20} />
              {t('deviceSync.mockData.loadSummaryButton')}
            </button>
          </div>
          
          {isMockData && (
            <div className="mock-indicator">
              <CheckCircle size={16} />
              <span>{t('deviceSync.mockData.currentIndicator')}</span>
            </div>
          )}
        </div>

        {/* Data Summary */}
        {summary && (
          <div className="data-summary-section">
            <h2>{t('deviceSync.summary.title')}</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-icon">
                  <Activity size={24} />
                </div>
                <div className="summary-content">
                  <h4>{t('deviceSync.summary.totalSteps')}</h4>
                  <p className="summary-value">{(summary.totalSteps || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <Zap size={24} />
                </div>
                <div className="summary-content">
                  <h4>{t('deviceSync.summary.totalCalories')}</h4>
                  <p className="summary-value">{(summary.totalCalories || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <Heart size={24} />
                </div>
                <div className="summary-content">
                  <h4>{t('deviceSync.summary.averageHeartRate')}</h4>
                  <p className="summary-value">{(summary.averageHeartRate || 0).toFixed(0)} bpm</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <Clock size={24} />
                </div>
                <div className="summary-content">
                  <h4>{t('deviceSync.summary.totalSleepHours')}</h4>
                  <p className="summary-value">{(summary.totalSleepHours || 0).toFixed(1)} {t('deviceSync.summary.hours')}</p>
                </div>
              </div>
            </div>
            
            <div className="summary-meta">
              <p>{t('deviceSync.summary.dataSource')}: {(summary.devices || []).join(', ')}</p>
              <p>{t('deviceSync.summary.lastSync')}: {formatTime(summary.lastSync || null)}</p>
            </div>
          </div>
        )}

        {/* Manual Sync Section */}
        <div className="manual-sync-section">
          <h2>{t('deviceSync.manualSync.title')}</h2>
          <div className="sync-options">
            <button 
              className="sync-all-btn"
              onClick={syncDevices}
              disabled={isSyncing || !deviceStatus?.fitbit.connected}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={20} className="spinning" />
                  {t('deviceSync.manualSync.syncing')}
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  {t('deviceSync.manualSync.syncAllDevices')}
                </>
              )}
            </button>
            
            <div className="sync-info">
              <p>{t('deviceSync.manualSync.description')}</p>
              <p>{t('deviceSync.manualSync.autoSave')}</p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Risk Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="risk-monitoring-section">
          <div className="section-header">
            <h2>
              <AlertTriangle size={24} />
              {language === 'zh' ? '实时风险监测' : 'Real-time Risk Monitoring'}
            </h2>
            <div className="monitoring-controls">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem' }}>
                  {language === 'zh' ? '自动刷新' : 'Auto Refresh'}
                </span>
              </label>
              <button
                className="refresh-monitoring-btn"
                onClick={() => {
                  loadMonitoringStatus();
                  loadAlerts();
                }}
                disabled={isLoadingMonitoring}
              >
                <RefreshCw size={16} className={isLoadingMonitoring ? 'spinning' : ''} />
                {language === 'zh' ? '刷新' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Monitoring Status */}
          {monitoringStatus && (
            <div className="monitoring-status-cards">
              <div className="status-card">
                <div className="status-icon" style={{ background: `linear-gradient(135deg, ${getRiskLevelColor(monitoringStatus.riskLevel)} 0%, ${getRiskLevelColor(monitoringStatus.riskLevel)}dd 100%)` }}>
                  <ActivityIcon size={24} />
                </div>
                <div className="status-content">
                  <h4>{language === 'zh' ? '整体风险等级' : 'Overall Risk Level'}</h4>
                  <p className="status-value" style={{ color: getRiskLevelColor(monitoringStatus.riskLevel) }}>
                    {monitoringStatus.riskLevel?.toUpperCase() || 'UNKNOWN'}
                  </p>
                </div>
              </div>

              <div className="status-card">
                <div className="status-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <Bell size={24} />
                </div>
                <div className="status-content">
                  <h4>{language === 'zh' ? '活跃预警' : 'Active Alerts'}</h4>
                  <p className="status-value">{monitoringStatus.activeAlerts?.length || 0}</p>
                </div>
              </div>

              <div className="status-card">
                <div className="status-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                  <CheckCircle size={24} />
                </div>
                <div className="status-content">
                  <h4>{language === 'zh' ? '监测状态' : 'Monitoring Status'}</h4>
                  <p className="status-value">
                    {monitoringStatus.isMonitoring 
                      ? (language === 'zh' ? '运行中' : 'Active')
                      : (language === 'zh' ? '未运行' : 'Inactive')
                    }
                  </p>
                </div>
              </div>

              {monitoringStatus.lastDataPoint && (
                <div className="status-card">
                  <div className="status-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                    <Clock size={24} />
                  </div>
                  <div className="status-content">
                    <h4>{language === 'zh' ? '最后数据点' : 'Last Data Point'}</h4>
                    <p className="status-value" style={{ fontSize: '0.9rem' }}>
                      {formatTime(monitoringStatus.lastDataPoint)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Current Metrics */}
          {monitoringStatus?.metrics && (
            <div className="current-metrics">
              <h3>{language === 'zh' ? '当前指标' : 'Current Metrics'}</h3>
              <div className="metrics-grid">
                {monitoringStatus.metrics.heartRate && (
                  <div className="metric-item">
                    <Heart size={20} />
                    <span className="metric-label">{language === 'zh' ? '心率' : 'Heart Rate'}</span>
                    <span className="metric-value">{monitoringStatus.metrics.heartRate} bpm</span>
                  </div>
                )}
                {monitoringStatus.metrics.glucose && (
                  <div className="metric-item">
                    <Activity size={20} />
                    <span className="metric-label">{language === 'zh' ? '血糖' : 'Glucose'}</span>
                    <span className="metric-value">{monitoringStatus.metrics.glucose} mg/dL</span>
                  </div>
                )}
                {monitoringStatus.metrics.hrv && (
                  <div className="metric-item">
                    <TrendingUp size={20} />
                    <span className="metric-label">{language === 'zh' ? 'HRV' : 'HRV'}</span>
                    <span className="metric-value">{monitoringStatus.metrics.hrv} ms</span>
                  </div>
                )}
                {monitoringStatus.metrics.steps && (
                  <div className="metric-item">
                    <Activity size={20} />
                    <span className="metric-label">{language === 'zh' ? '步数' : 'Steps'}</span>
                    <span className="metric-value">{monitoringStatus.metrics.steps}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Alerts */}
          {alerts.length > 0 && (
            <div className="alerts-section">
              <h3>
                <Bell size={20} />
                {language === 'zh' ? '预警通知' : 'Alert Notifications'}
              </h3>
              <div className="alerts-list">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`alert-item ${alert.acknowledged ? 'acknowledged' : ''}`}
                    style={{ borderLeftColor: getSeverityColor(alert.severity) }}
                  >
                    <div className="alert-header">
                      <div className="alert-type">
                        <AlertTriangle size={16} style={{ color: getSeverityColor(alert.severity) }} />
                        <span className="alert-type-label">
                          {language === 'zh' 
                            ? getAlertTypeLabel(alert.alertType).zh
                            : getAlertTypeLabel(alert.alertType).en
                          }
                        </span>
                        <span
                          className="alert-severity"
                          style={{ 
                            background: getSeverityColor(alert.severity),
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          {alert.severity?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                      <div className="alert-time">
                        {formatTime(alert.timestamp)}
                      </div>
                    </div>
                    <div className="alert-message">
                      {alert.details?.message || 
                        (language === 'zh' 
                          ? `检测到${getAlertTypeLabel(alert.alertType).zh}`
                          : `${getAlertTypeLabel(alert.alertType).en} detected`
                        )
                      }
                    </div>
                    {alert.action && (
                      <div className="alert-action">
                        <strong>{language === 'zh' ? '建议操作：' : 'Recommended Action: '}</strong>
                        {alert.action}
                      </div>
                    )}
                    {!alert.acknowledged && (
                      <button
                        className="acknowledge-btn"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle size={14} />
                        {language === 'zh' ? '确认' : 'Acknowledge'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {alerts.length === 0 && monitoringStatus && (
            <div className="no-alerts">
              <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
              <p>{language === 'zh' ? '暂无预警' : 'No active alerts'}</p>
            </div>
          )}
          </div>
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className="error-message">
            <XCircle size={20} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <CheckCircle size={20} />
            {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceSyncPage; 