import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, Card, Space, message } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'
import { useChatStore, Message } from '@/stores/chatStore'
import { chatService } from '@/services/chatService'
import ChatMessage from '@/components/ChatMessage'
import './ChatPage.css'

const { TextArea } = Input

const ChatPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, addMessage, updateMessage, clearMessages } = useChatStore()

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
      updateMessage(assistantMessage.id, {
        content: '抱歉，我遇到了一些问题。请稍后再试。',
        isLoading: false,
      })
      message.error('发送消息失败')
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
    message.success('聊天记录已清空')
  }

  return (
    <div className="chat-page">
      <Card
        title="AI医生对话"
        extra={
          <Space>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={messages.length === 0}
            >
              清空记录
            </Button>
          </Space>
        }
        className="chat-card"
      >
        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>👋 您好！我是您的AI医生助理</p>
                <p>请描述您的症状或健康问题，我会为您提供专业的建议</p>
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
              placeholder="请描述您的症状或健康问题..."
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
              发送
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ChatPage 