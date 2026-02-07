/**
 * 对话历史服务
 * 管理AI医生对话历史的存储和检索
 */

const { db } = require('../config/firebase');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit, getDocs, addDoc } = require('firebase/firestore');
const { createConversationHistory, createConversationMessage } = require('../models/conversationModels');

class ConversationService {
  constructor() {
    console.log('💬 Conversation Service initialized');
  }

  /**
   * 创建新对话
   * @param {string} userEmail 用户邮箱
   * @param {Object} initialMessage 初始消息（可选）
   * @returns {Promise<Object>} 对话对象
   */
  async createConversation(userEmail, initialMessage = null) {
    try {
      const conversation = createConversationHistory(userEmail, initialMessage);
      
      // 保存到Firestore
      const conversationRef = doc(collection(db, 'conversations'), conversation.conversationId);
      await setDoc(conversationRef, conversation);
      
      console.log(`✅ Conversation created: ${conversation.conversationId}`);
      return {
        success: true,
        conversation: conversation
      };
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 添加消息到对话
   * @param {string} conversationId 对话ID
   * @param {string} role 角色 ('user' | 'assistant' | 'system')
   * @param {string} content 消息内容
   * @param {Object} context 上下文信息（可选）
   * @returns {Promise<Object>} 结果
   */
  async addMessage(conversationId, role, content, context = {}) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        return { success: false, error: 'Conversation not found' };
      }
      
      const conversationData = conversationDoc.data();
      const messages = conversationData.messages || [];
      
      // 创建新消息
      const message = createConversationMessage(role, content, context);
      messages.push(message);
      
      // 更新对话
      await updateDoc(conversationRef, {
        messages: messages,
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true,
        message: message
      };
    } catch (error) {
      console.error('❌ Error adding message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取对话历史
   * @param {string} conversationId 对话ID
   * @returns {Promise<Object>} 对话对象
   */
  async getConversation(conversationId) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        return { success: false, error: 'Conversation not found' };
      }
      
      return {
        success: true,
        conversation: conversationDoc.data()
      };
    } catch (error) {
      console.error('❌ Error getting conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 获取用户的所有对话列表
   * @param {string} userEmail 用户邮箱
   * @param {number} limitCount 限制数量
   * @returns {Promise<Object>} 对话列表
   */
  async getUserConversations(userEmail, limitCount = 20) {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('userEmail', '==', userEmail),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => ({
        conversationId: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        conversations: conversations
      };
    } catch (error) {
      console.error('❌ Error getting user conversations:', error);
      // 如果索引不存在，尝试不使用orderBy
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('userEmail', '==', userEmail),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        let conversations = querySnapshot.docs.map(doc => ({
          conversationId: doc.id,
          ...doc.data()
        }));
        
        // 在内存中排序
        conversations.sort((a, b) => {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        return {
          success: true,
          conversations: conversations.slice(0, limitCount)
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * 更新对话摘要
   * @param {string} conversationId 对话ID
   * @param {string} summary 摘要
   * @returns {Promise<Object>} 结果
   */
  async updateConversationSummary(conversationId, summary) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        summary: summary,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating conversation summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 更新对话元数据
   * @param {string} conversationId 对话ID
   * @param {Object} metadata 元数据
   * @returns {Promise<Object>} 结果
   */
  async updateConversationMetadata(conversationId, metadata) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        return { success: false, error: 'Conversation not found' };
      }
      
      const existingMetadata = conversationDoc.data().metadata || {};
      
      await updateDoc(conversationRef, {
        metadata: {
          ...existingMetadata,
          ...metadata
        },
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating conversation metadata:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 删除对话
   * @param {string} conversationId 对话ID
   * @returns {Promise<Object>} 结果
   */
  async deleteConversation(conversationId) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await deleteDoc(conversationRef);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ConversationService();
