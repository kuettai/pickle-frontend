# Scores API Documentation

## Endpoint Configuration
- **URL**: `https://api.tournament-system.com/scores`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authorization**: Bearer token (from auth API)

## Request Schema
```json
{
  "matchId": "string (required)",
  "gameMode": "string (required) - 'singles' or 'doubles'",
  "finalScore": "object (required)",
  "winner": "string (required) - 'left' or 'right'",
  "players": "object (required)",
  "timestamp": "string (required) - ISO 8601 format",
  "refereeId": "string (required)"
}
```

## Response Schema
```json
{
  "success": "boolean",
  "submissionId": "string",
  "message": "string"
}
```

## Sample Requests & Responses

### 1. Singles Match Completion
**Request:**
```json
POST /scores
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "matchId": "MATCH-001",
  "gameMode": "singles",
  "finalScore": {
    "left": 11,
    "right": 7
  },
  "winner": "left",
  "players": {
    "left": {
      "name": "John Smith",
      "ranking": 4.2
    },
    "right": {
      "name": "Sarah Johnson", 
      "ranking": 4.1
    }
  },
  "timestamp": "2024-12-15T14:30:45.123Z",
  "refereeId": "REF001"
}
```

**Response (Success):**
```json
{
  "success": true,
  "submissionId": "SUB-20241215-001",
  "message": "Score submitted successfully for MATCH-001"
}
```

### 2. Doubles Match Completion
**Request:**
```json
POST /scores
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "matchId": "MATCH-002",
  "gameMode": "doubles",
  "finalScore": {
    "left": 11,
    "right": 9
  },
  "winner": "left",
  "players": {
    "left": [
      {
        "name": "Mike Wilson",
        "ranking": 4.5,
        "position": "top"
      },
      {
        "name": "Lisa Chen",
        "ranking": 4.3,
        "position": "bottom"
      }
    ],
    "right": [
      {
        "name": "David Brown",
        "ranking": 4.4,
        "position": "bottom"
      },
      {
        "name": "Emma Davis",
        "ranking": 4.2,
        "position": "top"
      }
    ]
  },
  "timestamp": "2024-12-15T15:45:30.456Z",
  "refereeId": "REF002"
}
```

**Response (Success):**
```json
{
  "success": true,
  "submissionId": "SUB-20241215-002",
  "message": "Score submitted successfully for MATCH-002"
}
```

### 3. Extended Game (Win by 2)
**Request:**
```json
POST /scores
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "matchId": "MATCH-003",
  "gameMode": "singles",
  "finalScore": {
    "left": 15,
    "right": 13
  },
  "winner": "left",
  "players": {
    "left": {
      "name": "Alice Cooper",
      "ranking": 4.8
    },
    "right": {
      "name": "Bob Martinez",
      "ranking": 4.6
    }
  },
  "timestamp": "2024-12-15T16:20:15.789Z",
  "refereeId": "REF003"
}
```

**Response (Success):**
```json
{
  "success": true,
  "submissionId": "SUB-20241215-003",
  "message": "Score submitted successfully for MATCH-003"
}
```

### 4. Mixed Doubles Match
**Request:**
```json
POST /scores
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "matchId": "MIXED-001",
  "gameMode": "doubles",
  "finalScore": {
    "left": 11,
    "right": 8
  },
  "winner": "left",
  "players": {
    "left": [
      {
        "name": "John Smith",
        "ranking": 4.5,
        "gender": "M",
        "position": "top"
      },
      {
        "name": "Sarah Johnson",
        "ranking": 4.2,
        "gender": "F",
        "position": "bottom"
      }
    ],
    "right": [
      {
        "name": "Mike Wilson",
        "ranking": 4.3,
        "gender": "M",
        "position": "bottom"
      },
      {
        "name": "Lisa Chen",
        "ranking": 4.1,
        "gender": "F",
        "position": "top"
      }
    ]
  },
  "timestamp": "2024-12-15T17:15:30.456Z",
  "refereeId": "REF004"
}
```

