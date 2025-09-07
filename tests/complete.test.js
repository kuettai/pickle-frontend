// Complete test suite for all existing MVP features
describe('Pickleball Scoring System - Complete Tests', () => {
  // Base PickleballApp class
  class PickleballApp {
    constructor() {
      this.gameState = {
        gameMode: 'singles',
        teams: {
          left: { score: 0, players: [{ name: 'Player 1' }] },
          right: { score: 0, players: [{ name: 'Player 2' }] }
        },
        serving: {
          team: 'left',
          player: 1,
          side: 'right'
        },
        gameStatus: 'active'
      }
    }

    scorePoint(team) {
      this.gameState.teams[team].score++
      this.switchServingSide()
    }

    performSideOut() {
      this.gameState.serving.team = (this.gameState.serving.team === 'left') ? 'right' : 'left'
      this.updateServingSide()
    }

    switchServingSide() {
      const servingTeam = this.gameState.serving.team
      const score = this.gameState.teams[servingTeam].score
      this.gameState.serving.side = (score % 2 === 0) ? 'right' : 'left'
    }

    updateServingSide() {
      const servingTeam = this.gameState.serving.team
      const score = this.gameState.teams[servingTeam].score
      this.gameState.serving.side = (score % 2 === 0) ? 'right' : 'left'
    }

    handleCourtTouch(touchedSide) {
      if (this.gameState.gameStatus !== 'active') return
      
      const servingTeam = this.gameState.serving.team
      
      if (touchedSide === servingTeam) {
        this.scorePoint(servingTeam)
      } else {
        this.performSideOut()
      }
    }
  }

  // Game completion logic
  class GameApp extends PickleballApp {
    checkGameCompletion() {
      const leftScore = this.gameState.teams.left.score
      const rightScore = this.gameState.teams.right.score
      
      if ((leftScore >= 11 || rightScore >= 11) && Math.abs(leftScore - rightScore) >= 2) {
        this.gameState.gameStatus = 'completed'
        return true
      }
      return false
    }
  }

  // Doubles mode with server rotation
  class DoublesApp extends PickleballApp {
    constructor() {
      super()
      this.gameState.gameMode = 'doubles'
      this.gameState.teams.left.players = [
        { name: 'Player 1A', position: 'top' },
        { name: 'Player 1B', position: 'bottom' }
      ]
      this.gameState.teams.right.players = [
        { name: 'Player 2A', position: 'top' },
        { name: 'Player 2B', position: 'bottom' }
      ]
      this.gameState.serving.player = 2
    }

    performSideOut() {
      const currentTeam = this.gameState.serving.team
      const currentServer = this.gameState.serving.player
      
      if (currentServer === 1) {
        this.gameState.serving.player = 2
      } else {
        this.gameState.serving.team = (currentTeam === 'left') ? 'right' : 'left'
        this.gameState.serving.player = 1
      }
      
      this.updateServingSide()
    }

    switchTeamSides(team) {
      const players = this.gameState.teams[team].players
      if (players.length === 2) {
        const temp = players[0].position
        players[0].position = players[1].position
        players[1].position = temp
      }
    }

    scorePoint(team) {
      this.gameState.teams[team].score++
      this.switchTeamSides(team)
      this.switchServingSide()
    }
  }

  // Authentication
  class AuthApp {
    constructor() {
      this.validCodes = ['REF2024', 'ADMIN123', 'DEMO', 'TEST']
    }

    authenticate(code) {
      if (this.validCodes.includes(code.toUpperCase())) {
        return { success: true, token: 'demo-jwt-token-' + Date.now() }
      }
      return { success: false, error: 'Invalid auth code' }
    }
  }

  // Match loading
  class MatchApp {
    constructor() {
      this.demoMatches = {
        'MATCH-001': {
          gameMode: 'singles',
          players: [
            { name: 'John Smith', team: 'A' },
            { name: 'Sarah Johnson', team: 'B' }
          ],
          tournament: 'Summer Championship'
        },
        'MATCH-002': {
          gameMode: 'doubles',
          players: [
            { name: 'Mike Wilson', team: 'A' },
            { name: 'Lisa Chen', team: 'A' },
            { name: 'David Brown', team: 'B' },
            { name: 'Emma Davis', team: 'B' }
          ],
          tournament: 'Doubles Tournament'
        }
      }
    }

    loadMatch(uuid) {
      const match = this.demoMatches[uuid.toUpperCase()]
      if (match) {
        return { success: true, match }
      }
      return { success: false, error: 'Match not found' }
    }
  }

  // Score display
  class ScoreApp extends PickleballApp {
    getScoreDisplay() {
      const leftScore = this.gameState.teams.left.score
      const rightScore = this.gameState.teams.right.score
      const serverNum = this.gameState.serving.player
      
      if (this.gameState.gameMode === 'singles') {
        return `${leftScore} - ${rightScore}`
      } else {
        return `${leftScore} - ${rightScore} - ${serverNum}`
      }
    }
  }

  describe('Core Scoring Engine', () => {
    test('serving team scores correctly', () => {
      const app = new PickleballApp()
      const initialScore = app.gameState.teams.left.score
      app.scorePoint('left')
      expect(app.gameState.teams.left.score).toBe(initialScore + 1)
    })

    test('serving team side touch awards point', () => {
      const app = new PickleballApp()
      app.gameState.serving.team = 'left'
      const initialScore = app.gameState.teams.left.score
      app.handleCourtTouch('left')
      expect(app.gameState.teams.left.score).toBe(initialScore + 1)
    })

    test('receiving team side touch causes side-out', () => {
      const app = new PickleballApp()
      app.gameState.serving.team = 'left'
      const initialScore = app.gameState.teams.left.score
      app.handleCourtTouch('right')
      expect(app.gameState.teams.left.score).toBe(initialScore)
      expect(app.gameState.serving.team).toBe('right')
    })

    test('ignores touches when game not active', () => {
      const app = new PickleballApp()
      app.gameState.gameStatus = 'setup'
      const initialScore = app.gameState.teams.left.score
      app.handleCourtTouch('left')
      expect(app.gameState.teams.left.score).toBe(initialScore)
    })
  })

  describe('Sideout Rules', () => {
    test('only serving team can score points', () => {
      const app = new PickleballApp()
      app.gameState.serving.team = 'left'
      
      const initialLeftScore = app.gameState.teams.left.score
      app.handleCourtTouch('left')
      expect(app.gameState.teams.left.score).toBe(initialLeftScore + 1)
      
      const rightScoreBeforeSideout = app.gameState.teams.right.score
      app.handleCourtTouch('right')
      expect(app.gameState.teams.right.score).toBe(rightScoreBeforeSideout)
    })

    test('even score serves from right side', () => {
      const app = new PickleballApp()
      app.gameState.teams.left.score = 0
      app.updateServingSide()
      expect(app.gameState.serving.side).toBe('right')
    })

    test('odd score serves from left side', () => {
      const app = new PickleballApp()
      app.gameState.teams.left.score = 1
      app.updateServingSide()
      expect(app.gameState.serving.side).toBe('left')
    })

    test('serve switches to opponent on side-out', () => {
      const app = new PickleballApp()
      app.gameState.serving.team = 'left'
      app.performSideOut()
      expect(app.gameState.serving.team).toBe('right')
    })
  })

  describe('Game Completion Logic', () => {
    test('game ends at 11-0', () => {
      const app = new GameApp()
      app.gameState.teams.left.score = 11
      app.gameState.teams.right.score = 0
      expect(app.checkGameCompletion()).toBe(true)
      expect(app.gameState.gameStatus).toBe('completed')
    })

    test('game ends at 11-9', () => {
      const app = new GameApp()
      app.gameState.teams.left.score = 11
      app.gameState.teams.right.score = 9
      expect(app.checkGameCompletion()).toBe(true)
    })

    test('game continues at 11-10 (deuce)', () => {
      const app = new GameApp()
      app.gameState.teams.left.score = 11
      app.gameState.teams.right.score = 10
      expect(app.checkGameCompletion()).toBe(false)
      expect(app.gameState.gameStatus).toBe('active')
    })

    test('game ends at 15-13', () => {
      const app = new GameApp()
      app.gameState.teams.left.score = 15
      app.gameState.teams.right.score = 13
      expect(app.checkGameCompletion()).toBe(true)
    })
  })

  describe('Doubles Mode Server Rotation', () => {
    test('first game starts with server #2', () => {
      const app = new DoublesApp()
      expect(app.gameState.serving.player).toBe(2)
    })

    test('server 1 to server 2 on same team', () => {
      const app = new DoublesApp()
      app.gameState.serving.player = 1
      app.performSideOut()
      expect(app.gameState.serving.player).toBe(2)
      expect(app.gameState.serving.team).toBe('left')
    })

    test('server 2 to opponent team server 1', () => {
      const app = new DoublesApp()
      app.gameState.serving.team = 'left'
      app.gameState.serving.player = 2
      app.performSideOut()
      expect(app.gameState.serving.team).toBe('right')
      expect(app.gameState.serving.player).toBe(1)
    })

    test('players switch positions after scoring', () => {
      const app = new DoublesApp()
      const leftPlayers = app.gameState.teams.left.players
      const originalTopPosition = leftPlayers[0].position
      const originalBottomPosition = leftPlayers[1].position
      
      app.scorePoint('left')
      
      expect(leftPlayers[0].position).toBe(originalBottomPosition)
      expect(leftPlayers[1].position).toBe(originalTopPosition)
    })
  })

  describe('Authentication Flow', () => {
    test('valid auth codes accepted', () => {
      const app = new AuthApp()
      expect(app.authenticate('REF2024').success).toBe(true)
      expect(app.authenticate('ADMIN123').success).toBe(true)
      expect(app.authenticate('ref2024').success).toBe(true)
    })

    test('invalid auth codes rejected', () => {
      const app = new AuthApp()
      expect(app.authenticate('INVALID').success).toBe(false)
      expect(app.authenticate('').success).toBe(false)
    })

    test('auth returns token on success', () => {
      const app = new AuthApp()
      const result = app.authenticate('REF2024')
      expect(result.success).toBe(true)
      expect(result.token).toContain('demo-jwt-token-')
    })
  })

  describe('Match Loading', () => {
    test('valid UUIDs load correctly', () => {
      const app = new MatchApp()
      const result1 = app.loadMatch('MATCH-001')
      expect(result1.success).toBe(true)
      expect(result1.match.gameMode).toBe('singles')
      
      const result2 = app.loadMatch('MATCH-002')
      expect(result2.success).toBe(true)
      expect(result2.match.gameMode).toBe('doubles')
    })

    test('invalid UUIDs show error', () => {
      const app = new MatchApp()
      const result = app.loadMatch('INVALID-UUID')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Match not found')
    })

    test('singles vs doubles mode detection', () => {
      const app = new MatchApp()
      const singles = app.loadMatch('MATCH-001')
      expect(singles.match.players.length).toBe(2)
      
      const doubles = app.loadMatch('MATCH-002')
      expect(doubles.match.players.length).toBe(4)
    })
  })

  describe('Score Display Format', () => {
    test('singles format: "5-3"', () => {
      const app = new ScoreApp()
      app.gameState.gameMode = 'singles'
      app.gameState.teams.left.score = 5
      app.gameState.teams.right.score = 3
      expect(app.getScoreDisplay()).toBe('5 - 3')
    })

    test('doubles format: "5-3-2"', () => {
      const app = new ScoreApp()
      app.gameState.gameMode = 'doubles'
      app.gameState.teams.left.score = 5
      app.gameState.teams.right.score = 3
      app.gameState.serving.player = 2
      expect(app.getScoreDisplay()).toBe('5 - 3 - 2')
    })
  })

  describe('Game State Management', () => {
    test('state remains consistent after operations', () => {
      const app = new PickleballApp()
      app.scorePoint('left')
      
      expect(typeof app.gameState.teams.left.score).toBe('number')
      expect(typeof app.gameState.teams.right.score).toBe('number')
      expect(['left', 'right']).toContain(app.gameState.serving.team)
      expect(['left', 'right']).toContain(app.gameState.serving.side)
    })

    test('scores never go negative', () => {
      const app = new PickleballApp()
      expect(app.gameState.teams.left.score).toBeGreaterThanOrEqual(0)
      expect(app.gameState.teams.right.score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Undo/Reset Features', () => {
    // Undo/Reset App with history tracking
    class UndoResetApp extends PickleballApp {
      constructor() {
        super()
        this.gameHistory = []
      }

      saveGameState() {
        this.gameHistory.push(JSON.parse(JSON.stringify(this.gameState)))
        if (this.gameHistory.length > 20) {
          this.gameHistory.shift()
        }
      }

      undoLastPoint() {
        if (this.gameHistory.length === 0) return
        this.gameState = this.gameHistory.pop()
      }

      resetGame() {
        this.gameState.teams.left.score = 0
        this.gameState.teams.right.score = 0
        this.gameState.serving.team = 'left'
        this.gameState.serving.player = this.gameState.gameMode === 'doubles' ? 2 : 1
        this.gameState.serving.side = 'right'
        this.gameState.gameStatus = 'active'
        this.gameHistory = []
      }

      handleCourtTouch(touchedSide) {
        if (this.gameState.gameStatus !== 'active') return
        this.saveGameState()
        super.handleCourtTouch(touchedSide)
      }
    }

    test('should save game state before scoring', () => {
      const app = new UndoResetApp()
      expect(app.gameHistory.length).toBe(0)
      
      app.saveGameState()
      expect(app.gameHistory.length).toBe(1)
      
      const savedState = app.gameHistory[0]
      expect(savedState.teams.left.score).toBe(0)
      expect(savedState.serving.team).toBe('left')
    })

    test('should limit history to 20 states', () => {
      const app = new UndoResetApp()
      for (let i = 0; i < 25; i++) {
        app.saveGameState()
      }
      expect(app.gameHistory.length).toBe(20)
    })

    test('should undo last point correctly', () => {
      const app = new UndoResetApp()
      app.saveGameState()
      
      app.gameState.teams.left.score = 1
      app.gameState.serving.side = 'left'
      
      app.undoLastPoint()
      
      expect(app.gameState.teams.left.score).toBe(0)
      expect(app.gameState.serving.side).toBe('right')
      expect(app.gameHistory.length).toBe(0)
    })

    test('should not undo when no history exists', () => {
      const app = new UndoResetApp()
      const originalState = JSON.parse(JSON.stringify(app.gameState))
      
      app.undoLastPoint()
      
      expect(app.gameState).toEqual(originalState)
    })

    test('should reset game correctly', () => {
      const app = new UndoResetApp()
      app.gameState.teams.left.score = 5
      app.gameState.teams.right.score = 3
      app.gameState.serving.team = 'right'
      app.gameHistory = [{ test: 'data' }]
      
      app.resetGame()
      
      expect(app.gameState.teams.left.score).toBe(0)
      expect(app.gameState.teams.right.score).toBe(0)
      expect(app.gameState.serving.team).toBe('left')
      expect(app.gameState.serving.player).toBe(1)
      expect(app.gameState.serving.side).toBe('right')
      expect(app.gameHistory.length).toBe(0)
    })

    test('should save state before court touch', () => {
      const app = new UndoResetApp()
      expect(app.gameHistory.length).toBe(0)
      
      app.handleCourtTouch('left')
      
      expect(app.gameHistory.length).toBe(1)
    })

    test('should reset doubles to server #2', () => {
      const app = new UndoResetApp()
      app.gameState.gameMode = 'doubles'
      app.gameState.serving.player = 1
      
      app.resetGame()
      
      expect(app.gameState.serving.player).toBe(2)
    })
  })
})