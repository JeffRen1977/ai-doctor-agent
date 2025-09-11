const express = require('express');
const Joi = require('joi');
const geminiService = require('../services/geminiService');
const aiServiceFactory = require('../services/aiServiceFactory');
const userSettingsService = require('../services/userSettingsService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { db } = require('../config/firebase');

const router = express.Router();

// 聊天消息验证schema
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required()
});

// 保存聊天消息到Firebase - 使用chatHistory集合，文档ID为用户邮箱
async function saveChatMessage(userEmail, message, sender) {
  try {
    console.log('💾 保存聊天消息到chatHistory集合:', { userEmail, sender, messageLength: message.length });
    
    // 使用chatHistory集合，文档ID为用户邮箱
    const chatHistoryDocRef = doc(db, 'chatHistory', userEmail);
    const chatHistoryDoc = await getDoc(chatHistoryDocRef);
    
    const chatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      sender,
      timestamp: new Date(),
      createdAt: new Date()
    };
    
    if (!chatHistoryDoc.exists()) {
      // 如果用户聊天历史文档不存在，创建一个新的
      await setDoc(chatHistoryDocRef, {
        userEmail,
        messages: [chatMessage],
        createdAt: new Date(),
        updatedAt: new Date(),
        totalMessages: 1
      });
      console.log('✅ 创建新用户聊天历史文档:', userEmail);
    } else {
      // 如果用户聊天历史文档存在，添加新消息到messages数组
      const currentData = chatHistoryDoc.data();
      const currentMessages = currentData.messages || [];
      
      await updateDoc(chatHistoryDocRef, {
        messages: arrayUnion(chatMessage),
        updatedAt: new Date(),
        totalMessages: currentMessages.length + 1
      });
      console.log('✅ 更新用户聊天历史文档:', userEmail);
    }
    
    return chatMessage.id;
  } catch (error) {
    console.error('❌ 保存聊天消息错误:', error);
    throw error;
  }
}

// 获取用户聊天历史 - 从chatHistory集合获取
async function getChatHistory(userEmail, limitCount = 50) {
  try {
    console.log('🔍 从chatHistory集合查询用户聊天历史:', userEmail);
    
    // 从chatHistory集合获取用户的聊天历史文档
    const chatHistoryDocRef = doc(db, 'chatHistory', userEmail);
    const chatHistoryDoc = await getDoc(chatHistoryDocRef);
    
    if (!chatHistoryDoc.exists()) {
      console.log('📊 用户聊天历史文档不存在，返回空历史');
      return [];
    }
    
    const chatHistoryData = chatHistoryDoc.data();
    const messages = chatHistoryData.messages || [];
    
    // 按时间排序并限制数量
    const sortedMessages = messages
      .sort((a, b) => {
        const timeA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date();
        const timeB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date();
        return timeA - timeB;
      })
      .slice(-limitCount);
    
    console.log('📊 找到聊天记录数量:', sortedMessages.length);
    return sortedMessages;
  } catch (error) {
    console.error('❌ 获取聊天历史错误:', error);
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    
    // 如果是Firestore权限错误，返回空数组
    if (error.code === 'permission-denied') {
      console.warn('⚠️  Firestore权限被拒绝，返回空历史');
      return [];
    }
    
    // 如果是其他错误，也返回空数组而不是抛出错误
    console.warn('⚠️  返回空历史记录');
    return [];
  }
}

