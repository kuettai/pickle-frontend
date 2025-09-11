# Pickleball Tournament Management API

A comprehensive REST API for managing pickleball tournaments, including player management, match scheduling, court management, and notification services.

## Base URL
```
https://frenchbread.dev/api
```

## Authentication

This API uses AWS Cognito for authentication. All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Setup
Before using authentication, you need to configure AWS Cognito. See [COGNITO_SETUP.md](./COGNITO_SETUP.md) for detailed setup instructions.

### Quick Start
1. Set up AWS Cognito User Pool
2. Update environment variables in `.env`
3. Create test users in Cognito
4. Use `/api/auth/login` to authenticate

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## API Endpoints

### Authentication

#### POST /api/auth/login
Login with username and password.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "SUPER_ADMIN | TOURNAMENT_ADMIN | PLAYER",
      "isActive": true,
      "token": "string",
      "refreshToken": "string",
      "expiresAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /api/auth/refresh
Refresh authentication token.

**Request:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/logout
Logout and invalidate tokens.

**Request:** Empty body

**Response:**
```json
{
  "success": true
}
```

---

### Players

#### GET /api/players
Get all players with optional filtering and pagination.

**Query Parameters:**
- `searchQuery` (optional): Search by name or email
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "whatsappNumber": "string",
        "preferredNotificationMethod": "EMAIL | SMS | WHATSAPP",
        "matchTypePreferences": ["SINGLES", "DOUBLES"],
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/players/:id
Get a specific player by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "whatsappNumber": "string",
    "preferredNotificationMethod": "EMAIL | SMS | WHATSAPP",
    "matchTypePreferences": ["SINGLES", "DOUBLES"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/players
Create a new player.

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "whatsappNumber": "string",
  "preferredNotificationMethod": "EMAIL | SMS | WHATSAPP",
  "matchTypePreferences": ["SINGLES", "DOUBLES"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "whatsappNumber": "string",
    "preferredNotificationMethod": "EMAIL | SMS | WHATSAPP",
    "matchTypePreferences": ["SINGLES", "DOUBLES"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Tournaments

#### GET /api/tournaments
Get all tournaments.

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "status": "DRAFT | ACTIVE | COMPLETED | CANCELLED",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-01-01T00:00:00.000Z",
        "settings": {
          "maxPlayersPerMatch": 4,
          "matchDuration": 60,
          "courtCount": 4
        },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

---

### Courts

#### GET /api/courts
Get all courts with optional filtering.

**Query Parameters:**
- `tournamentId` (optional): Filter by tournament
- `isActive` (optional): Filter by active status
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "name": "string",
        "location": "string",
        "isActive": true,
        "displayOrder": 1,
        "tournamentId": "string",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 100,
    "totalPages": 1
  }
}
```

#### GET /api/courts/:id
Get a specific court by ID.

#### POST /api/courts
Create a new court.

**Request:**
```json
{
  "name": "string",
  "location": "string",
  "isActive": true,
  "displayOrder": 1,
  "tournamentId": "string"
}
```

#### PUT /api/courts/:id
Update an existing court.

**Request:**
```json
{
  "name": "string",
  "location": "string",
  "isActive": true,
  "displayOrder": 1
}
```

#### DELETE /api/courts/:id
Delete a court.

#### POST /api/courts/reorder
Reorder courts by display order.

**Request:**
```json
{
  "courtIds": ["string", "string", "string"]
}
```

---

### Matches

#### GET /api/matches
Get all matches with optional filtering.

**Query Parameters:**
- `tournamentId` (optional): Filter by tournament
- `status` (optional): Filter by match status
- `dateFrom` (optional): Filter matches from date
- `dateTo` (optional): Filter matches to date
- `courtId` (optional): Filter by court
- `playerId` (optional): Filter by player participation

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "string",
        "tournamentId": "string",
        "courtId": "string",
        "matchType": "SINGLES | DOUBLES",
        "status": "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED",
        "scheduledTime": "2024-01-01T00:00:00.000Z",
        "startTime": "2024-01-01T00:00:00.000Z",
        "endTime": "2024-01-01T00:00:00.000Z",
        "teamA": {
          "player1Id": "string",
          "player2Id": "string",
          "score": 21
        },
        "teamB": {
          "player1Id": "string",
          "player2Id": "string",
          "score": 18
        },
        "score": {
          "teamAScore": 21,
          "teamBScore": 18,
          "isComplete": true,
          "winnerTeam": "A | B"
        },
        "court": {
          "id": "string",
          "name": "string"
        },
        "tournament": {
          "id": "string",
          "name": "string"
        },
        "teamAPlayers": [
          {
            "id": "string",
            "firstName": "string",
            "lastName": "string"
          }
        ],
        "teamBPlayers": [
          {
            "id": "string",
            "firstName": "string",
            "lastName": "string"
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 50,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /api/matches/:id
Get a specific match by ID.

#### POST /api/matches
Create a new match.

**Request:**
```json
{
  "tournamentId": "string",
  "courtId": "string",
  "matchType": "SINGLES | DOUBLES",
  "scheduledTime": "2024-01-01T00:00:00.000Z",
  "teamA": {
    "player1Id": "string",
    "player2Id": "string"
  },
  "teamB": {
    "player1Id": "string",
    "player2Id": "string"
  }
}
```

#### PUT /api/matches/:id
Update an existing match.

**Request:**
```json
{
  "tournamentId": "string",
  "courtId": "string",
  "matchType": "SINGLES | DOUBLES",
  "scheduledTime": "2024-01-01T00:00:00.000Z",
  "teamA": {
    "player1Id": "string",
    "player2Id": "string"
  },
  "teamB": {
    "player1Id": "string",
    "player2Id": "string"
  }
}
```

#### DELETE /api/matches/:id
Delete a match (only scheduled matches can be deleted).

#### PUT /api/matches/:id/score
Update match score.

**Request:**
```json
{
  "teamAScore": 21,
  "teamBScore": 18,
  "isComplete": true,
  "winnerTeam": "A | B"
}
```

#### PUT /api/matches/:id/status
Update match status.

**Request:**
```json
{
  "status": "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED"
}
```

---

### Notification Center

#### GET /api/notification-center/templates
Get all notification templates.

**Query Parameters:**
- `type` (optional): Filter by template type
- `platform` (optional): Filter by platform
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "type": "PRE_MATCH | ON_DECK | SCHEDULE_UPDATE | CUSTOM",
      "platform": "EMAIL | SMS | WHATSAPP",
      "subject": "string",
      "content": "string",
      "variables": ["playerName", "tournamentName"],
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/notification-center/templates/:id
Get a specific template.

#### POST /api/notification-center/templates
Create a new notification template.

**Request:**
```json
{
  "name": "string",
  "type": "PRE_MATCH | ON_DECK | SCHEDULE_UPDATE | CUSTOM",
  "platform": "EMAIL | SMS | WHATSAPP",
  "subject": "string",
  "content": "string",
  "variables": ["playerName", "tournamentName"],
  "isActive": true
}
```

#### PUT /api/notification-center/templates/:id
Update an existing template.

#### DELETE /api/notification-center/templates/:id
Delete a template.

#### GET /api/notification-center/template-variables
Get all available template variables.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "playerName",
      "description": "Player's full name",
      "example": "John Doe",
      "required": false
    }
  ]
}
```

#### POST /api/notification-center/templates/validate
Validate template content.

**Request:**
```json
{
  "content": "string",
  "variables": ["playerName"]
}
```

#### POST /api/notification-center/preview
Preview a message with actual data.

**Request:**
```json
{
  "templateId": "string",
  "playerId": "string",
  "matchId": "string",
  "customVariables": {
    "customVar": "value"
  }
}
```

#### POST /api/notification-center/send
Send notifications to selected recipients.

**Request:**
```json
{
  "templateId": "string",
  "recipientIds": ["string"],
  "customVariables": {
    "customVar": "value"
  }
}
```

#### POST /api/notification-center/send-bulk
Send bulk notifications.

**Request:**
```json
{
  "templateId": "string",
  "recipientIds": ["string"],
  "batchName": "string",
  "customVariables": {
    "customVar": "value"
  }
}
```

#### GET /api/notification-center/history
Get notification history.

**Query Parameters:**
- `status` (optional): Filter by status
- `platform` (optional): Filter by platform
- `templateId` (optional): Filter by template
- `recipientId` (optional): Filter by recipient
- `dateFrom` (optional): Filter from date
- `dateTo` (optional): Filter to date
- `limit` (optional): Number of results
- `offset` (optional): Pagination offset

#### POST /api/notification-center/retry/:id
Retry a failed notification.

**Request:**
```json
{
  "content": "string (optional)"
}
```

#### POST /api/notification-center/update-status/:id
Update notification status.

**Request:**
```json
{
  "status": "SENT | DELIVERED | FAILED | BOUNCED",
  "errorMessage": "string (optional)"
}
```

#### GET /api/notification-center/bulk/:batchId
Get bulk notification batch status.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "status": "PENDING | PROCESSING | COMPLETED | CANCELLED",
    "totalRecipients": 100,
    "processedCount": 85,
    "successCount": 80,
    "failedCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "completedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/notification-center/bulk/:batchId/cancel
Cancel a bulk notification batch.

#### GET /api/notification-center/batches
Get all bulk notification batches.

**Query Parameters:**
- `status` (optional): Filter by batch status
- `limit` (optional): Number of results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

#### GET /api/notification-center/delivery-metrics
Get delivery performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalNotifications": 1000,
    "deliveredCount": 850,
    "failedCount": 100,
    "pendingCount": 50,
    "bouncedCount": 25,
    "deliveryRate": 85.0,
    "averageDeliveryTime": 2.5,
    "platformBreakdown": {
      "EMAIL": {
        "total": 600,
        "delivered": 520,
        "failed": 60,
        "deliveryRate": 86.7
      },
      "SMS": {
        "total": 300,
        "delivered": 270,
        "failed": 25,
        "deliveryRate": 90.0
      },
      "WHATSAPP": {
        "total": 100,
        "delivered": 60,
        "failed": 15,
        "deliveryRate": 60.0
      }
    }
  }
}
```

#### GET /api/notification-center/queue-stats
Get notification queue statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingCount": 25,
    "processingRate": 120,
    "averageDeliveryTime": 2.3,
    "failureRate": 8.5
  }
}
```

