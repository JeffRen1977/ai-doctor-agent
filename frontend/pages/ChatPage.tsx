import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, Card, Space, message, Grid } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'
import { useChatStore, Message } from '@/stores/chatStore'
import { chatService } from '@/services/chatService'
import ChatMessage from '@/components/ChatMessage'
import { useLanguageStore } from '@/stores/languageStore'
import { getTranslation } from '@/locales'
import './ChatPage.css'

const { TextArea } = Input
const { useBreakpoint } = Grid

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, updateMessage, clearMessages } = useChatStore()
  const { language } = useLanguageStore()
  const screens = useBreakpoint()

  const t = (key: string) => getTranslation(language, key)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    }

    addMessage(userMessage)
    addMessage(assistantMessage)
    setInputValue('')
    setSending(true)

    try {
      const response = await chatService.sendMessage(userMessage.content)
      
      updateMessage(assistantMessage.id, {
        content: response.message,
        isLoading: false,
      })
    } catch (error) {
      const errorMessage = language === 'zh' 
        ? '抱歉，我遇到了一些问题。请稍后再试。'
        : 'Sorry, I encountered some issues. Please try again later.'
      updateMessage(assistantMessage.id, {
        content: errorMessage,
        isLoading: false,
      })
      message.error(language === 'zh' ? '发送消息失败' : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    clearMessages()
    message.success(language === 'zh' ? '聊天记录已清空' : 'Chat history cleared')
  }

  return (
    <div className="chat-page" style={{ padding: screens.xs ? '8px' : '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Card
        title={t('chat.title')}
        extra={
          <Space size={screens.xs ? 'small' : 'middle'}>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={messages.length === 0}
              size={screens.xs ? 'small' : 'default'}
            >
              {screens.xs ? (language === 'zh' ? '清空' : 'Clear') : (language === 'zh' ? '清空记录' : 'Clear History')}
            </Button>
          </Space>
        }
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          marginBottom: screens.xs ? '8px' : '16px'
        }}
        bodyStyle={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          padding: screens.xs ? '8px' : '16px'
        }}
        size={screens.xs ? 'small' : 'default'}
      >
        {/* Messages Container */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '16px',
            padding: screens.xs ? '4px' : '8px',
            maxHeight: screens.xs ? 'calc(100vh - 200px)' : 'calc(100vh - 300px)'
          }}
        >
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#999',
              fontSize: screens.xs ? '14px' : '16px'
            }}>
              {language === 'zh' 
                ? '开始与AI医生对话，描述您的症状或健康问题'
                : 'Start a conversation with AI Doctor, describe your symptoms or health concerns'
              }
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                style={{ marginBottom: screens.xs ? '8px' : '12px' }}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
          borderTop: '1px solid #f0f0f0', 
          paddingTop: '16px',
          backgroundColor: '#fff'
        }}>
          <Space.Compact style={{ width: '100%' }} size={screens.xs ? 'small' : 'middle'}>
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'zh' ? '描述您的症状或健康问题...' : 'Describe your symptoms or health concerns...'}
              autoSize={{ minRows: 1, maxRows: 4 }}
              style={{ 
                fontSize: screens.xs ? '14px' : '16px',
                resize: 'none'
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              disabled={!inputValue.trim()}
              style={{ 
                height: screens.xs ? '32px' : 'auto',
                minWidth: screens.xs ? '60px' : '80px'
              }}
            >
              {screens.xs ? (language === 'zh' ? '发送' : 'Send') : (language === 'zh' ? '发送消息' : 'Send')}
            </Button>
          </Space.Compact>
          
          {/* Mobile-friendly tips */}
          {screens.xs && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '12px', 
              color: '#999',
              textAlign: 'center'
            }}>
              {language === 'zh' 
                ? '💡 提示：按回车键快速发送消息'
                : '💡 Tip: Press Enter to send message quickly'
              }
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ChatPage 