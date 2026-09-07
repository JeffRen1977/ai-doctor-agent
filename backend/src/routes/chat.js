const express = require('express');
const Joi = require('joi');
const aiServiceFactory = require('../services/aiServiceFactory');
const userSettingsService = require('../services/userSettingsService');
const { authenticateToken, optionalAuth, requireAdmin } = require('../middleware/auth');
const { chatSessionRepo, chatHistoryRepo } = require('../repositories');
const contextBuilderService = require('../services/contextBuilderService');

const router = express.Router();

function sanitizeUserId(userEmail) {
  return (userEmail || '').replace(/[^a-zA-Z0-9@._-]/g, '_');
}

// 聊天消息验证schema
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required()
});

// 保存聊天消息到 chat_sessions 子集合（通过 Repository，便于今后换国内数据库）
async function saveChatMessage(userEmail, message, sender) {
  try {
    const userId = sanitizeUserId(userEmail);
    console.log('💾 保存聊天消息到 chat_sessions:', { userEmail, sender, messageLength: message.length });
    const { sessionId } = await chatSessionRepo.getOrCreateSession(userId);
    await chatSessionRepo.appendMessage(userId, sessionId, sender, message);
    console.log('✅ 聊天消息已保存');
    return sessionId;
  } catch (error) {
    console.error('❌ 保存聊天消息错误:', error);
    throw error;
  }
}