// 发送消息到AI医生
router.post('/send', authenticateToken, async (req, res) => {
  try {
    // 验证输入
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message } = value;
    const userEmail = req.user.email;
    console.log('📝 发送消息:', { userEmail, messageLength: message.length });

    // 保存用户消息
    try {
      await saveChatMessage(userEmail, message, 'user');
      console.log('✅ 用户消息保存成功');
    } catch (error) {
      console.error('❌ 保存用户消息失败:', error);
      // 继续执行，不中断流程
    }

    // 获取用户的AI设置
    const userAISettings = await userSettingsService.getUserAISettings(userId);
    const userProvider = userAISettings.success ? userAISettings.aiProvider : 'gemini';
    const userModel = userAISettings.success ? userAISettings.aiModel : '';
    
    console.log(`🤖 Using AI provider: ${userProvider} for chat`);
    
    // 使用AI服务工厂生成回复
    const aiResult = await aiServiceFactory.healthChat(message, '', {
      provider: userProvider,
      model: userModel
    });
    
    if (!aiResult.success) {
      return res.status(500).json({ error: 'AI服务暂时不可用' });
    }

    const aiResponse = aiResult.message;

    // 保存AI回复
    try {
      await saveChatMessage(userEmail, aiResponse, 'assistant');
      console.log('✅ AI回复保存成功');
    } catch (error) {
      console.error('❌ 保存AI回复失败:', error);
      // 继续执行，不中断流程
    }

    // 返回AI回复
    res.json({
      message: aiResponse,
      suggestions: [
        '头痛',
        '感冒',
        '发烧',
        '咳嗽',
        '失眠',
        '胃痛',
        '疲劳',
        '焦虑'
      ]
    });
  } catch (error) {
    console.error('❌ 发送消息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取聊天历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const limitCount = parseInt(req.query.limit) || 50;
    
    console.log('🔍 获取聊天历史，用户邮箱:', userEmail);
    
    const messages = await getChatHistory(userEmail, limitCount);
    console.log('📊 聊天历史数量:', messages.length);
    
    res.json(messages);
  } catch (error) {
    console.error('❌ 获取聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 清除聊天历史
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('🗑️  清除聊天历史，用户邮箱:', userEmail);
    
    // 清除用户的聊天历史文档（重置为空数组）
    const chatHistoryDocRef = doc(db, 'chatHistory', userEmail);
    await setDoc(chatHistoryDocRef, {
      userEmail,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalMessages: 0
    });
    
    res.json({ message: '聊天历史已清除' });
  } catch (error) {
    console.error('❌ 清除聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 测试Firestore连接和权限
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('🔍 测试Firestore连接，用户邮箱:', userEmail);
    
    // 尝试创建一个测试文档到chatHistory集合
    const testRef = doc(collection(db, 'chatHistory'));
    await setDoc(testRef, {
      userEmail,
      test: true,
      timestamp: new Date(),
      testType: 'connection-test'
    });
    
    // 尝试读取测试文档
    const testDoc = await getDoc(testRef);
    
    if (testDoc.exists()) {
      console.log('✅ Firestore连接测试成功');
      res.json({ message: 'Firestore连接测试成功', userEmail });
    } else {
      res.status(500).json({ error: 'Firestore连接测试失败' });
    }
  } catch (error) {
    console.error('❌ Firestore连接测试错误:', error);
    res.status(500).json({ error: 'Firestore连接测试失败', details: error.message });
  }
});

// 获取聊天建议
router.get('/suggestions', optionalAuth, (req, res) => {
  const suggestions = [
    {
      category: '常见症状',
      items: ['头痛', '感冒', '发烧', '咳嗽', '失眠']
    },
    {
      category: '健康咨询',
      items: ['营养建议', '运动建议', '心理健康', '慢性病管理']
    },
    {
      category: '用药咨询',
      items: ['药物相互作用', '用药时间', '副作用', '替代药物']
    }
  ];
  
  res.json(suggestions);
});

// 获取用户聊天统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('📊 获取用户聊天统计信息:', userEmail);
    
    // 从chatHistory集合获取用户统计信息
    const chatHistoryDocRef = doc(db, 'chatHistory', userEmail);
    const chatHistoryDoc = await getDoc(chatHistoryDocRef);
    
    if (!chatHistoryDoc.exists()) {
      return res.json({
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        lastActivity: null
      });
    }
    
    const chatHistoryData = chatHistoryDoc.data();
    const messages = chatHistoryData.messages || [];
    const userMessages = messages.filter(msg => msg.sender === 'user').length;
    const aiMessages = messages.filter(msg => msg.sender === 'assistant').length;
    
    res.json({
      totalMessages: messages.length,
      userMessages,
      aiMessages,
      lastActivity: messages.length > 0 ? messages[messages.length - 1].timestamp : null,
      createdAt: chatHistoryData.createdAt,
      updatedAt: chatHistoryData.updatedAt
    });
  } catch (error) {
    console.error('❌ 获取聊天统计信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取所有用户的聊天历史（管理员功能）
router.get('/admin/all-users', authenticateToken, async (req, res) => {
  try {
    // 这里可以添加管理员权限检查
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: '需要管理员权限' });
    // }
    
    console.log('🔍 管理员获取所有用户聊天历史');
    
    // 从chatHistory集合获取所有用户信息
    const chatHistoryCollection = collection(db, 'chatHistory');
    const chatHistorySnapshot = await getDocs(chatHistoryCollection);
    
    const allUsers = chatHistorySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        email: doc.id,
        messageCount: data.messages ? data.messages.length : 0,
        lastActivity: data.messages && data.messages.length > 0 ? 
          data.messages[data.messages.length - 1].timestamp : null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
    
    // 按最后活动时间排序
    allUsers.sort((a, b) => {
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      const timeA = a.lastActivity.toDate ? a.lastActivity.toDate() : new Date(a.lastActivity);
      const timeB = b.lastActivity.toDate ? b.lastActivity.toDate() : new Date(b.lastActivity);
      return timeB - timeA;
    });
    
    res.json(allUsers);
  } catch (error) {
    console.error('❌ 获取所有用户聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除特定用户的聊天历史（管理员功能）
router.delete('/admin/user/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    // 这里可以添加管理员权限检查
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: '需要管理员权限' });
    // }
    
    console.log('🗑️  管理员删除用户聊天历史:', email);
    
    // 删除用户的聊天历史文档
    const chatHistoryDocRef = doc(db, 'chatHistory', email);
    await setDoc(chatHistoryDocRef, {
      userEmail: email,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      totalMessages: 0,
      deletedAt: new Date(),
      deletedBy: req.user.email
    });
    
    res.json({ message: `用户 ${email} 的聊天历史已删除` });
  } catch (error) {
    console.error('❌ 删除用户聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 