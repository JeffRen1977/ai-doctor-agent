import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, message, Tabs, Upload, Alert, Grid, List, Avatar } from 'antd';
import type { TabsProps, UploadProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudDownloadOutlined, InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './HealthRecordsPage.css';
import { getFhirPatientRecords } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { getTranslation } from '../locales';

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;
const { useBreakpoint } = Grid;

interface HealthRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
}

const HealthRecordsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const screens = useBreakpoint();
  const t = (key: string) => getTranslation(language, key);
  
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [isFetchingFhir, setIsFetchingFhir] = useState(false);
  const [form] = Form.useForm();

  const severityColors = { low: 'green', medium: 'orange', high: 'red' };
  const severityLabels = { 
    low: language === 'zh' ? '轻微' : 'Low', 
    medium: language === 'zh' ? '中等' : 'Medium', 
    high: language === 'zh' ? '严重' : 'High' 
  };
  const statusColors = { active: 'red', resolved: 'green' };
  const statusLabels = { 
    active: language === 'zh' ? '进行中' : 'Active', 
    resolved: language === 'zh' ? '已解决' : 'Resolved' 
  };

  const columns = [
    { 
      title: language === 'zh' ? '日期' : 'Date', 
      dataIndex: 'date', 
      key: 'date', 
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      responsive: ['md'] as const
    },
    { 
      title: language === 'zh' ? '症状类型' : 'Symptom Type', 
      dataIndex: 'type', 
      key: 'type' 
    },
    { 
      title: language === 'zh' ? '描述' : 'Description', 
      dataIndex: 'description', 
      key: 'description', 
      ellipsis: true,
      responsive: ['lg'] as const
    },
    { 
      title: language === 'zh' ? '严重程度' : 'Severity', 
      dataIndex: 'severity', 
      key: 'severity', 
      render: (severity: keyof typeof severityColors) => (<Tag color={severityColors[severity]}>{severityLabels[severity]}</Tag>) 
    },
    { 
      title: language === 'zh' ? '状态' : 'Status', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: keyof typeof statusColors) => (<Tag color={statusColors[status]}>{statusLabels[status]}</Tag>),
      responsive: ['md'] as const
    },
    { 
      title: language === 'zh' ? '操作' : 'Actions', 
      key: 'action', 
      render: (_: any, record: HealthRecord) => (
        <Space size={screens.xs ? 'small' : 'middle'}>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size={screens.xs ? 'small' : 'default'}
          >
            {screens.xs ? (language === 'zh' ? '编辑' : 'Edit') : (language === 'zh' ? '编辑' : 'Edit')}
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            size={screens.xs ? 'small' : 'default'}
          >
            {screens.xs ? (language === 'zh' ? '删除' : 'Del') : (language === 'zh' ? '删除' : 'Delete')}
          </Button>
        </Space>
      ) 
    },
  ];

  const handleAdd = () => { setEditingRecord(null); form.resetFields(); setModalVisible(true); };
  const handleEdit = (record: HealthRecord) => { setEditingRecord(record); form.setFieldsValue({ ...record, date: dayjs(record.date) }); setModalVisible(true); };
  const handleDelete = (id: string) => { 
    Modal.confirm({ 
      title: t('healthRecords.confirmDeleteTitle'), 
      content: t('healthRecords.confirmDeleteContent'), 
      onOk: () => { 
        setRecords(prev => prev.filter(record => record.id !== id));
        message.success(language === 'zh' ? '记录已删除' : 'Record deleted');
      } 
    }); 
  };

  const handleSubmit = (values: any) => {
    const recordData = {
      ...values,
      date: values.date.format('YYYY-MM-DD'),
      id: editingRecord?.id || Date.now().toString(),
    };

    if (editingRecord) {
      setRecords(prev => prev.map(record => record.id === editingRecord.id ? recordData : record));
      message.success(language === 'zh' ? '记录已更新' : 'Record updated');
    } else {
      setRecords(prev => [...prev, recordData]);
      message.success(language === 'zh' ? '记录已添加' : 'Record added');
    }

    setModalVisible(false);
    form.resetFields();
  };

  const fetchFhirRecords = async () => {
    if (!user?.email) {
      message.error(language === 'zh' ? '请先登录' : 'Please login first');
      return;
    }

    setIsFetchingFhir(true);
    try {
      const fhirRecords = await getFhirPatientRecords(user.email);
      if (fhirRecords.length > 0) {
        const convertedRecords = fhirRecords.map((record: any) => ({
          id: record.id,
          date: record.date || new Date().toISOString().split('T')[0],
          type: record.type || 'FHIR Record',
          description: record.description || record.text || 'FHIR imported record',
          severity: record.severity || 'medium',
          status: record.status || 'active'
        }));
        setRecords(prev => [...prev, ...convertedRecords]);
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

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(language === 'zh' ? '文件大小不能超过10MB' : 'File size must be less than 10MB');
      }
      return false;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success(language === 'zh' ? '文件上传成功' : 'File uploaded successfully');
      }
    },
  };

  // Mobile-friendly list view
  const renderMobileList = () => (
    <List
      dataSource={records}
      renderItem={(record) => (
        <List.Item
          actions={[
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              size="small"
            >
              {language === 'zh' ? '编辑' : 'Edit'}
            </Button>,
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
              size="small"
            >
              {language === 'zh' ? '删除' : 'Del'}
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar 
                icon={<FileTextOutlined />} 
                style={{ backgroundColor: severityColors[record.severity] }}
              />
            }
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{record.type}</span>
                <Tag color={severityColors[record.severity]} size="small">
                  {severityLabels[record.severity]}
                </Tag>
              </div>
            }
            description={
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {dayjs(record.date).format('YYYY-MM-DD')}
                </div>
                <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                  {record.description}
                </div>
                <Tag color={statusColors[record.status]} size="small">
                  {statusLabels[record.status]}
                </Tag>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );

  const items: TabsProps['items'] = [
    {
      key: 'records',
      label: language === 'zh' ? '健康记录' : 'Health Records',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: screens.xs ? 'column' : 'row', gap: '8px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
              size={screens.xs ? 'middle' : 'default'}
              block={screens.xs}
            >
              {language === 'zh' ? '添加记录' : 'Add Record'}
            </Button>
            <Button 
              icon={<CloudDownloadOutlined />} 
              onClick={fetchFhirRecords}
              loading={isFetchingFhir}
              size={screens.xs ? 'middle' : 'default'}
              block={screens.xs}
            >
              {language === 'zh' ? '导入FHIR' : 'Import FHIR'}
            </Button>
          </div>
          
          {screens.xs ? renderMobileList() : (
            <Table 
              columns={columns} 
              dataSource={records} 
              rowKey="id"
              pagination={{ 
                pageSize: screens.xs ? 10 : 20,
                showSizeChanger: !screens.xs,
                showQuickJumper: !screens.xs
              }}
              scroll={{ x: screens.xs ? 600 : undefined }}
            />
          )}
        </div>
      ),
    },
    {
      key: 'upload',
      label: language === 'zh' ? '文件上传' : 'File Upload',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '文件上传说明' : 'File Upload Instructions'}
            description={language === 'zh' 
              ? '支持上传PDF、Word文档和图片文件，文件大小不超过10MB'
              : 'Supports PDF, Word documents and image files, file size should not exceed 10MB'
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Dragger {...uploadProps} style={{ padding: screens.xs ? '20px' : '40px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text" style={{ fontSize: screens.xs ? '14px' : '16px' }}>
              {language === 'zh' ? '点击或拖拽文件到此区域上传' : 'Click or drag file to this area to upload'}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
              {language === 'zh' ? '支持单个或批量上传' : 'Support for a single or bulk upload'}
            </p>
          </Dragger>
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
          size={screens.xs ? 'small' : 'default'}
          tabPosition={screens.xs ? 'top' : 'top'}
        />
      </Card>

      <Modal
        title={editingRecord ? (language === 'zh' ? '编辑记录' : 'Edit Record') : (language === 'zh' ? '添加记录' : 'Add Record')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={screens.xs ? '95%' : 600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ severity: 'medium', status: 'active' }}
        >
          <Form.Item
            name="date"
            label={language === 'zh' ? '日期' : 'Date'}
            rules={[{ required: true, message: language === 'zh' ? '请选择日期' : 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="type"
            label={language === 'zh' ? '症状类型' : 'Symptom Type'}
            rules={[{ required: true, message: language === 'zh' ? '请输入症状类型' : 'Please enter symptom type' }]}
          >
            <Input placeholder={language === 'zh' ? '例如：头痛、发烧等' : 'e.g., Headache, Fever'} />
          </Form.Item>
          
          <Form.Item
            name="description"
            label={language === 'zh' ? '描述' : 'Description'}
            rules={[{ required: true, message: language === 'zh' ? '请输入描述' : 'Please enter description' }]}
          >
            <TextArea 
              rows={4} 
              placeholder={language === 'zh' ? '详细描述症状或健康问题...' : 'Describe symptoms or health issues in detail...'} 
            />
          </Form.Item>
          
          <Form.Item
            name="severity"
            label={language === 'zh' ? '严重程度' : 'Severity'}
            rules={[{ required: true, message: language === 'zh' ? '请选择严重程度' : 'Please select severity' }]}
          >
            <Select>
              <Option value="low">{severityLabels.low}</Option>
              <Option value="medium">{severityLabels.medium}</Option>
              <Option value="high">{severityLabels.high}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="status"
            label={language === 'zh' ? '状态' : 'Status'}
            rules={[{ required: true, message: language === 'zh' ? '请选择状态' : 'Please select status' }]}
          >
            <Select>
              <Option value="active">{statusLabels.active}</Option>
              <Option value="resolved">{statusLabels.resolved}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                {language === 'zh' ? '取消' : 'Cancel'}
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRecord ? (language === 'zh' ? '更新' : 'Update') : (language === 'zh' ? '添加' : 'Add')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HealthRecordsPage;