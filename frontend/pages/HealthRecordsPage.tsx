import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Select, message, Tabs, Upload, Alert, Grid, List, Avatar, Typography, Row, Col, Statistic, Timeline, Badge, Empty } from 'antd';
import type { TabsProps, UploadProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudDownloadOutlined, InboxOutlined, FileTextOutlined, EyeOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './HealthRecordsPage.css';
import { getFhirPatientRecords } from '../services/api';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useLanguageStore } from '../stores/languageStore';
import { getTranslation } from '../locales';

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;
const { useBreakpoint } = Grid;
const { Text, Paragraph } = Typography;

interface HealthRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
}

interface HealthAnalysis {
  id: string;
  summary: string;
  healthMetrics: {
    bloodPressure?: string;
    cholesterol?: string;
    glucose?: string;
    [key: string]: any;
  };
  riskFactors: string[];
  medicalConditions: string[];
  medications: string[];
  recommendations: string[];
  nextSteps: string[];
  healthScore: {
    score: number;
    explanation: string;
  };
  priorityAreas: string[];
  timeline: {
    nextCheckup: string;
    urgentActions: string[];
    longTermGoals: string[];
  };
  analysisDate: string;
  documentsAnalyzed: number;
  status: 'completed' | 'processing' | 'failed';
  metadata?: {
    aiProvider?: string;
    aiModel?: string;
    processingTime?: number;
    [key: string]: any;
  };
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
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // AI Analysis states
  const [analyses, setAnalyses] = useState<HealthAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<HealthAnalysis | null>(null);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [userAISettings, setUserAISettings] = useState<any>({});

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

