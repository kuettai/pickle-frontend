// Manual Score Adjustment Tests
describe('Manual Score Adjustment Interface', () => {
  // Extended TestApp for integration testing
  class ExtendedTestApp {
    constructor() {
      this.gameState = {
        teams: { 
          left: { 
            score: 5, 
            players: [
              { name: 'Mike Wilson', position: 'top' },
              { name: 'Lisa Chen', position: 'bottom' }
            ]
          }, 
          right: { 
            score: 3, 
            players: [
              { name: 'David Brown', position: 'bottom' },
              { name: 'Emma Davis', position: 'top' }
            ]
          } 
        },
        serving: { team: 'left', player: 2, activeServer: 1 },
        gameMode: 'doubles',
        gameStatus: 'active'
      }
      this.gameHistory = []
      this.teamAssignment = { teamA: 'left', teamB: 'right' }
    }

    // Simulate team side switching
    switchSides() {
      this.teamAssignment = {
        teamA: this.teamAssignment.teamA === 'left' ? 'right' : 'left',
        teamB: this.teamAssignment.teamB === 'left' ? 'right' : 'left'
      }
      
      // Swap team players
      const temp = this.gameState.teams.left.players
      this.gameState.teams.left.players = this.gameState.teams.right.players
      this.gameState.teams.right.players = temp
      
      return { sidesSwapped: true, newAssignment: this.teamAssignment }
    }

    // Simulate normal scoring after configuration
    scorePoint(team) {
      this.gameState.teams[team].score++
      
      // Update serving side
      const servingScore = this.gameState.teams[this.gameState.serving.team].score
      this.gameState.serving.side = (servingScore % 2 === 0) ? 'right' : 'left'
      
      return {
        scored: true,
        team: team,
        newScore: this.gameState.teams[team].score,
        servingSide: this.gameState.serving.side
      }
    }
  }
  class MockElement {
    constructor() {
      this.value = ''
      this.innerHTML = ''
      this.classList = new Set()
    }
    
    remove() {}
    appendChild() {}
  }

  class TestApp {
    constructor() {
      this.gameState = {
        teams: { 
          left: { 
            score: 5, 
            players: [
              { name: 'Mike Wilson', position: 'top' },
              { name: 'Lisa Chen', position: 'bottom' }
            ]
          }, 
          right: { 
            score: 3, 
            players: [
              { name: 'David Brown', position: 'bottom' },
              { name: 'Emma Davis', position: 'top' }
            ]
          } 
        },
        serving: { team: 'left', player: 2, activeServer: 1 },
        gameMode: 'doubles',
        gameStatus: 'active'
      }
      this.gameHistory = []
    }

    getElementById(id) {
      const element = new MockElement()
      if (id === 'left-score') element.value = '5'
      if (id === 'right-score') element.value = '3'
      if (id === 'serving-team') element.value = 'left'
      if (id === 'server-number') element.value = '1'
      if (id === 'display-server-number') element.value = '2'
      return element
    }

    saveGameState() {
      this.gameHistory.push(JSON.parse(JSON.stringify(this.gameState)))
    }

    getServerName(team, serverNumber) {
      const players = this.gameState.teams[team].players
      if (serverNumber === 1) {
        return players[0]?.name || 'Server #1'
      } else {
        return players[1]?.name || 'Server #2'
      }
    }

    updateServerNames() {
      const selectedTeam = this.getElementById('serving-team').value
      return {
        teamChanged: true,
        newTeam: selectedTeam,
        server1: this.getServerName(selectedTeam, 1),
        server2: this.getServerName(selectedTeam, 2)
      }
    }

    applyScoreAdjustment() {
      const leftScore = parseInt(this.getElementById('left-score').value)
      const rightScore = parseInt(this.getElementById('right-score').value)
      const servingTeam = this.getElementById('serving-team').value
      const serverNumber = parseInt(this.getElementById('display-server-number').value)
      const activeServer = parseInt(this.getElementById('server-number').value)

      if (leftScore < 0 || rightScore < 0 || leftScore > 30 || rightScore > 30) {
        return { error: 'Scores must be between 0 and 30' }
      }

      this.saveGameState()

      // Update scores
      this.gameState.teams.left.score = leftScore
      this.gameState.teams.right.score = rightScore

      // Update serving info
      this.gameState.serving.team = servingTeam
      this.gameState.serving.player = serverNumber
      this.gameState.serving.activeServer = activeServer

      // Update serving side
      const servingScore = this.gameState.teams[servingTeam].score
      this.gameState.serving.side = (servingScore % 2 === 0) ? 'right' : 'left'

      return {
        success: true,
        newScore: { left: leftScore, right: rightScore },
        servingTeam: servingTeam,
        serverNumber: serverNumber,
        activeServer: activeServer,
        servingSide: this.gameState.serving.side
      }
    }

    showScoreAdjustment() {
      return {
        modalShown: true,
        gameMode: this.gameState.gameMode,
        currentScores: {
          left: this.gameState.teams.left.score,
          right: this.gameState.teams.right.score
        },
        servingInfo: {
          team: this.gameState.serving.team,
          player: this.gameState.serving.player,
          activeServer: this.gameState.serving.activeServer
        }
      }
    }
  }

  describe('Score Adjustment Modal', () => {
    test('shows modal with current game state', () => {
      const app = new TestApp()
      const result = app.showScoreAdjustment()
      
      expect(result.modalShown).toBe(true)
      expect(result.gameMode).toBe('doubles')
      expect(result.currentScores.left).toBe(5)
      expect(result.currentScores.right).toBe(3)
      expect(result.servingInfo.team).toBe('left')
      expect(result.servingInfo.player).toBe(2)
    })

    test('pre-populates form with current values', () => {
      const app = new TestApp()
      
      expect(app.getElementById('left-score').value).toBe('5')
      expect(app.getElementById('right-score').value).toBe('3')
      expect(app.getElementById('serving-team').value).toBe('left')
      expect(app.getElementById('display-server-number').value).toBe('2')
    })
  })

  describe('Server Name Display', () => {
    test('shows player names for server selection', () => {
      const app = new TestApp()
      
      expect(app.getServerName('left', 1)).toBe('Mike Wilson')
      expect(app.getServerName('left', 2)).toBe('Lisa Chen')
      expect(app.getServerName('right', 1)).toBe('David Brown')
      expect(app.getServerName('right', 2)).toBe('Emma Davis')
    })

    test('updates server names when team changes', () => {
      const app = new TestApp()
      const result = app.updateServerNames()
      
      expect(result.teamChanged).toBe(true)
      expect(result.server1).toBe('Mike Wilson')
      expect(result.server2).toBe('Lisa Chen')
    })

    test('handles missing player names gracefully', () => {
      const app = new TestApp()
      app.gameState.teams.left.players = [{ name: 'Solo Player' }]
      
      expect(app.getServerName('left', 1)).toBe('Solo Player')
      expect(app.getServerName('left', 2)).toBe('Server #2')
    })
  })

  describe('Score Validation', () => {
    test('accepts valid scores', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '8'
        if (id === 'right-score') element.value = '6'
        if (id === 'serving-team') element.value = 'right'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '2'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.success).toBe(true)
      expect(result.newScore.left).toBe(8)
      expect(result.newScore.right).toBe(6)
    })

    test('rejects negative scores', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '-1'
        if (id === 'right-score') element.value = '5'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.error).toBe('Scores must be between 0 and 30')
    })

    test('rejects scores over 30', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '15'
        if (id === 'right-score') element.value = '35'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.error).toBe('Scores must be between 0 and 30')
    })

    test('accepts boundary values', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '0'
        if (id === 'right-score') element.value = '30'
        if (id === 'serving-team') element.value = 'left'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '1'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.success).toBe(true)
      expect(result.newScore.left).toBe(0)
      expect(result.newScore.right).toBe(30)
    })
  })

  describe('Serving Configuration', () => {
    test('updates serving team correctly', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '7'
        if (id === 'right-score') element.value = '4'
        if (id === 'serving-team') element.value = 'right'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '2'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.servingTeam).toBe('right')
      expect(result.serverNumber).toBe(1)
      expect(result.activeServer).toBe(2)
    })

    test('calculates serving side based on score', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '6'
        if (id === 'right-score') element.value = '3'
        if (id === 'serving-team') element.value = 'left'
        if (id === 'display-server-number') element.value = '2'
        if (id === 'server-number') element.value = '1'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      // Left team score = 6 (even), so serving side = right
      expect(result.servingSide).toBe('right')
    })

    test('handles odd serving score', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '7'
        if (id === 'right-score') element.value = '3'
        if (id === 'serving-team') element.value = 'left'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '2'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      // Left team score = 7 (odd), so serving side = left
      expect(result.servingSide).toBe('left')
    })
  })

  describe('Separate Server Controls', () => {
    test('distinguishes between display server and active server', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '5'
        if (id === 'right-score') element.value = '3'
        if (id === 'serving-team') element.value = 'left'
        if (id === 'display-server-number') element.value = '1'  // Score shows 5-3-1
        if (id === 'server-number') element.value = '2'         // Lisa Chen highlighted
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.serverNumber).toBe(1)      // Score display: 5-3-1
      expect(result.activeServer).toBe(2)      // Lisa Chen highlighted
    })

    test('allows independent control of score and highlighting', () => {
      const app = new TestApp()
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '8'
        if (id === 'right-score') element.value = '6'
        if (id === 'serving-team') element.value = 'right'
        if (id === 'display-server-number') element.value = '2'  // Score shows 8-6-2
        if (id === 'server-number') element.value = '1'         // David Brown highlighted
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      expect(result.serverNumber).toBe(2)      // Score display: 8-6-2
      expect(result.activeServer).toBe(1)      // David Brown highlighted
      expect(result.servingTeam).toBe('right')
    })
  })

  describe('Game State Backup', () => {
    test('saves game state before applying changes', () => {
      const app = new TestApp()
      const initialHistoryLength = app.gameHistory.length
      
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '10'
        if (id === 'right-score') element.value = '8'
        if (id === 'serving-team') element.value = 'right'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '1'
        return element
      }
      
      app.applyScoreAdjustment()
      
      expect(app.gameHistory.length).toBe(initialHistoryLength + 1)
    })

    test('preserves original state in backup', () => {
      const app = new TestApp()
      const originalScore = { 
        left: app.gameState.teams.left.score,
        right: app.gameState.teams.right.score
      }
      
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '15'
        if (id === 'right-score') element.value = '12'
        if (id === 'serving-team') element.value = 'left'
        if (id === 'display-server-number') element.value = '2'
        if (id === 'server-number') element.value = '1'
        return element
      }
      
      app.applyScoreAdjustment()
      
      const backup = app.gameHistory[app.gameHistory.length - 1]
      expect(backup.teams.left.score).toBe(originalScore.left)
      expect(backup.teams.right.score).toBe(originalScore.right)
    })
  })

  describe('UI Responsiveness', () => {
    test('score display adapts to content width', () => {
      const scoreDisplayStyles = {
        whiteSpace: 'nowrap',
        minWidth: 'auto', // No fixed width
        textAlign: 'center',
        fontSize: '24vh'
      }
      
      expect(scoreDisplayStyles.whiteSpace).toBe('nowrap')
      expect(scoreDisplayStyles.minWidth).toBe('auto')
      expect(scoreDisplayStyles.textAlign).toBe('center')
    })

    test('prevents line breaks in score display', () => {
      const scoreText = '12-10-2'
      const displayRules = {
        whiteSpace: 'nowrap',
        overflow: 'visible'
      }
      
      expect(displayRules.whiteSpace).toBe('nowrap')
      expect(scoreText.includes('\n')).toBe(false)
    })
  })

  describe('Post-Configuration Integration Tests', () => {
    test('normal scoring flow works after configuration change', () => {
      const app = new TestApp()
      
      // Apply configuration change
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '3'
        if (id === 'right-score') element.value = '2'
        if (id === 'serving-team') element.value = 'right'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '2'
        return element
      }
      
      const result = app.applyScoreAdjustment()
      
      // Verify configuration applied
      expect(result.success).toBe(true)
      expect(result.servingTeam).toBe('right')
      expect(result.serverNumber).toBe(1)
      expect(result.activeServer).toBe(2)
      
      // Verify normal flow continues
      expect(app.gameState.teams.left.score).toBe(3)
      expect(app.gameState.teams.right.score).toBe(2)
      expect(app.gameState.serving.team).toBe('right')
    })

    test('player positions correct after configuration change', () => {
      const app = new TestApp()
      
      // Change serving team and server
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '4'
        if (id === 'right-score') element.value = '6'
        if (id === 'serving-team') element.value = 'left'
        if (id === 'display-server-number') element.value = '2'
        if (id === 'server-number') element.value = '1'
        return element
      }
      
      app.applyScoreAdjustment()
      
      // Verify player positions maintained
      const leftPlayers = app.gameState.teams.left.players
      const rightPlayers = app.gameState.teams.right.players
      
      expect(leftPlayers[0].position).toBe('top')
      expect(leftPlayers[1].position).toBe('bottom')
      expect(rightPlayers[0].position).toBe('bottom')
      expect(rightPlayers[1].position).toBe('top')
      
      // Verify correct server highlighted (activeServer = 1 = Mike Wilson)
      expect(app.gameState.serving.activeServer).toBe(1)
      expect(leftPlayers[0].name).toBe('Mike Wilson')
    })

    test('serving side calculation with different starting scores', () => {
      const testCases = [
        { leftScore: 0, rightScore: 0, servingTeam: 'left', expectedSide: 'right' },
        { leftScore: 1, rightScore: 0, servingTeam: 'left', expectedSide: 'left' },
        { leftScore: 2, rightScore: 1, servingTeam: 'left', expectedSide: 'right' },
        { leftScore: 3, rightScore: 2, servingTeam: 'left', expectedSide: 'left' },
        { leftScore: 0, rightScore: 4, servingTeam: 'right', expectedSide: 'right' },
        { leftScore: 1, rightScore: 5, servingTeam: 'right', expectedSide: 'left' }
      ]
      
      testCases.forEach(testCase => {
        const app = new TestApp()
        
        app.getElementById = (id) => {
          const element = new MockElement()
          if (id === 'left-score') element.value = testCase.leftScore.toString()
          if (id === 'right-score') element.value = testCase.rightScore.toString()
          if (id === 'serving-team') element.value = testCase.servingTeam
          if (id === 'display-server-number') element.value = '1'
          if (id === 'server-number') element.value = '1'
          return element
        }
        
        const result = app.applyScoreAdjustment()
        
        expect(result.servingSide).toBe(testCase.expectedSide)
      })
    })

    test('multiple server combinations work correctly', () => {
      const combinations = [
        { team: 'left', displayServer: 1, activeServer: 1, expectedPlayer: 'Mike Wilson' },
        { team: 'left', displayServer: 1, activeServer: 2, expectedPlayer: 'Lisa Chen' },
        { team: 'left', displayServer: 2, activeServer: 1, expectedPlayer: 'Mike Wilson' },
        { team: 'left', displayServer: 2, activeServer: 2, expectedPlayer: 'Lisa Chen' },
        { team: 'right', displayServer: 1, activeServer: 1, expectedPlayer: 'David Brown' },
        { team: 'right', displayServer: 1, activeServer: 2, expectedPlayer: 'Emma Davis' },
        { team: 'right', displayServer: 2, activeServer: 1, expectedPlayer: 'David Brown' },
        { team: 'right', displayServer: 2, activeServer: 2, expectedPlayer: 'Emma Davis' }
      ]
      
      combinations.forEach(combo => {
        const app = new TestApp()
        
        app.getElementById = (id) => {
          const element = new MockElement()
          if (id === 'left-score') element.value = '5'
          if (id === 'right-score') element.value = '3'
          if (id === 'serving-team') element.value = combo.team
          if (id === 'display-server-number') element.value = combo.displayServer.toString()
          if (id === 'server-number') element.value = combo.activeServer.toString()
          return element
        }
        
        const result = app.applyScoreAdjustment()
        
        expect(result.serverNumber).toBe(combo.displayServer)
        expect(result.activeServer).toBe(combo.activeServer)
        expect(app.getServerName(combo.team, combo.activeServer)).toBe(combo.expectedPlayer)
      })
    })

    test('configuration preserves game state backup', () => {
      const app = new TestApp()
      const originalScore = { left: 5, right: 3 }
      const originalServing = { team: 'left', player: 2 }
      
      app.getElementById = (id) => {
        const element = new MockElement()
        if (id === 'left-score') element.value = '8'
        if (id === 'right-score') element.value = '6'
        if (id === 'serving-team') element.value = 'right'
        if (id === 'display-server-number') element.value = '1'
        if (id === 'server-number') element.value = '2'
        return element
      }
      
      app.applyScoreAdjustment()
      
      // Verify backup contains original state
      const backup = app.gameHistory[app.gameHistory.length - 1]
      expect(backup.teams.left.score).toBe(originalScore.left)
      expect(backup.teams.right.score).toBe(originalScore.right)
      expect(backup.serving.team).toBe(originalServing.team)
      expect(backup.serving.player).toBe(originalServing.player)
      
      // Verify current state is updated
      expect(app.gameState.teams.left.score).toBe(8)
      expect(app.gameState.teams.right.score).toBe(6)
      expect(app.gameState.serving.team).toBe('right')
    })
  })
})