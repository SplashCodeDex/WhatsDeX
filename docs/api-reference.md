# 🔌 WhatsDeX API Reference

<div align="center">

![API Reference](https://img.shields.io/badge/WhatsDeX-API%20Reference-blue?style=for-the-badge&logo=api&logoColor=white)
![Version](https://img.shields.io/badge/API%20Version-v1.0.0-green?style=flat-square)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0.0-orange?style=flat-square)

**Complete API documentation for WhatsDeX platform**

[📚 Back to Docs](../docs/README.md) • [🚀 Quick Start](../docs/getting-started.md) • [🔧 SDK Examples](sdk-examples.md)

---

</div>

## 📋 API Overview

WhatsDeX provides a comprehensive REST API and WebSocket interface for programmatic access to bot functionality, analytics, and management features.

### Base URL

```
https://api.whatsdex.com/v1
# For local development: http://localhost:3000/api/v1
```

### Authentication

All API requests require authentication via Bearer token:

```http
Authorization: Bearer YOUR_API_TOKEN
```

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Optional message",
  "timestamp": "2024-10-24T12:00:00Z",
  "requestId": "req_123456789"
}
```

---

## 🔐 Authentication

### Login

Authenticate and receive access token.

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@whatsdex.com",
  "password": "your_password",
  "rememberMe": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "admin@whatsdex.com",
      "role": "admin",
      "permissions": ["read", "write", "admin"]
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

### Refresh Token

Refresh your access token before it expires.

```http
POST /api/v1/auth/refresh
Authorization: Bearer YOUR_REFRESH_TOKEN
```

### Logout

Invalidate your session.

```http
POST /api/v1/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 👥 User Management

### List Users

Get paginated list of bot users.

```http
GET /api/v1/users?page=1&limit=50&search=john&status=active
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)
- `search` (string): Search by name, phone, or email
- `status` (string): Filter by status (active, inactive, banned)
- `sortBy` (string): Sort field (createdAt, lastActive, messageCount)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "phone": "+1234567890",
        "name": "John Doe",
        "status": "active",
        "role": "user",
        "lastActive": "2024-10-24T10:30:00Z",
        "messageCount": 150,
        "commandsUsed": 45,
        "createdAt": "2024-09-01T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get User Details

Get detailed information about a specific user.

```http
GET /api/v1/users/{userId}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "phone": "+1234567890",
      "name": "John Doe",
      "status": "active",
      "role": "premium",
      "profile": {
        "avatar": "https://example.com/avatar.jpg",
        "bio": "WhatsApp user",
        "location": "New York, USA"
      },
      "stats": {
        "totalMessages": 150,
        "commandsUsed": 45,
        "aiInteractions": 23,
        "lastActive": "2024-10-24T10:30:00Z",
        "joinDate": "2024-09-01T08:00:00Z"
      },
      "permissions": {
        "canUseAI": true,
        "canDownloadMedia": true,
        "dailyLimit": 1000
      }
    }
  }
}
```

### Update User

Update user information and permissions.

```http
PUT /api/v1/users/{userId}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active",
  "role": "premium",
  "permissions": {
    "canUseAI": true,
    "dailyLimit": 500
  }
}
```

### Ban/Unban User

Manage user access.

```http
POST /api/v1/users/{userId}/ban
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "reason": "Violation of terms",
  "duration": "7d", // or "permanent"
  "moderatorId": "mod_456"
}
```

---

## 🤖 Bot Commands

### Execute Command

Execute a bot command programmatically.

```http
POST /api/v1/commands/execute
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "command": "gemini",
  "args": ["tell me a joke"],
  "userId": "user_123",
  "context": {
    "platform": "api",
    "sessionId": "session_789"
  }
}
```

**Request Body:**

- `command` (string, required): Command name
- `args` (array): Command arguments
- `userId` (string, required): User executing the command
- `context` (object): Additional context data

**Response:**

```json
{
  "success": true,
  "data": {
    "commandId": "cmd_456",
    "result": {
      "type": "text",
      "content": "Why don't scientists trust atoms? Because they make up everything! 🧪"
    },
    "executionTime": 245,
    "tokensUsed": 150,
    "status": "completed"
  }
}
```

### Get Command History

Retrieve command execution history.

```http
GET /api/v1/commands/history?userId=user_123&page=1&limit=20
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "commands": [
      {
        "id": "cmd_456",
        "command": "gemini",
        "args": ["tell me a joke"],
        "userId": "user_123",
        "result": "Why don't scientists trust atoms...",
        "status": "completed",
        "executionTime": 245,
        "timestamp": "2024-10-24T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### List Available Commands

Get all available bot commands.

```http
GET /api/v1/commands/list?category=ai&enabled=true
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📊 Analytics

### Overview Dashboard

Get comprehensive analytics overview.

```http
GET /api/v1/analytics/overview?period=7d
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Query Parameters:**

- `period` (string): Time period (1h, 24h, 7d, 30d, 90d)

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 12543,
      "activeUsers": 8921,
      "totalCommands": 45632,
      "aiRequests": 12847,
      "systemUptime": 99.8,
      "responseTime": 245,
      "errorRate": 0.2,
      "cacheHitRate": 94.5
    },
    "charts": {
      "userGrowth": [
        { "date": "2024-10-18", "users": 12000 },
        { "date": "2024-10-19", "users": 12100 }
      ],
      "commandUsage": [
        { "command": "gemini", "count": 5200 },
        { "command": "weather", "count": 3100 }
      ]
    },
    "period": "7d"
  }
}
```

### Command Analytics

Detailed command usage statistics.

```http
GET /api/v1/analytics/commands?period=30d&groupBy=command
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### User Analytics

