const express = require('express');
const Joi = require('joi');
const geminiService = require('../services/geminiService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { db, isMock } = require('../config/firebase');

const router = express.Router();

// 聊天消息验证schema
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required()
});

// 模拟聊天历史存储
const mockChatHistory = new Map();

// 保存聊天消息到Firebase - 为每个用户创建一个文档
async function saveChatMessage(userEmail, message, sender) {
  try {
    if (isMock) {
      // 模拟保存
      if (!mockChatHistory.has(userEmail)) {
        mockChatHistory.set(userEmail, []);
      }
      
      const chatId = `mock-${Date.now()}`;
      const chatMessage = {
        id: chatId,
        content: message,
        sender,
        timestamp: new Date(),
        createdAt: new Date()
      };
      
      mockChatHistory.get(userEmail).push(chatMessage);
      return chatId;
    }

    console.log('💾 保存聊天消息:', { userEmail, sender, messageLength: message.length });
    
    // 创建或获取用户的聊天文档
    const userChatDocRef = doc(db, 'userChats', userEmail);
    const userChatDoc = await getDoc(userChatDocRef);
    
    const chatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: message,
      sender,
      timestamp: new Date(),
      createdAt: new Date()
    };
    
    if (!userChatDoc.exists()) {
      // 如果用户聊天文档不存在，创建一个新的
      await setDoc(userChatDocRef, {
        userEmail,
        messages: [chatMessage],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ 创建新用户聊天文档:', userEmail);
    } else {
      // 如果用户聊天文档存在，添加新消息到messages数组
      await updateDoc(userChatDocRef, {
        messages: arrayUnion(chatMessage),
        updatedAt: new Date()
      });
      console.log('✅ 更新用户聊天文档:', userEmail);
    }
    
    return chatMessage.id;
  } catch (error) {
    console.error('❌ 保存聊天消息错误:', error);
    throw error;
  }
}

// 获取用户聊天历史 - 从用户文档中获取
async function getChatHistory(userEmail, limitCount = 50) {
  try {
    if (isMock) {
      // 模拟获取历史
      const history = mockChatHistory.get(userEmail) || [];
      return history.slice(-limitCount);
    }

    console.log('🔍 查询用户聊天历史:', userEmail);
    
    // 获取用户的聊天文档
    const userChatDocRef = doc(db, 'userChats', userEmail);
    const userChatDoc = await getDoc(userChatDocRef);
    
    if (!userChatDoc.exists()) {
      console.log('📊 用户聊天文档不存在，返回空历史');
      return [];
    }
    
    const userChatData = userChatDoc.data();
    const messages = userChatData.messages || [];
    
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

    // 使用Gemini AI生成回复
    const aiResult = await geminiService.healthChat(message);
    
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
    
    if (isMock) {
      // 模拟清除
      mockChatHistory.delete(userEmail);
      return res.json({ message: '聊天历史已清除' });
    }
    
    // 删除用户的聊天文档
    const userChatDocRef = doc(db, 'userChats', userEmail);
    await setDoc(userChatDocRef, {
      userEmail,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
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
    
    // 尝试创建一个测试文档
    const testRef = doc(collection(db, 'test'));
    await setDoc(testRef, {
      userEmail,
      test: true,
      timestamp: new Date()
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

module.exports = router; 