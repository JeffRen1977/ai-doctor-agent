/**
 * 对话历史服务
 * 管理AI医生对话历史的存储和检索
 */

const { createConversationHistory, createConversationMessage } = require('../models/conversationModels');
const { conversationRepo } = require('../repositories');

class ConversationService {
  constructor() {
    console.log('💬 Conversation Service initialized');
  }

  async createConversation(userEmail, initialMessage = null) {
    try {
      const conversation = createConversationHistory(userEmail, initialMessage);
      await conversationRepo.saveConversation(conversation);
      console.log(`✅ Conversation created: ${conversation.conversationId}`);
      return { success: true, conversation };
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  }

  async addMessage(conversationId, role, content, context = {}) {
    try {
      const conversation = await conversationRepo.getConversation(conversationId);
      if (!conversation) return { success: false, error: 'Conversation not found' };
      const messages = conversation.messages || [];
      const message = createConversationMessage(role, content, context);
      messages.push(message);
      await conversationRepo.updateConversation(conversationId, { messages });
      return { success: true, message };
    } catch (error) {
      console.error('❌ Error adding message:', error);
      return { success: false, error: error.message };
    }
  }

  async getConversation(conversationId) {
    try {
      const conversation = await conversationRepo.getConversation(conversationId);
      if (!conversation) return { success: false, error: 'Conversation not found' };
      return { success: true, conversation };
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserConversations(userEmail, limitCount = 20) {
    try {
      const conversations = await conversationRepo.listByUser(userEmail, limitCount);
      return { success: true, conversations };
    } catch (error) {
      console.error('❌ Error getting user conversations:', error);
      return { success: false, error: error.message };
    }
  }

  async updateConversationSummary(conversationId, summary) {
    try {
      await conversationRepo.updateConversation(conversationId, { summary });
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating conversation summary:', error);
      return { success: false, error: error.message };
    }
  }

  async updateConversationMetadata(conversationId, metadata) {
    try {
      const conversation = await conversationRepo.getConversation(conversationId);
      if (!conversation) return { success: false, error: 'Conversation not found' };
      const existingMetadata = conversation.metadata || {};
      await conversationRepo.updateConversation(conversationId, {
        metadata: { ...existingMetadata, ...metadata }
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating conversation metadata:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteConversation(conversationId) {
    try {
      await conversationRepo.deleteConversation(conversationId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ConversationService();