User engagement and behavior metrics.

```http
GET /api/v1/analytics/users?period=7d&segment=premium
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Performance Metrics

System performance and health metrics.

```http
GET /api/v1/analytics/performance?period=24h&metrics=cpu,memory,response_time
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## ⚙️ System Management

### System Health

Check system status and health.

```http
GET /api/v1/system/health
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "bot": "online",
      "database": "online",
      "redis": "online",
      "ai": "online"
    },
    "metrics": {
      "uptime": "99.8%",
      "cpu": "15%",
      "memory": "180MB",
      "responseTime": "245ms"
    },
    "lastChecked": "2024-10-24T12:00:00Z"
  }
}
```

### System Configuration

Get and update system settings.

```http
GET /api/v1/system/config
PUT /api/v1/system/config
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Logs

Retrieve system and application logs.

```http
GET /api/v1/system/logs?level=error&limit=100&from=2024-10-24T00:00:00Z
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Backup & Restore

Manage system backups.

```http
POST /api/v1/system/backup
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "type": "full", // or "incremental"
  "includeMedia": true,
  "notifyOnComplete": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "backupId": "backup_789",
    "status": "in_progress",
    "estimatedCompletion": "2024-10-24T12:30:00Z",
    "size": "2.5GB"
  }
}
```

---

## 🔌 WebSocket API

### Connection

Connect to real-time WebSocket events.

```javascript
import io from 'socket.io-client';

const socket = io('https://api.whatsdex.com', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN',
  },
});

// Connection established
socket.on('connect', () => {
  console.log('Connected to WhatsDeX WebSocket');
});

// Handle disconnections
socket.on('disconnect', reason => {
  console.log('Disconnected:', reason);
});
```

### Real-time Events

#### User Activity

```javascript
// Listen for user joins
socket.on('user_joined', data => {
  console.log('New user:', data);
  // {
  //   userId: "user_123",
  //   name: "John Doe",
  //   timestamp: "2024-10-24T12:00:00Z"
  // }
});

// Listen for user activity
socket.on('user_active', data => {
  console.log('User active:', data);
  // {
  //   userId: "user_123",
  //   lastActive: "2024-10-24T12:00:00Z"
  // }
});
```

#### Command Execution

```javascript
// Listen for command executions
socket.on('command_executed', data => {
  console.log('Command executed:', data);
  // {
  //   commandId: "cmd_456",
  //   command: "gemini",
  //   userId: "user_123",
  //   result: "AI response...",
  //   executionTime: 245,
  //   timestamp: "2024-10-24T12:00:00Z"
  // }
});
```

#### System Events

```javascript
// System alerts and notifications
socket.on('system_alert', data => {
  console.log('System alert:', data);
  // {
  //   type: "error",
  //   message: "High error rate detected",
  //   severity: "warning",
  //   timestamp: "2024-10-24T12:00:00Z"
  // }
});

// Performance metrics
socket.on('performance_update', data => {
  console.log('Performance update:', data);
  // {
  //   responseTime: 245,
  //   errorRate: 0.2,
  //   activeUsers: 8921,
  //   timestamp: "2024-10-24T12:00:00Z"
  // }
});
```

### Emitting Events

#### Send Message to User

```javascript
socket.emit('send_message', {
  userId: 'user_123',
  message: 'Hello from API!',
  type: 'text',
});
```

#### Broadcast to All Users

```javascript
socket.emit('broadcast', {
  message: 'System maintenance in 5 minutes',
  type: 'warning',
  target: 'all', // or 'premium', 'active', etc.
});
```

---

## 📝 Error Handling

### HTTP Status Codes

