const express = require('express');
const Joi = require('joi');
const geminiService = require('../services/geminiService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs } = require('firebase/firestore');
const { db, isMock } = require('../config/firebase');

const router = express.Router();

// 聊天消息验证schema
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required()
});

// 模拟聊天历史存储
const mockChatHistory = new Map();

// 保存聊天消息到Firebase
async function saveChatMessage(userId, message, sender) {
  try {
    if (isMock) {
      // 模拟保存
      if (!mockChatHistory.has(userId)) {
        mockChatHistory.set(userId, []);
      }
      
      const chatId = `mock-${Date.now()}`;
      const chatMessage = {
        id: chatId,
        userId,
        content: message,
        sender,
        timestamp: new Date(),
        createdAt: new Date()
      };
      
      mockChatHistory.get(userId).push(chatMessage);
      return chatId;
    }

    console.log('💾 保存聊天消息:', { userId, sender, messageLength: message.length });
    const chatRef = doc(collection(db, 'chats'));
    await setDoc(chatRef, {
      userId,
      content: message,
      sender,
      timestamp: new Date(),
      createdAt: new Date()
    });
    console.log('✅ 聊天消息保存成功:', chatRef.id);
    return chatRef.id;
  } catch (error) {
    console.error('❌ 保存聊天消息错误:', error);
    throw error;
  }
}

// 获取用户聊天历史
async function getChatHistory(userId, limit = 50) {
  try {
    if (isMock) {
      // 模拟获取历史
      const history = mockChatHistory.get(userId) || [];
      return history.slice(-limit);
    }

    console.log('🔍 查询用户聊天历史:', userId);
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        userId: data.userId,
        content: data.content,
        sender: data.sender,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
      });
    });
    
    console.log('📊 找到聊天记录数量:', messages.length);
    return messages.reverse(); // 按时间正序返回
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
    const userId = req.user.id;
    console.log('📝 发送消息:', { userId, messageLength: message.length });

    // 保存用户消息
    try {
      await saveChatMessage(userId, message, 'user');
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
      await saveChatMessage(userId, aiResponse, 'assistant');
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

// 测试Firestore连接和权限
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 测试Firestore连接，用户ID:', userId);
    
    // 尝试创建一个测试文档
    const testRef = doc(collection(db, 'test'));
    await setDoc(testRef, {
      userId,
      test: true,
      timestamp: new Date()
    });
    
    console.log('✅ Firestore连接测试成功');
    
    // 尝试查询测试文档
    const testQuery = query(collection(db, 'test'), where('userId', '==', userId));
    const testSnapshot = await getDocs(testQuery);
    console.log('📊 测试查询结果数量:', testSnapshot.size);
    
    res.json({ 
      success: true, 
      message: 'Firestore连接正常',
      testQueryCount: testSnapshot.size
    });
  } catch (error) {
    console.error('❌ Firestore连接测试失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取聊天历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 获取聊天历史，用户ID:', userId);
    
    const history = await getChatHistory(userId);
    console.log('📊 聊天历史数量:', history.length);
    
    res.json(history);
  } catch (error) {
    console.error('❌ 获取聊天历史错误:', error);
    // 返回空数组而不是错误
    res.json([]);
  }
});

// 清空聊天历史
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (isMock) {
      // 模拟清空
      mockChatHistory.delete(userId);
    } else {
      // 获取用户的所有聊天记录
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      // 删除所有聊天记录
      const deletePromises = querySnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
    }
    
    res.json({ message: '聊天历史已清空' });
  } catch (error) {
    console.error('清空聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
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