// Serving System Logic Tests
describe('Serving System Tests', () => {
  // Mock PickleballApp for serving tests
  class TestPickleballApp {
    constructor() {
      this.gameState = {
        gameMode: 'doubles',
        teams: {
          left: { score: 0, players: [] },
          right: { score: 0, players: [] }
        },
        serving: {
          team: 'left',
          player: 2,
          side: 'right'
        },
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

    setupPlayersFromMatch(match) {
      const teamAPlayers = match.players.filter(p => p.team === 'A')
      const teamBPlayers = match.players.filter(p => p.team === 'B')
      
      const leftTeamPlayers = this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers
      const rightTeamPlayers = this.teamAssignment.teamA === 'left' ? teamBPlayers : teamAPlayers
      
      if (this.gameState.serving.team === 'left') {
        // Left team serves: server #2 at bottom (CLB)
        this.gameState.teams.left.players = [
          { name: leftTeamPlayers[0].name, position: 'top' },    // Mike at CLT
          { name: leftTeamPlayers[1].name, position: 'bottom' }  // Lisa at CLB (server #2)
        ]
        this.gameState.teams.right.players = [
          { name: rightTeamPlayers[0].name, position: 'top' },    // David at CRT
          { name: rightTeamPlayers[1].name, position: 'bottom' }  // Emma at CRB
        ]
      } else {
        // Right team serves: server #2 at top (CRT)
        this.gameState.teams.left.players = [
          { name: leftTeamPlayers[0].name, position: 'top' },     // Mike at CLT
          { name: leftTeamPlayers[1].name, position: 'bottom' }   // Lisa at CLB
        ]
        this.gameState.teams.right.players = [
          { name: rightTeamPlayers[0].name, position: 'bottom' }, // David at CRB
          { name: rightTeamPlayers[1].name, position: 'top' }     // Emma at CRT (server #2)
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
  }

  describe('Left Team Serves First', () => {
    test('should start with server #2 at CLB (cross-court)', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'left'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const server = app.getCurrentServer()
      
      expect(server.serverNumber).toBe(2)
      expect(server.courtPosition).toBe('CLB')
      expect(server.playerName).toBe('Lisa Chen')
      expect(server.position).toBe('bottom')
    })

    test('should have correct player positions', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'left'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const leftPlayers = app.gameState.teams.left.players
      const rightPlayers = app.gameState.teams.right.players
      
      // Left team positions
      expect(leftPlayers[0].name).toBe('Mike Wilson')    // CLT
      expect(leftPlayers[0].position).toBe('top')
      expect(leftPlayers[1].name).toBe('Lisa Chen')      // CLB
      expect(leftPlayers[1].position).toBe('bottom')
      
      // Right team positions  
      expect(rightPlayers[0].name).toBe('David Brown')   // CRT
      expect(rightPlayers[0].position).toBe('top')
      expect(rightPlayers[1].name).toBe('Emma Davis')    // CRB
      expect(rightPlayers[1].position).toBe('bottom')
    })
  })

  describe('Right Team Serves First - CRITICAL TESTS', () => {
    test('should start with server #2 at CRT (cross-court)', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'right'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const server = app.getCurrentServer()
      
      console.log('Right team server info:', server)
      console.log('Right team players:', app.gameState.teams.right.players)
      
      expect(server.serverNumber).toBe(2)
      expect(server.courtPosition).toBe('CRT')
      expect(server.playerName).toBe('Emma Davis')
      expect(server.position).toBe('top')
    })

    test('should have correct player positions', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'right'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const leftPlayers = app.gameState.teams.left.players
      const rightPlayers = app.gameState.teams.right.players
      
      // Left team positions
      expect(leftPlayers[0].name).toBe('Mike Wilson')    // CLT
      expect(leftPlayers[0].position).toBe('top')
      expect(leftPlayers[1].name).toBe('Lisa Chen')      // CLB
      expect(leftPlayers[1].position).toBe('bottom')
      
      // Right team positions
      expect(rightPlayers[0].name).toBe('David Brown')   // CRB
      expect(rightPlayers[0].position).toBe('bottom')
      expect(rightPlayers[1].name).toBe('Emma Davis')    // CRT (server #2)
      expect(rightPlayers[1].position).toBe('top')
    })

    test('server #2 should be at array index 1', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'right'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const serverNum = app.gameState.serving.player
      const serverIndex = serverNum - 1
      const rightPlayers = app.gameState.teams.right.players
      const server = rightPlayers[serverIndex]
      
      expect(serverNum).toBe(2)
      expect(serverIndex).toBe(1)
      expect(server.name).toBe('Emma Davis')
      expect(server.position).toBe('top')
    })
  })

  describe('Cross-Court Serving Rule', () => {
    test('left team should serve CLB → CRB (cross-court)', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'left'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const server = app.getCurrentServer()
      const rightPlayers = app.gameState.teams.right.players
      const receiver = rightPlayers.find(p => p.position === 'bottom')
      
      expect(server.courtPosition).toBe('CLB')
      expect(receiver.name).toBe('Emma Davis')
    })

    test('right team should serve CRT → CLT (cross-court)', () => {
      const app = new TestPickleballApp()
      app.gameState.serving.team = 'right'
      app.setupPlayersFromMatch(app.loadedMatch)
      
      const server = app.getCurrentServer()
      const leftPlayers = app.gameState.teams.left.players
      const receiver = leftPlayers.find(p => p.position === 'top')
      
      expect(server.courtPosition).toBe('CRT')
      expect(receiver.name).toBe('Mike Wilson')
    })
  })

  describe('Score Display', () => {
    test('should always start with server #2', () => {
      const leftApp = new TestPickleballApp()
      leftApp.gameState.serving.team = 'left'
      expect(leftApp.gameState.serving.player).toBe(2)
      
      const rightApp = new TestPickleballApp()
      rightApp.gameState.serving.team = 'right'
      expect(rightApp.gameState.serving.player).toBe(2)
    })
  })
})