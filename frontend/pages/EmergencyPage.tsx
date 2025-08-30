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
  Checkbox,
  Grid
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
  EnvironmentOutlined,
  MedicineBoxOutlined
} from '@ant-design/icons';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

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
  const screens = useBreakpoint();
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

  const handleEmergencyCall = () => {
    Modal.confirm({
      title: language === 'zh' ? '紧急求助确认' : 'Emergency Call Confirmation',
      content: language === 'zh' 
        ? '您确定要拨打紧急求助电话吗？这将立即联系急救服务。'
        : 'Are you sure you want to make an emergency call? This will immediately contact emergency services.',
      okText: language === 'zh' ? '确认拨打' : 'Confirm Call',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      okType: 'danger',
      onOk: () => {
        message.success(language === 'zh' ? '正在拨打紧急求助电话...' : 'Calling emergency services...');
        // 这里可以集成实际的电话拨打功能
        setTimeout(() => {
          message.success(language === 'zh' ? '紧急求助电话已拨打' : 'Emergency call made');
        }, 2000);
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
      onOk: () => {
        message.success(language === 'zh' ? '正在发送紧急消息...' : 'Sending emergency messages...');
        // 这里可以集成实际的消息发送功能
        setTimeout(() => {
          message.success(language === 'zh' ? '紧急消息已发送' : 'Emergency messages sent');
        }, 2000);
      }
    });
  };

  return (
    <div style={{ padding: screens.xs ? '8px' : '24px' }}>
      <Title level={screens.xs ? 3 : 2} style={{ marginBottom: '24px', textAlign: screens.xs ? 'center' : 'left' }}>
        {t('emergency.title')}
      </Title>

      {/* 紧急求助按钮 */}
              <Card 
          title={language === 'zh' ? '紧急求助' : 'Emergency Help'} 
          size="small"
          style={{ marginBottom: '24px' }}
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
              size={screens.xs ? 'large' : 'large'}
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
              size={screens.xs ? 'large' : 'large'}
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
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '24px' }}
      >
        {screens.xs ? (
          // 移动端列表视图
          <List
            dataSource={contacts}
            renderItem={(contact) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    icon={<EditOutlined />} 
                    size="small"
                    onClick={() => {/* 编辑功能 */}}
                  >
                    {language === 'zh' ? '编辑' : 'Edit'}
                  </Button>,
                  <Button 
                    type="link" 
                    danger 
                    icon={<DeleteOutlined />} 
                    size="small"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    {language === 'zh' ? '删除' : 'Delete'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={contact.isPrimary ? '主要' : ''} size="small">
                      <Avatar 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: contact.isPrimary ? '#52c41a' : '#1890ff' }}
                        size={screens.xs ? 'small' : 'default'}
                      />
                    </Badge>
                  }
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: screens.xs ? '14px' : '16px', fontWeight: 'bold' }}>
                        {contact.name}
                      </span>
                                           <Tag color={contact.isPrimary ? 'green' : 'blue'}>
                       {contact.relationship}
                     </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: '4px', fontSize: screens.xs ? '12px' : '14px' }}>
                        <PhoneOutlined /> {contact.phone}
                      </div>
                      {contact.location && (
                        <div style={{ fontSize: screens.xs ? '11px' : '13px', color: '#666' }}>
                          <EnvironmentOutlined /> {contact.location}
                        </div>
                      )}
                      {!contact.isPrimary && (
                        <Button 
                          type="link" 
                          size="small" 
                          onClick={() => handleSetPrimary(contact.id)}
                          style={{ padding: 0, fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          {language === 'zh' ? '设为主要联系人' : 'Set as Primary'}
                        </Button>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          // 桌面端网格视图
          <Row gutter={[16, 16]}>
            {contacts.map((contact) => (
              <Col span={8} key={contact.id}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <Badge count={contact.isPrimary ? '主要' : ''} size="small">
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
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => {/* 编辑功能 */}}
                      >
                        {language === 'zh' ? '编辑' : 'Edit'}
                      </Button>
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
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title={language === 'zh' ? '血型' : 'Blood Type'}
                value={emergencyInfo.bloodType}
                prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ fontSize: screens.xs ? '18px' : '20px' }}
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
                valueStyle={{ fontSize: screens.xs ? '18px' : '20px' }}
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
                valueStyle={{ fontSize: screens.xs ? '18px' : '20px' }}
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
                valueStyle={{ fontSize: screens.xs ? '18px' : '20px' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: screens.xs ? '16px 0' : '24px 0' }} />

        {/* 详细信息 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                {language === 'zh' ? '过敏信息：' : 'Allergies: '}
              </Text>
              <div style={{ marginTop: '8px' }}>
                {emergencyInfo.allergies.map((allergy, index) => (
                  <Tag key={index} color="red" style={{ marginBottom: '4px' }}>
                    {allergy}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                {language === 'zh' ? '用药信息：' : 'Medications: '}
              </Text>
              <div style={{ marginTop: '8px' }}>
                {emergencyInfo.medications.map((medication, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                    {medication}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
          <Col xs={24}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                {language === 'zh' ? '疾病信息：' : 'Medical Conditions: '}
              </Text>
              <div style={{ marginTop: '8px' }}>
                {emergencyInfo.conditions.map((condition, index) => (
                  <Tag key={index} color="orange" style={{ marginBottom: '4px' }}>
                    {condition}
                  </Tag>
                ))}
              </div>
            </div>
          </Col>
          <Col xs={24}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                {language === 'zh' ? '紧急备注：' : 'Emergency Notes: '}
              </Text>
              <div style={{ 
                marginTop: '8px', 
                padding: '12px', 
                backgroundColor: '#fff2e8', 
                borderRadius: '6px',
                border: '1px solid #ffd591'
              }}>
                <Text style={{ fontSize: screens.xs ? '13px' : '14px' }}>
                  {emergencyInfo.emergencyNotes}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 附近医疗机构 */}
      <Card 
        title={language === 'zh' ? '附近医疗机构' : 'Nearby Medical Facilities'} 
        size={screens.xs ? 'small' : 'default'}
        extra={
          <Button 
            type="link" 
            icon={<GlobalOutlined />}
            size="small"
          >
            {language === 'zh' ? '查看地图' : 'View Map'}
          </Button>
        }
      >
        <Alert
          message={language === 'zh' ? '位置服务' : 'Location Services'}
          description={language === 'zh' 
            ? '基于您的位置，显示附近的医院、诊所和药房。点击"查看地图"获取详细信息。'
            : 'Based on your location, shows nearby hospitals, clinics and pharmacies. Click "View Map" for details.'
          }
          type="info"
          showIcon
          icon={<EnvironmentOutlined />}
          style={{ marginBottom: '16px' }}
        />
        
        <div style={{ 
          textAlign: 'center', 
          padding: screens.xs ? '20px' : '40px',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          border: '2px dashed #d9d9d9'
        }}>
          <EnvironmentOutlined style={{ fontSize: screens.xs ? '32px' : '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Text type="secondary" style={{ fontSize: screens.xs ? '14px' : '16px' }}>
            {language === 'zh' 
              ? '点击"查看地图"查看附近的医疗机构'
              : 'Click "View Map" to see nearby medical facilities'
            }
          </Text>
        </div>
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
            <Input 
              placeholder={language === 'zh' ? '请输入联系人姓名' : 'Enter contact name'}
              size="middle"
            />
          </Form.Item>
          
          <Form.Item
            name="relationship"
            label={language === 'zh' ? '关系' : 'Relationship'}
            rules={[{ required: true, message: language === 'zh' ? '请输入关系' : 'Please enter relationship' }]}
          >
            <Input 
              placeholder={language === 'zh' ? '例如：配偶、医生、朋友等' : 'e.g., Spouse, Doctor, Friend'}
              size="middle"
            />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label={language === 'zh' ? '电话' : 'Phone'}
            rules={[{ required: true, message: language === 'zh' ? '请输入电话号码' : 'Please enter phone number' }]}
          >
            <Input 
              placeholder={language === 'zh' ? '请输入电话号码' : 'Enter phone number'}
              size="middle"
            />
          </Form.Item>
          
          <Form.Item
            name="location"
            label={language === 'zh' ? '位置' : 'Location'}
          >
            <Input 
              placeholder={language === 'zh' ? '可选：联系人位置或工作地点' : 'Optional: Contact location or workplace'}
              size="middle"
            />
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
    </div>
  );
};

export default EmergencyPage; 