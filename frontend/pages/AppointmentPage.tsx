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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [form] = Form.useForm();

  const doctors: Doctor[] = [
    {
      id: '1',
      name: '张医生',
      department: '心血管科',
      title: '主任医师',
      avatar: 'https://joeschmoe.io/api/v1/1',
      rating: 4.8,
      available: true,
      specialties: ['高血压', '冠心病', '心律失常']
    },
    {
      id: '2',
      name: '李医生',
      department: '内分泌科',
      title: '副主任医师',
      avatar: 'https://joeschmoe.io/api/v1/2',
      rating: 4.6,
      available: true,
      specialties: ['糖尿病', '甲状腺疾病', '肥胖症']
    },
    {
      id: '3',
      name: '王医生',
      department: '神经内科',
      title: '主治医师',
      avatar: 'https://joeschmoe.io/api/v1/3',
      rating: 4.7,
      available: false,
      specialties: ['头痛', '眩晕', '癫痫']
    }
  ];

  const appointments: Appointment[] = [
    {
      id: '1',
      doctorId: '1',
      doctorName: '张医生',
      department: '心血管科',
      date: '2024-01-15',
      time: '14:30',
      type: 'in-person',
      status: 'scheduled',
      notes: '复诊检查血压控制情况'
    },
    {
      id: '2',
      doctorId: '2',
      doctorName: '李医生',
      department: '内分泌科',
      date: '2024-01-20',
      time: '10:00',
      type: 'video',
      status: 'scheduled',
      notes: '糖尿病管理咨询'
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
      message.success('预约创建成功！');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('预约创建失败，请重试');
    }
  };

  const appointmentColumns = [
    {
      title: '医生',
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
      title: '日期时间',
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getTypeIcon(type)}
          <Text>
            {type === 'in-person' ? '面诊' : 
             type === 'video' ? '视频问诊' : '电话问诊'}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'scheduled' ? '已预约' : 
           status === 'completed' ? '已完成' : '已取消'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Appointment) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>编辑</Button>
          <Button size="small" danger icon={<DeleteOutlined />}>取消</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>预约管理</Title>
      
      <Tabs defaultActiveKey="calendar">
        <TabPane tab="预约日历" key="calendar">
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
              <Card title="快速操作">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    block
                    onClick={() => setIsModalVisible(true)}
                  >
                    新建预约
                  </Button>
                  <Button 
                    icon={<VideoCameraOutlined />} 
                    block
                    onClick={() => window.location.href = '/chat'}
                  >
                    在线问诊
                  </Button>
                  <Button 
                    icon={<MessageOutlined />} 
                    block
                  >
                    消息中心
                  </Button>
                </Space>
              </Card>

              <Card title="今日预约" style={{ marginTop: '16px' }}>
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
                        {item.status === 'scheduled' ? '已预约' : 
                         item.status === 'completed' ? '已完成' : '已取消'}
                      </Tag>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="预约列表" key="list">
          <Card>
            <Table 
              columns={appointmentColumns} 
              dataSource={appointments}
              rowKey="id"
            />
          </Card>
        </TabPane>

        <TabPane tab="医生列表" key="doctors">
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
                    <Text strong>科室：</Text>
                    <Text>{doctor.department}</Text>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>专长：</Text>
                    <div style={{ marginTop: '4px' }}>
                      {doctor.specialties.map(specialty => (
                        <Tag key={specialty} style={{ marginBottom: '4px' }}>
                          {specialty}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>评分：</Text>
                    <Text>{doctor.rating} ⭐</Text>
                  </div>
                  <Button 
                    type="primary" 
                    block
                    disabled={!doctor.available}
                  >
                    {doctor.available ? '预约问诊' : '暂不可预约'}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>

      {/* 新建预约模态框 */}
      <Modal
        title="新建预约"
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
                label="选择医生"
                rules={[{ required: true, message: '请选择医生' }]}
              >
                <Select placeholder="请选择医生">
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
                label="问诊类型"
                rules={[{ required: true, message: '请选择问诊类型' }]}
              >
                <Select placeholder="请选择问诊类型">
                  <Option value="in-person">面诊</Option>
                  <Option value="video">视频问诊</Option>
                  <Option value="phone">电话问诊</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="date"
                label="预约日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="time"
                label="预约时间"
                rules={[{ required: true, message: '请选择预约时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea rows={3} placeholder="请描述您的症状或需求" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认预约
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentPage; 