import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, Card, Space, message } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'
import { useChatStore, Message } from '@/stores/chatStore'
import { chatService } from '@/services/chatService'
import ChatMessage from '@/components/ChatMessage'
import { useLanguageStore } from '@/stores/languageStore'
import { getTranslation } from '@/locales'
import './ChatPage.css'

const { TextArea } = Input

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, updateMessage, clearMessages } = useChatStore()
  const { language } = useLanguageStore()

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
    <div className="chat-page">
      <Card
        title={t('chat.title')}
        extra={
          <Space>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={messages.length === 0}
            >
              {language === 'zh' ? '清空记录' : 'Clear History'}
            </Button>
          </Space>
        }
        className="chat-card"
      >
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>👋 {language === 'zh' ? '您好！我是您的AI医生助理' : 'Hello! I am your AI doctor assistant'}</p>
                <p>{t('chat.placeholder')}</p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <TextArea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.placeholder')}
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={sending}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              disabled={!inputValue.trim()}
            >
              {t('chat.sendButton')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChatPage 