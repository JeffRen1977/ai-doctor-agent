import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Typography,
  Space,
  Tabs,
  Tag,
  Table,
  Alert,
  Statistic,
  Divider,
  Select,
  DatePicker,
  Avatar,
  Badge,
  Modal,
  Descriptions,
  Form,
  Input,
  message,
  Grid
} from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  CalendarOutlined, 
  PlusOutlined,
  FileTextOutlined, 
  DownloadOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  PhoneOutlined, 
  MessageOutlined,
  UserOutlined,
  HeartOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  BellOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';
import { collaborationAPI } from '@/services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

// 预约相关接口
interface Appointment {
  appointmentId: string;
  type: string;
  status: string;
  scheduledDateTime: string;
  duration: number;
  location: {
    name: string;
    address?: string;
    phone?: string;
    department?: string;
    room?: string;
  };
  provider: {
    name: string;
    title?: string;
    specialty?: string;
    phone?: string;
  };
  reason?: string;
  notes?: string;
}

// 临床报告相关接口
interface ClinicalReport {
  reportId: string;
  reportType: string;
  status: string;
  title: string;
  generatedAt: string;
  period?: {
    start: string;
    end: string;
  };
  sections?: any;
}

// 紧急联系人接口
interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  location?: string;
}

// 紧急医疗信息接口
interface EmergencyInfo {
  bloodType: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  emergencyNotes: string;
}

