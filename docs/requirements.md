# Pickleball Tournament Scoring System - Requirements

## Project Overview
A tablet-based pickleball scoring system for tournament use, designed for horizontal display on iPads, Samsung tablets, and Windows tablets.

## Core Features

### 1. Court Display
- [ ] Use existing court layout as base interface
- [ ] Display in horizontal orientation optimized for tablets
- [ ] Touch-responsive scoring areas on left and right sides of court

### 2. Authentication & Match Setup
- [ ] Referee authentication with auth code input
- [ ] Match UUID input interface
- [ ] API retrieval of match details based on UUID
- [ ] Support for game modes: Singles, Doubles, Mixed Doubles
- [ ] Default scoring system: SIDEOUT (configurable via API)
- [ ] Player information confirmation interface

### 3. Scoring System
#### Core Rules
- [ ] Only serving team can score points
- [ ] Game played to 11 points with 2-point lead requirement
- [ ] Side-out occurs when serving team loses rally
- [ ] Touch left/right court sides to indicate rally outcome:
  - If serving team's side touched: +1 score to serving team
  - If receiving team's side touched: side-out (no score, serve changes)
- [ ] Touch handling respects current serving team and side-out rules
- [ ] Real-time score display on court
- [ ] Score validation and game rules enforcement

#### Serving Rules
- [ ] Serve from right side when score is even, left side when odd
- [ ] Serving always from right-hand side of court (left court = bottom, right court = top)
- [ ] Singles: serving player switches sides after scoring, receiver mirrors opposite side
- [ ] Doubles: both players on serving team switch court positions after scoring

#### Singles Mode Scoring
- [ ] Score format: "Server Score - Receiver Score" (e.g., "5-3")
- [ ] One server per side, no second serve
- [ ] Side-out passes serve to opponent

#### Doubles Mode Scoring
- [ ] Score format: "Server Score - Receiver Score - Server Number" (e.g., "5-3-2")
- [ ] Each team member serves before side-out (except first server serves once)
- [ ] First game server is #2, serves only once initially
- [ ] Server #1 then #2 serve in sequence after side-out

### 4. Player Management
#### Single Mode
- [ ] Display single player name on each side
- [ ] Side assignment by referee before game start
- [ ] Track current server and serving side

#### Double Mode
- [ ] Display 2 player names per team (top/bottom positions)
- [ ] Player name positioning: Player 1 (top), Player 2 (bottom)
- [ ] Swap player positions functionality
- [ ] Click player name to designate first server
- [ ] Track server number (1 or 2) for each team
- [ ] Highlight current server

### 5. Referee Controls
#### Pre-Game Setup
- [ ] Auth code validation interface
- [ ] Match UUID input and validation
- [ ] Player information confirmation screen
- [ ] Team side assignment (left/right court)
- [ ] Starting serving team selection
- [ ] Player position arrangement (doubles/mixed)

#### During Game
- [ ] Side-out button (when serving team loses rally)
- [x] Score correction/undo functionality
- [ ] Serving side indicator (left/right based on score)
- [x] Game completion detection (11+ points with 2-point lead)
- [x] Game start/reset functionality

### 6. Data Integration
- [ ] API integration for external data source
- [ ] Placeholder API implementation for development
- [ ] Authentication endpoint for referee validation
- [ ] Match data retrieval by UUID
- [ ] Player data and match configuration management

## Technical Requirements

### Platform Support
- [ ] iPad compatibility
- [ ] Samsung tablet compatibility  
- [ ] Windows tablet compatibility
- [ ] Horizontal orientation lock

### Performance
- [ ] Responsive touch interface
- [ ] Real-time score updates
- [ ] Stable API connectivity

## User Interface Requirements
- [ ] Intuitive touch controls for scoring
- [ ] Extra large score display (minimum 10vh) visible from 10+ feet
- [ ] Clear player name display with responsive sizing
- [ ] Current server extra-visible highlighting (bold, bordered, animated)
- [ ] Referee control panel
- [ ] High contrast colors for tournament visibility

## API Specifications
### Endpoints (Placeholder)
- [ ] POST /auth - Validate referee auth code
- [ ] GET /matches/{uuid} - Retrieve match data by UUID
  - Response includes: game_mode, scoring_system, players, match_details
- [ ] POST /scores - Submit score updates
- [ ] GET /tournaments - Tournament information

### Match Data Response Format
```json
{
  "match_uuid": "string",
  "game_mode": "singles|doubles|mixed",
  "scoring_system": "sideout",
  "players": [
    {"id": "string", "name": "string", "team": "A|B"},
    ...
  ],
  "match_details": {
    "tournament": "string",
    "round": "string",
    "court": "string"
  }
}
```

## Acceptance Criteria
### Pre-Game Setup
- [x] Referee can authenticate with valid auth code
- [x] Match UUID input retrieves correct match data
- [x] Player information displays accurately for confirmation
- [ ] Referee can assign teams to court sides (left/right)
- [ ] Starting serving team selection works properly
- [x] Game mode (singles/doubles/mixed) loads correctly from API

### During Game
- [x] Touch scoring correctly handles rally outcomes (score vs side-out)
- [x] Side-out functionality transfers serve correctly
- [x] Score format displays correctly for singles/doubles/mixed
- [x] Serving side indicator updates based on score (even/odd)
- [x] Server switching works in doubles mode (1→2→side-out)
- [x] Game ends at 11+ points with 2-point lead
- [x] Player names display correctly in all modes
- [x] API integration handles data exchange
- [x] Interface remains usable in horizontal orientation

## Future Considerations
- [ ] Match history tracking
- [ ] Tournament bracket integration
- [ ] Multi-court management
- [ ] Score export functionality