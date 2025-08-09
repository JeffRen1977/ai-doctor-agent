import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  List, 
  Avatar, 
  Tag, 
  Typography, 
  Space,
  Switch,
  Progress,
  Alert,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  message,
  Badge,
  Tooltip,
  Statistic,
  Table
} from 'antd';
import { 
  SyncOutlined, 
  PlusOutlined, 
  SettingOutlined,
  HeartOutlined,
  AppleOutlined,
  AndroidOutlined,
  WifiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Device {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_tracker' | 'blood_pressure' | 'glucose_meter' | 'scale' | 'thermometer';
  brand: string;
  model: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  batteryLevel: number;
  dataTypes: string[];
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
}

interface SyncData {
  deviceId: string;
  dataType: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'synced' | 'syncing' | 'failed';
}

const DeviceSyncPage: React.FC = () => {
  const { language } = useLanguageStore();
  
  const t = (key: string) => getTranslation(language, key);

  // 获取状态文本的翻译
  const getStatusText = (status: string) => {
    if (language === 'zh') {
      switch (status) {
        case 'connected': return '已连接';
        case 'disconnected': return '未连接';
        case 'syncing': return '同步中';
        case 'error': return '连接错误';
        default: return '未知';
      }
    } else {
      switch (status) {
        case 'connected': return 'Connected';
        case 'disconnected': return 'Disconnected';
        case 'syncing': return 'Syncing';
        case 'error': return 'Error';
        default: return 'Unknown';
      }
    }
  };

  // 获取同步状态文本的翻译
  const getSyncStatusText = (status: string) => {
    if (language === 'zh') {
      switch (status) {
        case 'synced': return '已同步';
        case 'syncing': return '同步中';
        case 'failed': return '同步失败';
        default: return '未知';
      }
    } else {
      switch (status) {
        case 'synced': return 'Synced';
        case 'syncing': return 'Syncing';
        case 'failed': return 'Failed';
        default: return 'Unknown';
      }
    }
  };

  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: language === 'zh' ? 'Apple Watch Series 8' : 'Apple Watch Series 8',
      type: 'smartwatch',
      brand: 'Apple',
      model: 'Series 8',
      status: 'connected',
      lastSync: '2024-01-15 14:30:00',
      batteryLevel: 85,
      dataTypes: language === 'zh' ? ['心率', '步数', '睡眠', '血氧', '心电图'] : ['Heart Rate', 'Steps', 'Sleep', 'SpO2', 'ECG'],
      syncFrequency: 'realtime'
    },
    {
      id: '2',
      name: language === 'zh' ? '小米手环 8' : 'Xiaomi Mi Band 8',
      type: 'fitness_tracker',
      brand: 'Xiaomi',
      model: 'Mi Band 8',
      status: 'connected',
      lastSync: '2024-01-15 13:45:00',
      batteryLevel: 92,
      dataTypes: language === 'zh' ? ['心率', '步数', '睡眠', '血氧'] : ['Heart Rate', 'Steps', 'Sleep', 'SpO2'],
      syncFrequency: 'hourly'
    },
    {
      id: '3',
      name: language === 'zh' ? '欧姆龙血压计' : 'Omron Blood Pressure Monitor',
      type: 'blood_pressure',
      brand: 'Omron',
      model: 'HEM-7136',
      status: 'disconnected',
      lastSync: '2024-01-14 09:15:00',
      batteryLevel: 60,
      dataTypes: language === 'zh' ? ['血压'] : ['Blood Pressure'],
      syncFrequency: 'manual'
    },
    {
      id: '4',
      name: language === 'zh' ? '雅培血糖仪' : 'Abbott Glucose Meter',
      type: 'glucose_meter',
      brand: 'Abbott',
      model: 'FreeStyle Libre',
      status: 'syncing',
      lastSync: '2024-01-15 12:00:00',
      batteryLevel: 78,
      dataTypes: language === 'zh' ? ['血糖'] : ['Glucose'],
      syncFrequency: 'daily'
    }
  ]);

  const [syncData, setSyncData] = useState<SyncData[]>([
    {
      deviceId: '1',
      dataType: language === 'zh' ? '心率' : 'Heart Rate',
      value: 72,
      unit: language === 'zh' ? 'bpm' : 'bpm',
      timestamp: '2024-01-15 14:30:00',
      status: 'synced'
    },
    {
      deviceId: '1',
      dataType: language === 'zh' ? '步数' : 'Steps',
      value: 8234,
      unit: language === 'zh' ? '步' : 'steps',
      timestamp: '2024-01-15 14:30:00',
      status: 'synced'
    },
    {
      deviceId: '2',
      dataType: language === 'zh' ? '心率' : 'Heart Rate',
      value: 75,
      unit: language === 'zh' ? 'bpm' : 'bpm',
      timestamp: '2024-01-15 13:45:00',
      status: 'synced'
    },
    {
      deviceId: '4',
      dataType: language === 'zh' ? '血糖' : 'Glucose',
      value: 95,
      unit: language === 'zh' ? 'mg/dL' : 'mg/dL',
      timestamp: '2024-01-15 12:00:00',
      status: 'syncing'
    }
  ]);

  const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false);
  const [form] = Form.useForm();

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartwatch': return <AppleOutlined />;
      case 'fitness_tracker': return <HeartOutlined />;
      case 'blood_pressure': return <HeartOutlined />;
      case 'glucose_meter': return <SettingOutlined />;
      case 'scale': return <SettingOutlined />;
      case 'thermometer': return <SettingOutlined />;
      default: return <SettingOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'disconnected': return 'default';
      case 'syncing': return 'blue';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const handleSyncDevice = (deviceId: string) => {
    setDevices(prev => 
      prev.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'syncing' }
          : device
      )
    );

    // 模拟同步过程
    setTimeout(() => {
      setDevices(prev => 
        prev.map(device => 
          device.id === deviceId 
            ? { ...device, status: 'connected', lastSync: new Date().toLocaleString() }
            : device
        )
      );
      message.success(language === 'zh' ? '设备同步成功！' : 'Device synced successfully!');
    }, 2000);
  };

  const handleAddDevice = async (values: any) => {
    try {
      const newDevice: Device = {
        id: Date.now().toString(),
        name: values.name,
        type: values.type,
        brand: values.brand,
        model: values.model,
        status: 'disconnected',
        lastSync: '',
        batteryLevel: 100,
        dataTypes: values.dataTypes || [],
        syncFrequency: values.syncFrequency || 'manual'
      };

      setDevices(prev => [...prev, newDevice]);
      message.success(language === 'zh' ? '设备添加成功！' : 'Device added successfully!');
      setIsAddDeviceModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(language === 'zh' ? '设备添加失败，请重试' : 'Failed to add device, please try again');
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    setDevices(prev => prev.filter(device => device.id !== deviceId));
    message.success(language === 'zh' ? '设备已移除' : 'Device removed');
  };

  const deviceColumns = [
    {
      title: language === 'zh' ? '设备' : 'Device',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Device) => (
        <Space>
          <Avatar icon={getDeviceIcon(record.type)} />
          <div>
            <div>{text}</div>
            <Text type="secondary">{record.brand} {record.model}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: language === 'zh' ? '状态' : 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Device) => (
        <Space>
          <Badge 
            status={status === 'connected' ? 'success' : 
                   status === 'syncing' ? 'processing' : 
                   status === 'error' ? 'error' : 'default'} 
          />
          <Text>{getStatusText(status)}</Text>
        </Space>
      ),
    },
    {
      title: language === 'zh' ? '电量' : 'Battery',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      render: (level: number) => (
        <Progress percent={level} size="small" showInfo={false} />
      ),
    },
    {
      title: language === 'zh' ? '最后同步' : 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (time: string) => (
        <Text type="secondary">{time || (language === 'zh' ? '从未同步' : 'Never synced')}</Text>
      ),
    },
    {
      title: language === 'zh' ? '数据类型' : 'Data Types',
      dataIndex: 'dataTypes',
      key: 'dataTypes',
      render: (types: string[]) => (
        <Space>
          {types.map(type => (
            <Tag key={type}>{type}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: language === 'zh' ? '操作' : 'Actions',
      key: 'action',
      render: (text: string, record: Device) => (
        <Space>
          <Button 
            size="small" 
            icon={<SyncOutlined />}
            loading={record.status === 'syncing'}
            onClick={() => handleSyncDevice(record.id)}
          >
            {language === 'zh' ? '同步' : 'Sync'}
          </Button>
          <Button size="small" icon={<SettingOutlined />}>
            {language === 'zh' ? '设置' : 'Settings'}
          </Button>
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveDevice(record.id)}
          >
            {language === 'zh' ? '移除' : 'Remove'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{t('deviceSync.title')}</Title>
      
      {/* 设备概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '已连接设备' : 'Connected Devices'}
              value={devices.filter(d => d.status === 'connected').length}
              suffix={`/ ${devices.length}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '今日同步数据' : 'Today\'s Synced Data'}
              value={syncData.filter(d => d.status === 'synced').length}
              suffix={language === 'zh' ? '条' : ''}
              prefix={<SyncOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '同步成功率' : 'Sync Success Rate'}
              value={95.2}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '数据总量' : 'Total Data'}
              value={1247}
              suffix={language === 'zh' ? '条' : ''}
              prefix={<HeartOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 设备列表 */}
      <Card 
        title={language === 'zh' ? '设备管理' : 'Device Management'} 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsAddDeviceModalVisible(true)}
          >
            {language === 'zh' ? '添加设备' : 'Add Device'}
          </Button>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table 
          columns={deviceColumns} 
          dataSource={devices}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* 数据同步状态 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title={language === 'zh' ? '最近同步数据' : 'Recent Sync Data'}>
            <List
              dataSource={syncData.slice(0, 5)}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={getDeviceIcon(devices.find(d => d.id === item.deviceId)?.type || '')}
                        size="small"
                      />
                    }
                    title={`${item.dataType}: ${item.value} ${item.unit}`}
                    description={item.timestamp}
                  />
                  <Tag color={item.status === 'synced' ? 'green' : 
                              item.status === 'syncing' ? 'blue' : 'red'}>
                    {getSyncStatusText(item.status)}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={language === 'zh' ? '连接状态' : 'Connection Status'}>
            <List
              dataSource={devices}
              renderItem={(device) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={getDeviceIcon(device.type)} />}
                    title={device.name}
                    description={`${device.brand} ${device.model}`}
                  />
                  <Space>
                    <Tag color={getStatusColor(device.status)}>
                      {getStatusText(device.status)}
                    </Tag>
                    <Text type="secondary">{language === 'zh' ? '电量' : 'Battery'} {device.batteryLevel}%</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 支持的设备类型 */}
      <Card title={language === 'zh' ? '支持的设备类型' : 'Supported Device Types'} style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <AppleOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                <Title level={5}>{language === 'zh' ? '智能手表' : 'Smart Watches'}</Title>
                <Text type="secondary">{language === 'zh' ? 'Apple Watch, 小米手表等' : 'Apple Watch, Xiaomi Watches, etc.'}</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <HeartOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                <Title level={5}>{language === 'zh' ? '健康设备' : 'Health Devices'}</Title>
                <Text type="secondary">{language === 'zh' ? '血压计, 血糖仪, 体重秤等' : 'BP Monitors, Glucose Meters, Scales, etc.'}</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <AndroidOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
                <Title level={5}>{language === 'zh' ? '运动设备' : 'Fitness Devices'}</Title>
                <Text type="secondary">{language === 'zh' ? '手环, 运动手表等' : 'Fitness Bands, Sports Watches, etc.'}</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 添加设备模态框 */}
      <Modal
        title={language === 'zh' ? '添加设备' : 'Add Device'}
        open={isAddDeviceModalVisible}
        onCancel={() => setIsAddDeviceModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddDevice}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={language === 'zh' ? '设备名称' : 'Device Name'}
                rules={[{ required: true, message: language === 'zh' ? '请输入设备名称' : 'Please enter device name' }]}
              >
                <Input placeholder={language === 'zh' ? '请输入设备名称' : 'Enter device name'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label={language === 'zh' ? '设备类型' : 'Device Type'}
                rules={[{ required: true, message: language === 'zh' ? '请选择设备类型' : 'Please select device type' }]}
              >
                <Select placeholder={language === 'zh' ? '请选择设备类型' : 'Select device type'}>
                  <Option value="smartwatch">{language === 'zh' ? '智能手表' : 'Smart Watch'}</Option>
                  <Option value="fitness_tracker">{language === 'zh' ? '运动手环' : 'Fitness Tracker'}</Option>
                  <Option value="blood_pressure">{language === 'zh' ? '血压计' : 'Blood Pressure Monitor'}</Option>
                  <Option value="glucose_meter">{language === 'zh' ? '血糖仪' : 'Glucose Meter'}</Option>
                  <Option value="scale">{language === 'zh' ? '体重秤' : 'Scale'}</Option>
                  <Option value="thermometer">{language === 'zh' ? '体温计' : 'Thermometer'}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label={language === 'zh' ? '品牌' : 'Brand'}
                rules={[{ required: true, message: language === 'zh' ? '请输入品牌' : 'Please enter brand' }]}
              >
                <Input placeholder={language === 'zh' ? '请输入品牌' : 'Enter brand'} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label={language === 'zh' ? '型号' : 'Model'}
                rules={[{ required: true, message: language === 'zh' ? '请输入型号' : 'Please enter model' }]}
              >
                <Input placeholder={language === 'zh' ? '请输入型号' : 'Enter model'} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dataTypes"
            label={language === 'zh' ? '数据类型' : 'Data Types'}
          >
            <Select mode="multiple" placeholder={language === 'zh' ? '请选择数据类型' : 'Select data types'}>
              <Option value={language === 'zh' ? '心率' : 'Heart Rate'}>{language === 'zh' ? '心率' : 'Heart Rate'}</Option>
              <Option value={language === 'zh' ? '血压' : 'Blood Pressure'}>{language === 'zh' ? '血压' : 'Blood Pressure'}</Option>
              <Option value={language === 'zh' ? '血糖' : 'Glucose'}>{language === 'zh' ? '血糖' : 'Glucose'}</Option>
              <Option value={language === 'zh' ? '体温' : 'Temperature'}>{language === 'zh' ? '体温' : 'Temperature'}</Option>
              <Option value={language === 'zh' ? '体重' : 'Weight'}>{language === 'zh' ? '体重' : 'Weight'}</Option>
              <Option value={language === 'zh' ? '步数' : 'Steps'}>{language === 'zh' ? '步数' : 'Steps'}</Option>
              <Option value={language === 'zh' ? '睡眠' : 'Sleep'}>{language === 'zh' ? '睡眠' : 'Sleep'}</Option>
              <Option value={language === 'zh' ? '血氧' : 'SpO2'}>{language === 'zh' ? '血氧' : 'SpO2'}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="syncFrequency"
            label={language === 'zh' ? '同步频率' : 'Sync Frequency'}
          >
            <Select placeholder={language === 'zh' ? '请选择同步频率' : 'Select sync frequency'}>
              <Option value="realtime">{language === 'zh' ? '实时同步' : 'Real-time Sync'}</Option>
              <Option value="hourly">{language === 'zh' ? '每小时' : 'Hourly'}</Option>
              <Option value="daily">{language === 'zh' ? '每天' : 'Daily'}</Option>
              <Option value="manual">{language === 'zh' ? '手动同步' : 'Manual Sync'}</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {language === 'zh' ? '添加设备' : 'Add Device'}
              </Button>
              <Button onClick={() => setIsAddDeviceModalVisible(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeviceSyncPage; 