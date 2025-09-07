// Tournament System Configuration
const TournamentConfig = {
  // API Configuration
  apis: {
    auth: {
      endpoint: 'https://api.tournament-system.com/auth',
      method: 'POST',
      required: {
        authCode: 'string'
      },
      response: {
        token: 'string',
        refereeId: 'string',
        expiresIn: 'number'
      }
    },
    matches: {
      endpoint: 'https://api.tournament-system.com/matches',
      method: 'GET',
      required: {
        matchId: 'string'
      },
      response: {
        matchId: 'string',
        gameMode: 'string',
        players: 'array',
        tournament: 'string',
        round: 'string'
      }
    },
    scores: {
      endpoint: 'https://api.tournament-system.com/scores',
      method: 'POST',
      required: {
        matchId: 'string',
        gameMode: 'string',
        finalScore: 'object',
        winner: 'string',
        players: 'object',
        timestamp: 'string',
        refereeId: 'string'
      },
      response: {
        success: 'boolean',
        submissionId: 'string',
        message: 'string'
      }
    },

    timeout: 10000,
    retryAttempts: 3
  },
  
  // Demo Mode Settings
  demo: {
    enabled: true,
    successRate: 0.8,  // 80% success rate (0.0 = always fail, 1.0 = always succeed)
    authCodes: ['REF2024', 'ADMIN123', 'DEMO', 'TEST']
  },
  
  // Game Settings
  game: {
    winningScore: 11,    // Default points needed to win
    winByMargin: 2,      // Points ahead needed to win
    maxScore: 30,        // Maximum possible score
    historyLimit: 20     // Number of game states to keep for undo
  },
  
  // UI Settings
  ui: {
    touchFeedbackDuration: 300,
    scoreAnimationDuration: 300,
    notificationDuration: 10000,
    resultDisplayDuration: 5000
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TournamentConfig;
} else {
  window.TournamentConfig = TournamentConfig;
}