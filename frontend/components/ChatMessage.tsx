import React from 'react'
import { Avatar, Spin } from 'antd'
import { UserOutlined, MessageOutlined } from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
          <div className="message-text">
            {isUser ? (
              // 用户消息直接显示文本
              <span>{message.content}</span>
            ) : (
              // AI回复使用markdown渲染
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // 自定义代码块样式
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <pre className="code-block">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    )
                  },
                  // 自定义表格样式
                  table: ({ children }) => (
                    <div className="table-container">
                      <table className="markdown-table">{children}</table>
                    </div>
                  ),
                  // 自定义列表样式
                  ul: ({ children }) => (
                    <ul className="markdown-list">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="markdown-list">{children}</ol>
                  ),
                  // 自定义标题样式
                  h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
                  h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
                  h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
                  h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
                  h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
                  h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        <div className="message-time">
          {dayjs(message.timestamp).format('HH:mm')}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage 