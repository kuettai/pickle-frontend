# Pickleball Tournament Scoring System - Technical Specifications

## System Architecture

### Frontend Application
- **Technology**: Progressive Web App (PWA)
- **Framework**: Vanilla HTML5/CSS3/JavaScript
- **Build Tool**: Webpack or Vite for bundling
- **Offline Support**: Service Worker for caching
- **Storage**: LocalStorage for offline game state

### API Integration
- **Protocol**: REST over HTTPS
- **Authentication**: Bearer token from auth code
- **Data Format**: JSON
- **Timeout**: 10 seconds for API calls
- **Retry Logic**: 3 attempts with exponential backoff

## Data Models

### Game State
```javascript
{
  matchId: "uuid",
  gameMode: "singles|doubles|mixed",
  scoringSystem: "sideout",
  teams: {
    left: { score: 0, players: [...] },
    right: { score: 0, players: [...] }
  },
  serving: {
    team: "left|right",
    player: 1|2,
    side: "left|right"
  },
  gameStatus: "setup|active|completed",
  history: [...]
}
```

### Player Object
```javascript
{
  id: "string",
  name: "string",
  team: "A|B",
  position: "top|bottom" // doubles only
}
```

## API Specifications

### Authentication
```
POST /api/auth
Content-Type: application/json

Request:
{
  "authCode": "string"
}

Response:
{
  "token": "jwt_token",
  "expiresIn": 3600,
  "refereeId": "string"
}
```

### Match Data
```
GET /api/matches/{uuid}
Authorization: Bearer {token}

Response:
{
  "matchId": "uuid",
  "gameMode": "singles|doubles|mixed",
  "scoringSystem": "sideout",
  "players": [
    {
      "id": "player1",
      "name": "John Doe",
      "team": "A"
    },
    {
      "id": "player2", 
      "name": "Jane Smith",
      "team": "B"
    }
  ],
  "matchDetails": {
    "tournament": "Summer Championship",
    "round": "Quarterfinals",
    "court": "Court 1"
  }
}
```

### Score Updates
```
POST /api/matches/{uuid}/scores
Authorization: Bearer {token}

Request:
{
  "teamAScore": 5,
  "teamBScore": 3,
  "servingTeam": "A",
  "serverNumber": 2,
  "gameStatus": "active|completed"
}
```

## Scoring Engine Algorithm

### State Machine
```
States: [SETUP, SERVING, RALLY_OUTCOME, SIDE_OUT, GAME_COMPLETE]

Transitions:
SETUP → SERVING (game start)
SERVING → RALLY_OUTCOME (touch court side)
RALLY_OUTCOME → SERVING (serving team wins)
RALLY_OUTCOME → SIDE_OUT (receiving team wins)
SIDE_OUT → SERVING (server rotation complete)
SERVING → GAME_COMPLETE (11+ points, 2-point lead)
```

### Touch Handler Logic
```javascript
function handleCourtTouch(touchedSide) {
  const servingTeam = gameState.serving.team;
  
  if (touchedSide === servingTeam) {
    // Serving team wins rally
    incrementScore(servingTeam);
    switchServingSide();
    updateServerPosition();
  } else {
    // Receiving team wins rally - side out
    performSideOut();
  }
  
  checkGameCompletion();
}
```

### Side-Out Implementation
```javascript
function performSideOut() {
  const currentTeam = gameState.serving.team;
  const currentServer = gameState.serving.player;
  
  if (gameMode === 'singles') {
    // Switch to other team
    gameState.serving.team = (currentTeam === 'left') ? 'right' : 'left';
    gameState.serving.side = getServingSide(getTeamScore(gameState.serving.team));
  } else {
    // Doubles logic
    if (isFirstGameServer() && currentServer === 2) {
      // First server of game, switch teams
      switchTeams();
    } else if (currentServer === 1) {
      // Switch to server 2 on same team
      gameState.serving.player = 2;
    } else {
      // Switch teams after both servers
      switchTeams();
      gameState.serving.player = 1;
    }
  }
}
```

