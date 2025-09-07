// Test setup and utilities

// Mock sessionStorage for testing
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  })
}

// Test utilities
export function createMockApp(gameMode = 'singles') {
  const mockApp = {
    gameState: {
      matchId: null,
      gameMode: gameMode,
      teams: {
        left: { score: 0, players: [] },
        right: { score: 0, players: [] }
      },
      serving: {
        team: 'left',
        player: 1,
        side: 'right'
      },
      gameStatus: 'active'
    }
  }
  
  if (gameMode === 'singles') {
    mockApp.gameState.teams.left.players = [{ name: 'Player 1' }]
    mockApp.gameState.teams.right.players = [{ name: 'Player 2' }]
  } else {
    mockApp.gameState.teams.left.players = [
      { name: 'Player 1A', position: 'top' },
      { name: 'Player 1B', position: 'bottom' }
    ]
    mockApp.gameState.teams.right.players = [
      { name: 'Player 2A', position: 'top' },
      { name: 'Player 2B', position: 'bottom' }
    ]
    mockApp.gameState.serving.player = 2 // First game starts with server #2
  }
  
  return mockApp
}