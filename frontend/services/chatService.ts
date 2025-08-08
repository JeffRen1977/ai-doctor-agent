import api from './api'
import { Message } from '@/stores/chatStore'

export interface ChatResponse {
  message: string
  suggestions?: string[]
}

export const chatService = {
  // 发送消息到AI医生
  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await api.post('/chat/send', { message })
    return response.data
  },

  // 获取聊天历史
  async getChatHistory(): Promise<Message[]> {
    const response = await api.get('/chat/history')
    return response.data
  },

  // 清空聊天历史
  async clearChatHistory(): Promise<void> {
    await api.delete('/chat/history')
  },

  // 获取症状建议
  async getSymptomSuggestions(symptoms: string): Promise<string[]> {
    const response = await api.post('/chat/symptoms', { symptoms })
    return response.data.suggestions
  },
} 