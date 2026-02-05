import React, { useState } from 'react';
import { Card, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, message, Tabs, Upload, Alert, Grid, List, Row, Col, Divider, Radio } from 'antd';
import type { TabsProps } from 'antd';
import { PlusOutlined, InboxOutlined, FileTextOutlined, UsergroupAddOutlined, MobileOutlined, DatabaseOutlined, LinkOutlined, SyncOutlined, MedicineBoxOutlined, HeartOutlined, MonitorOutlined, FileSearchOutlined, FormOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './HealthRecordsPage.css';
import { getFhirPatientRecords } from '../services/api';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { getTranslation } from '../locales';

const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;


const HealthRecordsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const screens = useBreakpoint();
  const t = (key: string) => getTranslation(language, key);
  
  const [isFetchingFhir, setIsFetchingFhir] = useState(false);
  const [form] = Form.useForm();




  const fetchFhirRecords = async () => {
    if (!user?.email) {
      message.error(language === 'zh' ? '请先登录' : 'Please login first');
      return;
    }

    setIsFetchingFhir(true);
    try {
      const fhirRecords = await getFhirPatientRecords(user.email);
      if (fhirRecords.length > 0) {
        message.success(language === 'zh' ? `已导入 ${fhirRecords.length} 条FHIR记录` : `Imported ${fhirRecords.length} FHIR records`);
      } else {
        message.info(language === 'zh' ? '没有找到FHIR记录' : 'No FHIR records found');
      }
    } catch (error) {
      message.error(language === 'zh' ? '导入FHIR记录失败' : 'Failed to import FHIR records');
    } finally {
      setIsFetchingFhir(false);
    }
  };


  const items: TabsProps['items'] = [
    {
      key: 'personalRecords',
      label: language === 'zh' ? '个人健康档案' : 'Personal Health Records',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '个人健康档案采集' : 'Personal Health Records Collection'}
            description={language === 'zh' 
              ? '记录患者基本信息、既往病史、用药记录等个人健康档案数据。'
              : 'Record patient basic information, medical history, medication records, and other personal health record data.'}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Card
            title={
              <Space>
                <UsergroupAddOutlined />
                <span>{language === 'zh' ? '健康档案管理' : 'Health Records Management'}</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  const personalInfoModal = Modal.info({
                    title: language === 'zh' ? '个人健康档案采集' : 'Personal Health Records Collection',
                    width: screens.xs ? '95%' : 700,
                    content: (
                      <Form layout="vertical" form={form}>
                        <Form.Item label={language === 'zh' ? '基本信息' : 'Basic Information'}>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="name" label={language === 'zh' ? '姓名' : 'Name'}>
                                <Input placeholder={language === 'zh' ? '请输入姓名' : 'Enter name'} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="gender" label={language === 'zh' ? '性别' : 'Gender'}>
                                <Select placeholder={language === 'zh' ? '请选择性别' : 'Select gender'}>
                                  <Option value="male">{language === 'zh' ? '男' : 'Male'}</Option>
                                  <Option value="female">{language === 'zh' ? '女' : 'Female'}</Option>
                                  <Option value="other">{language === 'zh' ? '其他' : 'Other'}</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item name="birthDate" label={language === 'zh' ? '出生日期' : 'Date of Birth'}>
                                <DatePicker style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item name="bloodType" label={language === 'zh' ? '血型' : 'Blood Type'}>
                                <Select placeholder={language === 'zh' ? '请选择血型' : 'Select blood type'}>
                                  <Option value="A">A</Option>
                                  <Option value="B">B</Option>
                                  <Option value="AB">AB</Option>
                                  <Option value="O">O</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form.Item>

                        <Divider>{language === 'zh' ? '既往病史' : 'Medical History'}</Divider>
                        <Form.Item name="medicalHistory" label={language === 'zh' ? '病史记录' : 'Medical History'}>
                          <TextArea 
                            rows={4} 
                            placeholder={language === 'zh' ? '请输入既往病史、手术史、过敏史等...' : 'Enter medical history, surgical history, allergies, etc...'} 
                          />
                        </Form.Item>

                        <Divider>{language === 'zh' ? '用药记录' : 'Medication Records'}</Divider>
                        <Form.Item name="medications" label={language === 'zh' ? '当前用药' : 'Current Medications'}>
                          <TextArea 
                            rows={3} 
                            placeholder={language === 'zh' ? '请输入当前服用的药物名称、剂量、频率等...' : 'Enter current medications, dosage, frequency, etc...'} 
                          />
                        </Form.Item>

                        <Divider>{language === 'zh' ? '其他信息' : 'Additional Information'}</Divider>
                        <Form.Item name="familyHistory" label={language === 'zh' ? '家族病史' : 'Family History'}>
                          <TextArea 
                            rows={3} 
                            placeholder={language === 'zh' ? '请输入家族病史...' : 'Enter family history...'} 
                          />
                        </Form.Item>
                        <Form.Item name="allergies" label={language === 'zh' ? '过敏史' : 'Allergies'}>
                          <TextArea 
                            rows={2} 
                            placeholder={language === 'zh' ? '请输入过敏史...' : 'Enter allergies...'} 
                          />
                        </Form.Item>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item name="emergencyContact" label={language === 'zh' ? '紧急联系人' : 'Emergency Contact'}>
                              <Input placeholder={language === 'zh' ? '联系人姓名' : 'Contact name'} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="emergencyPhone" label={language === 'zh' ? '紧急联系电话' : 'Emergency Phone'}>
                              <Input placeholder={language === 'zh' ? '联系电话' : 'Phone number'} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Divider>{language === 'zh' ? '附件上传' : 'File Attachments'}</Divider>
                        <Form.Item name="files" label={language === 'zh' ? '上传文件（可选）' : 'Upload Files (Optional)'}>
                          <Upload
                            multiple
                            beforeUpload={() => false}
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                            onChange={(info) => {
                              form.setFieldsValue({ files: info.fileList });
                            }}
                          >
                            <Button icon={<InboxOutlined />}>
                              {language === 'zh' ? '选择文件' : 'Select Files'}
                            </Button>
                          </Upload>
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                            {language === 'zh' ? '支持图片、PDF、Word文档，最多10个文件' : 'Supports images, PDF, Word documents, up to 10 files'}
                          </div>
                        </Form.Item>

                        <Form.Item>
                          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => personalInfoModal.destroy()}>
                              {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                            <Button 
                              type="primary" 
                              loading={false}
                              onClick={async () => {
                                try {
                                  const values = await form.validateFields();
                                  
                                  // 准备 FormData
                                  const formData = new FormData();
                                  
                                  // 添加文本字段
                                  if (values.name) formData.append('name', values.name);
                                  if (values.gender) formData.append('gender', values.gender);
                                  if (values.birthDate) {
                                    const birthDate = dayjs.isDayjs(values.birthDate) 
                                      ? values.birthDate.format('YYYY-MM-DD')
                                      : dayjs(values.birthDate).format('YYYY-MM-DD');
                                    formData.append('birthDate', birthDate);
                                  }
                                  if (values.bloodType) formData.append('bloodType', values.bloodType);
                                  if (values.medicalHistory) formData.append('medicalHistory', values.medicalHistory);
                                  if (values.medications) formData.append('medications', values.medications);
                                  if (values.familyHistory) formData.append('familyHistory', values.familyHistory);
                                  if (values.allergies) formData.append('allergies', values.allergies);
                                  if (values.emergencyContact) formData.append('emergencyContact', values.emergencyContact);
                                  if (values.emergencyPhone) formData.append('emergencyPhone', values.emergencyPhone);
                                  
                                  // 添加文件
                                  if (values.files && values.files.length > 0) {
                                    values.files.forEach((file: any) => {
                                      const fileObj = file.originFileObj || file;
                                      if (fileObj instanceof File) {
                                        formData.append('files', fileObj);
                                      }
                                    });
                                  }
                                  
                                  // 发送请求
                                  const response = await api.post('/health-records/personal-health-record', formData, {
                                    headers: {
                                      'Content-Type': 'multipart/form-data',
                                    },
                                  });
                                  
                                  if (response.data.success) {
                                    message.success(language === 'zh' ? '健康档案已保存' : 'Health record saved');
                                    personalInfoModal.destroy();
                                    form.resetFields();
                                  } else {
                                    message.error(response.data.error || (language === 'zh' ? '保存失败' : 'Save failed'));
                                  }
                                } catch (error: any) {
                                  console.error('Save health record error:', error);
                                  message.error(
                                    error.response?.data?.error || 
                                    error.message || 
                                    (language === 'zh' ? '保存失败，请重试' : 'Save failed, please try again')
                                  );
                                }
                              }}
                            >
                              {language === 'zh' ? '保存' : 'Save'}
                            </Button>
                          </Space>
                        </Form.Item>
                      </Form>
                    ),
                  });
                }}
              >
                {language === 'zh' ? '添加档案' : 'Add Record'}
              </Button>
            }
          >
            <List
              size="small"
              dataSource={[
                { label: language === 'zh' ? '基本信息' : 'Basic Information', icon: <FileTextOutlined /> },
                { label: language === 'zh' ? '既往病史' : 'Medical History', icon: <MedicineBoxOutlined /> },
                { label: language === 'zh' ? '用药记录' : 'Medications', icon: <MedicineBoxOutlined /> },
                { label: language === 'zh' ? '家族病史' : 'Family History', icon: <UsergroupAddOutlined /> },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    {item.icon}
                    <span>{item.label}</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'smartDevices',
      label: language === 'zh' ? '智能设备' : 'Smart Devices',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '智能设备数据接入' : 'Smart Device Integration'}
            description={language === 'zh' 
              ? '连接可穿戴设备（如手环、智能手表）和健康监测设备（血糖仪、血压计等），实时同步健康数据。'
              : 'Connect wearable devices (bands, smartwatches) and health monitoring devices (glucose meters, blood pressure monitors, etc.) to sync health data in real-time.'}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Card
            title={
              <Space>
                <MobileOutlined />
                <span>{language === 'zh' ? '设备管理' : 'Device Management'}</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<SyncOutlined />}
                onClick={async () => {
                  try {
                    message.loading(language === 'zh' ? '正在同步设备数据...' : 'Syncing device data...', 0);
                    await api.post('/wearables/sync', { useMock: false });
                    message.destroy();
                    message.success(language === 'zh' ? '设备数据同步成功' : 'Device data synced successfully');
      } catch (error) {
                    message.destroy();
                    message.error(language === 'zh' ? '设备数据同步失败' : 'Device sync failed');
                  }
                }}
              >
                {language === 'zh' ? '同步所有设备' : 'Sync All Devices'}
              </Button>
            }
          >
    <List
              size="small"
              dataSource={[
                { 
                  name: 'Fitbit', 
                  type: 'wearable',
                  status: 'connected',
                  icon: <HeartOutlined style={{ color: '#52c41a' }} />,
                  description: language === 'zh' ? '可穿戴设备（手环、智能手表）' : 'Wearable devices (bands, smartwatches)'
                },
                { 
                  name: 'Apple Health', 
                  type: 'wearable',
                  status: 'disconnected',
                  icon: <MobileOutlined style={{ color: '#faad14' }} />,
                  description: language === 'zh' ? 'Apple HealthKit 数据' : 'Apple HealthKit data'
                },
                { 
                  name: language === 'zh' ? '血糖仪' : 'Glucose Meter', 
                  type: 'monitor',
                  status: 'disconnected',
                  icon: <MonitorOutlined style={{ color: '#1890ff' }} />,
                  description: language === 'zh' ? '健康监测设备' : 'Health monitoring devices'
                },
                { 
                  name: language === 'zh' ? '血压计' : 'Blood Pressure Monitor', 
                  type: 'monitor',
                  status: 'disconnected',
                  icon: <HeartOutlined style={{ color: '#ff4d4f' }} />,
                  description: language === 'zh' ? '健康监测设备' : 'Health monitoring devices'
                },
              ]}
              renderItem={(item) => (
        <List.Item
          actions={[
                    <Tag color={item.status === 'connected' ? 'success' : 'default'}>
                      {item.status === 'connected' 
                        ? (language === 'zh' ? '已连接' : 'Connected')
                        : (language === 'zh' ? '未连接' : 'Disconnected')}
                    </Tag>,
            <Button 
              type="link" 
              size="small"
                      onClick={() => {
                        if (item.name === 'Fitbit') {
                          window.open('/api/wearables/fitbit/auth', '_blank');
                        } else {
                          message.info(language === 'zh' ? '设备连接功能开发中' : 'Device connection feature in development');
                        }
                      }}
                    >
                      {item.status === 'connected' 
                        ? (language === 'zh' ? '管理' : 'Manage')
                        : (language === 'zh' ? '连接' : 'Connect')}
            </Button>
          ]}
        >
          <List.Item.Meta
                    avatar={item.icon}
                    title={item.name}
                    description={item.description}
          />
        </List.Item>
      )}
    />
          </Card>
        </div>
      ),
    },
    {
      key: 'hospitalSystems',
      label: language === 'zh' ? '医院系统' : 'Hospital Systems',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '医院/诊所系统数据对接' : 'Hospital/Clinic System Integration'}
            description={language === 'zh' 
              ? '与电子病历（EMR）、检验系统、影像系统对接，导入医疗数据。'
              : 'Connect with Electronic Medical Records (EMR), lab systems, and imaging systems to import medical data.'}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
            <Card 
            title={
                <Space>
                <DatabaseOutlined />
                <span>{language === 'zh' ? '系统对接' : 'System Integration'}</span>
              </Space>
            }
            extra={
                  <Button 
                    type="primary" 
                icon={<LinkOutlined />}
                onClick={fetchFhirRecords}
                loading={isFetchingFhir}
              >
                {language === 'zh' ? '导入FHIR' : 'Import FHIR'}
                  </Button>
            }
          >
              <List
                size="small"
              dataSource={[
                { 
                  name: 'FHIR', 
                  type: 'emr',
                  icon: <DatabaseOutlined style={{ color: '#1890ff' }} />,
                  description: language === 'zh' ? '电子病历（EMR）系统' : 'Electronic Medical Records (EMR)'
                },
                { 
                  name: language === 'zh' ? '检验系统' : 'Lab System', 
                  type: 'lab',
                  icon: <FileSearchOutlined style={{ color: '#52c41a' }} />,
                  description: language === 'zh' ? '检验报告、化验单' : 'Lab reports, test results'
                },
                { 
                  name: language === 'zh' ? '影像系统' : 'Imaging System', 
                  type: 'imaging',
                  icon: <FileSearchOutlined style={{ color: '#faad14' }} />,
                  description: language === 'zh' ? '医学影像、X光片、CT等' : 'Medical imaging, X-rays, CT scans, etc.'
                },
              ]}
              renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        size="small"
                      onClick={() => {
                        if (item.name === 'FHIR') {
                          fetchFhirRecords();
                        } else {
                          message.info(language === 'zh' ? '系统对接功能开发中' : 'System integration feature in development');
                        }
                      }}
                    >
                      {language === 'zh' ? '对接' : 'Connect'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                    avatar={item.icon}
                    title={item.name}
                    description={item.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
        </div>
      ),
    },
    {
      key: 'mobileReporting',
      label: language === 'zh' ? '移动端上报' : 'Mobile Reporting',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '移动端数据上报' : 'Mobile Data Reporting'}
            description={language === 'zh' 
              ? '通过APP/小程序填写问卷、上传自测数据，方便快捷地记录健康信息。'
              : 'Fill questionnaires and upload self-test data through APP/Mini Program to easily record health information.'}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
            <Card 
            title={
              <Space>
                <FormOutlined />
                <span>{language === 'zh' ? '数据上报' : 'Data Reporting'}</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  const mobileReportModal = Modal.info({
                    title: language === 'zh' ? '移动端数据上报' : 'Mobile Data Reporting',
                    width: screens.xs ? '95%' : 600,
                    content: (
                      <Form layout="vertical">
                        <Form.Item label={language === 'zh' ? '上报类型' : 'Report Type'}>
                          <Radio.Group>
                            <Radio value="questionnaire">{language === 'zh' ? '问卷填写' : 'Questionnaire'}</Radio>
                            <Radio value="selfTest">{language === 'zh' ? '自测数据' : 'Self-Test Data'}</Radio>
                          </Radio.Group>
                        </Form.Item>

                        <Form.Item label={language === 'zh' ? '数据内容' : 'Data Content'}>
                          <TextArea 
                            rows={6} 
                            placeholder={language === 'zh' ? '请填写问卷内容或自测数据...' : 'Enter questionnaire content or self-test data...'} 
                          />
                        </Form.Item>

                        <Form.Item label={language === 'zh' ? '上传附件（可选）' : 'Upload Attachments (Optional)'}>
                          <Upload
                            multiple
                            beforeUpload={() => false}
                            accept=".jpg,.jpeg,.png,.pdf"
                          >
                            <Button icon={<InboxOutlined />}>
                              {language === 'zh' ? '选择文件' : 'Select Files'}
                            </Button>
                          </Upload>
                        </Form.Item>

                        <Form.Item>
                          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => mobileReportModal.destroy()}>
                              {language === 'zh' ? '取消' : 'Cancel'}
                            </Button>
                      <Button 
                              type="primary"
                        onClick={() => {
                                message.success(language === 'zh' ? '数据上报成功' : 'Data reported successfully');
                                mobileReportModal.destroy();
                        }}
                      >
                              {language === 'zh' ? '提交' : 'Submit'}
                      </Button>
                          </Space>
                        </Form.Item>
                      </Form>
                    ),
                  });
                }}
              >
                {language === 'zh' ? '新建上报' : 'New Report'}
              </Button>
            }
          >
            <List
              size="small"
              dataSource={[
                { 
                  label: language === 'zh' ? '问卷填写' : 'Questionnaire', 
                  icon: <FormOutlined />,
                  description: language === 'zh' ? 'APP/小程序填写问卷' : 'Fill questionnaires via APP/Mini Program'
                },
                { 
                  label: language === 'zh' ? '自测数据' : 'Self-Test Data', 
                  icon: <MobileOutlined />,
                  description: language === 'zh' ? '上传自测数据、照片等' : 'Upload self-test data, photos, etc.'
                },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.label}
                    description={item.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: screens.xs ? '8px' : '24px' }}>
      <Card 
        title={t('healthRecords.title')} 
        size={screens.xs ? 'small' : 'default'}
        style={{ marginBottom: '16px' }}
      >
        <Tabs 
          items={items} 
          size={screens.xs ? 'small' : 'large'}
          tabPosition={screens.xs ? 'top' : 'top'}
        />
      </Card>

    </div>
  );
};

export default HealthRecordsPage;