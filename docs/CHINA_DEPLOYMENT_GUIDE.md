# 中国部署指南 - 中国大模型集成

## 📋 概述

本文档提供将AI医生助理部署到中国并使用中国大模型的完整指南，包括模型选择、集成步骤、部署方案和数据合规要求。

---

## 🤖 推荐的中国大模型

### 1. 百度文心一言（ERNIE Bot）⭐ 推荐

**优势：**
- ✅ API稳定可靠，服务成熟
- ✅ 支持多模态（文本、图片、语音）
- ✅ 医疗健康场景优化
- ✅ 文档完善，SDK易用
- ✅ 成本相对较低
- ✅ 支持长文本处理

**适用场景：**
- 健康文档分析
- 饮食图片识别
- 健康咨询对话
- 症状分析

**API文档：** https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t

### 2. 阿里通义千问（Qwen）⭐ 推荐

**优势：**
- ✅ 性能优秀，响应速度快
- ✅ 支持多模态（Qwen-VL）
- ✅ API稳定
- ✅ 医疗领域表现良好
- ✅ 支持函数调用

**适用场景：**
- 健康记录分析
- 实时对话
- 数据分析

**API文档：** https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9

### 3. 智谱AI GLM

**优势：**
- ✅ 开源友好
- ✅ API稳定
- ✅ 成本可控
- ✅ 支持长文本

**适用场景：**
- 健康文档分析
- 文本生成

**API文档：** https://open.bigmodel.cn/

### 4. 月之暗面Kimi

**优势：**
- ✅ 超长文本处理能力（200K tokens）
- ✅ 适合分析长文档
- ✅ 性能优秀

**适用场景：**
- 长文档分析
- 复杂健康报告

**API文档：** https://platform.moonshot.cn/docs

### 推荐组合方案

**主推荐：文心一言 + 通义千问**
- 文心一言：用于图片识别、多模态分析
- 通义千问：用于文本分析、对话

**备选方案：GLM + Kimi**
- GLM：通用文本处理
- Kimi：长文档分析

---

## 🏗️ 技术架构

### 集成架构

```
┌─────────────────────────────────────────┐
│          AI Service Factory             │
│  (统一接口管理所有AI服务)                 │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐
│ Gemini│ │OpenAI │ │中国模型│
│       │ │       │ │       │
│       │ │       │ │文心一言│
│       │ │       │ │通义千问│
│       │ │       │ │GLM    │
└───────┘ └───────┘ └───────┘
```

---

## 📦 第一步：安装依赖

### 1.1 安装文心一言SDK

```bash
cd backend
npm install baidubce-sdk
```

### 1.2 安装通义千问SDK

```bash
npm install @alicloud/dashscope
```

### 1.3 安装GLM SDK（可选）

```bash
npm install zhipuai
```

### 1.4 安装Kimi SDK（可选）

```bash
npm install @moonshot/moonshot-js
```

---

## 🔧 第二步：创建中国大模型服务

### 2.1 创建文心一言服务

创建文件：`backend/src/services/ernieService.js`

```javascript
const axios = require('axios');

class ErnieService {
  constructor() {
    this.isInitialized = false;
    this.accessToken = null;
    this.apiKey = process.env.BAIDU_API_KEY;
    this.secretKey = process.env.BAIDU_SECRET_KEY;
    this.baseUrl = 'https://aip.baidubce.com';
    
    this.initialize();
  }

  async initialize() {
    try {
      if (!this.apiKey || !this.secretKey) {
        console.warn('⚠️ 百度API密钥未配置');
        return;
      }

      // 获取访问令牌
      await this.getAccessToken();
      
      this.isInitialized = true;
      console.log('✅ 文心一言服务初始化成功');
    } catch (error) {
      console.error('❌ 文心一言服务初始化失败:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken() {
    try {
      const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
      
      const response = await axios.post(url);
      
      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        console.log('✅ 文心一言访问令牌获取成功');
        
        // 令牌有效期通常为30天，设置定时刷新
        setTimeout(() => {
          this.getAccessToken();
        }, (response.data.expires_in - 3600) * 1000); // 提前1小时刷新
      }
    } catch (error) {
      console.error('❌ 获取文心一言访问令牌失败:', error);
      throw error;
    }
  }

  /**
   * 健康咨询对话
   */
  async healthChat(message, context = '', options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        throw new Error('文心一言服务未初始化');
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const prompt = context 
        ? `作为专业的AI健康助手，基于以下上下文信息回答用户问题：\n\n上下文：${context}\n\n用户问题：${message}\n\n请提供专业、准确、易懂的健康建议。`
        : `作为专业的AI健康助手，请回答用户的健康问题：${message}\n\n请提供专业、准确、易懂的健康建议。`;

      const response = await axios.post(url, {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_output_tokens: 2000
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        text: response.data.result,
        model: 'ernie-bot',
        usage: response.data.usage
      };
    } catch (error) {
      console.error('❌ 文心一言对话错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 从图片中提取文本
   */
  async extractTextFromImage(base64Image, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        throw new Error('文心一言服务未初始化');
      }

      const url = `${this.baseUrl}/rest/2.0/ocr/v1/general_basic?access_token=${this.accessToken}`;
      
      const response = await axios.post(url, {
        image: base64Image
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.words_result) {
        const text = response.data.words_result.map(item => item.words).join('\n');
        return {
          success: true,
          text: text,
          model: 'ernie-ocr'
        };
      }

      throw new Error('OCR识别失败');
    } catch (error) {
      console.error('❌ 文心一言OCR错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析健康记录
   */
  async analyzeHealthRecords(healthData, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        throw new Error('文心一言服务未初始化');
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const prompt = `请分析以下健康数据，提供专业的健康评估和建议：

健康数据：
${JSON.stringify(healthData, null, 2)}