// 获取用户聊天历史 - 从 chat_sessions 子集合（通过 Repository）
async function getChatHistory(userEmail, limitCount = 50) {
  try {
    const userId = sanitizeUserId(userEmail);
    console.log('🔍 从 chat_sessions 查询用户聊天历史:', userEmail);
    const latest = await chatSessionRepo.getLatestSession(userId);
    if (!latest || !latest.session.messages) {
      console.log('📊 无会话或空消息，返回空历史');
      return [];
    }
    const messages = latest.session.messages.slice(-limitCount);
    console.log('📊 找到聊天记录数量:', messages.length);
    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      sender: m.role === 'assistant' ? 'assistant' : 'user',
      timestamp: m.timestamp
    }));
  } catch (error) {
    console.error('❌ 获取聊天历史错误:', error);
    if (error.code === 'permission-denied') {
      console.warn('⚠️  Firestore权限被拒绝，返回空历史');
      return [];
    }
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
    const userEmail = req.user.email;
    console.log('📝 发送消息:', { userId, userEmail, messageLength: message.length });

    // 保存用户消息
    try {
      await saveChatMessage(userEmail, message, 'user');
      console.log('✅ 用户消息保存成功');
    } catch (error) {
      console.error('❌ 保存用户消息失败:', error);
      // 继续执行，不中断流程
    }

    // 获取用户的AI设置
    let userLanguage = 'zh';
    const userAISettings = await userSettingsService.getUserAISettings(userId);
    const userProvider = userAISettings.success ? userAISettings.aiProvider : 'gemini';
    const userModel = userAISettings.success ? userAISettings.aiModel : '';
    userLanguage = userAISettings.success ? userAISettings.language : 'zh';
    
    console.log(`🤖 Using AI provider: ${userProvider}, model: ${userModel}, language: ${userLanguage} for chat`);
    
    // 通过 Context Builder 获取基础档案 + 最近对话，拼入 prompt 上下文
    let chatContext = '';
    try {
      const sanitizedUserId = sanitizeUserId(userEmail);
      const payload = await contextBuilderService.buildAIContext(sanitizedUserId, {
        medications: true,
        chatRecent: true,
        language: userLanguage
      });
      chatContext = contextBuilderService.formatContextForSystemPrompt(payload);
    } catch (e) {
      console.warn('⚠️ buildAIContext for chat failed:', e.message);
    }
    
    // 使用AI服务工厂生成回复
    const aiResult = await aiServiceFactory.healthChat(message, chatContext, {
      provider: userProvider,
      model: userModel,
      language: userLanguage
    });
    
    if (!aiResult.success) {
      const errorMessage = userLanguage === 'en' ? 'AI service temporarily unavailable' : 'AI服务暂时不可用';
      return res.status(500).json({ error: errorMessage });
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

    // 根据语言返回相应的建议
    const suggestions = userLanguage === 'en' ? [
      'Headache',
      'Cold',
      'Fever',
      'Cough',
      'Insomnia',
      'Stomach pain',
      'Fatigue',
      'Anxiety'
    ] : [
      '头痛',
      '感冒',
      '发烧',
      '咳嗽',
      '失眠',
      '胃痛',
      '疲劳',
      '焦虑'
    ];

    // 返回AI回复
    res.json({
      message: aiResponse,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('❌ 发送消息错误:', error);
    const errorMessage = userLanguage === 'en' ? 'Internal server error' : '服务器内部错误';
    res.status(500).json({ error: errorMessage });
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

// 清除聊天历史（清空当前会话 messages，走 Repository）
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = sanitizeUserId(userEmail);
    console.log('🗑️  清除聊天历史，用户邮箱:', userEmail);
    await chatSessionRepo.clearLatestSession(userId);
    res.json({ message: '聊天历史已清除' });
  } catch (error) {
    console.error('❌ 清除聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 测试存储连接和权限（通过 chatHistoryRepo）
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log('🔍 测试存储连接，用户邮箱:', userEmail);
    const { id } = await chatHistoryRepo.addDocument({
      userEmail,
      test: true,
      timestamp: new Date().toISOString(),
      testType: 'connection-test'
    });
    const testDoc = await chatHistoryRepo.getDocument(id);
    if (testDoc) {
      console.log('✅ 存储连接测试成功');
      res.json({ message: 'Firestore连接测试成功', userEmail });
    } else {
      res.status(500).json({ error: 'Firestore连接测试失败' });
    }
  } catch (error) {
    console.error('❌ 存储连接测试错误:', error);
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

// 获取用户聊天统计信息（从 chat_sessions 最新会话）
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userId = sanitizeUserId(userEmail);
    console.log('📊 获取用户聊天统计信息:', userEmail);
    const latest = await chatSessionRepo.getLatestSession(userId);
    if (!latest || !latest.session.messages.length) {
      return res.json({
        totalMessages: 0,
        userMessages: 0,
        aiMessages: 0,
        lastActivity: null
      });
    }
    const messages = latest.session.messages;
    const userMessages = messages.filter((m) => m.role === 'user').length;
    const aiMessages = messages.filter((m) => m.role === 'assistant').length;
    const lastMsg = messages[messages.length - 1];
    res.json({
      totalMessages: messages.length,
      userMessages,
      aiMessages,
      lastActivity: lastMsg.timestamp || null,
      createdAt: latest.session.startedAt,
      updatedAt: latest.session.updatedAt
    });
  } catch (error) {
    console.error('❌ 获取聊天统计信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取所有用户的聊天历史（管理员功能）
router.get('/admin/all-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 管理员获取所有用户聊天历史');
    const docs = await chatHistoryRepo.listAll();
    const allUsers = docs.map((data) => {
      const lastMsg = data.messages && data.messages.length > 0 ? data.messages[data.messages.length - 1] : null;
      return {
        email: data.id,
        messageCount: data.messages ? data.messages.length : 0,
        lastActivity: lastMsg ? (lastMsg.timestamp || null) : null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
    allUsers.sort((a, b) => {
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
    res.json(allUsers);
  } catch (error) {
    console.error('❌ 获取所有用户聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除特定用户的聊天历史（管理员功能，清空消息并标记删除）
router.delete('/admin/user/:email', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🗑️  管理员删除用户聊天历史:', email);
    const now = new Date().toISOString();
    await chatHistoryRepo.setByUser(email, {
      userEmail: email,
      messages: [],
      createdAt: now,
      updatedAt: now,
      totalMessages: 0,
      deletedAt: now,
      deletedBy: req.user.email
    });
    res.json({ message: `用户 ${email} 的聊天历史已删除` });
  } catch (error) {
    console.error('❌ 删除用户聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 