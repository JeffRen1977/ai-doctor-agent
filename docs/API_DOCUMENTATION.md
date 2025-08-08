# AI个人医生助理 - API文档

> 完整的RESTful API接口文档，包含认证、聊天和健康记录管理功能

## 📋 目录

- [概述](#概述)
- [基础信息](#基础信息)
- [认证接口](#认证接口)
- [聊天接口](#聊天接口)
- [健康记录接口](#健康记录接口)
- [错误处理](#错误处理)
- [状态码](#状态码)

## 🎯 概述

AI个人医生助理API提供完整的健康咨询和记录管理功能，采用RESTful设计原则，支持JSON数据格式。

### 基础URL
```
开发环境: http://localhost:8000
生产环境: https://api.ai-doctor.com
```

### 数据格式
- **请求**: `application/json`
- **响应**: `application/json`
- **字符编码**: `UTF-8`

## 🔧 基础信息

### 请求头
```http
Content-Type: application/json
Authorization: Bearer <token>  # 需要认证的接口
```

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应格式
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 🔐 认证接口

### 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "张三",
      "email": "demo@example.com",
      "avatar": null
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJkZW1vQGV4YW1wbGUuY29tIiwiaWF0IjoxNzU0NjM3MDU0LCJleHAiOjE3NTQ3MjM0NTR9.OGVQ0Yrr9XyvZ9Jbeb0QKtuzG2EIu_SV83BUAmY0IVU"
  },
  "message": "登录成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "邮箱或密码错误",
  "code": "AUTH_FAILED"
}
```

### 用户登出

**接口地址**: `POST /api/auth/logout`

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 获取当前用户信息

**接口地址**: `GET /api/auth/me`

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "张三",
    "email": "demo@example.com",
    "avatar": null
  }
}
```

## 💬 聊天接口

### 发送消息到AI医生

**接口地址**: `POST /api/chat/send`

**请求参数**:
```json
{
  "message": "我头痛"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "根据您描述的症状，可能是偏头痛或紧张性头痛。建议您：\n1. 保持充足的休息\n2. 避免长时间用眼\n3. 适当进行放松运动\n4. 如果症状持续，建议及时就医",
    "suggestions": ["头痛", "感冒", "发烧", "咳嗽", "失眠"]
  }
}
```

### 获取聊天历史

**接口地址**: `GET /api/chat/history`

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "content": "我头痛",
      "sender": "user",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "2",
      "content": "根据您描述的症状，可能是偏头痛或紧张性头痛...",
      "sender": "assistant",
      "timestamp": "2024-01-15T10:30:05.000Z"
    }
  ]
}
```

### 清空聊天历史

**接口地址**: `DELETE /api/chat/history`

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "聊天历史已清空"
}
```

### 获取症状建议

**接口地址**: `POST /api/chat/symptoms`

**请求参数**:
```json
{
  "symptoms": "头痛"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "suggestions": ["头痛", "感冒", "发烧", "咳嗽", "失眠", "胃痛", "腹泻", "皮疹"]
  }
}
```

## 📊 健康记录接口

### 获取健康记录列表

**接口地址**: `GET /api/health-records`

**请求头**:
```http
Authorization: Bearer <token>
```

**查询参数**:
```
?page=1&limit=10&status=active&severity=medium
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "1",
        "date": "2024-01-15",
        "type": "头痛",
        "description": "持续性头痛，伴有轻微恶心",
        "severity": "medium",
        "status": "resolved",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 创建健康记录

**接口地址**: `POST /api/health-records`

**请求头**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```json
{
  "date": "2024-01-15",
  "type": "头痛",
  "description": "持续性头痛，伴有轻微恶心",
  "severity": "medium",
  "status": "active"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "2",
    "date": "2024-01-15",
    "type": "头痛",
    "description": "持续性头痛，伴有轻微恶心",
    "severity": "medium",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "健康记录创建成功"
}
```

### 获取单个健康记录

**接口地址**: `GET /api/health-records/:id`

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "date": "2024-01-15",
    "type": "头痛",
    "description": "持续性头痛，伴有轻微恶心",
    "severity": "medium",
    "status": "resolved",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 更新健康记录

**接口地址**: `PUT /api/health-records/:id`

**请求头**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**请求参数**:
```json
{
  "date": "2024-01-15",
  "type": "头痛",
  "description": "持续性头痛，伴有轻微恶心",
  "severity": "high",
  "status": "resolved"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "date": "2024-01-15",
    "type": "头痛",
    "description": "持续性头痛，伴有轻微恶心",
    "severity": "high",
    "status": "resolved",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "message": "健康记录更新成功"
}
```

### 删除健康记录

**接口地址**: `DELETE /api/health-records/:id`

**请求头**:
```http
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "message": "健康记录删除成功"
}
```

## ⚠️ 错误处理

### 常见错误码

| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | `VALIDATION_ERROR` | 请求参数验证失败 |
| 401 | `UNAUTHORIZED` | 未提供认证token |
| 401 | `INVALID_TOKEN` | 无效的认证token |
| 401 | `AUTH_FAILED` | 认证失败 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

### 错误响应示例

**参数验证错误**:
```json
{
  "success": false,
  "error": "邮箱格式不正确",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "请输入有效的邮箱地址"
  }
}
```

**认证失败**:
```json
{
  "success": false,
  "error": "邮箱或密码错误",
  "code": "AUTH_FAILED"
}
```

**资源不存在**:
```json
{
  "success": false,
  "error": "健康记录不存在",
  "code": "NOT_FOUND"
}
```

## 📊 状态码

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 业务状态码

| 状态码 | 说明 |
|--------|------|
| `SUCCESS` | 操作成功 |
| `VALIDATION_ERROR` | 参数验证失败 |
| `AUTH_FAILED` | 认证失败 |
| `NOT_FOUND` | 资源不存在 |
| `INTERNAL_ERROR` | 服务器内部错误 |

## 🔧 开发工具

### cURL示例

**用户登录**:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"123456"}'
```

**发送聊天消息**:
```bash
curl -X POST http://localhost:8000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message":"我头痛"}'
```

**获取健康记录**:
```bash
curl -X GET http://localhost:8000/api/health-records \
  -H "Authorization: Bearer <token>"
```

### Postman集合

可以导入以下Postman集合进行API测试：

```json
{
  "info": {
    "name": "AI医生助理API",
    "description": "AI个人医生助理API测试集合"
  },
  "item": [
    {
      "name": "认证",
      "item": [
        {
          "name": "用户登录",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/login",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"demo@example.com\",\n  \"password\": \"123456\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✅ 初始版本发布
- ✅ 用户认证系统
- ✅ AI聊天功能
- ✅ 健康记录管理
- ✅ 完整的API文档

---

**AI个人医生助理API** - 为健康管理提供智能解决方案！ 🏥✨ 