# Pickleball Scoring System Development Rules

## System Terminology & Court Positions

### Court Position Abbreviations
- **CLT** = Court Left Top (left team, left-hand side position)
- **CLB** = Court Left Bottom (left team, right-hand side position)  
- **CRT** = Court Right Top (right team, right-hand side position)
- **CRB** = Court Right Bottom (right team, left-hand side position)
- **PLLH** = Player Left/Right Highlighting (current server highlighting)

### Player Positioning Rules
- **Top players (CLT/CRT)**: Positioned at 10% from top of court
- **Bottom players (CLB/CRB)**: Positioned at 10% from bottom of court
- **Player name color**: #74afda (light blue) for all players
- **Current server highlighting**: 4px orange border, bold font, pulsing animation

## Sideout Scoring Logic Rules

### Core Scoring Principles
- ONLY the serving team can score points
- Side-out occurs when serving team loses rally (no points awarded to receiving team)
- Game ends at 11+ points with 2-point lead requirement
- Score format: Singles "5-3", Doubles "5-3-2" (server number)
- **Score display**: 24vh font size, center-positioned, white text on dark background

### Server Rotation Rules
- Singles: serve switches to opponent on side-out
- Doubles: server 1 → server 2 → opponent team (except first game server #2 serves once)
- Serving side: even score = right side, odd score = left side
- **Cross-court serving**: Server and receiver positioned diagonally opposite
- **Singles**: Serving player switches sides after each point won, receiver stays on corresponding opposite side
- **Doubles**: Both players on serving team switch court positions after each point won

### Singles Mode Specific Rules
- **Game start (0-0)**: Even score = server starts on right-hand side (CLB or CRT)
- **First server**: Determined by game configuration (system allows selection)
- **Receiver positioning**: Always diagonally opposite to server
  - CLB serves → CRT receives (right-hand to right-hand, cross-court)
  - CLT serves → CRB receives (left-hand to left-hand, cross-court)
  - CRT serves → CLB receives (right-hand to right-hand, cross-court)
  - CRB serves → CLT receives (left-hand to left-hand, cross-court)
- **After each point won**: Server switches sides, receiver moves to opposite diagonal
- **Sideout**: Serve switches to opponent, positions determined by new server's score
- **Player name display**: Updates dynamically based on serving side (like doubles mode)
  - Even scores: Server at right-hand side, receiver at right-hand side (cross-court)
  - Odd scores: Server at left-hand side, receiver at left-hand side (cross-court)

### Touch Interaction Logic
- Touch serving team's court side = +1 point to serving team
- Touch receiving team's court side = side-out (serve changes, no score)
- Never allow direct scoring for receiving team

## Code Quality Standards

### JavaScript/TypeScript Rules
- Use const/let instead of var
- Prefer arrow functions for callbacks
- Use async/await instead of .then() chains
- Implement proper error handling with try/catch
- Use meaningful variable names (servingTeam, currentServer, gameState)

### State Management Rules
- Keep game state immutable - create new objects for updates
- Validate all state changes before applying
- Maintain single source of truth for game state
- Log all scoring actions for debugging/audit trail

### UI/UX Rules
- **Score display**: 24vh font size, center-positioned, no line breaks (white-space: nowrap)
- **Current server highlighting**: 4px orange border (#FFA500), bold font, pulsing animation
- **Touch zones**: Entire left/right court areas with immediate visual feedback
- **Touch feedback**: Orange pulse animation (300ms duration)
- **Button sizes**: Minimum 44px for touch targets, circular design for game controls
- **Player names**: #74afda color, positioned at 10% from court edges
- **All interactions**: Visual feedback within 100ms
- **High contrast**: White text on dark backgrounds, accessible color ratios

### Performance Rules
- Touch response time must be <100ms
- Score updates must be <200ms
- Minimize DOM manipulations - batch updates
- Use CSS transforms for animations (not position changes)
- Implement efficient event listeners (passive where possible)

## API Integration Rules

### Authentication
- Store JWT tokens in sessionStorage (never localStorage)
- Implement automatic token refresh before expiration
- Handle 401 responses with re-authentication flow
- Never log or expose auth tokens in console

### Match Data
- Validate all API responses before using
- Implement retry logic with exponential backoff
- Cache match data locally for offline mode
- Handle network timeouts gracefully (10 second limit)

### Score Submission
- Queue score updates for offline submission
- Implement idempotent score submissions
- Validate scores before submission
- Provide clear feedback on submission status

## Cross-Platform Compatibility Rules

### Touch Events
- Always implement both touch and click handlers
- Use passive event listeners where possible
- Prevent default behavior for scoring touches
- Test touch responsiveness on all target devices (iPad, Samsung, Windows tablets)

### CSS Rules
- Use viewport units (vh, vw) for responsive sizing
- Implement proper media queries for different tablet sizes
- Avoid fixed pixel values for critical UI elements
- Test in landscape orientation only

### Browser Support
- Target Safari 14+, Chrome 90+, Edge 90+
- Use progressive enhancement for advanced features
- Implement fallbacks for unsupported features
- Test on actual devices, not just browser dev tools

## Security Rules

### Data Handling
- Never store sensitive data in localStorage
- Sanitize all user inputs
- Validate all data from external APIs
- Implement proper CORS handling

### Authentication
- Use secure token storage (sessionStorage)
- Implement proper logout functionality
- Handle token expiration gracefully
- Never expose credentials in client-side code

## Testing Rules

### Unit Testing
- Test all scoring logic with edge cases
- Mock all API calls in tests
- Test sideout scenarios thoroughly
- Validate state transitions
- **Current coverage**: 144 tests across 8 test files

### Integration Testing
- Test complete game flows (setup → play → completion)
- Test post-configuration scenarios (normal flow after manual adjustments)
- Test player position validation after configuration changes
- Test multiple server combinations (all 8 possible scenarios)
- Test offline/online transitions
- Validate cross-platform compatibility
- Test error recovery scenarios

### Manual Score Adjustment Testing
- Test separate control of score display vs player highlighting
- Validate serving side calculations with different starting scores
- Test player name display in server selection dropdowns
- Verify game state backup and undo functionality after adjustments

## File Organization Rules

### Project Structure
- Keep source code in /sources
- Keep documentation in /docs
- Use clear, descriptive file names
- Group related components together

### Component Structure
- One component per file
- Clear separation of concerns
- Minimal component dependencies
- Reusable where appropriate

## Error Handling Rules

### User-Facing Errors
- Provide clear, actionable error messages
- Never show technical error details to users
- Implement graceful degradation for network issues
- Always provide recovery options

### Developer Errors
- Log detailed error information for debugging
- Include context (game state, user action) in error logs
- Implement proper error boundaries
- Use structured logging format

## Deployment Rules

### AWS Deployment
- Use CloudFront for global distribution
- Implement proper cache headers
- Enable compression (gzip/brotli)
- Use HTTPS only

### Build Process
- Minify all assets for production
- Generate proper PWA manifest
- Implement service worker for offline support
- Validate build output before deployment

## Documentation Rules

### Code Documentation
- Document complex scoring logic thoroughly
- Include examples for sideout scenarios
- Document API contracts clearly
- Keep documentation up to date with code changes

### User Documentation
- Provide clear referee instructions
- Include troubleshooting guides
- Document device compatibility
- Create quick reference guides

### Documentation Update Process
- After updating all necessary documentation files (requirements.md, development-checklist.md, unit-test-plans.md, user-stories.md), always suggest the next logical to-do items from the project roadmap
- Prioritize items based on: 1) Critical functionality gaps, 2) User experience improvements, 3) System reliability features
- Reference specific uncompleted items from development-checklist.md and user-stories.md