**Response (Success):**
```json
{
  "success": true,
  "submissionId": "SUB-20241215-004",
  "message": "Mixed doubles score submitted successfully for MIXED-001"
}
```

## Error Responses

### 1. Invalid Match ID
**Request:**
```json
{
  "matchId": "INVALID-MATCH",
  "gameMode": "singles",
  "finalScore": { "left": 11, "right": 7 },
  "winner": "left",
  "players": { "left": { "name": "John" }, "right": { "name": "Jane" } },
  "timestamp": "2024-12-15T14:30:45.123Z",
  "refereeId": "REF001"
}
```

**Response (Error):**
```json
{
  "success": false,
  "submissionId": null,
  "message": "Match ID 'INVALID-MATCH' not found in tournament system"
}
```

### 2. Invalid Score (No Win by 2)
**Request:**
```json
{
  "matchId": "MATCH-001",
  "gameMode": "singles",
  "finalScore": { "left": 11, "right": 10 },
  "winner": "left",
  "players": { "left": { "name": "John" }, "right": { "name": "Jane" } },
  "timestamp": "2024-12-15T14:30:45.123Z",
  "refereeId": "REF001"
}
```

**Response (Error):**
```json
{
  "success": false,
  "submissionId": null,
  "message": "Invalid final score: Must win by at least 2 points (11-10 not valid)"
}
```

### 3. Missing Required Fields
**Request:**
```json
{
  "matchId": "MATCH-001",
  "gameMode": "singles",
  "finalScore": { "left": 11, "right": 7 }
}
```

**Response (Error):**
```json
{
  "success": false,
  "submissionId": null,
  "message": "Missing required fields: winner, players, timestamp, refereeId"
}
```

### 4. Unauthorized Referee
**Request:**
```json
{
  "matchId": "MATCH-001",
  "gameMode": "singles",
  "finalScore": { "left": 11, "right": 7 },
  "winner": "left",
  "players": { "left": { "name": "John" }, "right": { "name": "Jane" } },
  "timestamp": "2024-12-15T14:30:45.123Z",
  "refereeId": "INVALID-REF"
}
```

**Response (Error):**
```json
{
  "success": false,
  "submissionId": null,
  "message": "Referee ID 'INVALID-REF' not authorized for this tournament"
}
```

### 5. Duplicate Submission
**Request:**
```json
{
  "matchId": "MATCH-001",
  "gameMode": "singles",
  "finalScore": { "left": 11, "right": 7 },
  "winner": "left",
  "players": { "left": { "name": "John" }, "right": { "name": "Jane" } },
  "timestamp": "2024-12-15T14:30:45.123Z",
  "refereeId": "REF001"
}
```

**Response (Error):**
```json
{
  "success": false,
  "submissionId": "SUB-20241215-001",
  "message": "Score already submitted for MATCH-001 (Submission ID: SUB-20241215-001)"
}
```

### 6. Server Error
**Response (Server Error):**
```json
{
  "success": false,
  "submissionId": null,
  "message": "Internal server error. Please try again later or contact tournament support."
}
```

## Implementation Notes

### Score Validation Rules
- Final score must be 11+ points for winner
- Winner must win by at least 2 points
- Maximum score is 30 (per game settings)
- Both scores must be non-negative integers

### Player Data Requirements
- **Singles**: Single player object per team
- **Doubles**: Array of 2 players per team with position field
- Player names must match tournament registration
- Rankings are optional but recommended for seeding

### Timestamp Format
- Must be ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Should represent match completion time
- Timezone should be UTC (Z suffix)

### Referee Authorization
- Referee ID must match authenticated user
- Some matches may require specific referee authorization levels
- Head referees can submit scores for any match

### Retry Logic
- Implement exponential backoff for failed submissions
- Maximum 3 retry attempts (per config.js)
- Queue submissions for offline mode
- Provide clear feedback on submission status

### Security Considerations
- Always include Authorization header with valid JWT token
- Validate all input data before submission
- Never expose sensitive tournament data in error messages
- Log all submission attempts for audit trail