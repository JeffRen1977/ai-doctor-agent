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
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

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
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: language === 'zh' ? '张小明' : 'John Smith',
      relationship: language === 'zh' ? '配偶' : 'Spouse',
      phone: '13800138000',
      isPrimary: true,
      location: language === 'zh' ? '北京市朝阳区' : 'Beijing, Chaoyang District'
    },
    {
      id: '2',
      name: language === 'zh' ? '李医生' : 'Dr. Li',
      relationship: language === 'zh' ? '主治医生' : 'Primary Doctor',
      phone: '13900139000',
      isPrimary: false,
      location: language === 'zh' ? '北京协和医院' : 'Peking Union Medical College Hospital'
    },
    {
      id: '3',
      name: language === 'zh' ? '王护士' : 'Nurse Wang',
      relationship: language === 'zh' ? '家庭护士' : 'Family Nurse',
      phone: '13700137000',
      isPrimary: false
    }
  ]);

  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo>({
    bloodType: 'A+',
    allergies: language === 'zh' ? ['青霉素', '海鲜'] : ['Penicillin', 'Seafood'],
    medications: language === 'zh' ? ['缬沙坦 80mg', '阿司匹林 100mg'] : ['Valsartan 80mg', 'Aspirin 100mg'],
    conditions: language === 'zh' ? ['高血压', '糖尿病'] : ['Hypertension', 'Diabetes'],
    emergencyNotes: language === 'zh' ? '有心脏病史，请优先联系家属' : 'Has heart disease history, please contact family first'
  });

  const [isAddContactModalVisible, setIsAddContactModalVisible] = useState(false);
  const [isEmergencyModalVisible, setIsEmergencyModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleEmergencyCall = (contact: EmergencyContact) => {
    Modal.confirm({
      title: language === 'zh' ? '紧急呼叫' : 'Emergency Call',
      content: language === 'zh' 
        ? `确定要拨打 ${contact.name} 的电话 ${contact.phone} 吗？`
        : `Are you sure you want to call ${contact.name} at ${contact.phone}?`,
      okText: language === 'zh' ? '确定拨打' : 'Call Now',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      onOk: () => {
        message.success(language === 'zh' 
          ? `正在拨打 ${contact.name} 的电话...`
          : `Calling ${contact.name}...`);
        // 这里可以集成实际的电话拨打功能
      }
    });
  };

  const handleEmergencySOS = () => {
    setIsEmergencyModalVisible(true);
  };

  const handleSendEmergencyAlert = (values: any) => {
    message.success(language === 'zh' 
      ? '紧急求助信息已发送给所有联系人！'
      : 'Emergency alert sent to all contacts!');
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
      message.success(language === 'zh' ? '紧急联系人添加成功！' : 'Emergency contact added successfully!');
      setIsAddContactModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error(language === 'zh' ? '添加失败，请重试' : 'Failed to add, please try again');
    }
  };

  const handleRemoveContact = (contactId: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    message.success(language === 'zh' ? '联系人已移除' : 'Contact removed');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>{t('emergency.title')}</Title>
      
      {/* 紧急状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '紧急联系人' : 'Emergency Contacts'}
              value={contacts.length}
              suffix={language === 'zh' ? '人' : ''}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '血型' : 'Blood Type'}
              value={emergencyInfo.bloodType}
              prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '过敏原' : 'Allergies'}
              value={emergencyInfo.allergies.length}
              suffix={language === 'zh' ? '种' : ''}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={language === 'zh' ? '当前用药' : 'Current Medications'}
              value={emergencyInfo.medications.length}
              suffix={language === 'zh' ? '种' : ''}
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
              message={language === 'zh' ? '紧急情况' : 'Emergency Situation'}
              description={language === 'zh' 
                ? '如果遇到紧急医疗情况，请立即点击紧急求助按钮'
                : 'If you encounter an emergency medical situation, please click the emergency help button immediately'}
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
              {t('emergency.sos')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 紧急联系人 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            title={language === 'zh' ? '紧急联系人' : 'Emergency Contacts'} 
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsAddContactModalVisible(true)}
              >
                {language === 'zh' ? '添加联系人' : 'Add Contact'}
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
                      {language === 'zh' ? '拨打' : 'Call'}
                    </Button>,
                    <Button 
                      icon={<MessageOutlined />}
                      onClick={() => message.info(language === 'zh' ? '发送短信功能' : 'Send SMS feature')}
                    >
                      {language === 'zh' ? '短信' : 'SMS'}
                    </Button>,
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveContact(contact.id)}
                    >
                      {language === 'zh' ? '删除' : 'Delete'}
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
                        {contact.isPrimary && <Tag color="red">{language === 'zh' ? '主要联系人' : 'Primary Contact'}</Tag>}
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
          <Card title={language === 'zh' ? '紧急医疗信息' : 'Emergency Medical Information'}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{language === 'zh' ? '血型：' : 'Blood Type: '}</Text>
              <Tag color="red">{emergencyInfo.bloodType}</Tag>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{language === 'zh' ? '过敏原：' : 'Allergies: '}</Text>
              <div style={{ marginTop: '4px' }}>
                {emergencyInfo.allergies.map(allergy => (
                  <Tag key={allergy} color="orange" style={{ marginBottom: '4px' }}>
                    {allergy}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>{language === 'zh' ? '当前用药：' : 'Current Medications: '}</Text>
              <div style={{ marginTop: '4px' }}>
                {emergencyInfo.medications.map(medication => (
                  <Tag key={medication} color="blue" style={{ marginBottom: '4px' }}>
                    {medication}
                  </Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text strong>{language === 'zh' ? '疾病史：' : 'Medical History: '}</Text>
              <div style={{ marginTop: '4px' }}>
                {emergencyInfo.conditions.map(condition => (
                  <Tag key={condition} color="purple" style={{ marginBottom: '4px' }}>
                    {condition}
                  </Tag>
                ))}
              </div>
            </div>

            <div>
              <Text strong>{language === 'zh' ? '紧急备注：' : 'Emergency Notes: '}</Text>
              <Paragraph style={{ marginTop: '4px', marginBottom: 0 }}>
                {emergencyInfo.emergencyNotes}
              </Paragraph>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title={language === 'zh' ? '快速操作' : 'Quick Actions'} style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Button 
              type="primary" 
              icon={<PhoneOutlined />}
              block
              size="large"
            >
              {language === 'zh' ? '拨打急救电话' : 'Call Emergency'}
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<GlobalOutlined />}
              block
              size="large"
            >
              {language === 'zh' ? '分享位置' : 'Share Location'}
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<MessageOutlined />}
              block
              size="large"
            >
              {language === 'zh' ? '发送位置' : 'Send Location'}
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<HeartOutlined />}
              block
              size="large"
            >
              {language === 'zh' ? '健康档案' : 'Health Records'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 添加联系人模态框 */}
      <Modal
        title={language === 'zh' ? '添加紧急联系人' : 'Add Emergency Contact'}
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
            <Select placeholder={language === 'zh' ? '请选择关系' : 'Select relationship'}>
              <Option value={language === 'zh' ? '配偶' : 'Spouse'}>{language === 'zh' ? '配偶' : 'Spouse'}</Option>
              <Option value={language === 'zh' ? '父母' : 'Parent'}>{language === 'zh' ? '父母' : 'Parent'}</Option>
              <Option value={language === 'zh' ? '子女' : 'Child'}>{language === 'zh' ? '子女' : 'Child'}</Option>
              <Option value={language === 'zh' ? '朋友' : 'Friend'}>{language === 'zh' ? '朋友' : 'Friend'}</Option>
              <Option value={language === 'zh' ? '医生' : 'Doctor'}>{language === 'zh' ? '医生' : 'Doctor'}</Option>
              <Option value={language === 'zh' ? '护士' : 'Nurse'}>{language === 'zh' ? '护士' : 'Nurse'}</Option>
              <Option value={language === 'zh' ? '其他' : 'Other'}>{language === 'zh' ? '其他' : 'Other'}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label={language === 'zh' ? '电话号码' : 'Phone Number'}
            rules={[{ required: true, message: language === 'zh' ? '请输入电话号码' : 'Please enter phone number' }]}
          >
            <Input placeholder={language === 'zh' ? '请输入电话号码' : 'Enter phone number'} />
          </Form.Item>

          <Form.Item
            name="location"
            label={language === 'zh' ? '位置' : 'Location'}
          >
            <Input placeholder={language === 'zh' ? '请输入位置信息（可选）' : 'Enter location (optional)'} />
          </Form.Item>

          <Form.Item
            name="isPrimary"
            valuePropName="checked"
          >
            <Checkbox>{language === 'zh' ? '设为主要联系人' : 'Set as primary contact'}</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {language === 'zh' ? '添加联系人' : 'Add Contact'}
              </Button>
              <Button onClick={() => setIsAddContactModalVisible(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 紧急求助模态框 */}
      <Modal
        title={t('emergency.sos')}
        open={isEmergencyModalVisible}
        onCancel={() => setIsEmergencyModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message={t('emergency.sos')}
          description={language === 'zh' 
            ? '系统将向所有紧急联系人发送求助信息，包括您的位置和基本医疗信息'
            : 'The system will send help requests to all emergency contacts, including your location and basic medical information'}
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
            label={language === 'zh' ? '求助信息' : 'Help Message'}
            initialValue={language === 'zh' 
              ? '我需要紧急医疗帮助，请立即联系我！'
              : 'I need emergency medical help, please contact me immediately!'}
          >
            <Input.TextArea 
              rows={3} 
              placeholder={language === 'zh' ? '请输入求助信息' : 'Enter help message'}
            />
          </Form.Item>

          <Form.Item
            name="includeLocation"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>{language === 'zh' ? '包含位置信息' : 'Include location information'}</Checkbox>
          </Form.Item>

          <Form.Item
            name="includeHealthInfo"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>{language === 'zh' ? '包含基本医疗信息' : 'Include basic medical information'}</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                {language === 'zh' ? '发送紧急求助' : 'Send Emergency Alert'}
              </Button>
              <Button onClick={() => setIsEmergencyModalVisible(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmergencyPage; 