// Demo Match Data for Testing
const DemoData = {
  matches: {
    'MATCH-001': {
      matchId: 'MATCH-001',
      gameMode: 'singles',
      players: [
        { playerId: 'P001', name: 'John Smith', team: 'A', ranking: 4.2 },
        { playerId: 'P002', name: 'Sarah Johnson', team: 'B', ranking: 4.1 }
      ],
      tournament: 'Summer Championship',
      round: 'Quarterfinals',
      maxScore: 15
    },
    'MATCH-002': {
      matchId: 'MATCH-002',
      gameMode: 'doubles',
      players: [
        { playerId: 'P101', name: 'Mike Wilson', team: 'A', ranking: 4.5 },
        { playerId: 'P102', name: 'Lisa Chen', team: 'A', ranking: 4.3 },
        { playerId: 'P201', name: 'David Brown', team: 'B', ranking: 4.4 },
        { playerId: 'P202', name: 'Emma Davis', team: 'B', ranking: 4.2 }
      ],
      tournament: 'Doubles Tournament',
      round: 'Semifinals',
      maxScore: 21
    },
    'MATCH-003': {
      matchId: 'MATCH-003',
      gameMode: 'singles',
      players: [
        { playerId: 'P301', name: 'Alex Rodriguez', team: 'A', ranking: 4.0 },
        { playerId: 'P302', name: 'Maria Garcia', team: 'B', ranking: 3.8 }
      ],
      tournament: 'Default Rules Tournament',
      round: 'Finals'
      // No maxScore - should fall back to config.js default (11)
    }
  },
  
  // Helper method to get match by ID
  getMatch(matchId) {
    return this.matches[matchId] || null;
  },
  
  // Get all available match IDs
  getMatchIds() {
    return Object.keys(this.matches);
  },
  
  // Validate if match ID exists
  isValidMatch(matchId) {
    return matchId in this.matches;
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DemoData;
} else {
  window.DemoData = DemoData;
}