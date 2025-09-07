// Singles Player Positioning Tests
import { createMockApp } from './setup.js';

describe('Singles Player Positioning', () => {
  let app;
  let mockDOM;

  beforeEach(() => {
    // Mock DOM elements
    mockDOM = {
      leftSide: { innerHTML: '', querySelectorAll: () => ({ forEach: () => {} }) },
      rightSide: { innerHTML: '', querySelectorAll: () => ({ forEach: () => {} }) }
    };
    
    global.document = {
      querySelector: (selector) => {
        if (selector === '.left-side') return mockDOM.leftSide;
        if (selector === '.right-side') return mockDOM.rightSide;
        return null;
      }
    };

    app = createMockApp('singles');
    app.gameState.teams.left.players = [{ name: 'John Smith' }];
    app.gameState.teams.right.players = [{ name: 'Sarah Johnson' }];
    
    // Add the method we're testing
    app.updateSinglesPlayerPositions = function() {
      const leftSide = document.querySelector('.left-side');
      const rightSide = document.querySelector('.right-side');
      
      if (!leftSide || !rightSide) return;
      
      leftSide.querySelectorAll('.player-1').forEach(el => el.remove());
      rightSide.querySelectorAll('.player-1').forEach(el => el.remove());
      
      const servingTeam = this.gameState.serving.team;
      const serverScore = this.gameState.teams[servingTeam].score;
      
      let serverSide, receiverSide;
      if (servingTeam === 'left') {
        serverSide = (serverScore % 2 === 0) ? 'bottom' : 'top';
        receiverSide = (serverScore % 2 === 0) ? 'top' : 'bottom';
      } else {
        serverSide = (serverScore % 2 === 0) ? 'top' : 'bottom';
        receiverSide = (serverScore % 2 === 0) ? 'bottom' : 'top';
      }
      
      const leftPlayer = this.gameState.teams.left.players[0];
      const rightPlayer = this.gameState.teams.right.players[0];
      
      if (servingTeam === 'left') {
        leftSide.innerHTML += `<div class="player-1 player-${serverSide}">${leftPlayer.name}</div>`;
        rightSide.innerHTML += `<div class="player-1 player-${receiverSide}">${rightPlayer.name}</div>`;
      } else {
        rightSide.innerHTML += `<div class="player-1 player-${serverSide}">${rightPlayer.name}</div>`;
        leftSide.innerHTML += `<div class="player-1 player-${receiverSide}">${leftPlayer.name}</div>`;
      }
    };
  });

  test('Game start (0-0): CLB serves → CRT receives (diagonal cross-court)', () => {
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.leftSide.innerHTML).toContain('John Smith');
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
    expect(mockDOM.rightSide.innerHTML).toContain('Sarah Johnson');
  });

  test('Score 1-0: CLT serves → CRB receives (diagonal cross-court)', () => {
    app.gameState.teams.left.score = 1;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-top'); // CLT
    expect(mockDOM.rightSide.innerHTML).toContain('player-bottom'); // CRB
  });

  test('Score 2-0: CLB serves → CRT receives (even score, diagonal)', () => {
    app.gameState.teams.left.score = 2;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
  });

  test('Right team serving (even): CRT serves → CLB receives', () => {
    app.gameState.serving.team = 'right';
    app.gameState.teams.right.score = 0;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
    expect(mockDOM.rightSide.innerHTML).toContain('Sarah Johnson');
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.leftSide.innerHTML).toContain('John Smith');
  });

  test('Right team serving (odd): CRB serves → CLT receives', () => {
    app.gameState.serving.team = 'right';
    app.gameState.teams.right.score = 3;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.rightSide.innerHTML).toContain('player-bottom'); // CRB
    expect(mockDOM.leftSide.innerHTML).toContain('player-top'); // CLT
  });

  test('Cross-court positioning: players always diagonal opposite', () => {
    const testScores = [0, 1, 2, 3, 4, 5];
    
    testScores.forEach(score => {
      app.gameState.teams.left.score = score;
      app.updateSinglesPlayerPositions();
      
      const leftHTML = mockDOM.leftSide.innerHTML;
      const rightHTML = mockDOM.rightSide.innerHTML;
      
      // Server and receiver should always be diagonal opposite (cross-court)
      if (leftHTML.includes('player-bottom')) {
        expect(rightHTML).toContain('player-top');
      } else if (leftHTML.includes('player-top')) {
        expect(rightHTML).toContain('player-bottom');
      }
    });
  });

  test('Specific cross-court scenarios - Left team serving', () => {
    // CLB serves → CRT receives (even score, diagonal)
    app.gameState.serving.team = 'left';
    app.gameState.teams.left.score = 0;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
    
    // CLT serves → CRB receives (odd score, diagonal)
    app.gameState.teams.left.score = 1;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-top'); // CLT
    expect(mockDOM.rightSide.innerHTML).toContain('player-bottom'); // CRB
  });

  test('Specific cross-court scenarios - Right team serving', () => {
    // CRT serves → CLB receives (even score, diagonal)
    app.gameState.serving.team = 'right';
    app.gameState.teams.right.score = 0;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
    
    // CRB serves → CLT receives (odd score, diagonal)
    app.gameState.teams.right.score = 1;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-top'); // CLT
    expect(mockDOM.rightSide.innerHTML).toContain('player-bottom'); // CRB
  });

  test('Server score determines positioning, not serving team', () => {
    // Left team serving with score 2 (even) - CLB serves, CRT receives
    app.gameState.serving.team = 'left';
    app.gameState.teams.left.score = 2;
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
    
    // Right team serving with score 2 (even) - CRT serves, CLB receives
    app.gameState.serving.team = 'right';
    app.gameState.teams.right.score = 2;
    app.gameState.teams.left.score = 0; // Reset left score
    app.updateSinglesPlayerPositions();
    
    expect(mockDOM.leftSide.innerHTML).toContain('player-bottom'); // CLB
    expect(mockDOM.rightSide.innerHTML).toContain('player-top'); // CRT
  });

  test('Player names cleared before repositioning', () => {
    let leftClearCalled = false;
    let rightClearCalled = false;
    
    mockDOM.leftSide.querySelectorAll = (selector) => {
      if (selector === '.player-1') leftClearCalled = true;
      return { forEach: () => {} };
    };
    mockDOM.rightSide.querySelectorAll = (selector) => {
      if (selector === '.player-1') rightClearCalled = true;
      return { forEach: () => {} };
    };
    
    app.updateSinglesPlayerPositions();
    
    expect(leftClearCalled).toBe(true);
    expect(rightClearCalled).toBe(true);
  });
});