  const columns: any[] = [
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
            size={screens.xs ? 'small' : 'large'}
          >
            {screens.xs ? (language === 'zh' ? '编辑' : 'Edit') : (language === 'zh' ? '编辑' : 'Edit')}
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            size={screens.xs ? 'small' : 'large'}
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

  // AI Analysis functions
  const fetchUserAISettings = async () => {
    try {
      const response = await api.get('/user-settings/ai');
      if (response.data.success) {
        setUserAISettings(response.data.data);
        console.log('User AI settings:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch user AI settings:', error);
    }
  };

  const handleAnalyzeFiles = async () => {
    if (fileList.length === 0) {
      message.warning(language === 'zh' ? '请先选择要分析的文件' : 'Please select files to analyze');
      return;
    }

    try {
      setAnalyzing(true);
      
      const formData = new FormData();
      fileList.forEach(file => {
        // Handle different file structures from Ant Design Upload
        const fileToUpload = file.originFileObj || file;
        console.log('File structure:', {
          name: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
          hasBuffer: !!fileToUpload.buffer,
          hasData: !!fileToUpload.data,
          fileObject: fileToUpload
        });
        
        // Ensure we're sending the actual File object
        if (fileToUpload instanceof File) {
          formData.append('documents', fileToUpload);
        } else {
          console.error('Invalid file object:', fileToUpload);
          message.error(language === 'zh' ? '文件格式错误' : 'Invalid file format');
          return;
        }
      });

      // Note: provider and model will be determined by user's settings on the backend

      console.log('Sending request to:', '/health-analysis/analyze');
      console.log('FormData entries:', Array.from(formData.entries()));
      console.log('User token:', localStorage.getItem('token'));
      
      const response = await api.post('/health-analysis/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const providerName = response.data.data.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI';
      const modelName = response.data.data.aiModel || 'default';
      const processingTime = response.data.data.processingTime || 0;
      
      message.success(
        language === 'zh' 
          ? `健康分析完成！使用${providerName} (${modelName})，处理时间: ${processingTime}ms` 
          : `Health analysis completed! Using ${providerName} (${modelName}), processing time: ${processingTime}ms`
      );
      
      // Debug: Log the response structure
      console.log('Analysis response:', response.data);
      
      // Add new analysis to the list
      const analysisId = response.data.analysisId || response.data.id || `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated analysis ID:', analysisId);
      
      const newAnalysis: HealthAnalysis = {
        id: analysisId,
        summary: response.data.summary || response.data.analysis?.summary || '基于上传的医疗文档，AI已完成健康分析。分析涵盖了您的健康状况、潜在风险因素和改善建议。',
        healthMetrics: response.data.healthMetrics || {},
        riskFactors: response.data.riskFactors || response.data.analysis?.riskFactors || [
          '建议定期监测血压',
          '注意饮食健康',
          '保持适量运动'
        ],
        medicalConditions: response.data.medicalConditions || response.data.analysis?.medicalConditions || [],
        medications: response.data.medications || response.data.analysis?.medications || [],
        recommendations: response.data.recommendations || response.data.analysis?.recommendations || [
          '建议定期体检',
          '保持健康的生活方式',
          '如有不适请及时就医'
        ],
        nextSteps: response.data.nextSteps || response.data.analysis?.nextSteps || [
          '3个月内进行复查',
          '保持健康饮食',
          '适量运动'
        ],
        healthScore: response.data.healthScore || response.data.analysis?.healthScore || { 
          score: 7, 
          explanation: '整体健康状况良好，建议继续保持健康的生活方式' 
        },
        priorityAreas: response.data.priorityAreas || response.data.analysis?.priorityAreas || ['心血管健康', '营养均衡'],
        timeline: response.data.timeline || response.data.analysis?.timeline || { 
          nextCheckup: '3个月', 
          urgentActions: [], 
          longTermGoals: ['保持健康体重', '定期体检'] 
        },
        analysisDate: response.data.analysisDate || new Date().toISOString(),
        documentsAnalyzed: fileList.length,
        status: 'completed'
      };
      
      // Validate the analysis object before adding
      if (newAnalysis.id && newAnalysis.summary) {
        console.log('Adding analysis to state:', newAnalysis);
        setAnalyses(prev => [newAnalysis, ...prev]);
        
        // Clear the file list after successful analysis
        setFileList([]);
        message.info(language === 'zh' ? '文件列表已清空，可以上传新的文档进行分析' : 'File list cleared, you can upload new documents for analysis');
      } else {
        console.error('Invalid analysis object:', newAnalysis);
        message.error(language === 'zh' ? '分析数据无效' : 'Invalid analysis data');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      message.error(language === 'zh' ? '分析失败' : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const viewAnalysis = async (analysisId: string) => {
    console.log('viewAnalysis called with ID:', analysisId, 'Type:', typeof analysisId);
    
    if (!analysisId || analysisId === 'undefined' || analysisId === 'null') {
      message.error(language === 'zh' ? '分析ID无效，请重新进行分析' : 'Invalid analysis ID, please re-analyze');
      return;
    }

    try {
      // First try to find the analysis in our local state
      const localAnalysis = analyses.find(a => a.id === analysisId);
      if (localAnalysis) {
        console.log('Found local analysis:', localAnalysis);
        setSelectedAnalysis(localAnalysis);
        setAnalysisModalVisible(true);
        return;
      }

      // If not found locally, try to fetch from API
      console.log('Analysis not found locally, trying API...');
      const response = await api.get(`/health-analysis/${analysisId}`);
      setSelectedAnalysis(response.data.data || response.data);
      setAnalysisModalVisible(true);
    } catch (error) {
      console.error('Error loading analysis details:', error);
      message.error(language === 'zh' ? '加载分析详情失败' : 'Failed to load analysis details');
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#faad14';
    if (score >= 4) return '#fa8c16';
    return '#ff4d4f';
  };

  const getHealthScoreText = (score: number) => {
    if (score >= 8) return language === 'zh' ? '优秀' : 'Excellent';
    if (score >= 6) return language === 'zh' ? '良好' : 'Good';
    if (score >= 4) return language === 'zh' ? '一般' : 'Fair';
    return language === 'zh' ? '需要关注' : 'Needs Attention';
  };

  // Fetch user AI settings on component mount
  useEffect(() => {
    fetchUserAISettings();
  }, []);

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
    multiple: true,
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.tiff',
    fileList: fileList,
    beforeUpload: (file) => {
      // Check file count limit
      if (fileList.length >= 20) {
        message.error(language === 'zh' ? '最多只能上传20个文件' : 'Maximum 20 files allowed');
        return false;
      }
      
      // Check file size
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(language === 'zh' ? '文件大小不能超过10MB' : 'File size must be less than 10MB');
        return false;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
      if (!allowedTypes.includes(file.type)) {
        message.error(language === 'zh' ? '不支持的文件类型' : 'Unsupported file type');
        return false;
      }
      
      // Check for duplicate files
      const isDuplicate = fileList.some(existingFile => existingFile.name === file.name);
      if (isDuplicate) {
        message.warning(language === 'zh' ? `文件 "${file.name}" 已存在` : `File "${file.name}" already exists`);
        return false;
      }
      
      return false; // Prevent auto upload
    },
    onChange: (info) => {
      setFileList(info.fileList);
      
      // Handle upload status
      if (info.file.status === 'done') {
        message.success(`${info.file.name} ${language === 'zh' ? '上传成功' : 'uploaded successfully'}`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} ${language === 'zh' ? '上传失败' : 'upload failed'}`);
      }
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
    },
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      try {
        setUploading(true);
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          onProgress?.({ percent: progress });
          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 100);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Store the file for later analysis
        const fileObj = file as File;
        console.log('File stored for analysis:', {
          name: fileObj.name,
          size: fileObj.size,
          type: fileObj.type
        });
        
        onSuccess?.(`stored://${fileObj.name}`);
        
        clearInterval(interval);
        setUploading(false);
      } catch (error) {
        setUploading(false);
        onError?.(error as Error);
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
            <Tag color={severityColors[record.severity]}>
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
                <Tag color={statusColors[record.status]}>
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
              size={screens.xs ? 'middle' : 'large'}
              block={screens.xs}
            >
              {language === 'zh' ? '添加记录' : 'Add Record'}
            </Button>
            <Button 
              icon={<CloudDownloadOutlined />} 
              onClick={fetchFhirRecords}
              loading={isFetchingFhir}
              size={screens.xs ? 'middle' : 'large'}
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
      label: language === 'zh' ? '文件上传与AI分析' : 'File Upload & AI Analysis',
      children: (
        <div style={{ padding: screens.xs ? '8px' : '16px' }}>
          <Alert
            message={language === 'zh' ? '多文件上传与AI分析' : 'Multiple File Upload & AI Analysis'}
            description={language === 'zh' 
              ? '支持同时上传多个PDF、Word文档和图片文件，AI将自动分析您的健康文档并提供个性化建议。分析完成后，文件将自动保存到Firebase Storage，分析结果保存到数据库，文件列表将自动清空。每个文件大小不超过10MB，最多可上传20个文件。'
              : 'Supports uploading multiple PDF, Word documents and image files simultaneously. AI will automatically analyze your health documents and provide personalized recommendations. After analysis, files will be automatically saved to Firebase Storage, analysis results saved to database, and file list will be cleared. Each file size should not exceed 10MB, maximum 20 files.'
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
              {language === 'zh' ? '点击或拖拽多个文件到此区域上传' : 'Click or drag multiple files to this area to upload'}
            </p>
            <p className="ant-upload-hint" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
              {language === 'zh' ? '支持批量上传，可同时选择多个文件' : 'Support for bulk upload, you can select multiple files at once'}
            </p>
          </Dragger>
          
          {fileList.length > 0 && (
            <Card 
              title={language === 'zh' ? `已选择文件 (${fileList.length})` : `Selected Files (${fileList.length})`}
              size="small"
              style={{ marginTop: '16px' }}
              extra={
                <Space>
                  <Button 
                    type="primary" 
                    icon={<BarChartOutlined />}
                    loading={analyzing}
                    onClick={handleAnalyzeFiles}
                    disabled={fileList.length === 0}
                    size={screens.xs ? 'small' : 'middle'}
                  >
                    {language === 'zh' ? 'AI分析这些文档' : 'AI Analyze These Documents'}
                  </Button>
                  <Button 
                    onClick={() => setFileList([])}
                    disabled={uploading || analyzing}
                    size={screens.xs ? 'small' : 'middle'}
                  >
                    {language === 'zh' ? '清空列表' : 'Clear All'}
                  </Button>
                </Space>
              }
            >
              {/* AI Service Information */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                <Typography.Title level={5} style={{ marginBottom: '12px' }}>
                  {language === 'zh' ? 'AI服务设置' : 'AI Service Settings'}
                </Typography.Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <div>
                      <Typography.Text strong>
                        {language === 'zh' ? '当前AI服务提供商:' : 'Current AI Provider:'}
                      </Typography.Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag color="blue">
                          {userAISettings.aiProvider === 'gemini' ? 'Google Gemini' : 'OpenAI'}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <div>
                      <Typography.Text strong>
                        {language === 'zh' ? '当前模型:' : 'Current Model:'}
                      </Typography.Text>
                      <div style={{ marginTop: '4px' }}>
                        <Tag color="green">
                          {userAISettings.aiModel || (language === 'zh' ? '默认模型' : 'Default Model')}
                        </Tag>
                      </div>
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => window.open('/settings', '_blank')}
                  >
                    {language === 'zh' ? '修改AI服务设置' : 'Modify AI Service Settings'}
                  </Button>
                </div>
              </div>
              <List
                size="small"
                dataSource={fileList}
                renderItem={(file) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        danger 
                        size="small"
                        onClick={() => uploadProps.onRemove?.(file)}
                        disabled={uploading || analyzing}
                      >
                        {language === 'zh' ? '移除' : 'Remove'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ color: '#1890ff' }} />}
                      title={
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}>
                          <span style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                            {file.name}
                          </span>
                          <Tag 
                            color={
                              file.status === 'done' ? 'green' : 
                              file.status === 'error' ? 'red' : 
                              file.status === 'uploading' ? 'blue' : 'default'
                            }
                          >
                            {file.status === 'done' ? (language === 'zh' ? '已完成' : 'Done') :
                             file.status === 'error' ? (language === 'zh' ? '失败' : 'Error') :
                             file.status === 'uploading' ? (language === 'zh' ? '上传中' : 'Uploading') :
                             (language === 'zh' ? '待上传' : 'Pending')}
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                          {file.status === 'uploading' && file.percent && (
                            <div style={{ width: '100%' }}>
                              <div style={{ 
                                width: '100%', 
                                height: '4px', 
                                backgroundColor: '#f0f0f0', 
                                borderRadius: '2px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  width: `${file.percent}%`,
                                  height: '100%',
                                  backgroundColor: '#1890ff',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#666', 
                                textAlign: 'right', 
                                marginTop: '2px' 
                              }}>
                                {file.percent}%
                              </div>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* AI Analysis Results Section */}
          {analyses.length > 0 && (
            <Card 
              title={language === 'zh' ? 'AI分析结果' : 'AI Analysis Results'}
              size="small"
              style={{ marginTop: '16px' }}
            >
              <List
                dataSource={analyses}
                renderItem={(analysis) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => {
                          console.log('Analysis object:', analysis);
                          console.log('Analysis ID:', analysis.id);
                          viewAnalysis(analysis.id);
                        }}
                        size="small"
                      >
                        {language === 'zh' ? '查看详情' : 'View Details'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge 
                          count={analysis.documentsAnalyzed} 
                          style={{ backgroundColor: '#52c41a' }}
                        >
                          <FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        </Badge>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                            {new Date(analysis.analysisDate).toLocaleDateString()}
                          </span>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <Tag color={getHealthScoreColor(analysis.healthScore.score)}>
                              {analysis.healthScore.score}/10 - {getHealthScoreText(analysis.healthScore.score)}
                            </Tag>
                            {analysis.metadata?.aiProvider && (
                              <Tag color="blue">
                                {analysis.metadata.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'}
                              </Tag>
                            )}
                            {analysis.metadata?.processingTime && (
                              <Tag color="green">
                                {analysis.metadata.processingTime}ms
                              </Tag>
                            )}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: screens.xs ? '12px' : '13px' }}>
                            {analysis.summary}
                          </Paragraph>
                          <Space wrap>
                            {analysis.riskFactors.slice(0, 3).map((risk, index) => (
                              <Tag key={index} color="orange" style={{ fontSize: screens.xs ? '10px' : '11px' }}>
                                {risk}
                              </Tag>
                            ))}
                            {analysis.riskFactors.length > 3 && (
                              <Tag style={{ fontSize: screens.xs ? '10px' : '11px' }}>
                                +{analysis.riskFactors.length - 3} more
                              </Tag>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {analyses.length === 0 && fileList.length === 0 && (
            <Empty 
              description={language === 'zh' ? '请先上传医疗文档进行分析' : 'Please upload medical documents for analysis'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: '32px' }}
            />
          )}
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

      {/* AI Analysis Details Modal */}
      <Modal
        title={language === 'zh' ? '健康分析详情' : 'Health Analysis Details'}
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedAnalysis ? (
          <div>
            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f5f5f5' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Debug: Analysis ID: {selectedAnalysis.id} | 
                  Summary: {selectedAnalysis.summary ? 'Yes' : 'No'} | 
                  Risk Factors: {selectedAnalysis.riskFactors?.length || 0} | 
                  Recommendations: {selectedAnalysis.recommendations?.length || 0}
                </Text>
              </Card>
            )}

            {/* Health Score */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title={language === 'zh' ? '健康评分' : 'Health Score'}
                    value={selectedAnalysis.healthScore?.score || 0}
                    suffix="/10"
                    valueStyle={{ color: getHealthScoreColor(selectedAnalysis.healthScore?.score || 0) }}
                  />
                </Col>
                <Col span={16}>
                  <Text>{selectedAnalysis.healthScore?.explanation || (language === 'zh' ? '暂无评分说明' : 'No score explanation available')}</Text>
                </Col>
              </Row>
            </Card>

            {/* Summary */}
            <Card size="small" title={language === 'zh' ? '健康总结' : 'Health Summary'} style={{ marginBottom: '16px' }}>
              <Paragraph>
                {selectedAnalysis.summary || (language === 'zh' ? '暂无健康总结' : 'No health summary available')}
              </Paragraph>
            </Card>

            {/* Risk Factors */}
            <Card size="small" title={language === 'zh' ? '风险因素' : 'Risk Factors'} style={{ marginBottom: '16px' }}>
              {selectedAnalysis.riskFactors && selectedAnalysis.riskFactors.length > 0 ? (
                <Space wrap>
                  {selectedAnalysis.riskFactors.map((risk, index) => (
                    <Tag key={index} color="orange" icon={<WarningOutlined />}>
                      {risk}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">{language === 'zh' ? '暂无风险因素' : 'No risk factors identified'}</Text>
              )}
            </Card>

            {/* Recommendations */}
            <Card size="small" title={language === 'zh' ? '建议' : 'Recommendations'} style={{ marginBottom: '16px' }}>
              {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 ? (
                <Timeline
                  items={selectedAnalysis.recommendations.map((rec) => ({
                    dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                    children: rec
                  }))}
                />
              ) : (
                <Text type="secondary">{language === 'zh' ? '暂无建议' : 'No recommendations available'}</Text>
              )}
            </Card>

            {/* Next Steps */}
            <Card size="small" title={language === 'zh' ? '下一步行动' : 'Next Steps'}>
              {selectedAnalysis.nextSteps && selectedAnalysis.nextSteps.length > 0 ? (
                <Timeline
                  items={selectedAnalysis.nextSteps.map((step) => ({
                    dot: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
                    children: step
                  }))}
                />
              ) : (
                <Text type="secondary">{language === 'zh' ? '暂无下一步行动' : 'No next steps available'}</Text>
              )}
            </Card>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Empty 
              description={language === 'zh' ? '没有找到分析数据' : 'No analysis data found'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HealthRecordsPage;