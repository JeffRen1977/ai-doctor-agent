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

    const chatRef = doc(collection(db, 'chats'));
    await setDoc(chatRef, {
      userId,
      content: message,
      sender,
      timestamp: new Date(),
      createdAt: new Date()
    });
    return chatRef.id;
  } catch (error) {
    console.error('保存聊天消息错误:', error);
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
      messages.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      });
    });
    
    return messages.reverse(); // 按时间正序返回
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    throw error;
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

    // 保存用户消息
    await saveChatMessage(userId, message, 'user');

    // 使用Gemini AI生成回复
    const aiResult = await geminiService.healthChat(message);
    
    if (!aiResult.success) {
      return res.status(500).json({ error: 'AI服务暂时不可用' });
    }

    const aiResponse = aiResult.message;

    // 保存AI回复
    await saveChatMessage(userId, aiResponse, 'assistant');

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
    console.error('发送消息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取聊天历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getChatHistory(userId);
    
    res.json(history);
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
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