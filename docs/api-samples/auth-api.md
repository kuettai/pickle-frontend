# Authentication API Documentation

## Two-Step Authentication Flow

### Step 1: Request Verification Code
- **URL**: `https://api.tournament-system.com/auth/request-code`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Schema:**
```json
{
  "refId": "string (required) - Referee ID (e.g., REF2024, ADMIN123)"
}
```

**Response Schema:**
```json
{
  "success": "boolean",
  "message": "string",
  "method": "string - 'email' or 'sms'",
  "maskedContact": "string - Partially hidden email/phone"
}
```

### Step 2: Verify Code and Get JWT
- **URL**: `https://api.tournament-system.com/auth/verify`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Schema:**
```json
{
  "refId": "string (required) - Same referee ID from step 1",
  "verificationCode": "string (required) - 6-digit code from email/SMS"
}
```

**Response Schema:**
```json
{
  "token": "string - JWT bearer token for API requests",
  "refereeId": "string - Unique referee identifier",
  "expiresIn": "number - Token expiration time in seconds",
  "refreshToken": "string - Token for refreshing JWT"
}
```

## Sample Requests & Responses

### Step 1 Examples

#### 1.1 Referee Code Request
**Request:**
```json
POST /auth/request-code
Content-Type: application/json

{
  "refId": "REF2024"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "method": "email",
  "maskedContact": "j***@tournament.com"
}
```

#### 1.2 Demo Mode (Auto-Code)
**Request:**
```json
POST /auth/request-code
Content-Type: application/json

{
  "refId": "DEMO"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Demo mode: Use code 111111",
  "method": "demo",
  "maskedContact": "demo@example.com"
}
```

### Step 2 Examples

#### 2.1 Referee Token Request
**Request:**
```json
POST /auth/verify
Content-Type: application/json

{
  "refId": "REF2024",
  "verificationCode": "123456"
}
```

**Response (Success):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJSRUYwMDEiLCJuYW1lIjoiSm9obiBEb2UiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjI0MjYyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  "refereeId": "REF001",
  "expiresIn": 3600,
  "refreshToken": "rt_abc123def456"
}
```

#### 2.2 Demo Mode Verification
**Request:**
```json
POST /auth/verify
Content-Type: application/json

{
  "refId": "DEMO",
  "verificationCode": "111111"
}
```

**Response (Success):**
```json
{
  "token": "demo-jwt-token-12345",
  "refereeId": "DEMO-REF",
  "expiresIn": 1800,
  "refreshToken": "demo-refresh-token"
}
```

## Error Responses

### Step 1 Errors

#### Invalid Referee ID
**Request:**
```json
{
  "refId": "INVALID123"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "INVALID_REF_ID",
  "message": "Referee ID 'INVALID123' not found in tournament system",
  "code": 404
}
```

#### Rate Limited
**Response (Error):**
```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Too many code requests. Please wait 60 seconds before trying again",
  "code": 429
}
```

### Step 2 Errors

#### Invalid Verification Code
**Request:**
```json
{
  "refId": "REF2024",
  "verificationCode": "999999"
}
```

**Response (Error):**
```json
{
  "error": "INVALID_CODE",
  "message": "Verification code is incorrect or expired",
  "code": 401,
  "attemptsRemaining": 2
}
```

#### Too Many Failed Attempts
**Response (Error):**
```json
{
  "error": "TOO_MANY_ATTEMPTS",
  "message": "Too many failed verification attempts. Please request a new code",
  "code": 429
}
```

## Implementation Notes

### Two-Step Flow
1. User enters Referee ID → System sends 6-digit code
2. User enters 6-digit code → System returns JWT token
3. Use JWT token for all subsequent API calls

### Verification Code Rules
- 6-digit numeric code (000000-999999)
- Valid for 10 minutes after generation
- Maximum 3 verification attempts per code
- Rate limited: 1 code request per 60 seconds per referee ID
- Demo mode always uses code: 111111

### Token Usage
- Include JWT in Authorization header: `Authorization: Bearer <token>`
- Token expires after specified time (expiresIn seconds)
- Use refreshToken to get new JWT without re-authentication
- Store tokens securely (sessionStorage, not localStorage)

### Security Considerations
- Verification codes are single-use and time-limited
- Failed attempts are tracked and rate-limited
- Never log or expose tokens/codes in console/network logs
- Implement automatic token refresh before expiration
- Clear all auth data on logout

### Demo Mode
- Always accepts verification code: 111111
- Demo tokens have reduced functionality
- Shorter expiration times (30 minutes vs 1 hour)
- Some API endpoints return mock data

### UI Flow Recommendations
1. **Step 1 Screen**: Referee ID input → "Send Code" button
2. **Step 2 Screen**: 6-digit code input → "Verify" button
3. Show masked contact info and resend option
4. Clear error messages and attempt counters
5. Automatic navigation after successful verification