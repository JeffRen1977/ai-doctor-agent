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
  Spin
} from 'antd';
import {
  MessageOutlined,
  BookOutlined,
  HeartOutlined,
  CloudOutlined,
  SendOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useChatStore, Message } from '@/stores/chatStore';
import { chatService } from '@/services/chatService';
import { rehabilitationAssistantAPI } from '@/services/api';
import ChatMessage from '@/components/ChatMessage';
import { useLanguageStore } from '@/stores/languageStore';
import { getTranslation } from '@/locales';
import './ChatPage.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const RehabilitationAssistantPage: React.FC = () => {
  const { language } = useLanguageStore();
  const t = (key: string) => getTranslation(language, key);
  
  const [activeTab, setActiveTab] = useState('chat');
  
  // Debug: Log component mount
  useEffect(() => {
    console.log('✅ RehabilitationAssistantPage mounted');
  }, []);
  
  // AI Chat Tab State (from ChatPage)
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, updateMessage, clearMessages } = useChatStore();
  
  // Education Tab State
  const [metrics, setMetrics] = useState<any>({});
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  
  // Emotional Support Tab State
  const [emotionalContext, setEmotionalContext] = useState('');
  const [providingSupport, setProvidingSupport] = useState(false);
  const [supportResult, setSupportResult] = useState<any>(null);
  
  // Meditation Tab State
  const [meditationType, setMeditationType] = useState('breathing');
  const [guiding, setGuiding] = useState(false);
  const [meditationGuidance, setMeditationGuidance] = useState<string>('');
  
  // CBT Tab State
  const [cbtSituation, setCbtSituation] = useState('');
  const [providingCBT, setProvidingCBT] = useState(false);
  const [cbtResult, setCbtResult] = useState<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // AI Chat Handlers
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

    addMessage(userMessage);
    addMessage(assistantMessage);
    setInputValue('');
    setSending(true);

    try {
      try {
        const { getApiBaseUrl } = await import('../utils/apiConfig');
        await fetch(`${getApiBaseUrl()}/user-settings/ai`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            language: language
          })
        });
      } catch (syncError) {
        console.warn('⚠️ Failed to sync language setting:', syncError);
      }

      const response = await chatService.sendMessage(userMessage.content);
      
      updateMessage(assistantMessage.id, {
        content: response.message,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = language === 'zh' 
        ? '抱歉，我遇到了一些问题。请稍后再试。'
        : 'Sorry, I encountered some issues. Please try again later.';
      updateMessage(assistantMessage.id, {
        content: errorMessage,
        isLoading: false,
      });
      message.error(language === 'zh' ? '发送消息失败' : 'Failed to send message');
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
    clearMessages();
    message.success(language === 'zh' ? '聊天记录已清空' : 'Chat history cleared');
  };

  // Education Tab Handlers
  const handleExplainMetrics = async () => {
    if (!metrics || Object.keys(metrics).length === 0) {
      message.warning(language === 'zh' ? '请输入临床指标' : 'Please enter clinical metrics');
      return;
    }

    setExplaining(true);
    setExplanation('');
    
    try {
      const result = await rehabilitationAssistantAPI.explainMetrics(metrics);
      if (result.success) {
        setExplanation(result.explanation);
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
    setMeditationGuidance('');
    
    try {
      const result = await rehabilitationAssistantAPI.guideMeditation(meditationType);
      if (result.success) {
        setMeditationGuidance(result.guidance);
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

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        {language === 'zh' ? '生成式AI康复助理' : 'Generative AI Rehabilitation Assistant'}
      </Title>
      
      <Paragraph style={{ marginBottom: '24px', fontSize: '16px', color: '#666' }}>
        {language === 'zh' 
          ? '利用大语言模型提供专业且有温度的健康咨询、科普解读和心理支持。'
          : 'Leveraging large language models to provide professional, warm health consultations, educational explanations, and psychological support.'}
      </Paragraph>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* AI对话 Tab */}
          <TabPane
            tab={
              <span>
                <MessageOutlined />
                {language === 'zh' ? 'AI对话' : 'AI Chat'}
              </span>
            }
            key="chat"
          >
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', padding: '8px', minHeight: '400px' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                    {language === 'zh' 
                      ? '开始与AI医生对话，描述您的症状或健康问题'
                      : 'Start a conversation with AI Doctor, describe your symptoms or health concerns'
                    }
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} style={{ marginBottom: '12px' }} />
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
                    ? '输入您的临床指标（如HbA1c、LDL-C等），AI将用简单易懂的语言为您解释。'
                    : 'Enter your clinical metrics (such as HbA1c, LDL-C, etc.), and AI will explain them in simple, easy-to-understand language.'}
                type="info"
                showIcon
              />

              <Card title={language === 'zh' ? '输入临床指标' : 'Enter Clinical Metrics'}>
                <TextArea
                  placeholder={language === 'zh' 
                    ? '例如：{"HbA1c": 7.2, "LDL-C": 120, "血压": "130/80"}'
                    : 'Example: {"HbA1c": 7.2, "LDL-C": 120, "Blood Pressure": "130/80"}'}
                  rows={4}
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
                >
                  {language === 'zh' ? '解读指标' : 'Explain Metrics'}
                </Button>
              </Card>

              {explanation && (
                <Card title={language === 'zh' ? '解读结果' : 'Explanation Result'}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{explanation}</Paragraph>
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

              <Card title={language === 'zh' ? '描述您的情况' : 'Describe Your Situation'}>
                <TextArea
                  placeholder={language === 'zh' 
                    ? '例如：我最近感到焦虑，担心自己的健康状况...'
                    : 'Example: I\'ve been feeling anxious lately, worried about my health...'}
                  rows={6}
                  value={emotionalContext}
                  onChange={(e) => setEmotionalContext(e.target.value)}
                />
                <Button
                  type="primary"
                  onClick={handleProvideSupport}
                  loading={providingSupport}
                  style={{ marginTop: '16px' }}
                  block
                >
                  {language === 'zh' ? '获取支持' : 'Get Support'}
                </Button>
              </Card>

              {supportResult && (
                <Card title={language === 'zh' ? '支持结果' : 'Support Result'}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {supportResult.anxietyLevel && (
                      <Tag color={
                        supportResult.anxietyLevel === 'high' ? 'red' :
                        supportResult.anxietyLevel === 'medium' ? 'orange' : 'green'
                      }>
                        {language === 'zh' ? '焦虑程度' : 'Anxiety Level'}: {supportResult.anxietyLevel}
                      </Tag>
                    )}
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{supportResult.support}</Paragraph>
                    {supportResult.recommendations && supportResult.recommendations.length > 0 && (
                      <div>
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
                  </Space>
                </Card>
              )}

              <Divider>{language === 'zh' ? '认知行为疗法 (CBT)' : 'Cognitive Behavioral Therapy (CBT)'}</Divider>

              <Card title={language === 'zh' ? 'CBT支持' : 'CBT Support'}>
                <TextArea
                  placeholder={language === 'zh' 
                    ? '描述您面临的情况或负面思维...'
                    : 'Describe your situation or negative thoughts...'}
                  rows={6}
                  value={cbtSituation}
                  onChange={(e) => setCbtSituation(e.target.value)}
                />
                <Button
                  type="primary"
                  onClick={handleProvideCBT}
                  loading={providingCBT}
                  style={{ marginTop: '16px' }}
                  block
                >
                  {language === 'zh' ? '获取CBT支持' : 'Get CBT Support'}
                </Button>
              </Card>

              {cbtResult && (
                <Card title={language === 'zh' ? 'CBT支持结果' : 'CBT Support Result'}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{cbtResult.cbtSupport}</Paragraph>
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
                >
                  {language === 'zh' ? '开始冥想引导' : 'Start Meditation Guide'}
                </Button>
              </Card>

              {meditationGuidance && (
                <Card title={language === 'zh' ? '冥想引导' : 'Meditation Guidance'}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.8' }}>
                    {meditationGuidance}
                  </Paragraph>
                </Card>
              )}
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default RehabilitationAssistantPage;
