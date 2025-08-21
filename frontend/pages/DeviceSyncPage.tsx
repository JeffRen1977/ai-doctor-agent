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
  Clock
} from 'lucide-react';
import { wearablesAPI } from '../services/api';
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
  }, []);

  const loadDeviceStatus = async () => {
    try {
      setIsLoading(true);
      const response = await wearablesAPI.getStatus();
      if (response.success) {
        setDeviceStatus(response.data);
      }
    } catch (err: any) {
      console.error('Error loading device status:', err);
      setError('Failed to load device status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await wearablesAPI.getSummary(selectedDays);
      if (response.success) {
        setSummary(response.data);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString();
  };

  if (isLoading) {
    return (
      <div className="device-sync-page">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" />
          <p>Loading device status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="device-sync-page">
      <div className="device-sync-header">
        <h1>📱 设备同步</h1>
        <p>连接您的可穿戴设备，同步健康数据</p>
      </div>

      <div className="device-sync-container">
        {/* Device Status Cards */}
        <div className="device-status-section">
          <h2>🔗 设备连接状态</h2>
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
                    <><CheckCircle size={16} /> 已连接</>
                  ) : (
                    <><XCircle size={16} /> 未连接</>
                  )}
                </p>
                <p className="last-sync">
                  最后同步: {formatDate(deviceStatus?.fitbit.lastSync)}
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
                    同步
                  </button>
                ) : (
                  <button 
                    className="connect-btn"
                    onClick={startFitbitAuth}
                    disabled={isLoading}
                  >
                    连接
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
                    <><CheckCircle size={16} /> 已连接</>
                  ) : (
                    <><XCircle size={16} /> 未连接</>
                  )}
                </p>
                <p className="last-sync">
                  最后同步: {formatDate(deviceStatus?.apple.lastSync)}
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
                    同步
                  </button>
                ) : (
                  <label className="upload-btn">
                    <Upload size={16} />
                    上传数据
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

        {/* Data Summary */}
        {summary && (
          <div className="data-summary-section">
            <h2>📊 健康数据摘要</h2>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-icon">
                  <Activity size={24} />
                </div>
                <div className="summary-content">
                  <h4>总步数</h4>
                  <p className="summary-value">{summary.totalSteps.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <Zap size={24} />
                </div>
                <div className="summary-content">
                  <h4>消耗卡路里</h4>
                  <p className="summary-value">{summary.totalCalories.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <Heart size={24} />
                </div>
                <div className="summary-content">
                  <h4>平均心率</h4>
                  <p className="summary-value">{summary.averageHeartRate.toFixed(0)} bpm</p>
                </div>
              </div>
              
              <div className="summary-card">
                <div className="summary-icon">
                  <Clock size={24} />
                </div>
                <div className="summary-content">
                  <h4>睡眠时长</h4>
                  <p className="summary-value">{summary.totalSleepHours.toFixed(1)} 小时</p>
                </div>
              </div>
            </div>
            
            <div className="summary-meta">
              <p>数据来源: {summary.devices.join(', ')}</p>
              <p>最后同步: {formatTime(summary.lastSync)}</p>
            </div>
          </div>
        )}

        {/* Manual Sync Section */}
        <div className="manual-sync-section">
          <h2>🔄 手动同步</h2>
          <div className="sync-options">
            <button 
              className="sync-all-btn"
              onClick={syncDevices}
              disabled={isSyncing || !deviceStatus?.fitbit.connected}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={20} className="spinning" />
                  同步中...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  同步所有设备
                </>
              )}
            </button>
            
            <div className="sync-info">
              <p>点击按钮同步所有已连接设备的最新数据</p>
              <p>数据将自动保存到您的健康档案中</p>
            </div>
          </div>
        </div>

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