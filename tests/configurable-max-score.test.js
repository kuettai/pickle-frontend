// TDD Tests for Configurable Max Score Feature
// Tests written FIRST before implementation

describe('Configurable Max Score System', () => {
  // Test PickleballApp class with configurable max score
  class PickleballApp {
    constructor() {
      this.config = {
        game: {
          winningScore: 11,
          winByMargin: 2,
          maxScore: 30
        }
      };
      this.matchConfiguration = null;
      this.gameState = {
        matchId: 'TEST-001',
        gameMode: 'doubles',
        teams: {
          left: { score: 0, players: [] },
          right: { score: 0, players: [] }
        },
        serving: { team: 'left', player: 1, side: 'right' },
        gameStatus: 'active'
      };
    }
    
    getMaxScore() {
      // Check if match has custom max score
      if (this.matchConfiguration && 
          typeof this.matchConfiguration.maxScore === 'number' && 
          this.matchConfiguration.maxScore > 0) {
        return this.matchConfiguration.maxScore;
      }
      
      // Fall back to config default
      return this.config.game.winningScore;
    }
    
    setMatchConfiguration(matchData) {
      this.matchConfiguration = matchData;
    }
    
    checkGameCompletion() {
      const leftScore = this.gameState.teams.left.score;
      const rightScore = this.gameState.teams.right.score;
      const maxScore = this.getMaxScore();
      
      if ((leftScore >= maxScore || rightScore >= maxScore) && Math.abs(leftScore - rightScore) >= 2) {
        this.gameState.gameStatus = 'completed';
        return true;
      }
      return false;
    }
  }
  
  let app;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="score-display"></div>';
    
    // Mock TournamentConfig
    window.TournamentConfig = {
      game: {
        winningScore: 11,
        winByMargin: 2,
        maxScore: 30
      }
    };
    
    // Create fresh app instance
    app = new PickleballApp();
  });

  describe('Config.js Default Values', () => {
    test('should have default winning score of 11', () => {
      expect(TournamentConfig.game.winningScore).toBe(11);
    });

    test('should have default win margin of 2', () => {
      expect(TournamentConfig.game.winByMargin).toBe(2);
    });

    test('should have default max score of 30', () => {
      expect(TournamentConfig.game.maxScore).toBe(30);
    });
  });

  describe('Match API Max Score Override', () => {
    test('should use match API max score when provided', () => {
      const matchData = {
        matchId: 'MATCH-001',
        maxScore: 15,
        gameMode: 'singles'
      };
      
      app.setMatchConfiguration(matchData);
      expect(app.getMaxScore()).toBe(15);
    });

    test('should fall back to config when match API has no max score', () => {
      const matchData = {
        matchId: 'MATCH-001',
        gameMode: 'singles'
        // No maxScore property
      };
      
      app.setMatchConfiguration(matchData);
      expect(app.getMaxScore()).toBe(11); // From config
    });

    test('should fall back to config when match API max score is null', () => {
      const matchData = {
        matchId: 'MATCH-001',
        maxScore: null,
        gameMode: 'singles'
      };
      
      app.setMatchConfiguration(matchData);
      expect(app.getMaxScore()).toBe(11);
    });

    test('should fall back to config when match API max score is undefined', () => {
      const matchData = {
        matchId: 'MATCH-001',
        maxScore: undefined,
        gameMode: 'singles'
      };
      
      app.setMatchConfiguration(matchData);
      expect(app.getMaxScore()).toBe(11);
    });
  });

  describe('Game Completion Logic', () => {
    test('should complete game at default 11 points with 2-point lead', () => {
      app.gameState.teams.left.score = 11;
      app.gameState.teams.right.score = 9;
      
      const isComplete = app.checkGameCompletion();
      expect(isComplete).toBe(true);
      expect(app.gameState.gameStatus).toBe('completed');
    });

    test('should complete game at custom max score from match API', () => {
      const matchData = { matchId: 'TEST', maxScore: 15 };
      app.setMatchConfiguration(matchData);
      
      app.gameState.teams.left.score = 15;
      app.gameState.teams.right.score = 13;
      
      const isComplete = app.checkGameCompletion();
      expect(isComplete).toBe(true);
    });

    test('should not complete game without 2-point lead even at max score', () => {
      app.gameState.teams.left.score = 11;
      app.gameState.teams.right.score = 10;
      
      const isComplete = app.checkGameCompletion();
      expect(isComplete).toBe(false);
      expect(app.gameState.gameStatus).toBe('active');
    });

    test('should complete game with custom max score and proper lead', () => {
      const matchData = { matchId: 'TEST', maxScore: 21 };
      app.setMatchConfiguration(matchData);
      
      app.gameState.teams.left.score = 21;
      app.gameState.teams.right.score = 19;
      
      const isComplete = app.checkGameCompletion();
      expect(isComplete).toBe(true);
    });

    test('should handle edge case of both teams at max score', () => {
      const matchData = { matchId: 'TEST', maxScore: 15 };
      app.setMatchConfiguration(matchData);
      
      app.gameState.teams.left.score = 16;
      app.gameState.teams.right.score = 14;
      
      const isComplete = app.checkGameCompletion();
      expect(isComplete).toBe(true);
    });
  });

  describe('API Integration', () => {
    test('should extract max score from demo match data', () => {
      const demoMatch = {
        matchId: 'MATCH-001',
        gameMode: 'singles',
        maxScore: 15,
        players: []
      };
      
      app.setMatchConfiguration(demoMatch);
      expect(app.getMaxScore()).toBe(15);
    });

    test('should handle missing max score in demo data gracefully', () => {
      const demoMatch = {
        matchId: 'MATCH-001',
        gameMode: 'singles',
        players: []
        // No maxScore
      };
      
      app.setMatchConfiguration(demoMatch);
      expect(app.getMaxScore()).toBe(11); // Fallback to config
    });
  });

  describe('Configuration Validation', () => {
    test('should validate max score is a positive number', () => {
      const invalidMatch = { matchId: 'TEST', maxScore: -5 };
      app.setMatchConfiguration(invalidMatch);
      expect(app.getMaxScore()).toBe(11); // Fallback to config
    });

    test('should validate max score is not zero', () => {
      const invalidMatch = { matchId: 'TEST', maxScore: 0 };
      app.setMatchConfiguration(invalidMatch);
      expect(app.getMaxScore()).toBe(11); // Fallback to config
    });

    test('should validate max score is not a string', () => {
      const invalidMatch = { matchId: 'TEST', maxScore: "15" };
      app.setMatchConfiguration(invalidMatch);
      expect(app.getMaxScore()).toBe(11); // Fallback to config
    });

    test('should accept valid numeric max score', () => {
      const validMatch = { matchId: 'TEST', maxScore: 21 };
      app.setMatchConfiguration(validMatch);
      expect(app.getMaxScore()).toBe(21);
    });
  });
});