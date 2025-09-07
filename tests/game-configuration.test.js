// Game Configuration Interface Tests
describe('Game Configuration Interface', () => {
  class TestApp {
    constructor() {
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
      this.resetSelections()
    }

    resetSelections() {
      this.selectedServer = undefined
      this.selectedReceiver = undefined
      this.selectedServerSide = undefined
      this.selectedReceiverSide = undefined
      this.selectedServerName = undefined
      this.selectedReceiverName = undefined
      this.servingTeam = null
    }

    selectPlayer(side, index, name) {
      if (!this.selectedServerSide) {
        // First selection - set as server
        this.selectedServer = index
        this.selectedServerSide = side
        this.selectedServerName = name
        this.servingTeam = side
      } else if (!this.selectedReceiverSide && side !== this.selectedServerSide) {
        // Second selection - set as receiver (must be opposite side)
        this.selectedReceiver = index
        this.selectedReceiverSide = side
        this.selectedReceiverName = name
      } else {
        // Reset and start over
        this.selectedServer = index
        this.selectedServerSide = side
        this.selectedServerName = name
        this.selectedReceiver = undefined
        this.selectedReceiverSide = undefined
        this.selectedReceiverName = undefined
        this.servingTeam = side
      }
    }

    switchSides() {
      this.teamAssignment = {
        teamA: this.teamAssignment.teamA === 'left' ? 'right' : 'left',
        teamB: this.teamAssignment.teamB === 'left' ? 'right' : 'left'
      }
      this.resetSelections()
    }

    isConfigurationComplete() {
      return !!(this.selectedServerSide && this.selectedReceiverSide)
    }

    getTeamPlayers(side) {
      const teamAPlayers = this.loadedMatch.players.filter(p => p.team === 'A')
      const teamBPlayers = this.loadedMatch.players.filter(p => p.team === 'B')
      
      if (side === 'left') {
        return this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers
      } else {
        return this.teamAssignment.teamA === 'right' ? teamAPlayers : teamBPlayers
      }
    }
  }

  describe('Player Selection Logic', () => {
    test('first selection sets server', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      
      expect(app.selectedServerSide).toBe('left')
      expect(app.selectedServer).toBe(0)
      expect(app.selectedServerName).toBe('Mike Wilson')
      expect(app.servingTeam).toBe('left')
      expect(app.selectedReceiverSide).toBeUndefined()
    })

    test('second selection on opposite side sets receiver', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      
      expect(app.selectedServerSide).toBe('left')
      expect(app.selectedServerName).toBe('Mike Wilson')
      expect(app.selectedReceiverSide).toBe('right')
      expect(app.selectedReceiverName).toBe('Emma Davis')
      expect(app.isConfigurationComplete()).toBe(true)
    })

    test('second selection on same side resets to new server', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('left', 1, 'Lisa Chen')
      
      expect(app.selectedServerSide).toBe('left')
      expect(app.selectedServerName).toBe('Lisa Chen')
      expect(app.selectedReceiverSide).toBeUndefined()
      expect(app.isConfigurationComplete()).toBe(false)
    })

    test('selection after complete configuration resets', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      app.selectPlayer('right', 0, 'David Brown')
      
      expect(app.selectedServerSide).toBe('right')
      expect(app.selectedServerName).toBe('David Brown')
      expect(app.selectedReceiverSide).toBeUndefined()
      expect(app.servingTeam).toBe('right')
    })
  })

  describe('Team Assignment Logic', () => {
    test('default team assignment', () => {
      const app = new TestApp()
      
      expect(app.teamAssignment.teamA).toBe('left')
      expect(app.teamAssignment.teamB).toBe('right')
      
      const leftPlayers = app.getTeamPlayers('left')
      const rightPlayers = app.getTeamPlayers('right')
      
      expect(leftPlayers[0].name).toBe('Mike Wilson')
      expect(leftPlayers[1].name).toBe('Lisa Chen')
      expect(rightPlayers[0].name).toBe('David Brown')
      expect(rightPlayers[1].name).toBe('Emma Davis')
    })

    test('switch sides changes team assignment', () => {
      const app = new TestApp()
      app.switchSides()
      
      expect(app.teamAssignment.teamA).toBe('right')
      expect(app.teamAssignment.teamB).toBe('left')
      
      const leftPlayers = app.getTeamPlayers('left')
      const rightPlayers = app.getTeamPlayers('right')
      
      expect(leftPlayers[0].name).toBe('David Brown')
      expect(leftPlayers[1].name).toBe('Emma Davis')
      expect(rightPlayers[0].name).toBe('Mike Wilson')
      expect(rightPlayers[1].name).toBe('Lisa Chen')
    })

    test('switch sides resets player selections', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      
      expect(app.isConfigurationComplete()).toBe(true)
      
      app.switchSides()
      
      expect(app.selectedServerSide).toBeUndefined()
      expect(app.selectedReceiverSide).toBeUndefined()
      expect(app.isConfigurationComplete()).toBe(false)
    })
  })

  describe('All Player Combinations', () => {
    test('Mike serves, David receives', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 0, 'David Brown')
      
      expect(app.selectedServerName).toBe('Mike Wilson')
      expect(app.selectedReceiverName).toBe('David Brown')
      expect(app.servingTeam).toBe('left')
    })

    test('Mike serves, Emma receives', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      
      expect(app.selectedServerName).toBe('Mike Wilson')
      expect(app.selectedReceiverName).toBe('Emma Davis')
      expect(app.servingTeam).toBe('left')
    })

    test('Lisa serves, David receives', () => {
      const app = new TestApp()
      app.selectPlayer('left', 1, 'Lisa Chen')
      app.selectPlayer('right', 0, 'David Brown')
      
      expect(app.selectedServerName).toBe('Lisa Chen')
      expect(app.selectedReceiverName).toBe('David Brown')
      expect(app.servingTeam).toBe('left')
    })

    test('Lisa serves, Emma receives', () => {
      const app = new TestApp()
      app.selectPlayer('left', 1, 'Lisa Chen')
      app.selectPlayer('right', 1, 'Emma Davis')
      
      expect(app.selectedServerName).toBe('Lisa Chen')
      expect(app.selectedReceiverName).toBe('Emma Davis')
      expect(app.servingTeam).toBe('left')
    })

    test('David serves, Mike receives', () => {
      const app = new TestApp()
      app.selectPlayer('right', 0, 'David Brown')
      app.selectPlayer('left', 0, 'Mike Wilson')
      
      expect(app.selectedServerName).toBe('David Brown')
      expect(app.selectedReceiverName).toBe('Mike Wilson')
      expect(app.servingTeam).toBe('right')
    })

    test('David serves, Lisa receives', () => {
      const app = new TestApp()
      app.selectPlayer('right', 0, 'David Brown')
      app.selectPlayer('left', 1, 'Lisa Chen')
      
      expect(app.selectedServerName).toBe('David Brown')
      expect(app.selectedReceiverName).toBe('Lisa Chen')
      expect(app.servingTeam).toBe('right')
    })

    test('Emma serves, Mike receives', () => {
      const app = new TestApp()
      app.selectPlayer('right', 1, 'Emma Davis')
      app.selectPlayer('left', 0, 'Mike Wilson')
      
      expect(app.selectedServerName).toBe('Emma Davis')
      expect(app.selectedReceiverName).toBe('Mike Wilson')
      expect(app.servingTeam).toBe('right')
    })

    test('Emma serves, Lisa receives', () => {
      const app = new TestApp()
      app.selectPlayer('right', 1, 'Emma Davis')
      app.selectPlayer('left', 1, 'Lisa Chen')
      
      expect(app.selectedServerName).toBe('Emma Davis')
      expect(app.selectedReceiverName).toBe('Lisa Chen')
      expect(app.servingTeam).toBe('right')
    })
  })

  describe('Configuration Validation', () => {
    test('incomplete configuration - no selections', () => {
      const app = new TestApp()
      expect(app.isConfigurationComplete()).toBe(false)
    })

    test('incomplete configuration - server only', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      expect(app.isConfigurationComplete()).toBe(false)
    })

    test('complete configuration - server and receiver', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      expect(app.isConfigurationComplete()).toBe(true)
    })

    test('cross-court validation - server and receiver on opposite sides', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      
      expect(app.selectedServerSide).not.toBe(app.selectedReceiverSide)
      expect(app.selectedServerSide).toBe('left')
      expect(app.selectedReceiverSide).toBe('right')
    })
  })

  describe('Edge Cases', () => {
    test('selecting first player (index 0) works correctly', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      
      expect(app.selectedServer).toBe(0)
      expect(app.selectedServerName).toBe('Mike Wilson')
      expect(app.selectedServerSide).toBe('left')
    })

    test('multiple resets work correctly', () => {
      const app = new TestApp()
      
      // First configuration
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      expect(app.isConfigurationComplete()).toBe(true)
      
      // Reset by selecting new server
      app.selectPlayer('right', 0, 'David Brown')
      expect(app.selectedServerName).toBe('David Brown')
      expect(app.selectedReceiverSide).toBeUndefined()
      
      // Complete new configuration
      app.selectPlayer('left', 1, 'Lisa Chen')
      expect(app.selectedReceiverName).toBe('Lisa Chen')
      expect(app.isConfigurationComplete()).toBe(true)
    })

    test('switch sides after configuration works', () => {
      const app = new TestApp()
      app.selectPlayer('left', 0, 'Mike Wilson')
      app.selectPlayer('right', 1, 'Emma Davis')
      
      app.switchSides()
      
      // Team assignments changed
      expect(app.teamAssignment.teamA).toBe('right')
      expect(app.teamAssignment.teamB).toBe('left')
      
      // Selections cleared
      expect(app.isConfigurationComplete()).toBe(false)
      
      // Can make new selections with switched teams
      app.selectPlayer('left', 0, 'David Brown')
      app.selectPlayer('right', 1, 'Lisa Chen')
      expect(app.isConfigurationComplete()).toBe(true)
    })
  })
})