const CollaborationPage: React.FC = () => {
  const { language } = useLanguageStore();
  const screens = useBreakpoint();
  const t = (key: string) => getTranslation(language, key);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'appointments';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [form] = Form.useForm();

  // 当 URL 参数变化时更新 activeTab
  useEffect(() => {
    const tab = searchParams.get('tab') || 'appointments';
    setActiveTab(tab);
  }, [searchParams]);

  // 当 activeTab 变化时更新 URL
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // 预约管理状态
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);

  // 临床报告状态
  const [reports, setReports] = useState<ClinicalReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ClinicalReport | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // 紧急求助状态
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo>({
    bloodType: 'A+',
    allergies: [],
    medications: [],
    conditions: [],
    emergencyNotes: ''
  });
  const [isAddContactModalVisible, setIsAddContactModalVisible] = useState(false);

  // 加载预约数据
  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab]);

  // 加载报告数据
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab]);

  const loadAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const response = await collaborationAPI.getAppointments();
      if (response.success) {
        setAppointments(response.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      message.error(language === 'zh' ? '加载预约失败' : 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const response = await collaborationAPI.getReports();
      if (response.success) {
        setReports(response.reports || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      message.error(language === 'zh' ? '加载报告失败' : 'Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleCreateAppointment = async (values: any) => {
    try {
      // 转换 DatePicker 的日期格式为 ISO 字符串
      let scheduledDateTime: string;
      if (values.scheduledDateTime) {
        if (dayjs.isDayjs(values.scheduledDateTime)) {
          scheduledDateTime = values.scheduledDateTime.toISOString();
        } else if (values.scheduledDateTime instanceof Date) {
          scheduledDateTime = values.scheduledDateTime.toISOString();
        } else {
          scheduledDateTime = new Date(values.scheduledDateTime).toISOString();
        }
      } else {
        scheduledDateTime = new Date().toISOString();
      }
      
      const appointmentData = {
        ...values,
        scheduledDateTime,
        status: 'scheduled', // 默认状态
        duration: 30 // 默认30分钟
      };
      
      const response = await collaborationAPI.createAppointment(appointmentData);
      if (response.success) {
        message.success(language === 'zh' ? '预约创建成功' : 'Appointment created successfully');
        setAppointmentModalVisible(false);
        form.resetFields();
        loadAppointments();
      } else {
        message.error(response.error || (language === 'zh' ? '创建预约失败' : 'Failed to create appointment'));
      }
    } catch (error: any) {
      console.error('Failed to create appointment:', error);
      message.error(error.response?.data?.error || error.message || (language === 'zh' ? '创建预约失败' : 'Failed to create appointment'));
    }
  };

  const handleEmergencyCall = () => {
    Modal.confirm({
      title: language === 'zh' ? '紧急求助确认' : 'Emergency Call Confirmation',
      content: language === 'zh' 
        ? '您确定要拨打紧急求助电话吗？这将立即联系急救服务。'
        : 'Are you sure you want to make an emergency call? This will immediately contact emergency services.',
      okText: language === 'zh' ? '确认拨打' : 'Confirm Call',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await collaborationAPI.triggerEmergencyAlert('manual', {});
          message.success(language === 'zh' ? '紧急求助已触发' : 'Emergency alert triggered');
        } catch (error) {
          console.error('Failed to trigger emergency alert:', error);
          message.error(language === 'zh' ? '触发紧急求助失败' : 'Failed to trigger emergency alert');
        }
      }
    });
  };

  const handleSendEmergencyMessage = () => {
    Modal.confirm({
      title: language === 'zh' ? '发送紧急消息' : 'Send Emergency Message',
      content: language === 'zh' 
        ? '您确定要发送紧急消息给所有紧急联系人吗？'
        : 'Are you sure you want to send emergency messages to all emergency contacts?',
      okText: language === 'zh' ? '确认发送' : 'Confirm Send',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await collaborationAPI.sendEmergencyMessage({});
          message.success(language === 'zh' ? '紧急消息已发送' : 'Emergency messages sent');
        } catch (error) {
          console.error('Failed to send emergency message:', error);
          message.error(language === 'zh' ? '发送紧急消息失败' : 'Failed to send emergency message');
        }
      }
    });
  };

  const handleAddContact = (values: any) => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      ...values,
      isPrimary: false
    };
    setContacts([...contacts, newContact]);
    setIsAddContactModalVisible(false);
    form.resetFields();
    message.success(language === 'zh' ? '紧急联系人已添加' : 'Emergency contact added');
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(contact => contact.id !== id));
    message.success(language === 'zh' ? '紧急联系人已删除' : 'Emergency contact deleted');
  };

  const handleSetPrimary = (id: string) => {
    setContacts(contacts.map(contact => ({
      ...contact,
      isPrimary: contact.id === id
    })));
    message.success(language === 'zh' ? '主要联系人已设置' : 'Primary contact set');
  };

  const handleGenerateReport = async () => {
    try {
      const response = await collaborationAPI.generateReport({
        reportType: 'comprehensive',
        period: selectedPeriod
      });
      if (response.success) {
        message.success(language === 'zh' ? '报告生成成功' : 'Report generated successfully');
        loadReports();
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      message.error(language === 'zh' ? '生成报告失败' : 'Failed to generate report');
    }
  };

  // 预约管理标签页
  const renderAppointmentsTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginRight: '8px' }} />
            {language === 'zh' ? '预约管理' : 'Appointment Management'}
          </Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setAppointmentModalVisible(true)}
          >
            {language === 'zh' ? '新建预约' : 'New Appointment'}
          </Button>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={appointments}
          loading={appointmentsLoading}
          rowKey="appointmentId"
          columns={[
            {
              title: language === 'zh' ? '预约类型' : 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type: string) => (
                <Tag color="blue">{type}</Tag>
              )
            },
            {
              title: language === 'zh' ? '预约时间' : 'Scheduled Time',
              dataIndex: 'scheduledDateTime',
              key: 'scheduledDateTime',
              render: (date: string) => new Date(date).toLocaleString()
            },
            {
              title: language === 'zh' ? '医生/机构' : 'Provider',
              key: 'provider',
              render: (_: any, record: Appointment) => (
                <Space>
                  <Text strong>{record.provider.name}</Text>
                  {record.provider.specialty && (
                    <Text type="secondary">({record.provider.specialty})</Text>
                  )}
                </Space>
              )
            },
            {
              title: language === 'zh' ? '地点' : 'Location',
              dataIndex: ['location', 'name'],
              key: 'location'
            },
            {
              title: language === 'zh' ? '状态' : 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const statusMap: Record<string, { color: string; text: string }> = {
                  scheduled: { color: 'blue', text: language === 'zh' ? '已预约' : 'Scheduled' },
                  confirmed: { color: 'green', text: language === 'zh' ? '已确认' : 'Confirmed' },
                  completed: { color: 'default', text: language === 'zh' ? '已完成' : 'Completed' },
                  cancelled: { color: 'red', text: language === 'zh' ? '已取消' : 'Cancelled' }
                };
                const statusInfo = statusMap[status] || { color: 'default', text: status };
                return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
              }
            },
            {
              title: language === 'zh' ? '操作' : 'Actions',
              key: 'actions',
              render: (_: any, record: Appointment) => (
                <Space>
                  <Button size="small" icon={<EyeOutlined />}>
                    {language === 'zh' ? '查看' : 'View'}
                  </Button>
                  <Button size="small" icon={<EditOutlined />}>
                    {language === 'zh' ? '编辑' : 'Edit'}
                  </Button>
                </Space>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建预约模态框 */}
      <Modal
        title={language === 'zh' ? '新建预约' : 'New Appointment'}
        open={appointmentModalVisible}
        onCancel={() => setAppointmentModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAppointment}
        >
          <Form.Item
            name="type"
            label={language === 'zh' ? '预约类型' : 'Appointment Type'}
            rules={[{ required: true }]}
          >
            <Select placeholder={language === 'zh' ? '请选择预约类型' : 'Select appointment type'}>
              <Option value="consultation">{language === 'zh' ? '咨询' : 'Consultation'}</Option>
              <Option value="follow-up">{language === 'zh' ? '随访' : 'Follow-up'}</Option>
              <Option value="checkup">{language === 'zh' ? '体检' : 'Checkup'}</Option>
              <Option value="examination">{language === 'zh' ? '检查' : 'Examination'}</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="scheduledDateTime"
            label={language === 'zh' ? '预约时间' : 'Scheduled Time'}
            rules={[{ required: true }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['provider', 'name']}
            label={language === 'zh' ? '医生姓名' : 'Doctor Name'}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name={['location', 'name']}
            label={language === 'zh' ? '医疗机构' : 'Medical Facility'}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAppointmentModalVisible(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit">
                {language === 'zh' ? '创建' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );

  // 紧急求助标签页
  const renderEmergencyTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>
        <ExclamationCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
        {language === 'zh' ? '紧急求助' : 'Emergency Help'}
      </Title>

      {/* 紧急求助按钮 */}
      <Card 
        title={language === 'zh' ? '紧急求助' : 'Emergency Help'} 
        size="small"
      >
        <Alert
          message={language === 'zh' ? '紧急情况' : 'Emergency Situation'}
          description={language === 'zh' 
            ? '如果您遇到紧急医疗情况，请立即使用以下按钮寻求帮助。'
            : 'If you encounter an emergency medical situation, please immediately use the buttons below to seek help.'
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button 
              type="primary" 
              danger 
              size="large"
              icon={<PhoneOutlined />}
              onClick={handleEmergencyCall}
              block={screens.xs}
              style={{ height: screens.xs ? '48px' : 'auto' }}
            >
              {language === 'zh' ? '拨打急救电话' : 'Call Emergency'}
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button 
              type="default" 
              danger 
              size="large"
              icon={<MessageOutlined />}
              onClick={handleSendEmergencyMessage}
              block={screens.xs}
              style={{ height: screens.xs ? '48px' : 'auto' }}
            >
              {language === 'zh' ? '发送紧急消息' : 'Send Emergency Message'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 紧急联系人 */}
      <Card 
        title={language === 'zh' ? '紧急联系人' : 'Emergency Contacts'} 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsAddContactModalVisible(true)}
            size="small"
          >
            {screens.xs ? (language === 'zh' ? '添加' : 'Add') : (language === 'zh' ? '添加联系人' : 'Add Contact')}
          </Button>
        }
      >
        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Text type="secondary">
              {language === 'zh' ? '暂无紧急联系人，请添加' : 'No emergency contacts, please add'}
            </Text>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {contacts.map((contact) => (
              <Col xs={24} sm={12} md={8} key={contact.id}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Badge count={contact.isPrimary ? (language === 'zh' ? '主要' : 'Primary') : ''} size="small">
                      <Avatar 
                        icon={<UserOutlined />} 
                        size={64}
                        style={{ backgroundColor: contact.isPrimary ? '#52c41a' : '#1890ff' }}
                      />
                    </Badge>
                    <Title level={5} style={{ margin: '12px 0 8px 0' }}>
                      {contact.name}
                    </Title>
                    <Tag color={contact.isPrimary ? 'green' : 'blue'} style={{ marginBottom: '8px' }}>
                      {contact.relationship}
                    </Tag>
                    <div style={{ marginBottom: '8px' }}>
                      <PhoneOutlined /> {contact.phone}
                    </div>
                    {contact.location && (
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                        <EnvironmentOutlined /> {contact.location}
                      </div>
                    )}
                    <Space size="small">
                      <Button 
                        type="link" 
                        danger 
                        icon={<DeleteOutlined />} 
                        size="small"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        {language === 'zh' ? '删除' : 'Delete'}
                      </Button>
                    </Space>
                    {!contact.isPrimary && (
                      <div style={{ marginTop: '8px' }}>
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => handleSetPrimary(contact.id)}
                        >
                          {language === 'zh' ? '设为主要联系人' : 'Set as Primary'}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 紧急医疗信息 */}
      <Card 
        title={language === 'zh' ? '紧急医疗信息' : 'Emergency Medical Information'} 
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title={language === 'zh' ? '血型' : 'Blood Type'}
                value={emergencyInfo.bloodType}
                prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title={language === 'zh' ? '过敏' : 'Allergies'}
                value={emergencyInfo.allergies.length}
                suffix={language === 'zh' ? '项' : 'items'}
                prefix={<SafetyOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title={language === 'zh' ? '用药' : 'Medications'}
                value={emergencyInfo.medications.length}
                suffix={language === 'zh' ? '种' : 'types'}
                prefix={<MedicineBoxOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title={language === 'zh' ? '疾病' : 'Conditions'}
                value={emergencyInfo.conditions.length}
                suffix={language === 'zh' ? '种' : 'types'}
                prefix={<BellOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 添加联系人模态框 */}
      <Modal
        title={language === 'zh' ? '添加紧急联系人' : 'Add Emergency Contact'}
        open={isAddContactModalVisible}
        onCancel={() => setIsAddContactModalVisible(false)}
        footer={null}
        width={screens.xs ? '95%' : 600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddContact}
        >
          <Form.Item
            name="name"
            label={language === 'zh' ? '姓名' : 'Name'}
            rules={[{ required: true, message: language === 'zh' ? '请输入姓名' : 'Please enter name' }]}
          >
            <Input placeholder={language === 'zh' ? '请输入联系人姓名' : 'Enter contact name'} />
          </Form.Item>
          <Form.Item
            name="relationship"
            label={language === 'zh' ? '关系' : 'Relationship'}
            rules={[{ required: true, message: language === 'zh' ? '请输入关系' : 'Please enter relationship' }]}
          >
            <Input placeholder={language === 'zh' ? '例如：配偶、医生、朋友等' : 'e.g., Spouse, Doctor, Friend'} />
          </Form.Item>
          <Form.Item
            name="phone"
            label={language === 'zh' ? '电话' : 'Phone'}
            rules={[{ required: true, message: language === 'zh' ? '请输入电话号码' : 'Please enter phone number' }]}
          >
            <Input placeholder={language === 'zh' ? '请输入电话号码' : 'Enter phone number'} />
          </Form.Item>
          <Form.Item
            name="location"
            label={language === 'zh' ? '位置' : 'Location'}
          >
            <Input placeholder={language === 'zh' ? '可选：联系人位置或工作地点' : 'Optional: Contact location or workplace'} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsAddContactModalVisible(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit">
                {language === 'zh' ? '添加' : 'Add'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );

  // 临床报告标签页
  const renderReportsTab = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            {language === 'zh' ? '临床报告' : 'Clinical Reports'}
          </Title>
        </Col>
        <Col>
          <Space>
            <Select 
              value={selectedPeriod} 
              onChange={setSelectedPeriod}
              style={{ width: 150 }}
            >
              <Option value="month">{language === 'zh' ? '本月' : 'This Month'}</Option>
              <Option value="quarter">{language === 'zh' ? '本季度' : 'This Quarter'}</Option>
              <Option value="year">{language === 'zh' ? '本年' : 'This Year'}</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<FileTextOutlined />}
              onClick={handleGenerateReport}
            >
              {language === 'zh' ? '生成新报告' : 'Generate New Report'}
            </Button>
          </Space>
        </Col>
      </Row>

      <Paragraph style={{ color: '#666' }}>
        {language === 'zh' 
          ? '自动生成月度健康摘要，突出显示异常波动和关键指标趋势，缩短医生面诊时的判读时间。'
          : 'Automatically generate monthly health summaries, highlighting abnormal fluctuations and key metric trends to reduce doctor consultation time.'}
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '总报告数' : 'Total Reports'}
              value={reports.length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '已完成' : 'Completed'}
              value={reports.filter(r => r.status === 'completed').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '生成中' : 'Generating'}
              value={reports.filter(r => r.status === 'generating').length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '草稿' : 'Draft'}
              value={reports.filter(r => r.status === 'draft').length}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#999' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={reports}
          loading={reportsLoading}
          rowKey="reportId"
          columns={[
            {
              title: language === 'zh' ? '报告标题' : 'Report Title',
              dataIndex: 'title',
              key: 'title',
              render: (text: string) => (
                <Space>
                  <FileTextOutlined />
                  <Text strong>{text}</Text>
                </Space>
              )
            },
            {
              title: language === 'zh' ? '报告类型' : 'Report Type',
              dataIndex: 'reportType',
              key: 'reportType',
              render: (type: string) => <Tag color="blue">{type}</Tag>
            },
            {
              title: language === 'zh' ? '生成日期' : 'Generated Date',
              dataIndex: 'generatedAt',
              key: 'generatedAt',
              render: (date: string) => new Date(date).toLocaleDateString()
            },
            {
              title: language === 'zh' ? '状态' : 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const statusMap: Record<string, { color: string; text: string }> = {
                  draft: { color: 'default', text: language === 'zh' ? '草稿' : 'Draft' },
                  generating: { color: 'processing', text: language === 'zh' ? '生成中' : 'Generating' },
                  completed: { color: 'success', text: language === 'zh' ? '已完成' : 'Completed' },
                  archived: { color: 'default', text: language === 'zh' ? '已归档' : 'Archived' }
                };
                const statusInfo = statusMap[status] || { color: 'default', text: status };
                return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
              }
            },
            {
              title: language === 'zh' ? '操作' : 'Actions',
              key: 'actions',
              render: (_: any, record: ClinicalReport) => (
                <Space>
                  <Button 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedReport(record);
                      setPreviewVisible(true);
                    }}
                  >
                    {language === 'zh' ? '预览' : 'Preview'}
                  </Button>
                  <Button size="small" icon={<DownloadOutlined />}>
                    {language === 'zh' ? '下载' : 'Download'}
                  </Button>
                  <Button size="small" icon={<ShareAltOutlined />}>
                    {language === 'zh' ? '分享' : 'Share'}
                  </Button>
                </Space>
              )
            }
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 报告预览模态框 */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <Text strong>
              {selectedReport ? `${language === 'zh' ? '报告预览' : 'Report Preview'}: ${selectedReport.title}` : ''}
            </Text>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            {language === 'zh' ? '下载PDF' : 'Download PDF'}
          </Button>,
          <Button key="share" type="primary" icon={<ShareAltOutlined />}>
            {language === 'zh' ? '分享给医生' : 'Share with Doctor'}
          </Button>
        ]}
      >
        {selectedReport && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label={language === 'zh' ? '报告标题' : 'Report Title'} span={2}>
                {selectedReport.title}
              </Descriptions.Item>
              <Descriptions.Item label={language === 'zh' ? '生成日期' : 'Generated Date'}>
                {new Date(selectedReport.generatedAt).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label={language === 'zh' ? '状态' : 'Status'}>
                <Tag color={selectedReport.status === 'completed' ? 'success' : 'processing'}>
                  {selectedReport.status === 'completed' ? (language === 'zh' ? '已完成' : 'Completed') : (language === 'zh' ? '生成中' : 'Generating')}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            {selectedReport.sections && (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {/* 执行摘要 */}
                {selectedReport.sections.executiveSummary && (
                  <>
                    <Divider orientation="left">
                      <Text strong>{language === 'zh' ? '执行摘要' : 'Executive Summary'}</Text>
                    </Divider>
                    <div style={{ 
                      padding: '16px', 
                      background: '#fafafa', 
                      borderRadius: '4px',
                      marginBottom: '16px'
                    }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedReport.sections.executiveSummary}
                      </ReactMarkdown>
                    </div>
                  </>
                )}

                {/* 健康指标 */}
                {selectedReport.sections.healthMetrics && (
                  <>
                    <Divider orientation="left">
                      <Text strong>{language === 'zh' ? '健康指标' : 'Health Metrics'}</Text>
                    </Divider>
                    <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
                      {selectedReport.sections.healthMetrics.basicInfo && (
                        <>
                          {selectedReport.sections.healthMetrics.basicInfo.name && (
                            <Descriptions.Item label={language === 'zh' ? '姓名' : 'Name'}>
                              {selectedReport.sections.healthMetrics.basicInfo.name}
                            </Descriptions.Item>
                          )}
                          {selectedReport.sections.healthMetrics.basicInfo.gender && (
                            <Descriptions.Item label={language === 'zh' ? '性别' : 'Gender'}>
                              {selectedReport.sections.healthMetrics.basicInfo.gender}
                            </Descriptions.Item>
                          )}
                          {selectedReport.sections.healthMetrics.basicInfo.birthDate && (
                            <Descriptions.Item label={language === 'zh' ? '出生日期' : 'Birth Date'}>
                              {selectedReport.sections.healthMetrics.basicInfo.birthDate}
                            </Descriptions.Item>
                          )}
                          {selectedReport.sections.healthMetrics.basicInfo.bloodType && (
                            <Descriptions.Item label={language === 'zh' ? '血型' : 'Blood Type'}>
                              {selectedReport.sections.healthMetrics.basicInfo.bloodType}
                            </Descriptions.Item>
                          )}
                        </>
                      )}
                    </Descriptions>
                  </>
                )}

                {/* 风险评估 */}
                {selectedReport.sections.riskAssessment && selectedReport.sections.riskAssessment.length > 0 && (
                  <>
                    <Divider orientation="left">
                      <Text strong>{language === 'zh' ? '风险评估' : 'Risk Assessment'}</Text>
                    </Divider>
                    <ul style={{ marginBottom: '16px' }}>
                      {selectedReport.sections.riskAssessment.map((risk: any, index: number) => (
                        <li key={index}>{typeof risk === 'string' ? risk : JSON.stringify(risk)}</li>
                      ))}
                    </ul>
                  </>
                )}

                {/* 建议 */}
                {selectedReport.sections.recommendations && selectedReport.sections.recommendations.length > 0 && (
                  <>
                    <Divider orientation="left">
                      <Text strong>{language === 'zh' ? '健康建议' : 'Recommendations'}</Text>
                    </Divider>
                    <div style={{ 
                      padding: '16px', 
                      background: '#f0f7ff', 
                      borderRadius: '4px',
                      marginBottom: '16px'
                    }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {Array.isArray(selectedReport.sections.recommendations)
                          ? selectedReport.sections.recommendations.join('\n')
                          : selectedReport.sections.recommendations}
                      </ReactMarkdown>
                    </div>
                  </>
                )}

                {/* 行动计划 */}
                {selectedReport.sections.actionItems && selectedReport.sections.actionItems.length > 0 && (
                  <>
                    <Divider orientation="left">
                      <Text strong>{language === 'zh' ? '行动计划' : 'Action Items'}</Text>
                    </Divider>
                    <ul style={{ marginBottom: '16px' }}>
                      {selectedReport.sections.actionItems.map((item: any, index: number) => (
                        <li key={index}>
                          <Text>{typeof item === 'string' ? item : (item.description || JSON.stringify(item))}</Text>
                          {item.priority && (
                            <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'} style={{ marginLeft: '8px' }}>
                              {item.priority}
                            </Tag>
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </Space>
        )}
      </Modal>
    </Space>
  );

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        {language === 'zh' ? '医患协作' : 'Clinical Collaboration'}
      </Title>
      
      <Paragraph style={{ marginBottom: '24px', fontSize: '16px', color: '#666' }}>
        {language === 'zh' 
          ? '管理预约、紧急求助和临床报告，实现医患协作闭环管理。'
          : 'Manage appointments, emergency help, and clinical reports for seamless clinical collaboration.'}
      </Paragraph>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'appointments',
              label: (
                <Space>
                  <CalendarOutlined />
                  {language === 'zh' ? '预约管理' : 'Appointments'}
                </Space>
              ),
              children: renderAppointmentsTab()
            },
            {
              key: 'emergency',
              label: (
                <Space>
                  <ExclamationCircleOutlined />
                  {language === 'zh' ? '紧急求助' : 'Emergency'}
                </Space>
              ),
              children: renderEmergencyTab()
            },
            {
              key: 'reports',
              label: (
                <Space>
                  <FileTextOutlined />
                  {language === 'zh' ? '临床报告' : 'Clinical Reports'}
                </Space>
              ),
              children: renderReportsTab()
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default CollaborationPage;
