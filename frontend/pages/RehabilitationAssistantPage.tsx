import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Tabs,
  Input,
  Button,
  Space,
  message,
  Alert,
  Select,
  Typography,
  List,
  Tag,
  Row,
  Col,
  Divider,
  Spin,
  Table,
  Rate,
  Modal,
  Descriptions,
  Badge,
  Empty,
  Timeline,
  Collapse
} from 'antd';
import {
  MessageOutlined,
  BookOutlined,
  HeartOutlined,
  CloudOutlined,
  SendOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  StarOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { rehabilitationAssistantAPI } from '@/services/api';
import { useLanguageStore } from '@/stores/languageStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

interface RehabilitationRecord {
  id: string;
  recordId: string;
  type: string;
  subtype?: string;
  input: any;
  output: any;
  timestamp: string;
  metadata?: {
    aiProvider?: string;
    aiModel?: string;
    language?: string;
  };
  feedback?: {
    effectiveness?: number;
    helpful?: boolean;
    comments?: string;
  };
}

const RehabilitationAssistantPage: React.FC = () => {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Chat Tab State
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Education Tab State
  const [metrics, setMetrics] = useState<any>({});
  const [explaining, setExplaining] = useState(false);
  const [explanationResult, setExplanationResult] = useState<any>(null);

  // Emotional Support Tab State
  const [emotionalContext, setEmotionalContext] = useState('');
  const [providingSupport, setProvidingSupport] = useState(false);
  const [supportResult, setSupportResult] = useState<any>(null);

  // Meditation Tab State
  const [meditationType, setMeditationType] = useState('breathing');
  const [guiding, setGuiding] = useState(false);
  const [meditationResult, setMeditationResult] = useState<any>(null);

  // CBT Tab State
  const [cbtSituation, setCbtSituation] = useState('');
  const [providingCBT, setProvidingCBT] = useState(false);
  const [cbtResult, setCbtResult] = useState<any>(null);

  // Records Tab State
  const [records, setRecords] = useState<RehabilitationRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');

  // Context Tab State
  const [userContext, setUserContext] = useState<any>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Feedback Modal State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RehabilitationRecord | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackHelpful, setFeedbackHelpful] = useState<boolean | null>(null);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load records when records tab is active
  useEffect(() => {
    if (activeTab === 'records') {
      loadRecords();
    }
  }, [activeTab, recordTypeFilter]);

  // AI Chat Handlers - 使用新的 answerHealthQuestion API
  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
    setSending(true);

    try {
      const result = await rehabilitationAssistantAPI.answerHealthQuestion(userMessage.content);
      
      if (result.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: result.answer, isLoading: false }
            : msg
        ));
      } else {
        throw new Error(result.error || 'Failed to get answer');
      }
    } catch (error: any) {
      const errorMessage = language === 'zh' 
        ? '抱歉，我遇到了一些问题。请稍后再试。'
        : 'Sorry, I encountered some issues. Please try again later.';
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: errorMessage, isLoading: false }
          : msg
      ));
      message.error(error?.message || (language === 'zh' ? '发送消息失败' : 'Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    message.success(language === 'zh' ? '聊天记录已清空' : 'Chat history cleared');
  };

  // Education Tab Handlers
  const handleExplainMetrics = async () => {
    if (!metrics || Object.keys(metrics).length === 0) {
      message.warning(language === 'zh' ? '请输入临床指标' : 'Please enter clinical metrics');
      return;
    }

    setExplaining(true);
    setExplanationResult(null);
    
    try {
      const result = await rehabilitationAssistantAPI.explainMetrics(metrics);
      if (result.success) {
        setExplanationResult(result);
        message.success(language === 'zh' ? '解读成功' : 'Explanation successful');
      } else {
        message.error(result.error || (language === 'zh' ? '解读失败' : 'Explanation failed'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '解读出错' : 'Explanation error'));
    } finally {
      setExplaining(false);
    }
  };

  // Emotional Support Tab Handlers
  const handleProvideSupport = async () => {
    if (!emotionalContext.trim()) {
      message.warning(language === 'zh' ? '请描述您的情况' : 'Please describe your situation');
      return;
    }

    setProvidingSupport(true);
    setSupportResult(null);
    
    try {
      const result = await rehabilitationAssistantAPI.provideEmotionalSupport({
        description: emotionalContext
      });
      if (result.success) {
        setSupportResult(result);
        message.success(language === 'zh' ? '支持已提供' : 'Support provided');
      } else {
        message.error(result.error || (language === 'zh' ? '支持失败' : 'Support failed'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '支持出错' : 'Support error'));
    } finally {
      setProvidingSupport(false);
    }
  };

  // Meditation Tab Handlers
  const handleGuideMeditation = async () => {
    setGuiding(true);
    setMeditationResult(null);
    
    try {
      const result = await rehabilitationAssistantAPI.guideMeditation(meditationType);
      if (result.success) {
        setMeditationResult(result);
        message.success(language === 'zh' ? '冥想引导已生成' : 'Meditation guide generated');
      } else {
        message.error(result.error || (language === 'zh' ? '引导失败' : 'Guide failed'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '引导出错' : 'Guide error'));
    } finally {
      setGuiding(false);
    }
  };

  // CBT Tab Handlers
  const handleProvideCBT = async () => {
    if (!cbtSituation.trim()) {
      message.warning(language === 'zh' ? '请描述您面临的情况' : 'Please describe your situation');
      return;
    }

    setProvidingCBT(true);
    setCbtResult(null);
    
    try {
      const result = await rehabilitationAssistantAPI.provideCBT({
        description: cbtSituation
      });
      if (result.success) {
        setCbtResult(result);
        message.success(language === 'zh' ? 'CBT支持已提供' : 'CBT support provided');
      } else {
        message.error(result.error || (language === 'zh' ? 'CBT支持失败' : 'CBT support failed'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? 'CBT支持出错' : 'CBT support error'));
    } finally {
      setProvidingCBT(false);
    }
  };

  // Records Tab Handlers
  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const result = await rehabilitationAssistantAPI.getRecords({
        type: recordTypeFilter !== 'all' ? recordTypeFilter : undefined,
        limit: 50
      });
      if (result.success) {
        setRecords(result.records || []);
      } else {
        message.error(result.error || (language === 'zh' ? '加载记录失败' : 'Failed to load records'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '加载记录出错' : 'Error loading records'));
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleShowFeedback = (record: RehabilitationRecord) => {
    setSelectedRecord(record);
    setFeedbackRating(record.feedback?.effectiveness || 5);
    setFeedbackHelpful(record.feedback?.helpful ?? null);
    setFeedbackComments(record.feedback?.comments || '');
    setFeedbackModalVisible(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRecord) return;

    setSubmittingFeedback(true);
    try {
      const result = await rehabilitationAssistantAPI.submitFeedback(selectedRecord.recordId, {
        effectiveness: feedbackRating,
        helpful: feedbackHelpful,
        comments: feedbackComments
      });
      if (result.success) {
        message.success(language === 'zh' ? '反馈已提交' : 'Feedback submitted');
        setFeedbackModalVisible(false);
        loadRecords(); // Reload records to show updated feedback
      } else {
        message.error(result.error || (language === 'zh' ? '提交反馈失败' : 'Failed to submit feedback'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '提交反馈出错' : 'Error submitting feedback'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Context Tab Handlers
  const loadContext = async () => {
    setLoadingContext(true);
    try {
      const result = await rehabilitationAssistantAPI.getContext();
      if (result.success) {
        setUserContext(result.context);
      } else {
        message.error(result.error || (language === 'zh' ? '加载上下文失败' : 'Failed to load context'));
      }
    } catch (error: any) {
      message.error(error.message || (language === 'zh' ? '加载上下文出错' : 'Error loading context'));
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'context') {
      loadContext();
    }
  }, [activeTab]);

  // Record columns
  const recordColumns: ColumnsType<RehabilitationRecord> = [
    {
      title: language === 'zh' ? '类型' : 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string, record: RehabilitationRecord) => {
        const typeLabels: { [key: string]: { zh: string; en: string; color: string } } = {
          qa: { zh: '健康问答', en: 'Health Q&A', color: 'blue' },
          explanation: { zh: '指标解读', en: 'Metrics', color: 'green' },
          support: { zh: '心理支持', en: 'Support', color: 'purple' },
          meditation: { zh: '冥想引导', en: 'Meditation', color: 'cyan' },
          cbt: { zh: 'CBT支持', en: 'CBT', color: 'orange' }
        };
        const label = typeLabels[type] || { zh: type, en: type, color: 'default' };
        return (
          <Tag color={label.color}>
            {language === 'zh' ? label.zh : label.en}
            {record.subtype && ` (${record.subtype})`}
          </Tag>
        );
      }
    },
    {
      title: language === 'zh' ? '时间' : 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => dayjs(timestamp).format('YYYY-MM-DD HH:mm')
    },
    {
      title: language === 'zh' ? '操作' : 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => handleShowFeedback(record)}
          >
            {language === 'zh' ? '反馈' : 'Feedback'}
          </Button>
        </Space>
      )
    }
  ];

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: { zh: string; en: string } } = {
      qa: { zh: '健康问答', en: 'Health Q&A' },
      explanation: { zh: '临床指标解读', en: 'Clinical Metrics Explanation' },
      support: { zh: '情绪与心理支持', en: 'Emotional Support' },
      meditation: { zh: '冥想引导', en: 'Meditation Guide' },
      cbt: { zh: '认知行为疗法支持', en: 'CBT Support' }
    };
    return labels[type] || { zh: type, en: type };
  };

  return (
    <div className="app-page-shell" style={{ width: '100%', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '8px' }}>
          <MessageOutlined style={{ marginRight: '8px', color: 'var(--app-color-primary)' }} />
          {language === 'zh' ? '生成式AI康复助理' : 'Generative AI Rehabilitation Assistant'}
        </Title>
        <Paragraph style={{ marginBottom: 0, fontSize: '16px', color: '#666' }}>
          {language === 'zh' 
            ? '利用大语言模型提供专业且有温度的健康咨询、科普解读和心理支持。'
            : 'Leveraging large language models to provide professional, warm health consultations, educational explanations, and psychological support.'}
        </Paragraph>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          {/* AI对话 Tab */}
          <TabPane
            tab={
              <span>
                <MessageOutlined />
                {language === 'zh' ? 'AI健康对话' : 'AI Health Chat'}
              </span>
            }
            key="chat"
          >
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '8px', minHeight: '400px', maxHeight: '600px' }}>
                {messages.length === 0 ? (
                  <Empty
                    description={language === 'zh' 
                      ? '开始与AI医生对话，描述您的症状或健康问题'
                      : 'Start a conversation with AI Doctor, describe your symptoms or health concerns'}
                    style={{ marginTop: '100px' }}
                  />
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <Card
                        size="small"
                        style={{
                          maxWidth: '70%',
                          backgroundColor: msg.sender === 'user' ? '#1890ff' : '#f0f0f0',
                          color: msg.sender === 'user' ? 'white' : 'inherit'
                        }}
                      >
                        {msg.isLoading ? (
                          <Spin size="small" />
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </Card>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={language === 'zh' ? '描述您的症状或健康问题...' : 'Describe your symptoms or health concerns...'}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                    disabled={!inputValue.trim()}
                  >
                    {language === 'zh' ? '发送' : 'Send'}
                  </Button>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={handleClear}
                    disabled={messages.length === 0}
                  >
                    {language === 'zh' ? '清空' : 'Clear'}
                  </Button>
                </Space.Compact>
              </div>
            </div>
          </TabPane>

          {/* 科普知识库 Tab */}
          <TabPane
            tab={
              <span>
                <BookOutlined />
                {language === 'zh' ? '科普知识库' : 'Education Library'}
              </span>
            }
            key="education"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '临床指标解读' : 'Clinical Metrics Explanation'}
                description={
                  language === 'zh' 
                    ? '输入您的临床指标（如HbA1c、LDL-C、血压等），AI将用简单易懂的语言为您解释。'
                    : 'Enter your clinical metrics (such as HbA1c, LDL-C, etc.), and AI will explain them in simple, easy-to-understand language.'}
                type="info"
                showIcon
              />

              <Card title={language === 'zh' ? '输入临床指标' : 'Enter Clinical Metrics'}>
                <TextArea
                  placeholder={language === 'zh' 
                    ? '例如：{"HbA1c": 7.2, "LDL-C": 120, "血压": "130/80"}'
                    : 'Example: {"HbA1c": 7.2, "LDL-C": 120, "Blood Pressure": "130/80"}'}
                  rows={6}
                  value={JSON.stringify(metrics, null, 2)}
                  onChange={(e) => {
                    try {
                      setMetrics(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
                <Button
                  type="primary"
                  onClick={handleExplainMetrics}
                  loading={explaining}
                  style={{ marginTop: '16px' }}
                  block
                  size="large"
                >
                  {language === 'zh' ? '解读指标' : 'Explain Metrics'}
                </Button>
              </Card>

              {explanationResult && (
                <Card 
                  title={language === 'zh' ? '解读结果' : 'Explanation Result'}
                  extra={
                    <Tag color="green">
                      {explanationResult.metadata?.aiProvider || 'AI'}
                    </Tag>
                  }
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {explanationResult.explanation}
                  </ReactMarkdown>
                  {explanationResult.metrics && (
                    <div style={{ marginTop: '16px' }}>
                      <Title level={5}>{language === 'zh' ? '指标详情' : 'Metrics Details'}</Title>
                      <Descriptions column={2} bordered size="small">
                        {Object.entries(explanationResult.metrics).map(([key, value]: [string, any]) => (
                          <Descriptions.Item key={key} label={key}>
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    </div>
                  )}
                </Card>
              )}
            </Space>
          </TabPane>

          {/* 心理健康支持中心 Tab */}
          <TabPane
            tab={
              <span>
                <HeartOutlined />
                {language === 'zh' ? '心理健康支持' : 'Mental Health Support'}
              </span>
            }
            key="emotional"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '情绪与心理支持' : 'Emotional & Psychological Support'}
                description={
                  language === 'zh' 
                    ? '描述您当前的情绪状态或困扰，AI将提供专业的心理支持和认知行为疗法指导。'
                    : 'Describe your current emotional state or concerns, and AI will provide professional psychological support and cognitive behavioral therapy guidance.'}
                type="info"
                showIcon
              />

              <Row gutter={16}>
                <Col xs={24} lg={12}>
                  <Card title={language === 'zh' ? '情绪支持' : 'Emotional Support'}>
                    <TextArea
                      placeholder={language === 'zh' 
                        ? '例如：我最近感到焦虑，担心自己的健康状况...'
                        : 'Example: I\'ve been feeling anxious lately, worried about my health...'}
                      rows={8}
                      value={emotionalContext}
                      onChange={(e) => setEmotionalContext(e.target.value)}
                    />
                    <Button
                      type="primary"
                      onClick={handleProvideSupport}
                      loading={providingSupport}
                      style={{ marginTop: '16px' }}
                      block
                      size="large"
                    >
                      {language === 'zh' ? '获取支持' : 'Get Support'}
                    </Button>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title={language === 'zh' ? 'CBT支持' : 'CBT Support'}>
                    <TextArea
                      placeholder={language === 'zh' 
                        ? '描述您面临的情况或负面思维...'
                        : 'Describe your situation or negative thoughts...'}
                      rows={8}
                      value={cbtSituation}
                      onChange={(e) => setCbtSituation(e.target.value)}
                    />
                    <Button
                      type="primary"
                      onClick={handleProvideCBT}
                      loading={providingCBT}
                      style={{ marginTop: '16px' }}
                      block
                      size="large"
                    >
                      {language === 'zh' ? '获取CBT支持' : 'Get CBT Support'}
                    </Button>
                  </Card>
                </Col>
              </Row>

              {supportResult && (
                <Card 
                  title={language === 'zh' ? '情绪支持结果' : 'Emotional Support Result'}
                  extra={
                    <Space>
                      {supportResult.anxietyLevel && (
                        <Tag color={
                          supportResult.anxietyLevel === 'high' ? 'red' :
                          supportResult.anxietyLevel === 'medium' ? 'orange' : 'green'
                        }>
                          {language === 'zh' ? '焦虑程度' : 'Anxiety'}: {supportResult.anxietyLevel}
                        </Tag>
                      )}
                    </Space>
                  }
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {supportResult.support}
                  </ReactMarkdown>
                  {supportResult.recommendations && supportResult.recommendations.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Title level={5}>{language === 'zh' ? '建议' : 'Recommendations'}</Title>
                      <List
                        dataSource={supportResult.recommendations}
                        renderItem={(item: string) => (
                          <List.Item>
                            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                            {item}
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Card>
              )}

              {cbtResult && (
                <Card title={language === 'zh' ? 'CBT支持结果' : 'CBT Support Result'}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {cbtResult.cbtSupport}
                  </ReactMarkdown>
                  {cbtResult.techniques && cbtResult.techniques.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <Title level={5}>{language === 'zh' ? 'CBT技巧' : 'CBT Techniques'}</Title>
                      <Space wrap>
                        {cbtResult.techniques.map((tech: string, index: number) => (
                          <Tag key={index} color="blue">{tech}</Tag>
                        ))}
                      </Space>
                    </div>
                  )}
                </Card>
              )}
            </Space>
          </TabPane>

          {/* 冥想引导界面 Tab */}
          <TabPane
            tab={
              <span>
                <CloudOutlined />
                {language === 'zh' ? '冥想引导' : 'Meditation Guide'}
              </span>
            }
            key="meditation"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message={language === 'zh' ? '冥想引导' : 'Meditation Guidance'}
                description={
                  language === 'zh' 
                    ? '选择冥想类型，AI将为您提供专业的冥想引导，帮助您放松身心、缓解压力。'
                    : 'Select a meditation type, and AI will provide professional meditation guidance to help you relax and relieve stress.'}
                type="info"
                showIcon
              />

              <Card title={language === 'zh' ? '选择冥想类型' : 'Select Meditation Type'}>
                <Select
                  value={meditationType}
                  onChange={setMeditationType}
                  style={{ width: '100%', marginBottom: '16px' }}
                  size="large"
                >
                  <Option value="breathing">
                    {language === 'zh' ? '呼吸冥想 (5分钟)' : 'Breathing Meditation (5 min)'}
                  </Option>
                  <Option value="bodyScan">
                    {language === 'zh' ? '身体扫描冥想 (15分钟)' : 'Body Scan Meditation (15 min)'}
                  </Option>
                  <Option value="mindfulness">
                    {language === 'zh' ? '正念冥想 (10分钟)' : 'Mindfulness Meditation (10 min)'}
                  </Option>
                  <Option value="relaxation">
                    {language === 'zh' ? '放松冥想 (20分钟)' : 'Relaxation Meditation (20 min)'}
                  </Option>
                </Select>
                <Button
                  type="primary"
                  icon={<CloudOutlined />}
                  onClick={handleGuideMeditation}
                  loading={guiding}
                  block
                  size="large"
                >
                  {language === 'zh' ? '开始冥想引导' : 'Start Meditation Guide'}
                </Button>
              </Card>

              {meditationResult && (
                <Card 
                  title={language === 'zh' ? '冥想引导' : 'Meditation Guidance'}
                  extra={
                    <Space>
                      <Tag color="cyan">
                        {language === 'zh' ? '类型' : 'Type'}: {meditationResult.type}
                      </Tag>
                      {meditationResult.duration && (
                        <Tag color="blue">
                          {meditationResult.duration} {language === 'zh' ? '分钟' : 'min'}
                        </Tag>
                      )}
                    </Space>
                  }
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {meditationResult.guidance}
                  </ReactMarkdown>
                </Card>
              )}
            </Space>
          </TabPane>

          {/* 记录历史 Tab */}
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                {language === 'zh' ? '记录历史' : 'History'}
              </span>
            }
            key="records"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Space>
                  <Select
                    value={recordTypeFilter}
                    onChange={setRecordTypeFilter}
                    style={{ width: 200 }}
                  >
                    <Option value="all">{language === 'zh' ? '全部类型' : 'All Types'}</Option>
                    <Option value="qa">{language === 'zh' ? '健康问答' : 'Health Q&A'}</Option>
                    <Option value="explanation">{language === 'zh' ? '指标解读' : 'Metrics'}</Option>
                    <Option value="support">{language === 'zh' ? '心理支持' : 'Support'}</Option>
                    <Option value="meditation">{language === 'zh' ? '冥想引导' : 'Meditation'}</Option>
                  </Select>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadRecords}
                    loading={loadingRecords}
                  >
                    {language === 'zh' ? '刷新' : 'Refresh'}
                  </Button>
                </Space>
              </Card>

              <Table
                columns={recordColumns}
                dataSource={records}
                loading={loadingRecords}
                rowKey="id"
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px' }}>
                      <Collapse>
                        <Panel header={language === 'zh' ? '输入数据' : 'Input Data'} key="input">
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                            {JSON.stringify(record.input, null, 2)}
                          </pre>
                        </Panel>
                        <Panel header={language === 'zh' ? '输出结果' : 'Output Result'} key="output">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {typeof record.output === 'string' 
                              ? record.output 
                              : (record.output.answer || record.output.explanation || record.output.support || record.output.guidance || record.output.cbtSupport || JSON.stringify(record.output, null, 2))}
                          </ReactMarkdown>
                        </Panel>
                        {record.metadata && (
                          <Panel header={language === 'zh' ? '元数据' : 'Metadata'} key="metadata">
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label={language === 'zh' ? 'AI服务' : 'AI Provider'}>
                                {record.metadata.aiProvider}
                              </Descriptions.Item>
                              <Descriptions.Item label={language === 'zh' ? 'AI模型' : 'AI Model'}>
                                {record.metadata.aiModel}
                              </Descriptions.Item>
                              <Descriptions.Item label={language === 'zh' ? '语言' : 'Language'}>
                                {record.metadata.language}
                              </Descriptions.Item>
                            </Descriptions>
                          </Panel>
                        )}
                      </Collapse>
                    </div>
                  )
                }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => (language === 'zh' ? `共 ${total} 条记录` : `Total ${total} records`)
                }}
              />
            </Space>
          </TabPane>

          {/* 用户上下文 Tab */}
          <TabPane
            tab={
              <span>
                <UserOutlined />
                {language === 'zh' ? '用户上下文' : 'User Context'}
              </span>
            }
            key="context"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadContext}
                    loading={loadingContext}
                  >
                    {language === 'zh' ? '刷新上下文' : 'Refresh Context'}
                  </Button>
                </Space>
              </Card>

              {userContext && (
                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Card title={language === 'zh' ? '健康快照' : 'Health Snapshot'}>
                      {userContext.healthSnapshot ? (
                        <Descriptions column={1} bordered>
                          {userContext.healthSnapshot.currentMetrics && (
                            <Descriptions.Item label={language === 'zh' ? '当前指标' : 'Current Metrics'}>
                              <pre style={{ fontSize: '12px', margin: 0 }}>
                                {JSON.stringify(userContext.healthSnapshot.currentMetrics, null, 2)}
                              </pre>
                            </Descriptions.Item>
                          )}
                          {userContext.healthSnapshot.medications && userContext.healthSnapshot.medications.length > 0 && (
                            <Descriptions.Item label={language === 'zh' ? '用药记录' : 'Medications'}>
                              {userContext.healthSnapshot.medications.length} {language === 'zh' ? '条记录' : 'records'}
                            </Descriptions.Item>
                          )}
                          {userContext.healthSnapshot.recentAlerts && userContext.healthSnapshot.recentAlerts.length > 0 && (
                            <Descriptions.Item label={language === 'zh' ? '最近预警' : 'Recent Alerts'}>
                              {userContext.healthSnapshot.recentAlerts.length} {language === 'zh' ? '条预警' : 'alerts'}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      ) : (
                        <Empty description={language === 'zh' ? '暂无健康数据' : 'No health data'} />
                      )}
                    </Card>
                  </Col>

                  <Col xs={24} lg={12}>
                    <Card title={language === 'zh' ? '对话上下文' : 'Conversation Context'}>
                      {userContext.conversationContext ? (
                        <Descriptions column={1} bordered>
                          <Descriptions.Item label={language === 'zh' ? '最近消息' : 'Recent Messages'}>
                            {userContext.conversationContext.recentMessages?.length || 0} {language === 'zh' ? '条' : 'messages'}
                          </Descriptions.Item>
                          <Descriptions.Item label={language === 'zh' ? '活跃对话' : 'Active Conversations'}>
                            {userContext.conversationContext.activeConversations?.length || 0} {language === 'zh' ? '个' : 'conversations'}
                          </Descriptions.Item>
                        </Descriptions>
                      ) : (
                        <Empty description={language === 'zh' ? '暂无对话数据' : 'No conversation data'} />
                      )}
                    </Card>
                  </Col>

                  <Col xs={24}>
                    <Card title={language === 'zh' ? '用户偏好' : 'User Preferences'}>
                      {userContext.preferences && (
                        <Descriptions column={3} bordered>
                          <Descriptions.Item label={language === 'zh' ? '语言' : 'Language'}>
                            {userContext.preferences.language}
                          </Descriptions.Item>
                          <Descriptions.Item label={language === 'zh' ? 'AI服务' : 'AI Provider'}>
                            {userContext.preferences.aiProvider || 'Default'}
                          </Descriptions.Item>
                          <Descriptions.Item label={language === 'zh' ? 'AI模型' : 'AI Model'}>
                            {userContext.preferences.aiModel || 'Default'}
                          </Descriptions.Item>
                        </Descriptions>
                      )}
                    </Card>
                  </Col>
                </Row>
              )}

              {!userContext && !loadingContext && (
                <Empty description={language === 'zh' ? '点击刷新加载上下文' : 'Click refresh to load context'} />
              )}
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* Feedback Modal */}
      <Modal
        title={language === 'zh' ? '提交反馈' : 'Submit Feedback'}
        open={feedbackModalVisible}
        onOk={handleSubmitFeedback}
        onCancel={() => setFeedbackModalVisible(false)}
        confirmLoading={submittingFeedback}
        width={600}
      >
        {selectedRecord && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>{language === 'zh' ? '记录类型' : 'Record Type'}: </Text>
              <Tag>{getTypeLabel(selectedRecord.type)[language === 'zh' ? 'zh' : 'en']}</Tag>
            </div>
            <div>
              <Text strong>{language === 'zh' ? '有效性评分' : 'Effectiveness Rating'}: </Text>
              <Rate
                value={feedbackRating}
                onChange={setFeedbackRating}
                allowClear={false}
              />
            </div>
            <div>
              <Text strong>{language === 'zh' ? '是否有帮助' : 'Helpful'}: </Text>
              <Space>
                <Button
                  type={feedbackHelpful === true ? 'primary' : 'default'}
                  onClick={() => setFeedbackHelpful(true)}
                >
                  {language === 'zh' ? '是' : 'Yes'}
                </Button>
                <Button
                  type={feedbackHelpful === false ? 'primary' : 'default'}
                  onClick={() => setFeedbackHelpful(false)}
                >
                  {language === 'zh' ? '否' : 'No'}
                </Button>
                <Button
                  type={feedbackHelpful === null ? 'primary' : 'default'}
                  onClick={() => setFeedbackHelpful(null)}
                >
                  {language === 'zh' ? '不确定' : 'Not Sure'}
                </Button>
              </Space>
            </div>
            <div>
              <Text strong>{language === 'zh' ? '评论' : 'Comments'}: </Text>
              <TextArea
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                rows={4}
                placeholder={language === 'zh' ? '请输入您的反馈意见...' : 'Please enter your feedback...'}
              />
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default RehabilitationAssistantPage;