## User Interface Specifications

### Court Layout
- **Dimensions**: 100vw × 100vh (full screen)
- **Sections**: Left area (38%), Kitchen (24%), Right area (38%)
- **Touch Zones**: Entire left/right areas are clickable
- **Colors**: Green (#4a7c59), Light grey kitchen (#ccc), White lines

### Score Display
- **Position**: Top center of court
- **Size**: Extra large - minimum 10vh (viewport height)
- **Format**: 
  - Singles: "5 - 3"
  - Doubles: "5 - 3 - 2"
- **Font**: Bold, high contrast, sans-serif
- **Colors**: White text on dark background for maximum visibility
- **Update**: Real-time with animation
- **Visibility**: Readable from 10+ feet away

### Player Names
- **Singles**: Center of each court side
- **Doubles**: Top/bottom positions per side
- **Font Size**: Responsive to court size (minimum 3vh)
- **Current Server Highlighting**:
  - **Border**: 4px solid yellow/orange border
  - **Background**: Semi-transparent highlight
  - **Font Weight**: Extra bold (font-weight: 900)
  - **Animation**: Subtle pulsing effect
  - **Box Shadow**: Prominent shadow for depth

### Referee Controls
- **Position**: Bottom overlay panel
- **Buttons**: Side-out, Undo, Reset, Settings
- **Size**: Touch-friendly (44px minimum)
- **Feedback**: Visual/haptic confirmation

## Cross-Platform Compatibility

### Touch Events
```javascript
// Unified touch handling
function addTouchListeners(element) {
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: false });
  element.addEventListener('click', handleClick); // Fallback for mouse
}
```

### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, orientation=landscape">
```

### CSS Media Queries
```css
/* iPad */
@media screen and (min-width: 768px) and (max-width: 1024px) { }

/* Samsung Tablets */
@media screen and (min-width: 800px) and (max-width: 1280px) { }

/* Windows Tablets */
@media screen and (min-width: 1024px) and (max-width: 1366px) { }
```

## Performance Requirements

### Response Times
- Touch interaction: <100ms
- Score update: <200ms
- API calls: <2000ms
- Screen transitions: <300ms

### Memory Usage
- Maximum heap: 50MB
- LocalStorage: <5MB
- Cache size: <10MB

### Battery Optimization
- Minimize DOM updates
- Use CSS transforms for animations
- Throttle API calls
- Implement sleep mode detection

## Error Handling

### Network Errors
```javascript
async function apiCall(endpoint, options) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Fallback to offline mode
    showOfflineNotification();
    return getCachedData(endpoint);
  }
}
```

### Scoring Validation
```javascript
function validateScore(teamScore, opponentScore) {
  // Basic validation
  if (teamScore < 0 || opponentScore < 0) return false;
  if (teamScore > 21 || opponentScore > 21) return false;
  
  // Game completion validation
  if (teamScore >= 11 && (teamScore - opponentScore) >= 2) {
    return { valid: true, gameComplete: true };
  }
  
  return { valid: true, gameComplete: false };
}
```

## Security Specifications

### Authentication
- JWT tokens with 1-hour expiration
- Secure storage in sessionStorage (not localStorage)
- Automatic token refresh before expiration

### Data Protection
- HTTPS only for all API calls
- No sensitive data in localStorage
- Input sanitization for all user inputs

### Authorization
- Referee-level permissions required
- Match-specific access control
- Audit trail for all scoring actions

## Testing Strategy

### Unit Tests
- Scoring engine logic
- Side-out state transitions
- API client functions
- Touch event handlers

### Integration Tests
- Complete game scenarios
- API integration flows
- Cross-platform compatibility
- Offline/online transitions

### User Acceptance Tests
- Referee workflow validation
- Performance under tournament conditions
- Error recovery scenarios
- Multi-device testing

## AWS Deployment Specifications

### Architecture Overview
- **S3 Bucket**: Static asset hosting
- **CloudFront**: Global CDN distribution
- **Route 53**: DNS management (optional)
- **Certificate Manager**: SSL/TLS certificates

### S3 Configuration
```json
{
  "bucketName": "pickleball-scoring-app",
  "staticWebsiteHosting": {
    "indexDocument": "index.html",
    "errorDocument": "index.html"
  },
  "publicReadAccess": true,
  "corsConfiguration": {
    "allowedOrigins": ["*"],
    "allowedMethods": ["GET", "HEAD"],
    "allowedHeaders": ["*"]
  }
}
```

### CloudFront Distribution
```json
{
  "origins": [
    {
      "domainName": "pickleball-scoring-app.s3.amazonaws.com",
      "originPath": "",
      "s3OriginConfig": {
        "originAccessIdentity": "origin-access-identity/cloudfront/ABCDEFG1234567"
      }
    }
  ],
  "defaultCacheBehavior": {
    "targetOriginId": "S3-pickleball-scoring-app",
    "viewerProtocolPolicy": "redirect-to-https",
    "cachePolicyId": "managed-caching-optimized",
    "compress": true
  },
  "customErrorResponses": [
    {
      "errorCode": 404,
      "responseCode": 200,
      "responsePagePath": "/index.html"
    }
  ]
}
```

### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build:prod

# Deploy to S3
aws s3 sync ./dist s3://pickleball-scoring-app --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id EDFDVBD6EXAMPLE --paths "/*"
```

