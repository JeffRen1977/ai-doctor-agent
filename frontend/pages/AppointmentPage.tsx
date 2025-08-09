import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Calendar, 
  Button, 
  Modal, 
  Form, 
  Select, 
  DatePicker, 
  TimePicker,
  Input,
  List,
  Avatar,
  Tag,
  Typography,
  Space,
  Divider,
  Badge,
  Tabs,
  Table,
  message
} from 'antd';
import { 
  CalendarOutlined, 
  UserOutlined, 
  PhoneOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Doctor {
  id: string;
  name: string;
  department: string;
  title: string;
  avatar: string;
  rating: number;
  available: boolean;
  specialties: string[];
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

const AppointmentPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm();

  const doctors: Doctor[] = [
    {
      id: '1',
      name: t('appointments.doctors.zhang'),
      department: t('appointments.departments.cardiology'),
      title: t('appointments.titles.chiefPhysician'),
      avatar: 'https://joeschmoe.io/api/v1/1',
      rating: 4.8,
      available: true,
      specialties: [t('appointments.specialties.hypertension'), t('appointments.specialties.coronaryHeartDisease'), t('appointments.specialties.arrhythmia')]
    },
    {
      id: '2',
      name: t('appointments.doctors.li'),
      department: t('appointments.departments.endocrinology'),
      title: t('appointments.titles.associateChiefPhysician'),
      avatar: 'https://joeschmoe.io/api/v1/2',
      rating: 4.6,
      available: true,
      specialties: [t('appointments.specialties.diabetes'), t('appointments.specialties.thyroidDisease'), t('appointments.specialties.obesity')]
    },
    {
      id: '3',
      name: t('appointments.doctors.wang'),
      department: t('appointments.departments.neurology'),
      title: t('appointments.titles.attendingPhysician'),
      avatar: 'https://joeschmoe.io/api/v1/3',
      rating: 4.7,
      available: false,
      specialties: [t('appointments.specialties.headache'), t('appointments.specialties.dizziness'), t('appointments.specialties.epilepsy')]
    }
  ];

  const appointments: Appointment[] = [
    {
      id: '1',
      doctorId: '1',
      doctorName: t('appointments.doctors.zhang'),
      department: t('appointments.departments.cardiology'),
      date: '2024-01-15',
      time: '14:30',
      type: 'in-person',
      status: 'scheduled',
      notes: t('appointments.notes.followUp')
    },
    {
      id: '2',
      doctorId: '2',
      doctorName: t('appointments.doctors.li'),
      department: t('appointments.departments.endocrinology'),
      date: '2024-01-20',
      time: '10:00',
      type: 'video',
      status: 'scheduled',
      notes: t('appointments.notes.diabetesManagement')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in-person': return <UserOutlined />;
      case 'video': return <VideoCameraOutlined />;
      case 'phone': return <PhoneOutlined />;
      default: return <UserOutlined />;
    }
  };

  const handleDateSelect = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    setIsModalVisible(true);
  };

  const handleCreateAppointment = async (values: any) => {
    try {
      console.log('Creating appointment:', values);
      message.success(t('appointments.appointmentCreatedSuccess'));
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(t('appointments.appointmentCreatedFailed'));
    }
  };

  const appointmentColumns = [
    {
      title: t('appointments.doctor'),
      dataIndex: 'doctorName',
      key: 'doctorName',
      render: (text: string, record: Appointment) => (
        <Space>
          <Avatar size="small" src={doctors.find(d => d.id === record.doctorId)?.avatar} />
          <div>
            <div>{text}</div>
            <Text type="secondary">{record.department}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('appointments.dateTime'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string, record: Appointment) => (
        <div>
          <div>{date}</div>
          <Text type="secondary">{record.time}</Text>
        </div>
      ),
    },
    {
      title: t('appointments.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          <Text>
            {type === 'in-person' ? t('appointments.inPerson') : 
             type === 'video' ? t('appointments.videoConsultation') : t('appointments.phoneConsultation')}
          </Text>
        </Space>
      ),
    },
    {
      title: t('appointments.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'scheduled' ? t('appointments.scheduled') : 
           status === 'completed' ? t('appointments.completed') : t('appointments.cancelled')}
        </Tag>
      ),
    },
    {
      title: t('appointments.actions'),
      key: 'action',
      render: (text: string, record: Appointment) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>{t('appointments.edit')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />}>{t('appointments.cancel')}</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{t('appointments.title')}</Title>
      
      <Tabs defaultActiveKey="calendar">
        <TabPane tab={t('appointments.calendar')} key="calendar">
          <Row gutter={[16, 16]}>
            <Col span={16}>
              <Card>
                <Calendar 
                  onSelect={handleDateSelect}
                  dateCellRender={(date) => {
                    const dayAppointments = appointments.filter(
                      apt => apt.date === date.format('YYYY-MM-DD')
                    );
                    return (
                      <div>
                        {dayAppointments.map(apt => (
                          <div key={apt.id} style={{ fontSize: '10px', color: '#1890ff' }}>
                            {apt.time} {apt.doctorName}
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card title={t('appointments.quickActions')}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    block
                    onClick={() => setIsModalVisible(true)}
                  >
                    {t('appointments.newAppointment')}
                  </Button>
                  <Button 
                    icon={<VideoCameraOutlined />} 
                    block
                    onClick={() => window.location.href = '/chat'}
                  >
                    {t('appointments.onlineConsultation')}
                  </Button>
                  <Button 
                    icon={<MessageOutlined />} 
                    block
                  >
                    {t('appointments.messageCenter')}
                  </Button>
                </Space>
              </Card>

              <Card title={t('appointments.todayAppointments')} style={{ marginTop: '16px' }}>
                <List
                  dataSource={appointments.filter(apt => apt.date === dayjs().format('YYYY-MM-DD'))}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={doctors.find(d => d.id === item.doctorId)?.avatar} />}
                        title={item.doctorName}
                        description={`${item.time} - ${item.department}`}
                      />
                      <Tag color={getStatusColor(item.status)}>
                        {item.status === 'scheduled' ? t('appointments.scheduled') : 
                         item.status === 'completed' ? t('appointments.completed') : t('appointments.cancelled')}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={t('appointments.list')} key="list">
          <Card>
            <Table 
              columns={appointmentColumns} 
              dataSource={appointments}
              rowKey="id"
            />
          </Card>
        </TabPane>

        <TabPane tab={t('appointments.doctors')} key="doctors">
          <Row gutter={[16, 16]}>
            {doctors.map(doctor => (
              <Col span={8} key={doctor.id}>
                <Card>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <Avatar size={64} src={doctor.avatar} />
                    <Title level={4} style={{ marginTop: '8px' }}>{doctor.name}</Title>
                    <Text type="secondary">{doctor.title}</Text>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>{t('appointments.department')}：</Text>
                    <Text>{doctor.department}</Text>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>{t('appointments.specialties')}：</Text>
                    <div style={{ marginTop: '4px' }}>
                      {doctor.specialties.map(specialty => (
                        <Tag key={specialty} style={{ marginBottom: '4px' }}>
                          {specialty}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>{t('appointments.rating')}：</Text>
                    <Text>{doctor.rating} ⭐</Text>
                  </div>
                  <Button 
                    type="primary" 
                    block
                    disabled={!doctor.available}
                  >
                    {doctor.available ? t('appointments.bookConsultation') : t('appointments.notAvailable')}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>

      {/* Create appointment modal */}
      <Modal
        title={t('appointments.createAppointment')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAppointment}
          initialValues={{
            date: selectedDate,
            type: 'in-person'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="doctorId"
                label={t('appointments.selectDoctor')}
                rules={[{ required: true, message: t('appointments.pleaseSelectDoctor') }]}
              >
                <Select placeholder={t('appointments.pleaseSelectDoctor')}>
                  {doctors.map(doctor => (
                    <Option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.department}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label={t('appointments.consultationType')}
                rules={[{ required: true, message: t('appointments.pleaseSelectConsultationType') }]}
              >
                <Select placeholder={t('appointments.pleaseSelectConsultationType')}>
                  <Option value="in-person">{t('appointments.inPerson')}</Option>
                  <Option value="video">{t('appointments.videoConsultation')}</Option>
                  <Option value="phone">{t('appointments.phoneConsultation')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label={t('appointments.appointmentDate')}
                rules={[{ required: true, message: t('appointments.pleaseSelectDate') }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="time"
                label={t('appointments.appointmentTime')}
                rules={[{ required: true, message: t('appointments.pleaseSelectTime') }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label={t('appointments.notes')}
          >
            <TextArea rows={3} placeholder={t('appointments.pleaseDescribeSymptoms')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('appointments.confirmAppointment')}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                {t('appointments.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentPage; 