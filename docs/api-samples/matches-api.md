# Matches API - Sample Requests & Responses

## Endpoint Configuration
- **URL**: `https://api.tournament-system.com/matches/{matchId}`
- **Method**: `GET`
- **Authentication**: Bearer token required

## Request Format

### Headers
```http
GET /matches/MATCH-001 HTTP/1.1
Host: api.tournament-system.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### URL Parameters
- `matchId` (string, required): Unique match identifier

## Response Samples

### 1. Singles Match - Success Response
**Request**: `GET /matches/MATCH-001`

**Response**: `200 OK`
```json
{
  "matchId": "MATCH-001",
  "gameMode": "singles",
  "players": [
    {
      "playerId": "P001",
      "name": "John Smith",
      "team": "A",
      "ranking": 4.2
    },
    {
      "playerId": "P002", 
      "name": "Sarah Johnson",
      "team": "B",
      "ranking": 4.1
    }
  ],
  "tournament": "Summer Championship 2024",
  "round": "Quarterfinals",
  "court": "Court 3",
  "scheduledTime": "2024-12-15T14:30:00Z",
  "status": "scheduled",
  "maxScore": 15
}
```

### 2. Doubles Match - Success Response
**Request**: `GET /matches/MATCH-002`

**Response**: `200 OK`
```json
{
  "matchId": "MATCH-002",
  "gameMode": "doubles",
  "players": [
    {
      "playerId": "P101",
      "name": "Mike Wilson",
      "team": "A",
      "ranking": 4.5
    },
    {
      "playerId": "P102",
      "name": "Lisa Chen", 
      "team": "A",
      "ranking": 4.3
    },
    {
      "playerId": "P201",
      "name": "David Brown",
      "team": "B", 
      "ranking": 4.4
    },
    {
      "playerId": "P202",
      "name": "Emma Davis",
      "team": "B",
      "ranking": 4.2
    }
  ],
  "tournament": "Doubles Championship 2024",
  "round": "Semifinals",
  "court": "Court 1",
  "scheduledTime": "2024-12-15T16:00:00Z",
  "status": "in_progress",
  "maxScore": 21
}
```

### 3. Mixed Doubles Match - Success Response
**Request**: `GET /matches/MATCH-003`

**Response**: `200 OK`
```json
{
  "matchId": "MATCH-003",
  "gameMode": "mixed",
  "players": [
    {
      "playerId": "P301",
      "name": "Alex Rodriguez",
      "team": "A",
      "gender": "M",
      "ranking": 4.0
    },
    {
      "playerId": "P302",
      "name": "Maria Garcia",
      "team": "A", 
      "gender": "F",
      "ranking": 3.8
    },
    {
      "playerId": "P401",
      "name": "Tom Anderson",
      "team": "B",
      "gender": "M", 
      "ranking": 3.9
    },
    {
      "playerId": "P402",
      "name": "Rachel Kim",
      "team": "B",
      "gender": "F",
      "ranking": 4.1
    }
  ],
  "tournament": "Mixed Doubles Open 2024",
  "round": "Finals",
  "court": "Center Court",
  "scheduledTime": "2024-12-15T18:00:00Z",
  "status": "scheduled"
}
```

## Error Responses

### 4. Match Not Found - 404 Error
**Request**: `GET /matches/INVALID-MATCH`

**Response**: `404 Not Found`
```json
{
  "error": "MATCH_NOT_FOUND",
  "message": "Match with ID 'INVALID-MATCH' not found",
  "code": 404,
  "timestamp": "2024-12-15T12:00:00Z"
}
```

### 5. Unauthorized Access - 401 Error
**Request**: `GET /matches/MATCH-001` (without valid token)

**Response**: `401 Unauthorized`
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired authentication token",
  "code": 401,
  "timestamp": "2024-12-15T12:00:00Z"
}
```

### 6. Match Already Completed - 409 Error
**Request**: `GET /matches/MATCH-001` (match already finished)

**Response**: `409 Conflict`
```json
{
  "error": "MATCH_ALREADY_COMPLETED",
  "message": "Match MATCH-001 has already been completed and scored",
  "code": 409,
  "timestamp": "2024-12-15T12:00:00Z",
  "completedAt": "2024-12-15T10:30:00Z",
  "finalScore": "11-7"
}
```

### 8. Match Cancelled - 410 Error
**Request**: `GET /matches/MATCH-001` (match was cancelled)

**Response**: `410 Gone`
```json
{
  "error": "MATCH_CANCELLED",
  "message": "Match MATCH-001 has been cancelled due to player withdrawal",
  "code": 410,
  "timestamp": "2024-12-15T12:00:00Z",
  "cancelledAt": "2024-12-15T11:00:00Z",
  "reason": "Player injury"
}
```

### 9. Invalid Match Format - 400 Error
**Request**: `GET /matches/INVALID-FORMAT`

**Response**: `400 Bad Request`
```json
{
  "error": "INVALID_MATCH_ID_FORMAT",
  "message": "Match ID must follow format: MATCH-XXX where XXX is a 3-digit number",
  "code": 400,
  "timestamp": "2024-12-15T12:00:00Z",
  "providedId": "INVALID-FORMAT"
}
```

### 10. Rate Limit Exceeded - 429 Error
**Request**: `GET /matches/MATCH-001` (too many requests)

**Response**: `429 Too Many Requests`
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait before trying again.",
  "code": 429,
  "timestamp": "2024-12-15T12:00:00Z",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0
}
```

### 11. Service Unavailable - 503 Error
**Request**: `GET /matches/MATCH-001` (maintenance mode)

**Response**: `503 Service Unavailable`
```json
{
  "error": "SERVICE_UNAVAILABLE",
  "message": "Tournament system is temporarily unavailable for maintenance",
  "code": 503,
  "timestamp": "2024-12-15T12:00:00Z",
  "estimatedDowntime": "30 minutes",
  "retryAfter": 1800
}
```

### 12. Server Error - 500 Error
**Request**: `GET /matches/MATCH-001`

**Response**: `500 Internal Server Error`
```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred while retrieving match data",
  "code": 500,
  "timestamp": "2024-12-15T12:00:00Z",
  "requestId": "req_abc123def456"
}
```

## Field Descriptions

### Match Object
- `matchId`: Unique identifier for the match
- `gameMode`: Type of game ("singles", "doubles", "mixed")
- `players`: Array of player objects
- `tournament`: Tournament name
- `round`: Current round (e.g., "Quarterfinals", "Semifinals", "Finals")
- `court`: Court assignment
- `scheduledTime`: ISO 8601 timestamp
- `status`: Match status ("scheduled", "in_progress", "completed", "cancelled")
- `maxScore`: Maximum score for game completion (optional, defaults to tournament rules)

### Player Object
- `playerId`: Unique player identifier
- `name`: Player's full name
- `team`: Team assignment ("A" or "B")
- `ranking`: Player skill level (1.0-5.0)
- `gender`: Player gender ("M"/"F", required for mixed doubles)

## Usage Examples

### JavaScript Fetch
```javascript
const response = await fetch(`${config.apis.matches.endpoint}/MATCH-001`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  }
});

const matchData = await response.json();
```

### cURL
```bash
curl -X GET "https://api.tournament-system.com/matches/MATCH-001" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```