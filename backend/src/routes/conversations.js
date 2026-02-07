/**
 * 对话历史API路由
 */

const express = require('express');
const router = express.Router();
const conversationService = require('../services/conversationService');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/conversations
 * 创建新对话
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { initialMessage } = req.body;

    const result = await conversationService.createConversation(
      userEmail,
      initialMessage || null
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation: result.conversation
    });
  } catch (error) {
    console.error('❌ Create conversation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create conversation.',
      details: error.message 
    });
  }
});

/**
 * POST /api/conversations/:conversationId/messages
 * 添加消息到对话
 */
router.post('/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;
    const { role, content, context } = req.body;

    if (!role || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: role, content' 
      });
    }

    const result = await conversationService.addMessage(
      conversationId,
      role,
      content,
      context || {}
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      message: result.message
    });
  } catch (error) {
    console.error('❌ Add message error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to add message.',
      details: error.message 
    });
  }
});

/**
 * GET /api/conversations/:conversationId
 * 获取对话历史
 */
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;

    const result = await conversationService.getConversation(conversationId);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // 验证对话属于当前用户
    if (result.conversation.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      conversation: result.conversation
    });
  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get conversation.',
      details: error.message 
    });
  }
});

/**
 * GET /api/conversations
 * 获取用户的所有对话列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { limit } = req.query;
    const limitCount = limit ? parseInt(limit) : 20;

    const result = await conversationService.getUserConversations(
      userEmail,
      limitCount
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      conversations: result.conversations
    });
  } catch (error) {
    console.error('❌ Get user conversations error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get conversations.',
      details: error.message 
    });
  }
});

/**
 * PUT /api/conversations/:conversationId/summary
 * 更新对话摘要
 */
router.put('/:conversationId/summary', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;
    const { summary } = req.body;

    if (!summary) {
      return res.status(400).json({ error: 'Missing required field: summary' });
    }

    const result = await conversationService.updateConversationSummary(
      conversationId,
      summary
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Conversation summary updated successfully'
    });
  } catch (error) {
    console.error('❌ Update conversation summary error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update conversation summary.',
      details: error.message 
    });
  }
});

/**
 * DELETE /api/conversations/:conversationId
 * 删除对话
 */
router.delete('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { conversationId } = req.params;

    // 验证对话属于当前用户
    const conversationResult = await conversationService.getConversation(conversationId);
    if (!conversationResult.success || conversationResult.conversation.userEmail !== userEmail) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await conversationService.deleteConversation(conversationId);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete conversation.',
      details: error.message 
    });
  }
});

module.exports = router;
