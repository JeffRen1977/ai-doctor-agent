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
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Apple Watch Series 8',
      type: 'smartwatch',
      brand: 'Apple',
      model: 'Series 8',
      status: 'connected',
      lastSync: '2024-01-15 14:30:00',
      batteryLevel: 85,
      dataTypes: ['心率', '步数', '睡眠', '血氧', '心电图'],
      syncFrequency: 'realtime'
    },
    {
      id: '2',
      name: '小米手环 8',
      type: 'fitness_tracker',
      brand: 'Xiaomi',
      model: 'Mi Band 8',
      status: 'connected',
      lastSync: '2024-01-15 13:45:00',
      batteryLevel: 92,
      dataTypes: ['心率', '步数', '睡眠', '血氧'],
      syncFrequency: 'hourly'
    },
    {
      id: '3',
      name: '欧姆龙血压计',
      type: 'blood_pressure',
      brand: 'Omron',
      model: 'HEM-7136',
      status: 'disconnected',
      lastSync: '2024-01-14 09:15:00',
      batteryLevel: 60,
      dataTypes: ['血压'],
      syncFrequency: 'manual'
    },
    {
      id: '4',
      name: '雅培血糖仪',
      type: 'glucose_meter',
      brand: 'Abbott',
      model: 'FreeStyle Libre',
      status: 'syncing',
      lastSync: '2024-01-15 12:00:00',
      batteryLevel: 78,
      dataTypes: ['血糖'],
      syncFrequency: 'daily'
    }
  ]);

  const [syncData, setSyncData] = useState<SyncData[]>([
    {
      deviceId: '1',
      dataType: '心率',
      value: 72,
      unit: 'bpm',
      timestamp: '2024-01-15 14:30:00',
      status: 'synced'
    },
    {
      deviceId: '1',
      dataType: '步数',
      value: 8234,
      unit: '步',
      timestamp: '2024-01-15 14:30:00',
      status: 'synced'
    },
    {
      deviceId: '2',
      dataType: '心率',
      value: 75,
      unit: 'bpm',
      timestamp: '2024-01-15 13:45:00',
      status: 'synced'
    },
    {
      deviceId: '4',
      dataType: '血糖',
      value: 95,
      unit: 'mg/dL',
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '已连接';
      case 'disconnected': return '未连接';
      case 'syncing': return '同步中';
      case 'error': return '连接错误';
      default: return '未知';
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
      message.success('设备同步成功！');
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
      message.success('设备添加成功！');
      setIsAddDeviceModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('设备添加失败，请重试');
    }
  };

  const handleRemoveDevice = (deviceId: string) => {
    setDevices(prev => prev.filter(device => device.id !== deviceId));
    message.success('设备已移除');
  };

  const deviceColumns = [
    {
      title: '设备',
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
      title: '状态',
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
      title: '电量',
      dataIndex: 'batteryLevel',
      key: 'batteryLevel',
      render: (level: number) => (
        <Progress percent={level} size="small" showInfo={false} />
      ),
    },
    {
      title: '最后同步',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (time: string) => (
        <Text type="secondary">{time || '从未同步'}</Text>
      ),
    },
    {
      title: '数据类型',
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
      title: '操作',
      key: 'action',
      render: (text: string, record: Device) => (
        <Space>
          <Button 
            size="small" 
            icon={<SyncOutlined />}
            loading={record.status === 'syncing'}
            onClick={() => handleSyncDevice(record.id)}
          >
            同步
          </Button>
          <Button size="small" icon={<SettingOutlined />}>
            设置
          </Button>
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveDevice(record.id)}
          >
            移除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>设备同步</Title>
      
      {/* 设备概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="已连接设备"
              value={devices.filter(d => d.status === 'connected').length}
              suffix={`/ ${devices.length}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日同步数据"
              value={syncData.filter(d => d.status === 'synced').length}
              suffix="条"
              prefix={<SyncOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="同步成功率"
              value={95.2}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据总量"
              value={1247}
              suffix="条"
              prefix={<HeartOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 设备列表 */}
      <Card 
        title="设备管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setIsAddDeviceModalVisible(true)}
          >
            添加设备
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
          <Card title="最近同步数据">
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
                    {item.status === 'synced' ? '已同步' : 
                     item.status === 'syncing' ? '同步中' : '同步失败'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="连接状态">
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
                    <Text type="secondary">电量 {device.batteryLevel}%</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 支持的设备类型 */}
      <Card title="支持的设备类型" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <AppleOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                <Title level={5}>智能手表</Title>
                <Text type="secondary">Apple Watch, 小米手表等</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <HeartOutlined style={{ fontSize: '32px', color: '#52c41a' }} />
                <Title level={5}>健康设备</Title>
                <Text type="secondary">血压计, 血糖仪, 体重秤等</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <AndroidOutlined style={{ fontSize: '32px', color: '#fa8c16' }} />
                <Title level={5}>运动设备</Title>
                <Text type="secondary">手环, 运动手表等</Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 添加设备模态框 */}
      <Modal
        title="添加设备"
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
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="请输入设备名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select placeholder="请选择设备类型">
                  <Option value="smartwatch">智能手表</Option>
                  <Option value="fitness_tracker">运动手环</Option>
                  <Option value="blood_pressure">血压计</Option>
                  <Option value="glucose_meter">血糖仪</Option>
                  <Option value="scale">体重秤</Option>
                  <Option value="thermometer">体温计</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="brand"
                label="品牌"
                rules={[{ required: true, message: '请输入品牌' }]}
              >
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="型号"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dataTypes"
            label="数据类型"
          >
            <Select mode="multiple" placeholder="请选择数据类型">
              <Option value="心率">心率</Option>
              <Option value="血压">血压</Option>
              <Option value="血糖">血糖</Option>
              <Option value="体温">体温</Option>
              <Option value="体重">体重</Option>
              <Option value="步数">步数</Option>
              <Option value="睡眠">睡眠</Option>
              <Option value="血氧">血氧</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="syncFrequency"
            label="同步频率"
          >
            <Select placeholder="请选择同步频率">
              <Option value="realtime">实时同步</Option>
              <Option value="hourly">每小时</Option>
              <Option value="daily">每天</Option>
              <Option value="manual">手动同步</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加设备
              </Button>
              <Button onClick={() => setIsAddDeviceModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeviceSyncPage; 