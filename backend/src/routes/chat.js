const express = require('express');
const Joi = require('joi');

const router = express.Router();

// 模拟聊天历史数据
const chatHistory = new Map();

// 聊天消息验证schema
const messageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required()
});

// 模拟AI医生回复
const generateAIResponse = (userMessage) => {
  const responses = {
    '头痛': '根据您描述的症状，可能是偏头痛或紧张性头痛。建议您：\n1. 保持充足的休息\n2. 避免长时间用眼\n3. 适当进行放松运动\n4. 如果症状持续，建议及时就医',
    '感冒': '感冒是常见疾病，建议您：\n1. 多休息，保持充足睡眠\n2. 多喝温水，保持水分\n3. 适当服用感冒药\n4. 注意保暖，避免受凉\n5. 如果症状加重，请及时就医',
    '发烧': '发烧需要引起重视，建议您：\n1. 测量体温，记录变化\n2. 多喝温水，保持水分\n3. 适当物理降温\n4. 如果体温超过38.5°C，建议服用退烧药\n5. 如果症状持续或加重，请及时就医',
    '咳嗽': '咳嗽可能由多种原因引起，建议您：\n1. 保持室内空气湿润\n2. 多喝温水\n3. 避免刺激性食物\n4. 如果咳嗽持续或伴有其他症状，请及时就医',
    '失眠': '失眠会影响健康，建议您：\n1. 建立规律的作息时间\n2. 睡前避免使用电子设备\n3. 保持卧室环境安静舒适\n4. 适当进行放松活动\n5. 如果长期失眠，建议咨询医生'
  };

  // 简单的关键词匹配
  for (const [keyword, response] of Object.entries(responses)) {
    if (userMessage.includes(keyword)) {
      return response;
    }
  }

  // 默认回复
  return `感谢您的咨询。我理解您描述的症状，但为了给您更准确的建议，建议您：\n\n1. 详细描述症状的具体表现\n2. 说明症状的持续时间\n3. 是否有其他伴随症状\n4. 是否有相关病史\n\n如果症状严重或持续不缓解，建议及时就医。`;
};

// 发送消息到AI医生
router.post('/send', (req, res) => {
  try {
    // 验证输入
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { message } = value;
    const userId = req.headers['user-id'] || '1'; // 实际应用中从JWT获取

    // 生成AI回复
    const aiResponse = generateAIResponse(message);

    // 保存到聊天历史
    if (!chatHistory.has(userId)) {
      chatHistory.set(userId, []);
    }

    const userHistory = chatHistory.get(userId);
    userHistory.push({
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    });

    userHistory.push({
      id: (Date.now() + 1).toString(),
      content: aiResponse,
      sender: 'assistant',
      timestamp: new Date()
    });

    // 返回AI回复
    res.json({
      message: aiResponse,
      suggestions: [
        '头痛',
        '感冒',
        '发烧',
        '咳嗽',
        '失眠'
      ]
    });
  } catch (error) {
    console.error('发送消息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取聊天历史
router.get('/history', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    const history = chatHistory.get(userId) || [];
    
    res.json(history);
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 清空聊天历史
router.delete('/history', (req, res) => {
  try {
    const userId = req.headers['user-id'] || '1';
    chatHistory.delete(userId);
    
    res.json({ message: '聊天历史已清空' });
  } catch (error) {
    console.error('清空聊天历史错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取症状建议
router.post('/symptoms', (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms) {
      return res.status(400).json({ error: '请提供症状描述' });
    }

    // 根据症状生成建议
    const suggestions = [
      '头痛',
      '感冒',
      '发烧',
      '咳嗽',
      '失眠',
      '胃痛',
      '腹泻',
      '皮疹'
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error('获取症状建议错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router; 