请提供：
1. 健康总结
2. 关键指标分析
3. 风险因素识别
4. 个性化建议
5. 下一步行动建议`;

      const response = await axios.post(url, {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_output_tokens: 3000
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        analysis: response.data.result,
        model: 'ernie-bot'
      };
    } catch (error) {
      console.error('❌ 文心一言健康分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 饮食分析
   */
  async analyzeDiet(foodItems, userHealthData = {}, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        throw new Error('文心一言服务未初始化');
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${this.accessToken}`;
      
      const prompt = `作为营养专家，请分析以下食物并提供健康建议：

食物：${JSON.stringify(foodItems)}
用户健康数据：${JSON.stringify(userHealthData)}

请提供：
1. 营养成分分析
2. 血糖影响评估
3. 个性化饮食建议
4. 注意事项`;

      const response = await axios.post(url, {
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_output_tokens: 2000
      });

      return {
        success: true,
        analysis: response.data.result,
        model: 'ernie-bot'
      };
    } catch (error) {
      console.error('❌ 文心一言饮食分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 图片分析（多模态）
   */
  async analyzeImageWithErnie(base64Image, prompt, options = {}) {
    try {
      if (!this.isInitialized || !this.accessToken) {
        throw new Error('文心一言服务未初始化');
      }

      const url = `${this.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-vilg-v2?access_token=${this.accessToken}`;
      
      // 使用文心一言的多模态能力
      const response = await axios.post(url, {
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.5
      });

      return {
        success: true,
        result: response.data.result,
        model: 'ernie-vilg-v2'
      };
    } catch (error) {
      console.error('❌ 文心一言图片分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查服务是否可用
   */
  isServiceAvailable() {
    return this.isInitialized && this.accessToken !== null;
  }

  /**
   * 获取可用模型
   */
  getAvailableModels() {
    return {
      text: ['ernie-bot', 'ernie-bot-turbo'],
      image: ['ernie-vilg-v2'],
      ocr: ['general_basic']
    };
  }
}

module.exports = new ErnieService();
```

### 2.2 创建通义千问服务

创建文件：`backend/src/services/qwenService.js`

```javascript
const axios = require('axios');

class QwenService {
  constructor() {
    this.isInitialized = false;
    this.apiKey = process.env.DASHSCOPE_API_KEY;
    this.baseUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    
    this.initialize();
  }

  initialize() {
    try {
      if (!this.apiKey) {
        console.warn('⚠️ 通义千问API密钥未配置');
        return;
      }

      this.isInitialized = true;
      console.log('✅ 通义千问服务初始化成功');
    } catch (error) {
      console.error('❌ 通义千问服务初始化失败:', error);
      this.isInitialized = false;
    }
  }

  /**
   * 健康咨询对话
   */
  async healthChat(message, context = '', options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const prompt = context 
        ? `作为专业的AI健康助手，基于以下上下文信息回答用户问题：\n\n上下文：${context}\n\n用户问题：${message}\n\n请提供专业、准确、易懂的健康建议。`
        : `作为专业的AI健康助手，请回答用户的健康问题：${message}\n\n请提供专业、准确、易懂的健康建议。`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.7,
            max_tokens: 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        text: response.data.output.choices[0].message.content,
        model: 'qwen-turbo',
        usage: response.data.usage
      };
    } catch (error) {
      console.error('❌ 通义千问对话错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 分析健康记录
   */
  async analyzeHealthRecords(healthData, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const prompt = `请分析以下健康数据，提供专业的健康评估和建议：

健康数据：
${JSON.stringify(healthData, null, 2)}

请提供：
1. 健康总结
2. 关键指标分析
3. 风险因素识别
4. 个性化建议
5. 下一步行动建议`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'qwen-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.3,
            max_tokens: 3000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        analysis: response.data.output.choices[0].message.content,
        model: 'qwen-plus'
      };
    } catch (error) {
      console.error('❌ 通义千问健康分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 饮食分析
   */
  async analyzeDiet(foodItems, userHealthData = {}, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const prompt = `作为营养专家，请分析以下食物并提供健康建议：

食物：${JSON.stringify(foodItems)}
用户健康数据：${JSON.stringify(userHealthData)}

请提供：
1. 营养成分分析
2. 血糖影响评估
3. 个性化饮食建议
4. 注意事项`;

      const response = await axios.post(
        this.baseUrl,
        {
          model: 'qwen-turbo',
          input: {
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          },
          parameters: {
            temperature: 0.5,
            max_tokens: 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        analysis: response.data.output.choices[0].message.content,
        model: 'qwen-turbo'
      };
    } catch (error) {
      console.error('❌ 通义千问饮食分析错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 从图片中提取文本（使用OCR）
   */
  async extractTextFromImage(base64Image, options = {}) {
    // 通义千问可以使用多模态模型进行图片理解
    try {
      if (!this.isInitialized) {
        throw new Error('通义千问服务未初始化');
      }

      const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
      
      const response = await axios.post(
        url,
        {
          model: 'qwen-vl-plus',
          input: {
            messages: [
              {
                role: 'user',
                content: [
                  {
                    image: `data:image/jpeg;base64,${base64Image}`
                  },
                  {
                    text: '请提取这张图片中的所有文字内容，包括医疗报告、检查结果、诊断意见等。'
                  }
                ]
              }
            ]
          },
          parameters: {
            max_tokens: 2000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        text: response.data.output.choices[0].message.content,
        model: 'qwen-vl-plus'
      };
    } catch (error) {
      console.error('❌ 通义千问图片文本提取错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 检查服务是否可用
   */
  isServiceAvailable() {
    return this.isInitialized;
  }

  /**
   * 获取可用模型
   */
  getAvailableModels() {
    return {
      text: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
      image: ['qwen-vl-plus', 'qwen-vl-max']
    };
  }
}

module.exports = new QwenService();
```

---

## 🔌 第三步：集成到AI服务工厂

更新文件：`backend/src/services/aiServiceFactory.js`

```javascript
const geminiService = require('./geminiService');
const openaiService = require('./openaiService');
const ernieService = require('./ernieService');  // 新增
const qwenService = require('./qwenService');    // 新增

class AIServiceFactory {
  constructor() {
    this.services = {
      gemini: geminiService,
      openai: openaiService,
      ernie: ernieService,      // 新增
      qwen: qwenService          // 新增
    };
    
    this.availableServices = this.checkAvailableServices();
    console.log('🏭 AI Service Factory initialized');
    console.log('📋 Available services:', Object.keys(this.availableServices));
  }

  checkAvailableServices() {
    const available = {};
    
    // ... 原有的Gemini和OpenAI检查 ...

    // 检查文心一言服务
    if (ernieService.isServiceAvailable && ernieService.isServiceAvailable()) {
      const ernieModels = ernieService.getAvailableModels ? ernieService.getAvailableModels() : ['ernie-bot'];
      available.ernie = {
        name: '百度文心一言',
        models: ernieModels.text || ['ernie-bot'],
        provider: 'ernie'
      };
    }
    
    // 检查通义千问服务
    if (qwenService.isServiceAvailable && qwenService.isServiceAvailable()) {
      const qwenModels = qwenService.getAvailableModels ? qwenService.getAvailableModels() : ['qwen-turbo'];
      available.qwen = {
        name: '阿里通义千问',
        models: qwenModels.text || ['qwen-turbo'],
        provider: 'qwen'
      };
    }
    
    return available;
  }

  // ... 其他方法保持不变，只需在方法中添加对ernie和qwen的支持 ...
}
```

---

## 🔐 第四步：配置环境变量

### 4.1 本地开发环境

创建/更新 `backend/.env` 文件：

```bash
# 百度文心一言配置
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key

# 阿里通义千问配置
DASHSCOPE_API_KEY=your-dashscope-api-key

# 原有配置保持不变
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret
# ... 其他配置
```

### 4.2 获取API密钥

#### 百度文心一言API密钥

1. 访问 [百度智能云](https://cloud.baidu.com/)
2. 注册/登录账号
3. 进入"产品服务" → "人工智能" → "文心一言"
4. 创建应用，获取API Key和Secret Key
5. 将密钥添加到环境变量

**文档：** https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t

#### 阿里通义千问API密钥

1. 访问 [阿里云DashScope](https://dashscope.console.aliyun.com/)
2. 注册/登录账号
3. 进入"API-KEY管理"
4. 创建新的API Key
5. 将密钥添加到环境变量

**文档：** https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9

---

## 🚀 第五步：部署到中国服务器

### 5.1 服务器选择

**推荐云服务商：**
- 阿里云（推荐，与通义千问同源，延迟低）
- 腾讯云
- 华为云
- 百度智能云（与文心一言同源）

### 5.2 部署步骤

#### 方案A：使用Docker部署

1. **创建Dockerfile（已存在，检查是否需要更新）**

2. **创建docker-compose.yml（已存在）**

3. **构建和部署**
```bash
# 构建镜像
docker build -t ai-doctor-agent:china .

# 运行容器
docker-compose up -d
```

#### 方案B：直接部署

1. **安装Node.js**
```bash
# 使用nvm安装Node.js 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

2. **克隆项目**
```bash
git clone <your-repo-url>
cd ai-doctor-agent
```

3. **安装依赖**
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

4. **配置环境变量**
```bash
# 创建.env文件
cd ../backend
cp .env.example .env
# 编辑.env文件，添加所有必要的环境变量
```

5. **构建前端**
```bash
cd ../frontend
npm run build
```

6. **启动服务**
```bash
# 使用PM2管理进程
npm install -g pm2
cd ..
pm2 start start-railway.js --name ai-doctor-agent
```

### 5.3 使用Nginx反向代理

创建Nginx配置：`/etc/nginx/sites-available/ai-doctor-agent`

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/ai-doctor-agent/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket支持（如果需要）
    location /socket.io {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/ai-doctor-agent /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.4 配置SSL证书

使用Let's Encrypt免费SSL证书：

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔒 第六步：数据合规和安全

### 6.1 数据存储合规

**要求：**
- ✅ 用户数据存储在境内服务器
- ✅ 遵守《个人信息保护法》
- ✅ 数据加密存储
- ✅ 访问日志记录

**实施：**
```javascript
// 数据加密示例
const crypto = require('crypto');

function encryptSensitiveData(data) {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}
```

### 6.2 用户隐私保护

- 实现数据脱敏
- 用户数据访问控制
- 定期数据清理
- 用户数据导出功能

### 6.3 API限流

```javascript
// 使用express-rate-limit
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100次请求
});

app.use('/api/', apiLimiter);
```

---

## 🧪 第七步：测试

### 7.1 测试文心一言服务

创建测试文件：`backend/test-ernie.js`

```javascript
require('dotenv').config();
const ernieService = require('./src/services/ernieService');

async function test() {
  console.log('🧪 测试文心一言服务...\n');
  
  // 测试健康对话
  const chatResult = await ernieService.healthChat('我最近总是头痛，应该怎么办？');
  console.log('对话测试:', chatResult);
  
  // 测试健康分析
  const healthData = {
    bloodPressure: '140/90',
    heartRate: 85,
    glucose: 110
  };
  const analysisResult = await ernieService.analyzeHealthRecords(healthData);
  console.log('健康分析测试:', analysisResult);
}

test().catch(console.error);
```

运行测试：
```bash
node backend/test-ernie.js
```

### 7.2 测试通义千问服务

创建测试文件：`backend/test-qwen.js`

```javascript
require('dotenv').config();
const qwenService = require('./src/services/qwenService');

async function test() {
  console.log('🧪 测试通义千问服务...\n');
  
  const chatResult = await qwenService.healthChat('我最近总是头痛，应该怎么办？');
  console.log('对话测试:', chatResult);
}

test().catch(console.error);
```

运行测试：
```bash
node backend/test-qwen.js
```

---

## 📊 第八步：监控和日志

### 8.1 配置日志

```javascript
// 使用winston记录日志
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// 记录AI服务调用
logger.info('AI Service Call', {
  provider: 'ernie',
  model: 'ernie-bot',
  timestamp: new Date(),
  userId: 'user123'
});
```

### 8.2 性能监控

```javascript
// 监控API响应时间
const startTime = Date.now();
const result = await aiService.healthChat(message);
const duration = Date.now() - startTime;

logger.info('AI Service Performance', {
  provider: 'ernie',
  duration: duration,
  success: result.success
});
```

---

## 🎯 使用建议

### 场景选择

1. **图片识别（饮食分析）**：使用文心一言（多模态能力强）
2. **文本分析（健康记录）**：使用通义千问（速度快）
3. **长文档分析**：使用Kimi（长文本能力强）
4. **通用对话**：文心一言或通义千问均可

### 成本优化

- 文心一言：按调用次数计费，适合高频场景
- 通义千问：按token计费，适合长文本
- 建议：根据实际使用情况选择，可以混合使用

---

## 🐛 常见问题

### Q1: API调用失败怎么办？

**A:** 检查以下几点：
1. API密钥是否正确
2. 网络连接是否正常
3. API配额是否用完
4. 查看错误日志

### Q2: 如何切换AI服务？

**A:** 在前端或API调用时指定provider参数：
```javascript
// 使用文心一言
{ provider: 'ernie', model: 'ernie-bot' }

// 使用通义千问
{ provider: 'qwen', model: 'qwen-turbo' }
```

### Q3: 如何实现服务降级？

**A:** 在aiServiceFactory中实现fallback逻辑：
```javascript
async healthChat(message, options = {}) {
  try {
    return await this.getService('ernie').healthChat(message);
  } catch (error) {
    // 降级到通义千问
    return await this.getService('qwen').healthChat(message);
  }
}
```

---

## 📚 参考资源

- [百度文心一言API文档](https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t)
- [阿里通义千问API文档](https://help.aliyun.com/zh/model-studio/developer-reference/api-details-9)
- [智谱AI GLM文档](https://open.bigmodel.cn/)
- [月之暗面Kimi文档](https://platform.moonshot.cn/docs)

---

**文档版本**: v1.0  
**最后更新**: 2025-01-XX  
**维护者**: 开发团队
