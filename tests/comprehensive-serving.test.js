// Comprehensive Serving Scenarios Test
describe('Comprehensive Serving Scenarios', () => {
  class TestApp {
    constructor() {
      this.gameState = {
        gameMode: 'doubles',
        teams: {
          left: { score: 0, players: [] },
          right: { score: 0, players: [] }
        },
        serving: { team: 'left', player: 2, side: 'right' },
        gameStatus: 'active'
      }
      this.loadedMatch = {
        gameMode: 'doubles',
        players: [
          { name: 'Mike Wilson', team: 'A' },
          { name: 'Lisa Chen', team: 'A' },
          { name: 'David Brown', team: 'B' },
          { name: 'Emma Davis', team: 'B' }
        ]
      }
      this.teamAssignment = { teamA: 'left', teamB: 'right' }
    }

    setupGame(servingTeam, serverIndex = null, receiverIndex = null) {
      this.gameState.serving.team = servingTeam
      this.gameState.serving.player = 2
      
      const teamAPlayers = this.loadedMatch.players.filter(p => p.team === 'A')
      const teamBPlayers = this.loadedMatch.players.filter(p => p.team === 'B')
      const leftTeamPlayers = this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers
      const rightTeamPlayers = this.teamAssignment.teamA === 'left' ? teamBPlayers : teamAPlayers

      if (serverIndex !== null) {
        // Custom player selection
        this.applyCustomSelection(servingTeam, leftTeamPlayers, rightTeamPlayers, serverIndex, receiverIndex)
      } else {
        // Default setup
        this.setupDefault(servingTeam, leftTeamPlayers, rightTeamPlayers)
      }
    }

    setupDefault(servingTeam, leftTeamPlayers, rightTeamPlayers) {
      if (servingTeam === 'left') {
        this.gameState.teams.left.players = [
          { name: leftTeamPlayers[0].name, position: 'top' },
          { name: leftTeamPlayers[1].name, position: 'bottom' }
        ]
        this.gameState.teams.right.players = [
          { name: rightTeamPlayers[0].name, position: 'top' },
          { name: rightTeamPlayers[1].name, position: 'bottom' }
        ]
      } else {
        this.gameState.teams.left.players = [
          { name: leftTeamPlayers[0].name, position: 'top' },
          { name: leftTeamPlayers[1].name, position: 'bottom' }
        ]
        this.gameState.teams.right.players = [
          { name: rightTeamPlayers[0].name, position: 'bottom' },
          { name: rightTeamPlayers[1].name, position: 'top' }
        ]
      }
    }

    applyCustomSelection(servingTeam, leftTeamPlayers, rightTeamPlayers, serverIndex, receiverIndex) {
      let servingTeamPlayers, receivingTeamPlayers
      if (servingTeam === 'left') {
        servingTeamPlayers = leftTeamPlayers
        receivingTeamPlayers = rightTeamPlayers
      } else {
        servingTeamPlayers = rightTeamPlayers
        receivingTeamPlayers = leftTeamPlayers
      }

      const serverName = servingTeamPlayers[serverIndex].name
      const receiverName = receivingTeamPlayers[receiverIndex].name
      const serverPartnerName = servingTeamPlayers[1 - serverIndex].name
      const receiverPartnerName = receivingTeamPlayers[1 - receiverIndex].name

      if (servingTeam === 'left') {
        this.gameState.teams.left.players = [
          { name: serverPartnerName, position: 'top' },
          { name: serverName, position: 'bottom' }
        ]
        this.gameState.teams.right.players = [
          { name: receiverName, position: 'top' },
          { name: receiverPartnerName, position: 'bottom' }
        ]
      } else {
        this.gameState.teams.left.players = [
          { name: receiverPartnerName, position: 'top' },
          { name: receiverName, position: 'bottom' }
        ]
        this.gameState.teams.right.players = [
          { name: serverPartnerName, position: 'bottom' },
          { name: serverName, position: 'top' }
        ]
      }
    }

    getCurrentServer() {
      const servingTeam = this.gameState.serving.team
      const serverNum = this.gameState.serving.player
      const players = this.gameState.teams[servingTeam].players
      const currentServer = players[serverNum - 1]
      
      return {
        team: servingTeam,
        serverNumber: serverNum,
        playerName: currentServer.name,
        position: currentServer.position,
        courtPosition: servingTeam === 'left' ? 
          (currentServer.position === 'top' ? 'CLT' : 'CLB') :
          (currentServer.position === 'top' ? 'CRT' : 'CRB')
      }
    }

    scorePoint(team) {
      this.gameState.teams[team].score++
      this.switchTeamSides(team)
      this.switchServingSide()
    }

    performSideOut() {
      const currentTeam = this.gameState.serving.team
      const currentServer = this.gameState.serving.player
      
      if (currentServer === 1) {
        this.gameState.serving.player = 2
      } else {
        this.gameState.serving.team = (currentTeam === 'left') ? 'right' : 'left'
        this.gameState.serving.player = 2  // Always start with server #2 when switching teams
      }
    }

    switchTeamSides(team) {
      const players = this.gameState.teams[team].players
      if (players.length === 2) {
        const temp = players[0].position
        players[0].position = players[1].position
        players[1].position = temp
      }
    }

    switchServingSide() {
      const servingTeam = this.gameState.serving.team
      const score = this.gameState.teams[servingTeam].score
      this.gameState.serving.side = (score % 2 === 0) ? 'right' : 'left'
    }
  }

  describe('All Starting Player Combinations - Left Court Serves', () => {
    test('Mike serves, David receives (0→0)', () => {
      const app = new TestApp()
      app.setupGame('left', 0, 0)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('Mike Wilson')
      expect(server.courtPosition).toBe('CLB')
      expect(server.serverNumber).toBe(2)
    })

    test('Mike serves, Emma receives (0→1)', () => {
      const app = new TestApp()
      app.setupGame('left', 0, 1)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('Mike Wilson')
      expect(server.courtPosition).toBe('CLB')
      expect(server.serverNumber).toBe(2)
    })

    test('Lisa serves, David receives (1→0)', () => {
      const app = new TestApp()
      app.setupGame('left', 1, 0)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('Lisa Chen')
      expect(server.courtPosition).toBe('CLB')
      expect(server.serverNumber).toBe(2)
    })

    test('Lisa serves, Emma receives (1→1)', () => {
      const app = new TestApp()
      app.setupGame('left', 1, 1)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('Lisa Chen')
      expect(server.courtPosition).toBe('CLB')
      expect(server.serverNumber).toBe(2)
    })
  })

  describe('All Starting Player Combinations - Right Court Serves', () => {
    test('David serves, Mike receives (0→0)', () => {
      const app = new TestApp()
      app.setupGame('right', 0, 0)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('David Brown')
      expect(server.courtPosition).toBe('CRT')
      expect(server.serverNumber).toBe(2)
    })

    test('David serves, Lisa receives (0→1)', () => {
      const app = new TestApp()
      app.setupGame('right', 0, 1)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('David Brown')
      expect(server.courtPosition).toBe('CRT')
      expect(server.serverNumber).toBe(2)
    })

    test('Emma serves, Mike receives (1→0)', () => {
      const app = new TestApp()
      app.setupGame('right', 1, 0)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('Emma Davis')
      expect(server.courtPosition).toBe('CRT')
      expect(server.serverNumber).toBe(2)
    })

    test('Emma serves, Lisa receives (1→1)', () => {
      const app = new TestApp()
      app.setupGame('right', 1, 1)
      const server = app.getCurrentServer()
      
      expect(server.playerName).toBe('Emma Davis')
      expect(server.courtPosition).toBe('CRT')
      expect(server.serverNumber).toBe(2)
    })
  })

  describe('Game Start Validation', () => {
    test('All games start with server #2', () => {
      const leftApp = new TestApp()
      leftApp.setupGame('left')
      expect(leftApp.gameState.serving.player).toBe(2)
      
      const rightApp = new TestApp()
      rightApp.setupGame('right')
      expect(rightApp.gameState.serving.player).toBe(2)
    })

    test('Score format is always x-x-2 at start', () => {
      const scenarios = ['left', 'right']
      
      scenarios.forEach(servingTeam => {
        const app = new TestApp()
        app.setupGame(servingTeam)
        
        expect(app.gameState.teams.left.score).toBe(0)
        expect(app.gameState.teams.right.score).toBe(0)
        expect(app.gameState.serving.player).toBe(2)
      })
    })
  })

  describe('Position Swapping After Scoring', () => {
    test('Left team positions swap after each point', () => {
      const app = new TestApp()
      app.setupGame('left')
      
      // Initial: Mike-CLT, Lisa-CLB
      expect(app.gameState.teams.left.players[0].name).toBe('Mike Wilson')
      expect(app.gameState.teams.left.players[0].position).toBe('top')
      expect(app.gameState.teams.left.players[1].name).toBe('Lisa Chen')
      expect(app.gameState.teams.left.players[1].position).toBe('bottom')
      
      // After scoring: Lisa-CLT, Mike-CLB
      app.scorePoint('left')
      expect(app.gameState.teams.left.players[0].name).toBe('Mike Wilson')
      expect(app.gameState.teams.left.players[0].position).toBe('bottom')
      expect(app.gameState.teams.left.players[1].name).toBe('Lisa Chen')
      expect(app.gameState.teams.left.players[1].position).toBe('top')
    })

    test('Right team positions swap after each point', () => {
      const app = new TestApp()
      app.setupGame('right')
      
      // Initial: David-CRB, Emma-CRT
      expect(app.gameState.teams.right.players[0].name).toBe('David Brown')
      expect(app.gameState.teams.right.players[0].position).toBe('bottom')
      expect(app.gameState.teams.right.players[1].name).toBe('Emma Davis')
      expect(app.gameState.teams.right.players[1].position).toBe('top')
      
      // After scoring: Emma-CRB, David-CRT
      app.scorePoint('right')
      expect(app.gameState.teams.right.players[0].name).toBe('David Brown')
      expect(app.gameState.teams.right.players[0].position).toBe('top')
      expect(app.gameState.teams.right.players[1].name).toBe('Emma Davis')
      expect(app.gameState.teams.right.players[1].position).toBe('bottom')
    })
  })

  describe('Cross-Court Serving Validation', () => {
    test('All serving scenarios maintain cross-court rule', () => {
      const scenarios = [
        { team: 'left', server: 'Lisa Chen', serverPos: 'CLB', receiver: 'Emma Davis', receiverPos: 'CRB' },
        { team: 'right', server: 'Emma Davis', serverPos: 'CRT', receiver: 'Mike Wilson', receiverPos: 'CLT' }
      ]

      scenarios.forEach(scenario => {
        const app = new TestApp()
        app.setupGame(scenario.team)
        const server = app.getCurrentServer()
        
        expect(server.playerName).toBe(scenario.server)
        expect(server.courtPosition).toBe(scenario.serverPos)
        
        // Verify cross-court positioning
        const oppositeTeam = scenario.team === 'left' ? 'right' : 'left'
        const receivingPlayers = app.gameState.teams[oppositeTeam].players
        const expectedReceiver = receivingPlayers.find(p => 
          (scenario.receiverPos === 'CRB' && p.position === 'bottom') ||
          (scenario.receiverPos === 'CLT' && p.position === 'top')
        )
        expect(expectedReceiver.name).toBe(scenario.receiver)
      })
    })
  })
})