import { create } from 'zustand'

export interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  isLoading?: boolean
}

interface ChatState {
  messages: Message[]
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  clearMessages: () => void
  setLoading: (messageId: string, loading: boolean) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === id ? { ...msg, ...updates } : msg
      )
    })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (messageId, loading) =>
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === messageId ? { ...msg, isLoading: loading } : msg
      )
    })),
})) 