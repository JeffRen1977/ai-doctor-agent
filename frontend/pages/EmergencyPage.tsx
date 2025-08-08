import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space,
  Alert,
  Modal,
  Form,
  Input,
  Select,
  message,
  Badge,
  Divider,
  Statistic,
  Tag,
  Checkbox
} from 'antd';
import { 
  PhoneOutlined, 
  MessageOutlined, 
  GlobalOutlined,
  UserOutlined,
  HeartOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  BellOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  location?: string;
}

interface EmergencyInfo {
  bloodType: string;
  allergies: string[];
  medications: string[];
  conditions: string[];
  emergencyNotes: string;
}

const EmergencyPage: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: '张小明',
      relationship: '配偶',
      phone: '13800138000',
      isPrimary: true,
      location: '北京市朝阳区'
    },
    {
      id: '2',
      name: '李医生',
      relationship: '主治医生',
      phone: '13900139000',
      isPrimary: false,
      location: '北京协和医院'
    },
    {
      id: '3',
      name: '王护士',
      relationship: '家庭护士',
      phone: '13700137000',
      isPrimary: false
    }
  ]);

  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo>({
    bloodType: 'A+',
    allergies: ['青霉素', '海鲜'],
    medications: ['缬沙坦 80mg', '阿司匹林 100mg'],
    conditions: ['高血压', '糖尿病'],
    emergencyNotes: '有心脏病史，请优先联系家属'
  });

  const [isAddContactModalVisible, setIsAddContactModalVisible] = useState(false);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleEmergencyCall = (contact: EmergencyContact) => {
    Modal.confirm({
      title: '紧急呼叫',
      content: `确定要拨打 ${contact.name} 的电话 ${contact.phone} 吗？`,
      okText: '确定拨打',
      cancelText: '取消',
      onOk: () => {
        message.success(`正在拨打 ${contact.name} 的电话...`);
        // 这里可以集成实际的电话拨打功能
      }
    });
  };

  const handleEmergencySOS = () => {
    setIsEmergencyModalVisible(true);
  };

  const handleSendEmergencyAlert = (values: any) => {
    message.success('紧急求助信息已发送给所有联系人！');
    setIsEmergencyModalVisible(false);
    // 这里可以发送紧急求助信息给所有联系人
  };

  const handleAddContact = async (values: any) => {
    try {
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        name: values.name,
        relationship: values.relationship,
        phone: values.phone,
        isPrimary: values.isPrimary || false,
        location: values.location
      };

      setContacts(prev => [...prev, newContact]);
      message.success('紧急联系人添加成功！');
      setIsAddContactModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('添加失败，请重试');
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    message.success('联系人已移除');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>紧急求助</Title>
      
      {/* 紧急状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="紧急联系人"
              value={contacts.length}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="血型"
              value={emergencyInfo.bloodType}
              prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="过敏原"
              value={emergencyInfo.allergies.length}
              suffix="种"
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="当前用药"
              value={emergencyInfo.medications.length}
              suffix="种"
              prefix={<SafetyOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 紧急求助按钮 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={12}>
            <Alert
              message="紧急情况"
              description="如果遇到紧急医疗情况，请立即点击紧急求助按钮"
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={12} style={{ textAlign: 'center' }}>
            <Button 
              type="primary" 
              danger 
              size="large"
              icon={<BellOutlined />}
              onClick={handleEmergencySOS}
              style={{ 
                height: '60px', 
                width: '200px',
                fontSize: '18px',
                borderRadius: '30px'
              }}
            >
              紧急求助
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 紧急联系人 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            title="紧急联系人" 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsAddContactModalVisible(true)}
              >
                添加联系人
              </Button>
            }
          >
            <List
              dataSource={contacts}
              renderItem={(contact) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      icon={<PhoneOutlined />}
                      onClick={() => handleEmergencyCall(contact)}
                    >
                      拨打
                    </Button>,
                    <Button 
                      icon={<MessageOutlined />}
                      onClick={() => message.info('发送短信功能')}
                    >
                      短信
                    </Button>,
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveContact(contact.id)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: contact.isPrimary ? '#ff4d4f' : '#1890ff' }}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text>{contact.name}</Text>
                        {contact.isPrimary && <Tag color="red">主要联系人</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <div>{contact.relationship} - {contact.phone}</div>
                        {contact.location && (
                          <div style={{ marginTop: '4px' }}>
                            <EnvironmentOutlined /> {contact.location}
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card title="紧急医疗信息">
            <div style={{ marginBottom: '16px' }}>
              <Text strong>血型：</Text>
              <Tag color="red">{emergencyInfo.bloodType}</Tag>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>过敏原：</Text>
              <div style={{ marginTop: '4px' }}>
                {emergencyInfo.allergies.map(allergy => (
                  <Tag key={allergy} color="orange" style={{ marginBottom: '4px' }}>
                    {allergy}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>当前用药：</Text>
              <div style={{ marginTop: '4px' }}>
                {emergencyInfo.medications.map(medication => (
                  <Tag key={medication} color="blue" style={{ marginBottom: '4px' }}>
                    {medication}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>疾病史：</Text>
              <div style={{ marginTop: '4px' }}>
                {emergencyInfo.conditions.map(condition => (
                  <Tag key={condition} color="purple" style={{ marginBottom: '4px' }}>
                    {condition}
                  </Tag>
                ))}
              </div>
            </div>

            <div>
              <Text strong>紧急备注：</Text>
              <Paragraph style={{ marginTop: '4px', marginBottom: 0 }}>
                {emergencyInfo.emergencyNotes}
              </Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button 
              type="primary" 
              icon={<PhoneOutlined />}
              block
              size="large"
            >
              拨打急救电话
            </Button>
          </Col>
          <Col span={6}>
            <Button 
                              icon={<GlobalOutlined />}
              block
              size="large"
            >
              分享位置
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<MessageOutlined />}
              block
              size="large"
            >
              发送位置
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<HeartOutlined />}
              block
              size="large"
            >
              健康档案
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 添加联系人模态框 */}
      <Modal
        title="添加紧急联系人"
        open={isAddContactModalVisible}
        onCancel={() => setIsAddContactModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddContact}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            name="relationship"
            label="关系"
            rules={[{ required: true, message: '请输入关系' }]}
          >
            <Select placeholder="请选择关系">
              <Option value="配偶">配偶</Option>
              <Option value="父母">父母</Option>
              <Option value="子女">子女</Option>
              <Option value="朋友">朋友</Option>
              <Option value="医生">医生</Option>
              <Option value="护士">护士</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话号码"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入电话号码" />
          </Form.Item>

          <Form.Item
            name="location"
            label="位置"
          >
            <Input placeholder="请输入位置信息（可选）" />
          </Form.Item>

          <Form.Item
            name="isPrimary"
            valuePropName="checked"
          >
            <Checkbox>设为主要联系人</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                添加联系人
              </Button>
              <Button onClick={() => setIsAddContactModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 紧急求助模态框 */}
      <Modal
        title="紧急求助"
        open={isEmergencyModalVisible}
        onCancel={() => setIsEmergencyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="紧急求助"
          description="系统将向所有紧急联系人发送求助信息，包括您的位置和基本医疗信息"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Form
          layout="vertical"
          onFinish={handleSendEmergencyAlert}
        >
          <Form.Item
            name="message"
            label="求助信息"
            initialValue="我需要紧急医疗帮助，请立即联系我！"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入求助信息"
            />
          </Form.Item>

          <Form.Item
            name="includeLocation"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>包含位置信息</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeHealthInfo"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>包含基本医疗信息</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                发送紧急求助
              </Button>
              <Button onClick={() => setIsEmergencyModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmergencyPage; 