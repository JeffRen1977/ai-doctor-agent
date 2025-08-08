import React from 'react'
import { Avatar, Spin } from 'antd'
import { UserOutlined, MessageOutlined } from '@ant-design/icons'
import { Message } from '@/stores/chatStore'
import dayjs from 'dayjs'
import './ChatMessage.css'

interface ChatMessageProps {
  message: Message
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user'

  return (
    <div className={`message ${message.sender}`}>
      <Avatar
        size={40}
        icon={isUser ? <UserOutlined /> : <MessageOutlined />}
        className={isUser ? 'user-avatar' : 'assistant-avatar'}
      />
      <div className="message-content">
        {message.isLoading ? (
          <div className="loading-message">
            <Spin size="small" />
            <span>AI医生正在思考...</span>
          </div>
        ) : (
          <div className="message-text">{message.content}</div>
        )}
        <div className="message-time">
          {dayjs(message.timestamp).format('HH:mm')}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage 