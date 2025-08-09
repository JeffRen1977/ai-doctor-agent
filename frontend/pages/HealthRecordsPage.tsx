import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, message, Tabs, Upload, Alert } from 'antd';
import type { TabsProps, UploadProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudDownloadOutlined, InboxOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './HealthRecordsPage.css';
import { getFhirPatientRecords } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { getTranslation } from '../locales';

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

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
      render: (date: string) => dayjs(date).format('YYYY-MM-DD') 
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
      ellipsis: true 
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
      render: (status: keyof typeof statusColors) => (<Tag color={statusColors[status]}>{statusLabels[status]}</Tag>) 
    },
    { 
      title: language === 'zh' ? '操作' : 'Actions', 
      key: 'action', 
      render: (_: any, record: HealthRecord) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            {language === 'zh' ? '编辑' : 'Edit'}
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            {language === 'zh' ? '删除' : 'Delete'}
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
        setRecords(records.filter(record => record.id !== id)); 
        message.success(t('healthRecords.deleteSuccess')); 
      } 
    }); 
  };
  
  const handleSubmit = () => { 
    form.validateFields().then(values => { 
      const recordData = { ...values, date: values.date.format('YYYY-MM-DD') }; 
      if (editingRecord) { 
        setRecords(records.map(record => record.id === editingRecord.id ? { ...record, ...recordData } : record)); 
        message.success(t('healthRecords.updateSuccess')); 
      } else { 
        const newRecord: HealthRecord = { id: Date.now().toString(), ...recordData }; 
        setRecords([...records, newRecord]); 
        message.success(t('healthRecords.addSuccess')); 
      } 
      setModalVisible(false); 
      form.resetFields(); 
    }); 
  };

  const transformFhirToHealthRecord = (fhirResource: any): HealthRecord | null => { 
    const resource = fhirResource.resource; 
    if (!resource) return null; 
    if (resource.resourceType === 'Observation') { 
      return { 
        id: resource.id, 
        date: resource.effectiveDateTime ? dayjs(resource.effectiveDateTime).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'), 
        type: resource.code?.text || 'FHIR Observation', 
        description: `Value: ${resource.valueQuantity?.value || 'N/A'} ${resource.valueQuantity?.unit || ''}`, 
        severity: 'low', 
        status: resource.status === 'final' ? 'resolved' : 'active' 
      }; 
    } 
    return null; 
  };
  
  const handleFetchFromFhir = async () => { 
    setIsFetchingFhir(true); 
    message.loading({ content: t('healthRecords.fetchingFhirRecords'), key: 'fhirFetch' }); 
    try { 
      const fhirData = await getFhirPatientRecords('123'); 
      const newRecords = fhirData.map(transformFhirToHealthRecord).filter((record: HealthRecord | null): record is HealthRecord => record !== null); 
      if (newRecords.length === 0) { 
        message.info({ content: t('healthRecords.noNewRecordsFound'), key: 'fhirFetch', duration: 2 }); 
        return; 
      } 
      setRecords(prevRecords => { 
        const existingIds = new Set(prevRecords.map(r => r.id)); 
        const uniqueNewRecords = newRecords.filter(r => !existingIds.has(r.id)); 
        if (uniqueNewRecords.length === 0) { 
          message.info({ content: t('healthRecords.allFetchedRecordsExist'), key: 'fhirFetch', duration: 2 }); 
          return prevRecords; 
        } 
        message.success({ content: t('healthRecords.successFetchedAndAddedRecords'), key: 'fhirFetch', duration: 2 }); 
        return [...prevRecords, ...uniqueNewRecords]; 
      }); 
    } catch (error) { 
      console.error('Failed to fetch from FHIR:', error); 
      message.error({ content: t('healthRecords.fetchFhirRecordsFailed'), key: 'fhirFetch', duration: 2 }); 
    } finally { 
      setIsFetchingFhir(false); 
    } 
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    action: '/api/health-records/upload',
    data: { userEmail: user?.email },
    accept: '.pdf,.png,.jpg,.jpeg',
    onChange(info) {
      const { status } = info.file;
      if (status === 'uploading') { 
        message.loading({ content: t('healthRecords.uploadingFile'), key: 'upload' }); 
      }
      if (status === 'done') { 
        message.success({ content: t('healthRecords.uploadSuccess'), key: 'upload' }); 
      }
      else if (status === 'error') { 
        message.error({ content: t('healthRecords.uploadFailed'), key: 'upload' }); 
      }
    },
  };

  const renderUploadTab = () => {
    if (!user) {
      return <Alert message={t('healthRecords.pleaseLoginToUpload')} type="warning" showIcon />;
    }
    return (
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">{t('healthRecords.clickOrDragFileHere')}</p>
        <p className="ant-upload-hint">{t('healthRecords.supportedFileTypesHint')}</p>
      </Dragger>
    );
  };

  const tabItems: TabsProps['items'] = [
    {
      key: '1',
      label: t('healthRecords.recordsList'),
      children: (
        <Card
          title={t('healthRecords.healthRecords')}
          extra={
            <Space>
              <Button type="default" icon={<CloudDownloadOutlined />} onClick={handleFetchFromFhir} loading={isFetchingFhir}>
                {t('healthRecords.fetchFromFhir')}
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                {t('healthRecords.addRecord')}
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: t('healthRecords.noRecords')
            }}
          />
        </Card>
      )
    },
    {
      key: '2',
      label: t('healthRecords.uploadFile'),
      children: (
        <Card title={t('healthRecords.uploadNewHealthRecordFile')}>
          {renderUploadTab()}
        </Card>
      )
    }
  ];

  return (
    <div className="health-records-page">
      <Tabs 
        defaultActiveKey="1" 
        items={tabItems}
        className="health-records-tabs"
      />
      
      <Modal
        title={editingRecord ? t('healthRecords.editHealthRecord') : t('healthRecords.addHealthRecord')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText={t('healthRecords.save')}
        cancelText={t('healthRecords.cancel')}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="date" label={t('healthRecords.date')} rules={[{ required: true, message: t('healthRecords.pleaseSelectDate') }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label={t('healthRecords.symptomType')} rules={[{ required: true, message: t('healthRecords.pleaseEnterSymptomType') }]}>
            <Input placeholder={t('healthRecords.e_g_headache_cold_fever')} />
          </Form.Item>
          <Form.Item name="description" label={t('healthRecords.detailedDescription')} rules={[{ required: true, message: t('healthRecords.pleaseEnterDetailedDescription') }]}>
            <TextArea rows={4} placeholder={t('healthRecords.pleaseEnterDetailedDescription')} />
          </Form.Item>
          <Form.Item name="severity" label={t('healthRecords.severity')} rules={[{ required: true, message: t('healthRecords.pleaseSelectSeverity') }]}>
            <Select placeholder={t('healthRecords.pleaseSelectSeverity')}>
              <Option value="low">{t('healthRecords.low')}</Option>
              <Option value="medium">{t('healthRecords.medium')}</Option>
              <Option value="high">{t('healthRecords.high')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label={t('healthRecords.status')} rules={[{ required: true, message: t('healthRecords.pleaseSelectStatus') }]}>
            <Select placeholder={t('healthRecords.pleaseSelectStatus')}>
              <Option value="active">{t('healthRecords.active')}</Option>
              <Option value="resolved">{t('healthRecords.resolved')}</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HealthRecordsPage;