| Code | Meaning               | Description                     |
| ---- | --------------------- | ------------------------------- |
| 200  | OK                    | Request successful              |
| 201  | Created               | Resource created successfully   |
| 400  | Bad Request           | Invalid request parameters      |
| 401  | Unauthorized          | Authentication required         |
| 403  | Forbidden             | Insufficient permissions        |
| 404  | Not Found             | Resource not found              |
| 429  | Too Many Requests     | Rate limit exceeded             |
| 500  | Internal Server Error | Server error                    |
| 503  | Service Unavailable   | Service temporarily unavailable |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "reason": "Must be valid email address"
    }
  },
  "timestamp": "2024-10-24T12:00:00Z",
  "requestId": "req_123456789"
}
```

### Common Error Codes

| Error Code             | HTTP Status | Description                    |
| ---------------------- | ----------- | ------------------------------ |
| `VALIDATION_ERROR`     | 400         | Invalid request data           |
| `AUTHENTICATION_ERROR` | 401         | Invalid or missing credentials |
| `AUTHORIZATION_ERROR`  | 403         | Insufficient permissions       |
| `NOT_FOUND`            | 404         | Resource not found             |
| `RATE_LIMIT_EXCEEDED`  | 429         | Too many requests              |
| `QUOTA_EXCEEDED`       | 429         | API quota exceeded             |
| `SERVICE_UNAVAILABLE`  | 503         | Service temporarily down       |

---

## 🔒 Rate Limiting

### Rate Limits

- **Authenticated Requests**: 1000 requests per hour
- **Anonymous Requests**: 100 requests per hour
- **File Uploads**: 50 MB per hour
- **AI Requests**: 100 requests per hour per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635082800
X-RateLimit-Retry-After: 3600
```

### Handling Rate Limits

```javascript
// Check rate limit status
const response = await fetch('/api/v1/users', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (response.status === 429) {
  const retryAfter = response.headers.get('X-RateLimit-Retry-After');
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
}
```

---

## 📚 SDK & Libraries

### JavaScript SDK

```javascript
import { WhatsDeX } from '@whatsdex/sdk';

const client = new WhatsDeX({
  apiKey: 'YOUR_API_TOKEN',
  baseURL: 'https://api.whatsdex.com/v1',
});

// Authenticate
await client.auth.login('email@example.com', 'password');

// Get users
const users = await client.users.list({ page: 1, limit: 50 });

// Execute command
const result = await client.commands.execute('gemini', ['hello world']);
```

### Python SDK

```python
from whatsdex import WhatsDeX

client = WhatsDeX(api_key='YOUR_API_TOKEN')

# Authenticate
client.auth.login(email='email@example.com', password='password')

# Get analytics
analytics = client.analytics.overview(period='7d')

# Execute command
result = client.commands.execute('weather', args=['Tokyo'])
```

### cURL Examples

```bash
# Login
curl -X POST https://api.whatsdex.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get users
curl -X GET https://api.whatsdex.com/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Execute command
curl -X POST https://api.whatsdex.com/v1/commands/execute \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"command":"gemini","args":["hello"],"userId":"user_123"}'
```

---

## 🔧 SDK Examples

### Complete Integration Example

```javascript
import { WhatsDeX } from '@whatsdex/sdk';

class WhatsDeXIntegration {
  constructor() {
    this.client = new WhatsDeX({
      apiKey: process.env.WHATSDEX_API_KEY,
    });
  }

  async initialize() {
    try {
      await this.client.auth.login(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
      console.log('✅ Connected to WhatsDeX API');
    } catch (error) {
      console.error('❌ Failed to connect:', error);
    }
  }

  async getActiveUsers() {
    const users = await this.client.users.list({
      status: 'active',
      limit: 100,
    });
    return users.data.users;
  }

  async sendBroadcast(message) {
    const result = await this.client.commands.execute('broadcast', [message], {
      target: 'all',
      priority: 'high',
    });
    return result;
  }

  async monitorPerformance() {
    // Real-time performance monitoring
    this.client.on('performance_update', data => {
      console.log('Performance:', data);
    });
  }
}

// Usage
const integration = new WhatsDeXIntegration();
await integration.initialize();
const users = await integration.getActiveUsers();
```

---

## 📞 Support & Resources

### Getting Help

- **📖 Documentation**: [Full API Docs](../docs/README.md)
- **🐛 Issue Tracker**: [GitHub Issues](../../issues)
- **💬 Community**: [Discord Server](https://discord.gg/whatsdex)
- **📧 Enterprise Support**: enterprise@whatsdex.com

### API Status

- **Status Page**: [status.whatsdex.com](https://status.whatsdex.com)
- **Uptime**: 99.8% SLA
- **Response Time**: <300ms average

### Changelog

- **API Version**: v1.0.0 (Stable)
- **Last Updated**: October 2024
- **[View Changelog](../../CHANGELOG.md)**

---

<div align="center">

**🔌 Ready to build with WhatsDeX API?**

[🚀 Get Started](../docs/getting-started.md) • [📚 Full Documentation](../docs/README.md) • [💬 Get Support](https://discord.gg/whatsdex)

---

_API Version: v1.0.0 | Last Updated: October 2024_

</div>