#### GET /api/notification-center/stats
Get notification statistics.

**Query Parameters:**
- `dateFrom` (optional): Statistics from date
- `dateTo` (optional): Statistics to date

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSent": 1500,
    "totalFailed": 150,
    "totalPending": 25,
    "byPlatform": {
      "EMAIL": 800,
      "SMS": 500,
      "WHATSAPP": 350
    },
    "recentActivity": [
      {
        "id": "string",
        "templateName": "string",
        "recipientEmail": "string",
        "status": "SENT | FAILED | PENDING",
        "platform": "EMAIL | SMS | WHATSAPP",
        "sentAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### Webhooks

#### POST /api/webhooks/ses
AWS SES delivery status webhooks.

**Request:** AWS SES notification format

#### POST /api/webhooks/sns
AWS SNS SMS delivery status webhooks.

**Request:** AWS SNS notification format

#### POST /api/webhooks/whatsapp
WhatsApp delivery status webhooks.

**Request:** WhatsApp webhook format

#### POST /api/webhooks/test-delivery
Test endpoint for delivery status updates.

**Request:**
```json
{
  "notificationId": "string",
  "status": "SENT | DELIVERED | FAILED | BOUNCED",
  "errorMessage": "string (optional)"
}
```

---

### Monitoring

#### GET /health
Basic health check with comprehensive system information.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "socket": {
    "totalConnections": 0,
    "currentConnections": 0,
    "authenticatedConnections": 0
  },
  "api": {
    "requests24h": 1500,
    "averageResponseTime": 125.5,
    "errorRate": 2.1,
    "blockedIPs": 5
  }
}
```

#### GET /health/socket
Socket connection health check.

**Response:**
```json
{
  "totalConnections": 0,
  "currentConnections": 0,
  "authenticatedConnections": 0
}
```

#### GET /health/api
API-specific health metrics.

**Response:**
```json
{
  "requestsLast24h": 1500,
  "averageResponseTime": 125.5,
  "errorRate": 2.1,
  "blockedIPs": 5
}
```

#### GET /api
API information and version.

**Response:**
```json
{
  "message": "Tournament Management API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/monitoring/health
Detailed health check with system metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy | degraded | unhealthy",
    "checks": {
      "systemResources": {
        "status": "pass | fail",
        "message": "CPU: 45.2%, Memory: 62.1%",
        "duration": 15
      },
      "database": {
        "status": "pass | fail",
        "duration": 25
      }
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/monitoring/metrics
System performance metrics.

#### GET /api/monitoring/database
Database performance statistics.

#### GET /api/monitoring/alerts
System alerts and warnings.

#### GET /api/monitoring/stats
Comprehensive system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "systemMetrics": {
      "cpu": 45.2,
      "memory": 62.1,
      "disk": 78.5,
      "uptime": 3600
    },
    "databaseStats": {
      "totalQueries": 1500,
      "averageQueryDuration": 25.5,
      "slowQueryPercentage": 2.1
    },
    "activeAlerts": [
      {
        "id": "string",
        "type": "cpu_high",
        "severity": "medium",
        "message": "CPU usage elevated"
      }
    ],
    "slowQueries": {
      "totalSlowQueries": 15,
      "averageSlowQueryDuration": 1250.5
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/monitoring/alerts/:id/resolve
Resolve a system alert.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Alert resolved successfully",
    "alertId": "string",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `CONFLICT` | Resource conflict |
| `INTERNAL_ERROR` | Internal server error |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- Authenticated endpoints: 1000 requests per hour
- Public endpoints: 100 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

The API supports real-time updates via WebSocket connections:

### Connection
```javascript
const socket = io('http://localhost:3001');
```

### Events
- `matches` - Initial match data
- `scoreUpdate` - Real-time score updates
- `matchStatusUpdate` - Match status changes
- `notificationUpdate` - Notification status updates

### Example Score Update Event
```json
{
  "matchId": "string",
  "score": {
    "teamAScore": 21,
    "teamBScore": 18,
    "isComplete": true,
    "winnerTeam": "A"
  },
  "status": "COMPLETED"
}
```