### PWA Optimization for AWS
```javascript
// Service Worker cache strategy
const CACHE_NAME = 'pickleball-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/court.css',
  '/app.js',
  '/manifest.json'
];

// Cache-first strategy for static assets
self.addEventListener('fetch', event => {
  if (event.request.destination === 'document' || 
      event.request.destination === 'script' ||
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

### CloudFront Cache Headers
```javascript
// In build process, set appropriate headers
const cacheHeaders = {
  'index.html': 'no-cache',
  '*.js': 'max-age=31536000', // 1 year
  '*.css': 'max-age=31536000',
  '*.png': 'max-age=31536000',
  'manifest.json': 'max-age=86400' // 1 day
};
```

### Environment Configuration
```javascript
// config/environment.js
const config = {
  production: {
    apiBaseUrl: 'https://api.tournament-system.com',
    cdnUrl: 'https://d1234567890.cloudfront.net',
    enableAnalytics: true
  },
  staging: {
    apiBaseUrl: 'https://staging-api.tournament-system.com',
    cdnUrl: 'https://staging.d1234567890.cloudfront.net',
    enableAnalytics: false
  }
};
```

### Deployment Pipeline (GitHub Actions)
```yaml
name: Deploy to AWS
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build:prod
        
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Deploy to S3
        run: |
          aws s3 sync ./dist s3://${{ secrets.S3_BUCKET }} --delete
          
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### Performance Optimization
- **Gzip Compression**: Enabled via CloudFront
- **Brotli Compression**: Available for modern browsers
- **HTTP/2**: Automatic with CloudFront
- **Edge Locations**: Global distribution for low latency
- **Origin Shield**: Optional for high-traffic scenarios

### Security Configuration
```json
{
  "securityHeaders": {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
}
```

### Monitoring & Analytics
- **CloudWatch**: Monitor CloudFront metrics
- **S3 Access Logs**: Track usage patterns
- **Real User Monitoring**: Performance tracking
- **Error Tracking**: Client-side error reporting

### Cost Optimization
- **S3 Intelligent Tiering**: Automatic cost optimization
- **CloudFront Price Class**: Regional distribution control
- **Compression**: Reduce bandwidth costs
- **Cache Optimization**: Minimize origin requests

### Browser Support
- Safari 14+ (iPad)
- Chrome 90+ (Android tablets)
- Edge 90+ (Windows tablets)
- Progressive enhancement for older versions