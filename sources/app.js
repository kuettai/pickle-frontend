// Pickleball Scoring System - Main Application
// Import ScoreSubmission class
if (typeof ScoreSubmission === 'undefined') {
  // Load ScoreSubmission if not already loaded
  const script = document.createElement('script');
  script.src = './score-submission.js';
  document.head.appendChild(script);
}

// Import OfflineManager class
if (typeof OfflineManager === 'undefined') {
  // Load OfflineManager if not already loaded
  const script = document.createElement('script');
  script.src = './offline-manager.js';
  document.head.appendChild(script);
}

class PickleballApp {
  constructor(container) {
    this.container = container || document.body;
    this.gameState = {
      matchId: null,
      gameMode: null,
      teams: {
        left: { score: 0, players: [] },
        right: { score: 0, players: [] }
      },
      serving: {
        team: 'left',
        player: 1,
        side: 'right'
      },
      gameStatus: 'setup'
    };
    
    this.gameHistory = [];
    this.gameStartTime = null;
    this.gameDuration = 0;
    this.matchConfiguration = null;
    
    // Initialize Performance Optimizer
    this.performanceOptimizer = null;
    this.initializePerformanceOptimizer();
    
    // Initialize ScoreSubmission system
    this.initializeScoreSubmission();
    
    // Initialize TouchFeedback system
    this.touchFeedback = null;
    
    // Initialize OfflineManager system
    this.offlineManager = null;
    
    // Two-step authentication state
    this.authState = {
      refId: null,
      verificationCode: null,
      token: null,
      codeRequestTime: null,
      attempts: 0,
      currentScreen: 'auth-step1'
    };
    
    // Use external configuration
    this.config = TournamentConfig;
    
    this.init();
  }
  
  initializePerformanceOptimizer() {
    const initOptimizer = () => {
      if (typeof PerformanceOptimizer !== 'undefined') {
        this.performanceOptimizer = new PerformanceOptimizer();
        this.performanceOptimizer.startPerformanceMonitoring();
        this.performanceOptimizer.optimizeBatteryUsage();
        
        // Wrap critical methods with performance monitoring
        this.handleCourtTouch = this.performanceOptimizer.measureTouchResponse(
          this.handleCourtTouch.bind(this)
        );
        
        this.updateDisplay = this.performanceOptimizer.measurePerformance(
          'updateDisplay',
          this.updateDisplay.bind(this)
        );
        
        this.updateScoreDisplay = this.performanceOptimizer.measurePerformance(
          'updateScoreDisplay', 
          this.updateScoreDisplay.bind(this)
        );
        
      } else {
        setTimeout(initOptimizer, 100);
      }
    };
    initOptimizer();
  }
  
  initializeScoreSubmission() {
    // Create mock API client for ScoreSubmission
    this.apiClient = {
      submitScore: async (data) => {
        // Use existing sendScoreToTournament logic
        const result = await this.sendScoreToTournament();
        if (result.success) {
          return { success: true, submissionId: result.submissionId };
        } else {
          throw new Error(result.error || 'Submission failed');
        }
      },
      isOnline: () => navigator.onLine
    };
    
    // Initialize ScoreSubmission when class is available
    const initSubmission = () => {
      if (typeof ScoreSubmission !== 'undefined') {
        this.scoreSubmission = new ScoreSubmission(this.apiClient);
        
        // Add global debug functions
        window.viewQueue = () => {
          const queue = this.scoreSubmission.getQueuedSubmissions();
          const auditLog = this.scoreSubmission.getAuditLog();
          console.log('=== SCORE SUBMISSION QUEUE ===');
          console.log('Queued submissions:', queue.length);
          queue.forEach((item, index) => {
            console.log(`${index + 1}.`, item);
          });
          console.log('\n=== AUDIT LOG ===');
          console.log('Total submissions:', auditLog.length);
          auditLog.forEach((item, index) => {
            console.log(`${index + 1}.`, item);
          });
          console.log('========================');
          return { queue, auditLog };
        };
        
        window.processQueue = async () => {
          console.log('Processing queued submissions...');
          const result = await this.scoreSubmission.processQueuedSubmissions();
          console.log('Queue processing result:', result);
          return result;
        };
        
      } else {
        setTimeout(initSubmission, 100);
      }
    };
    initSubmission();
  }
  
  initializeOfflineManager() {
    // Initialize OfflineManager when class is available
    const initOffline = () => {
      if (typeof OfflineManager !== 'undefined') {
        this.offlineManager = new OfflineManager();
        
        // Setup connection monitoring
        this.offlineManager.startConnectionMonitoring((isOnline) => {
          if (isOnline) {
            this.onConnectionRestored();
          } else {
            this.onConnectionLost();
          }
        });
        
        // Enable auto-save for game state
        this.offlineManager.enableAutoSave();
        
        // Setup action processor for offline queue
        this.offlineManager.setActionProcessor(async (action) => {
          return this.processOfflineAction(action);
        });
        
        // Initial connection indicator update
        this.offlineManager.updateConnectionIndicator();
        
      } else {
        setTimeout(initOffline, 100);
      }
    };
    initOffline();
  }

  init() {
    this.setupEventListeners();
    this.checkExistingAuth();
    this.checkPendingSubmissions();
    this.initializeOfflineManager();
  }
  
  checkPendingSubmissions() {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions') || '[]');
    
    if (pendingSubmissions.length > 0) {
      console.log(`Found ${pendingSubmissions.length} pending submission(s)`);
      
      // Show notification if user is authenticated
      if (sessionStorage.getItem('authToken')) {
        this.showPendingSubmissionsNotification(pendingSubmissions.length);
      }
    }
  }
  
  showPendingSubmissionsNotification(count) {
    const notification = document.createElement('div');
    notification.className = 'pending-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>📤 ${count} pending score submission(s)</span>
        <button onclick="app.retryPendingSubmissions()" class="retry-all-btn">Retry All</button>
        <button onclick="app.dismissNotification()" class="dismiss-btn">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }
  
  async retryPendingSubmissions() {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions') || '[]');
    let successCount = 0;
    let failCount = 0;
    
    for (const submission of pendingSubmissions) {
      try {
        // Temporarily set game state for submission
        const originalState = this.gameState;
        this.gameState = {
          matchId: submission.matchId,
          gameMode: submission.gameMode,
          teams: {
            left: { score: submission.finalScore.left, players: submission.players.left },
            right: { score: submission.finalScore.right, players: submission.players.right }
          }
        };
        
        const result = await this.sendScoreToTournament();
        if (result.success) {
          successCount++;
        }
        
        // Restore original state
        this.gameState = originalState;
      } catch (error) {
        failCount++;
        console.error('Failed to submit pending score:', error);
      }
    }
    
    // Update pending submissions (remove successful ones)
    if (successCount > 0) {
      const remainingSubmissions = pendingSubmissions.slice(successCount);
      localStorage.setItem('pendingSubmissions', JSON.stringify(remainingSubmissions));
    }
    
    // Show result
    this.showSubmissionResult(successCount, failCount);
    this.dismissNotification();
  }
  
  showSubmissionResult(successCount, failCount) {
    const message = successCount > 0 
      ? `✅ ${successCount} submission(s) successful${failCount > 0 ? `, ${failCount} failed` : ''}` 
      : `❌ All ${failCount} submission(s) failed - saved for later retry`;
    
    const result = document.createElement('div');
    result.className = 'submission-result';
    result.innerHTML = `<div class="result-content">${message}</div>`;
    document.body.appendChild(result);
    
    setTimeout(() => {
      if (result.parentNode) {
        result.remove();
      }
    }, 5000);
  }
  
  dismissNotification() {
    const notification = document.querySelector('.pending-notification');
    if (notification) {
      notification.remove();
    }
  }
  
  getStartingServerInfo() {
    // Reconstruct starting server/receiver from current game state
    const servingTeam = this.gameState.serving.team;
    const servingPlayers = this.gameState.teams[servingTeam].players;
    const receivingTeam = servingTeam === 'left' ? 'right' : 'left';
    const receivingPlayers = this.gameState.teams[receivingTeam].players;
    
    if (this.gameState.gameMode === 'singles') {
      return {
        startingServer: {
          playerId: servingPlayers[0].playerId,
          name: servingPlayers[0].name,
          team: servingTeam
        },
        startingReceiver: {
          playerId: receivingPlayers[0].playerId,
          name: receivingPlayers[0].name,
          team: receivingTeam
        }
      };
    } else {
      // For doubles, determine starting server and receiver based on positions
      // Starting server is always server #2 (index 1) for first game
      const startingServer = servingPlayers[1]; // Server #2
      
      // Starting receiver is cross-court from server
      let startingReceiver;
      if (servingTeam === 'left') {
        // Left team server #2 is at bottom, so receiver is at top (cross-court)
        startingReceiver = receivingPlayers.find(p => p.position === 'top');
      } else {
        // Right team server #2 is at top, so receiver is at bottom (cross-court)
        startingReceiver = receivingPlayers.find(p => p.position === 'bottom');
      }
      
      return {
        startingServer: {
          playerId: startingServer.playerId,
          name: startingServer.name,
          team: servingTeam,
          position: startingServer.position,
          serverNumber: 2
        },
        startingReceiver: {
          playerId: startingReceiver.playerId,
          name: startingReceiver.name,
          team: receivingTeam,
          position: startingReceiver.position
        },
        crossCourtServing: true
      };
    }
  }

  checkExistingAuth() {
    const authToken = sessionStorage.getItem('authToken');
    const refereeId = sessionStorage.getItem('refereeId');
    const tokenExpires = sessionStorage.getItem('tokenExpires');
    
    if (authToken && refereeId && tokenExpires && Date.now() < parseInt(tokenExpires)) {
      // Already authenticated and token not expired
      this.authState.token = authToken;
      this.authState.currentScreen = 'authenticated';
      this.showMatchSetup();
    } else {
      // Need to authenticate (or token expired)
      if (tokenExpires && Date.now() >= parseInt(tokenExpires)) {
        // Clear expired token
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('tokenExpires');
        sessionStorage.removeItem('refereeId');
      }
      this.showAuthScreen();
    }
  }

  setupEventListeners() {
    // Touch events for court scoring with passive listeners for performance
    const leftArea = document.querySelector('.left-side');
    const rightArea = document.querySelector('.right-side');
    
    if (leftArea) {
      // Use passive listeners for better performance
      leftArea.addEventListener('touchstart', (e) => {
        // Immediate visual feedback on touch start
        this.addTouchFeedback('left');
      }, { passive: true });
      
      leftArea.addEventListener('touchend', (e) => this.handleCourtTouch('left', e), { passive: false });
      leftArea.addEventListener('click', (e) => this.handleCourtTouch('left', e));
    }
    
    if (rightArea) {
      rightArea.addEventListener('touchstart', (e) => {
        // Immediate visual feedback on touch start
        this.addTouchFeedback('right');
      }, { passive: true });
      
      rightArea.addEventListener('touchend', (e) => this.handleCourtTouch('right', e), { passive: false });
      rightArea.addEventListener('click', (e) => this.handleCourtTouch('right', e));
    }
  }

  handleCourtTouch(touchedSide, event) {
    event.preventDefault();
    
    if (this.gameState.gameStatus !== 'active') return;
    
    // Add immediate touch feedback with performance optimization
    requestAnimationFrame(() => {
      this.addTouchFeedback(touchedSide);
    });
    
    this.saveGameState();
    
    const servingTeam = this.gameState.serving.team;
    
    if (touchedSide === servingTeam) {
      // Serving team wins rally - score point
      this.scorePoint(servingTeam);
    } else {
      // Receiving team wins rally - side out
      this.performSideOut();
    }
    
    // Batch DOM updates for better performance
    if (this.performanceOptimizer) {
      this.performanceOptimizer.batchDOMUpdates([
        () => this.updateDisplay(),
        () => this.checkGameCompletion()
      ]);
    } else {
      this.updateDisplay();
      this.checkGameCompletion();
    }
  }
  
  addTouchFeedback(side) {
    // Use cached element for better performance
    let sideElement = this.performanceOptimizer ? 
      this.performanceOptimizer.getCachedElement(`${side}-side`) : 
      document.querySelector(`.${side}-side`);
    
    if (!sideElement) {
      sideElement = document.querySelector(`.${side}-side`);
      if (this.performanceOptimizer) {
        this.performanceOptimizer.cacheElement(`${side}-side`, `.${side}-side`);
      }
    }
    
    if (sideElement) {
      // Use optimized animation for touch feedback
      if (this.performanceOptimizer) {
        this.performanceOptimizer.createOptimizedAnimation(sideElement, [
          { backgroundColor: '#00AA00', transform: 'scale(1)' },
          { backgroundColor: '#00FF00', transform: 'scale(1.02)' },
          { backgroundColor: '#00AA00', transform: 'scale(1)' }
        ], { duration: 150 });
      } else {
        sideElement.classList.add('touch-feedback');
        setTimeout(() => {
          sideElement.classList.remove('touch-feedback');
        }, 300);
      }
    }
  }

  scorePoint(team) {
    this.gameState.teams[team].score++;
    this.lastAction = 'point';
    
    if (this.gameState.gameMode === 'singles') {
      // Singles: serving player switches sides after scoring
      this.switchServingSide();
    } else {
      // Doubles: both players on serving team switch sides after scoring
      this.switchTeamSides(team);
      this.switchServingSide();
    }
  }

  performSideOut() {
    const currentTeam = this.gameState.serving.team;
    const currentServer = this.gameState.serving.player;
    this.lastAction = 'sideout';
    
    if (this.gameState.gameMode === 'singles') {
      // Switch to other team
      this.gameState.serving.team = (currentTeam === 'left') ? 'right' : 'left';
    } else {
      // Doubles logic
      if (currentServer === 1) {
        // Switch to server 2 on same team
        this.gameState.serving.player = 2;
      } else {
        // Switch teams after both servers
        this.gameState.serving.team = (currentTeam === 'left') ? 'right' : 'left';
        // Set server to whoever is on the right-hand side for the new team
        this.setServerToRightSidePlayer();
      }
    }
    
    this.updateServingSide();
  }

  setServerToRightSidePlayer() {
    // When switching teams, server #1 should be the player on the right-hand side
    // Right-hand side is relative to each team's perspective (closer to center net)
    const newServingTeam = this.gameState.serving.team;
    const players = this.gameState.teams[newServingTeam].players;
    
    let servingPlayer;
    if (newServingTeam === 'left') {
      // Left team serves from BOTTOM (cross-court)
      servingPlayer = players.find(p => p.position === 'bottom');
    } else {
      // Right team serves from TOP (cross-court)
      servingPlayer = players.find(p => p.position === 'top');
    }
    
    // Always start with server #1, but make sure the serving player is designated as player 1
    const servingPlayerIndex = players.findIndex(p => p === servingPlayer);
    if (servingPlayerIndex === 1) {
      // If serving player is currently player 2, swap the players so they become player 1
      const temp = players[0];
      players[0] = players[1];
      players[1] = temp;
    }
    
    // Always start with server 1 when switching teams
    this.gameState.serving.player = 1;
  }

  ensureCorrectStartingServer() {
    // For game start, ensure the correct player is serving based on serving side
    if (this.gameState.gameMode === 'doubles') {
      const servingTeam = this.gameState.serving.team;
      const players = this.gameState.teams[servingTeam].players;
      
      // At game start with score 0-0, serve from right side
      // Right side player should be server #1
      let servingPlayer;
      if (servingTeam === 'left') {
        // Left team serves from BOTTOM (cross-court to right team's TOP)
        servingPlayer = players.find(p => p.position === 'bottom');
      } else {
        // Right team serves from TOP (cross-court to left team's BOTTOM)
        servingPlayer = players.find(p => p.position === 'top');
      }
      
      // Make sure serving player is player 1 (server #1)
      const servingPlayerIndex = players.findIndex(p => p === servingPlayer);
      if (servingPlayerIndex === 1) {
        // Swap players so serving player becomes index 0 (player 1)
        const temp = players[0];
        players[0] = players[1];
        players[1] = temp;
      }
    }
  }

  switchServingSide() {
    const servingTeam = this.gameState.serving.team;
    const score = this.gameState.teams[servingTeam].score;
    this.gameState.serving.side = (score % 2 === 0) ? 'right' : 'left';
  }

  updateServingSide() {
    const servingTeam = this.gameState.serving.team;
    const score = this.gameState.teams[servingTeam].score;
    this.gameState.serving.side = (score % 2 === 0) ? 'right' : 'left';
  }

  switchTeamSides(team) {
    // In doubles, when a team scores, both players switch court positions
    const players = this.gameState.teams[team].players;
    if (players.length === 2) {
      // Swap top and bottom positions
      const temp = players[0].position;
      players[0].position = players[1].position;
      players[1].position = temp;
    }
  }

  updatePlayerPositions() {
    if (this.gameState.gameMode === 'singles') {
      this.updateSinglesPlayerPositions();
    } else {
      this.updateDoublesPlayerPositions();
    }
  }
  
  updateSinglesPlayerPositions() {
    const leftSide = document.querySelector('.left-side');
    const rightSide = document.querySelector('.right-side');
    
    if (!leftSide || !rightSide) return;
    
    // Clear existing player names
    leftSide.querySelectorAll('.player-1').forEach(el => el.remove());
    rightSide.querySelectorAll('.player-1').forEach(el => el.remove());
    
    // Get current serving info
    const servingTeam = this.gameState.serving.team;
    const serverScore = this.gameState.teams[servingTeam].score;
    
    let serverSide, receiverSide;
    if (servingTeam === 'left') {
      // Left team: CLB (bottom) = right-hand = even, CLT (top) = left-hand = odd
      serverSide = (serverScore % 2 === 0) ? 'bottom' : 'top';
      receiverSide = (serverScore % 2 === 0) ? 'top' : 'bottom'; // Diagonal opposite
    } else {
      // Right team: CRT (top) = right-hand = even, CRB (bottom) = left-hand = odd
      serverSide = (serverScore % 2 === 0) ? 'top' : 'bottom';
      receiverSide = (serverScore % 2 === 0) ? 'bottom' : 'top'; // Diagonal opposite
    }
    
    // Position players - cross-court (diagonal)
    const leftPlayer = this.gameState.teams.left.players[0];
    const rightPlayer = this.gameState.teams.right.players[0];
    
    if (servingTeam === 'left') {
      // Left team serves - server at serverSide, receiver diagonally opposite
      leftSide.innerHTML += `<div class="player-1 player-${serverSide}">${leftPlayer.name}</div>`;
      rightSide.innerHTML += `<div class="player-1 player-${receiverSide}">${rightPlayer.name}</div>`;
    } else {
      // Right team serves - server at serverSide, receiver diagonally opposite  
      rightSide.innerHTML += `<div class="player-1 player-${serverSide}">${rightPlayer.name}</div>`;
      leftSide.innerHTML += `<div class="player-1 player-${receiverSide}">${leftPlayer.name}</div>`;
    }
  }
  
  updateDoublesPlayerPositions() {
    // Update player name display based on current positions
    const leftSide = document.querySelector('.left-side');
    const rightSide = document.querySelector('.right-side');
    
    // Clear existing player names
    leftSide.querySelectorAll('.player-top, .player-bottom').forEach(el => el.remove());
    rightSide.querySelectorAll('.player-top, .player-bottom').forEach(el => el.remove());
    
    // Re-add player names in correct positions
    const leftPlayers = this.gameState.teams.left.players;
    const rightPlayers = this.gameState.teams.right.players;
    
    const leftTop = leftPlayers.find(p => p.position === 'top');
    const leftBottom = leftPlayers.find(p => p.position === 'bottom');
    const rightTop = rightPlayers.find(p => p.position === 'top');
    const rightBottom = rightPlayers.find(p => p.position === 'bottom');
    
    leftSide.innerHTML += `
      <div class="player-top">${leftTop.name}</div>
      <div class="player-bottom">${leftBottom.name}</div>
    `;
    rightSide.innerHTML += `
      <div class="player-top">${rightTop.name}</div>
      <div class="player-bottom">${rightBottom.name}</div>
    `;
  }

  checkGameCompletion() {
    const leftScore = this.gameState.teams.left.score;
    const rightScore = this.gameState.teams.right.score;
    const maxScore = this.getMaxScore();
    
    if ((leftScore >= maxScore || rightScore >= maxScore) && Math.abs(leftScore - rightScore) >= 2) {
      this.gameState.gameStatus = 'completed';
      this.showGameComplete();
      return true;
    }
    return false;
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

  updateDisplay() {
    this.updateScoreDisplay();
    this.updatePlayerPositions();
    this.updateServerHighlight();
    
    // Trigger touch feedback animations
    if (this.touchFeedback) {
      const action = this.lastAction || 'update';
      this.touchFeedback.onGameStateUpdate(this.gameState, action);
    }
    
    // Update offline manager with game state changes
    if (this.offlineManager) {
      this.offlineManager.onGameStateChange(this.gameState);
      this.offlineManager.updateConnectionIndicator();
    }
  }

  updateScoreDisplay() {
    // Use cached element for better performance
    let scoreElement = this.performanceOptimizer ? 
      this.performanceOptimizer.getCachedElement('score-display') : 
      document.getElementById('score-display');
    
    if (!scoreElement) {
      scoreElement = document.getElementById('score-display');
      if (this.performanceOptimizer) {
        this.performanceOptimizer.cacheElement('score-display', '#score-display');
      }
    }
    
    if (!scoreElement) return;
    
    const leftScore = this.gameState.teams.left.score;
    const rightScore = this.gameState.teams.right.score;
    const serverNum = this.gameState.serving.player;
    
    let scoreText;
    if (this.gameState.gameMode === 'singles') {
      scoreText = `${leftScore} - ${rightScore}`;
    } else {
      scoreText = `${leftScore} - ${rightScore} - ${serverNum}`;
    }
    
    // Optimized animation using transform
    if (this.performanceOptimizer) {
      this.performanceOptimizer.createOptimizedAnimation(scoreElement, [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 0.8 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 200 });
    } else {
      scoreElement.classList.add('updating');
      setTimeout(() => scoreElement.classList.remove('updating'), 300);
    }
    
    scoreElement.textContent = scoreText;
  }

  updateServerHighlight() {
    // Remove existing highlights and icons
    document.querySelectorAll('.current-server').forEach(el => {
      el.classList.remove('current-server');
    });
    document.querySelectorAll('.player-1, .player-top, .player-bottom').forEach(el => {
      el.innerHTML = el.innerHTML.replace(/🏓|🟡/g, '').trim();
    });
    
    const servingTeam = this.gameState.serving.team;
    const receivingTeam = servingTeam === 'left' ? 'right' : 'left';
    
    if (this.gameState.gameMode === 'singles') {
      // Singles: highlight server and receiver
      const serverElement = document.querySelector(`.${servingTeam}-side .player-1`);
      const receiverElement = document.querySelector(`.${receivingTeam}-side .player-1`);
      
      if (serverElement) {
        serverElement.classList.add('current-server');
        serverElement.innerHTML = '🏓 ' + serverElement.innerHTML;
      }
      if (receiverElement) {
        receiverElement.innerHTML = '🏓 ' + receiverElement.innerHTML;
      }
    } else {
      // Doubles: highlight server and cross-court receiver
      const activeServer = this.gameState.serving.activeServer || this.gameState.serving.player;
      const players = this.gameState.teams[servingTeam].players;
      const currentServer = players[activeServer - 1];
      
      if (currentServer) {
        const serverPosition = currentServer.position;
        const serverElement = document.querySelector(`.${servingTeam}-side .player-${serverPosition}`);
        
        // Cross-court receiver (opposite position)
        const receiverPosition = serverPosition === 'top' ? 'bottom' : 'top';
        const receiverElement = document.querySelector(`.${receivingTeam}-side .player-${receiverPosition}`);
        
        if (serverElement) {
          serverElement.classList.add('current-server');
          serverElement.innerHTML = '🏓 ' + serverElement.innerHTML;
        }
        if (receiverElement) {
          receiverElement.innerHTML = '🏓 ' + receiverElement.innerHTML;
        }
      }
    }
  }



  showAuthScreen() {
    this.authState.currentScreen = 'auth-step1';
    this.showStep1Screen();
  }
  
  showStep1Screen() {
    document.body.innerHTML = `
      <div class="auth-screen">
        <div class="connection-indicator" id="connection-status">📶 Online</div>
        <h1>Pickleball Tournament Scoring</h1>
        <div class="auth-form">
          <div class="step-indicator">
            <span class="step active">1</span>
            <span class="step-line"></span>
            <span class="step">2</span>
          </div>
          <h3>Step 1: Enter Referee ID</h3>
          <input type="text" id="ref-id" placeholder="Enter Referee ID (try: REF2024)" />
          <button onclick="app.requestVerificationCode()" id="send-code-btn">Send Code</button>
          <div class="demo-codes">
            <p><strong>Demo IDs:</strong></p>
            <p>REF2024 - Tournament Referee</p>
            <p>ADMIN123 - Tournament Admin</p>
            <p>DEMO - Demo Mode (code: 111111)</p>
          </div>
          <div id="auth-error" class="auth-error" style="display: none;"></div>
        </div>
      </div>
    `;
    
    // Update connection indicator
    if (this.offlineManager) {
      this.offlineManager.updateConnectionIndicator();
    }
  }
  
  showStep2Screen(maskedContact, method) {
    this.authState.currentScreen = 'auth-step2';
    document.body.innerHTML = `
      <div class="auth-screen">
        <div class="connection-indicator" id="connection-status">📶 Online</div>
        <h1>Pickleball Tournament Scoring</h1>
        <div class="auth-form">
          <div class="step-indicator">
            <span class="step completed">✓</span>
            <span class="step-line"></span>
            <span class="step active">2</span>
          </div>
          <h3>Step 2: Enter Verification Code</h3>
          <p class="contact-info">Code sent via ${method} to: <strong>${maskedContact}</strong></p>
          <input type="text" id="verification-code" placeholder="Enter 6-digit code" maxlength="6" />
          <div class="auth-buttons">
            <button onclick="app.verifyCode()" id="verify-btn">Verify</button>
            <button onclick="app.goBackToStep1()" class="back-btn">← Back</button>
          </div>
          <div class="resend-section">
            <button onclick="app.resendCode()" id="resend-btn" disabled>Resend Code</button>
            <span id="resend-timer">Wait 60s</span>
          </div>
          <div id="auth-error" class="auth-error" style="display: none;"></div>
        </div>
      </div>
    `;
    
    // Start resend timer
    this.startResendTimer();
    
    // Update connection indicator
    if (this.offlineManager) {
      this.offlineManager.updateConnectionIndicator();
    }
  }

  async requestVerificationCode() {
    const refId = document.getElementById('ref-id')?.value.toUpperCase().trim() || this.mockRefId;
    
    if (!refId || refId.trim() === '') {
      if (document.getElementById('ref-id')) {
        this.showAuthError('Please enter a Referee ID');
        return;
      } else {
        throw new Error('Please enter a Referee ID');
      }
    }
    
    const sendBtn = document.getElementById('send-code-btn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
    try {
      let response;
      
      if (this.config.demo.enabled && this.config.demo.authCodes.includes(refId)) {
        // Demo mode - simulate code request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (refId === 'DEMO' || refId === 'TEST') {
          response = {
            success: true,
            message: "Demo mode: Use code 111111",
            method: "demo",
            maskedContact: "demo@example.com"
          };
        } else {
          response = {
            success: true,
            message: "Verification code sent successfully",
            method: "email",
            maskedContact: "j***@tournament.com"
          };
        }
      } else {
        // Real API call
        const apiResponse = await fetch(`${this.config.apis.auth.endpoint}/request-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refId }),
          timeout: this.config.apis.timeout
        });
        
        response = await apiResponse.json();
        
        if (!response.success) {
          throw new Error(response.message || 'Failed to send verification code');
        }
      }
      
      // Store ref ID and request time
      this.authState.refId = refId;
      this.authState.codeRequestTime = Date.now();
      this.authState.attempts = 0;
      
      // Show step 2
      this.showStep2Screen(response.maskedContact, response.method);
      
    } catch (error) {
      this.showAuthError(error.message || 'Failed to send verification code');
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Code';
    }
  }
  
  async verifyCode() {
    const verificationCode = document.getElementById('verification-code')?.value.trim() || this.mockVerificationCode;
    
    if (!verificationCode || verificationCode.length !== 6) {
      if (document.getElementById('verification-code')) {
        this.showAuthError('Please enter a 6-digit verification code');
        return;
      } else {
        throw new Error('Please enter a 6-digit verification code');
      }
    }
    
    const verifyBtn = document.getElementById('verify-btn');
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';
    
    try {
      let response;
      
      if (this.config.demo.enabled && this.config.demo.authCodes.includes(this.authState.refId)) {
        // Demo mode - simulate verification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if ((this.authState.refId === 'DEMO' || this.authState.refId === 'TEST') && verificationCode === '111111') {
          response = {
            token: "demo-jwt-token-" + Date.now(),
            refereeId: "DEMO-REF",
            expiresIn: 1800,
            refreshToken: "demo-refresh-token"
          };
        } else if (verificationCode === '123456') {
          response = {
            token: "jwt-token-" + Date.now(),
            refereeId: this.authState.refId === 'ADMIN123' ? 'ADMIN001' : 'REF001',
            expiresIn: 3600,
            refreshToken: "refresh-token-" + Date.now()
          };
        } else {
          this.authState.attempts++;
          const attemptsRemaining = 3 - this.authState.attempts;
          
          if (attemptsRemaining <= 0) {
            throw new Error('Too many failed attempts. Please request a new code.');
          } else {
            throw new Error(`Invalid verification code. ${attemptsRemaining} attempts remaining.`);
          }
        }
      } else {
        // Real API call
        const apiResponse = await fetch(`${this.config.apis.auth.endpoint}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            refId: this.authState.refId, 
            verificationCode 
          }),
          timeout: this.config.apis.timeout
        });
        
        response = await apiResponse.json();
        
        if (!response.token) {
          this.authState.attempts++;
          throw new Error(response.message || 'Invalid verification code');
        }
      }
      
      // Store JWT token
      this.storeJWTToken(response.token, response.refreshToken, response.expiresIn);
      sessionStorage.setItem('refereeId', response.refereeId);
      
      // Clear auth state
      this.authState = {
        refId: null,
        verificationCode: null,
        token: response.token,
        codeRequestTime: null,
        attempts: 0,
        currentScreen: 'authenticated'
      };
      
      // Navigate to match setup
      this.showMatchSetup();
      
    } catch (error) {
      this.showAuthError(error.message || 'Verification failed');
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify';
    }
  }
  
  storeJWTToken(token, refreshToken, expiresIn) {
    sessionStorage.setItem('authToken', token);
    sessionStorage.setItem('refreshToken', refreshToken);
    sessionStorage.setItem('tokenExpires', Date.now() + (expiresIn * 1000));
  }
  
  goBackToStep1() {
    this.authState.currentScreen = 'auth-step1';
    this.authState.refId = null;
    this.authState.codeRequestTime = null;
    this.authState.attempts = 0;
    this.showStep1Screen();
  }
  
  async resendCode() {
    if (!this.authState.refId) {
      this.goBackToStep1();
      return;
    }
    
    const resendBtn = document.getElementById('resend-btn');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    
    try {
      // Reset attempts
      this.authState.attempts = 0;
      
      // Simulate resend (same logic as initial request)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let response;
      if (this.authState.refId === 'DEMO' || this.authState.refId === 'TEST') {
        response = {
          success: true,
          message: "Demo mode: Use code 111111",
          method: "demo",
          maskedContact: "demo@example.com"
        };
      } else {
        response = {
          success: true,
          message: "Verification code sent successfully",
          method: "email",
          maskedContact: "j***@tournament.com"
        };
      }
      
      this.authState.codeRequestTime = Date.now();
      
      // Show success message
      const contactInfo = document.querySelector('.contact-info');
      contactInfo.innerHTML = `Code resent via ${response.method} to: <strong>${response.maskedContact}</strong>`;
      
      // Restart timer
      this.startResendTimer();
      
    } catch (error) {
      this.showAuthError('Failed to resend code: ' + error.message);
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  }
  
  startResendTimer() {
    const resendBtn = document.getElementById('resend-btn');
    const timerSpan = document.getElementById('resend-timer');
    let seconds = 60;
    
    const timer = setInterval(() => {
      seconds--;
      timerSpan.textContent = `Wait ${seconds}s`;
      
      if (seconds <= 0) {
        clearInterval(timer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
        timerSpan.textContent = '';
      }
    }, 1000);
  }

  showAuthError(message) {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      
      // Clear error after 5 seconds
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }
  
  showMatchError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'match-error';
    errorDiv.innerHTML = `
      <div class="error-content">
        <span>⚠️ ${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="dismiss-btn">×</button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 8000);
  }

  showMatchSetup() {
    const refereeId = sessionStorage.getItem('refereeId');
    const refereeType = refereeId === 'admin-001' ? 'Admin' : 'Referee';
    const pendingCount = JSON.parse(localStorage.getItem('pendingSubmissions') || '[]').length;
    const queueCount = JSON.parse(localStorage.getItem('scoreSubmissionQueue') || '[]').length;
    
    document.body.innerHTML = `
      <div class="match-setup">
        <div class="connection-indicator" id="connection-status">📶 Online</div>
        <div class="header">
          <h2>Match Setup</h2>
          <div class="user-info">
            <span>Logged in as: ${refereeType} (${refereeId})</span>
            ${pendingCount > 0 ? `<button class="pending-btn" onclick="app.showPendingSubmissions()">📤 ${pendingCount} Old Pending</button>` : ''}
            ${queueCount > 0 ? `<button class="queue-btn" onclick="app.showSubmissionQueue()">🔄 ${queueCount} Queued</button>` : ''}
            <button class="logout-btn" onclick="app.logout()">Logout</button>
          </div>
        </div>
        <div class="setup-form">
          <input type="text" id="match-uuid" placeholder="Enter Match UUID (try: MATCH-001)" value="MATCH-002" />
          <button onclick="app.loadMatch()">Load Match</button>
          <div class="demo-matches">
            <p><strong>Demo Matches:</strong></p>
            <p>MATCH-001 - Singles Championship (Max: 15)</p>
            <p>MATCH-002 - Doubles Tournament (Max: 21)</p>
            <p>MATCH-003 - Default Rules Tournament (Max: 11)</p>
          </div>
          <div id="team-assignment-section" style="display: none;">
            <h3>Team Court Assignment</h3>
            <div class="team-assignment">
              <div class="team-buttons">
                <button onclick="app.switchSides()" id="switch-btn">Switch Sides</button>
              </div>
              <div class="court-preview">
                <div class="left-court-preview" id="left-preview">LEFT COURT</div>
                <div class="right-court-preview" id="right-preview">RIGHT COURT</div>
              </div>
              <div class="player-selection" id="player-selection">
                <h4>Select Starting Server & Receiver</h4>
                <div class="player-config-court">
                  <div class="config-left-side" id="config-left">
                    <div class="config-court-label">LEFT COURT</div>
                    <div class="config-players" id="left-players"></div>
                  </div>
                  <div class="config-right-side" id="config-right">
                    <div class="config-court-label">RIGHT COURT</div>
                    <div class="config-players" id="right-players"></div>
                  </div>
                </div>
                <div class="config-instructions">
                  <p>1. Click a player to select as <strong>First Server</strong></p>
                  <p>2. Click a player on opposite court to select as <strong>First Receiver</strong></p>
                </div>
                <div class="config-status" id="config-status"></div>
              </div>
            </div>
            <button onclick="app.startGame()" id="start-game-btn">Start Game</button>
          </div>
        </div>
      </div>
    `;
    
    // Update connection indicator
    if (this.offlineManager) {
      this.offlineManager.updateConnectionIndicator();
    }
  }

  logout() {
    // Clear authentication data
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('tokenExpires');
    sessionStorage.removeItem('refereeId');
    
    // Reset auth state
    this.authState = {
      refId: null,
      verificationCode: null,
      token: null,
      codeRequestTime: null,
      attempts: 0,
      currentScreen: 'auth-step1'
    };
    
    // Reset game state
    this.gameState = {
      matchId: null,
      gameMode: null,
      teams: {
        left: { score: 0, players: [] },
        right: { score: 0, players: [] }
      },
      serving: {
        team: 'left',
        player: 1,
        side: 'right'
      },
      gameStatus: 'setup'
    };
    
    this.gameHistory = [];
    
    // Clear loaded match
    this.loadedMatch = null;
    
    // Return to auth screen
    this.showAuthScreen();
  }

  async loadMatch() {
    const uuid = document.getElementById('match-uuid').value.toUpperCase();
    
    // Check if match is already in submission queue
    const queuedSubmissions = JSON.parse(localStorage.getItem('scoreSubmissionQueue') || '[]');
    const matchInQueue = queuedSubmissions.find(item => item.matchId === uuid);
    
    if (matchInQueue) {
      this.showMatchError(`Match ${uuid} is already in the submission queue. Please process the queue first.`);
      return;
    }
    
    try {
      let match;
      if (this.config.demo.enabled && DemoData.isValidMatch(uuid)) {
        // Demo mode - use local data
        match = DemoData.getMatch(uuid);
      } else {
        // Real API - fetch from server
        const response = await fetch(`${this.config.apis.matches.endpoint}/${uuid}`, {
          method: this.config.apis.matches.method,
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          },
          timeout: this.config.apis.timeout
        });
        
        if (!response.ok) {
          throw new Error(`Match ${uuid} not found`);
        }
        
        match = await response.json();
      }
    
      if (match) {
        // Show match confirmation
        const confirmDiv = document.createElement('div');
        confirmDiv.className = 'match-confirmation';
        confirmDiv.innerHTML = `
          <h3>Match Loaded Successfully!</h3>
          <p><strong>Tournament:</strong> ${match.tournament}</p>
          <p><strong>Round:</strong> ${match.round}</p>
          <p><strong>Mode:</strong> ${match.gameMode.toUpperCase()}</p>
          <p><strong>Players:</strong> ${match.players.map(p => p.name).join(', ')}</p>
          <p><em>Please confirm the match details above are correct.</em></p>
        `;
        
        const setupForm = document.querySelector('.setup-form');
        const existing = document.querySelector('.match-confirmation');
        if (existing) existing.remove();
        setupForm.appendChild(confirmDiv);
        
        // Show team assignment section
        document.getElementById('team-assignment-section').style.display = 'block';
        
        // Reset game state for new match
        this.gameState = {
          matchId: match.matchId,
          gameMode: match.gameMode,
          teams: {
            left: { score: 0, players: [] },
            right: { score: 0, players: [] }
          },
          serving: {
            team: 'left',
            player: 1,
            side: 'right'
          },
          gameStatus: 'setup'
        };
        
        // Store match data and set default assignment
        this.loadedMatch = match;
        this.setMatchConfiguration(match);
        this.teamAssignment = { teamA: 'left', teamB: 'right' };
        this.servingTeam = null;
        this.updateCourtPreview();
        
        // Show player selection for all game modes
        this.showPlayerSelection();
      }
    } catch (error) {
      if (this.config.demo.enabled) {
        const availableMatches = DemoData.getMatchIds().join(' or ');
        alert(`Match not found. Try: ${availableMatches}`);
      } else {
        alert(`Failed to load match: ${error.message}`);
      }
    }
  }

  updateCourtPreview() {
    const teamAPlayers = this.loadedMatch.players.filter(p => p.team === 'A');
    const teamBPlayers = this.loadedMatch.players.filter(p => p.team === 'B');
    
    const formatTeamDisplay = (players) => {
      if (players.length === 1) {
        return `${players[0].name}\n(${players[0].ranking || 'N/A'})`;
      } else {
        return players.map(p => `${p.name} (${p.ranking || 'N/A'})`).join('\n');
      }
    };
    
    const teamADisplay = formatTeamDisplay(teamAPlayers);
    const teamBDisplay = formatTeamDisplay(teamBPlayers);
    
    const leftPreview = document.getElementById('left-preview');
    const rightPreview = document.getElementById('right-preview');
    
    // Clear previous selection styling
    leftPreview.classList.remove('serving-selected', 'server-court', 'receiver-court');
    rightPreview.classList.remove('serving-selected', 'server-court', 'receiver-court');
    
    if (this.teamAssignment.teamA === 'left') {
      leftPreview.textContent = `LEFT COURT\n${teamADisplay}`;
      rightPreview.textContent = `RIGHT COURT\n${teamBDisplay}`;
    } else {
      leftPreview.textContent = `LEFT COURT\n${teamBDisplay}`;
      rightPreview.textContent = `RIGHT COURT\n${teamADisplay}`;
    }
    
    // Apply server/receiver highlighting
    if (this.selectedServerSide === 'left') {
      leftPreview.classList.add('server-court');
      rightPreview.classList.add('receiver-court');
    } else if (this.selectedServerSide === 'right') {
      rightPreview.classList.add('server-court');
      leftPreview.classList.add('receiver-court');
    }
  }

  selectServingTeam(side) {
    this.servingTeam = side;
    this.updateCourtPreview();
  }

  showPlayerSelection() {
    this.populatePlayerSelection();
  }

  populatePlayerSelection() {
    const leftPlayersDiv = document.getElementById('left-players');
    const rightPlayersDiv = document.getElementById('right-players');
    
    // Clear existing players
    leftPlayersDiv.innerHTML = '';
    rightPlayersDiv.innerHTML = '';
    
    // Get team players from match data
    const teamAPlayers = this.loadedMatch.players.filter(p => p.team === 'A');
    const teamBPlayers = this.loadedMatch.players.filter(p => p.team === 'B');
    
    // Determine which team is on which side
    const leftTeamPlayers = this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers;
    const rightTeamPlayers = this.teamAssignment.teamA === 'left' ? teamBPlayers : teamAPlayers;
    
    // Create player buttons for left side
    leftTeamPlayers.forEach((player, index) => {
      const playerBtn = document.createElement('button');
      playerBtn.className = 'config-player-btn';
      playerBtn.textContent = player.name;
      playerBtn.dataset.side = 'left';
      playerBtn.dataset.index = index;
      playerBtn.onclick = () => this.selectPlayer('left', index, player.name);
      leftPlayersDiv.appendChild(playerBtn);
    });
    
    // Create player buttons for right side
    rightTeamPlayers.forEach((player, index) => {
      const playerBtn = document.createElement('button');
      playerBtn.className = 'config-player-btn';
      playerBtn.textContent = player.name;
      playerBtn.dataset.side = 'right';
      playerBtn.dataset.index = index;
      playerBtn.onclick = () => this.selectPlayer('right', index, player.name);
      rightPlayersDiv.appendChild(playerBtn);
    });
    
    // Reset selections
    this.selectedServer = undefined;
    this.selectedReceiver = undefined;
    this.selectedServerSide = undefined;
    this.selectedReceiverSide = undefined;
    this.updateConfigStatus();
  }

  selectPlayer(side, index, name) {
    // Clear previous selections
    document.querySelectorAll('.config-player-btn').forEach(btn => {
      btn.classList.remove('selected-server', 'selected-receiver');
    });
    
    const clickedBtn = document.querySelector(`[data-side="${side}"][data-index="${index}"]`);
    
    if (!this.selectedServerSide) {
      // First selection - set as server
      this.selectedServer = index;
      this.selectedServerSide = side;
      this.selectedServerName = name;
      clickedBtn.classList.add('selected-server');
      clickedBtn.textContent = '🏓 ' + name;
      
      // Update serving team and court highlighting
      this.servingTeam = side;
      this.updateCourtPreview();
    } else if (!this.selectedReceiverSide && side !== this.selectedServerSide) {
      // Second selection - set as receiver (must be opposite side)
      this.selectedReceiver = index;
      this.selectedReceiverSide = side;
      this.selectedReceiverName = name;
      clickedBtn.classList.add('selected-receiver');
      clickedBtn.textContent = '🏓 ' + name;
      
      // Re-highlight server
      const serverBtn = document.querySelector(`[data-side="${this.selectedServerSide}"][data-index="${this.selectedServer}"]`);
      serverBtn.classList.add('selected-server');
      serverBtn.textContent = '🏓 ' + this.selectedServerName;
    } else {
      // Reset and start over - clear all icons first
      document.querySelectorAll('.config-player-btn').forEach(btn => {
        const originalName = btn.textContent.replace('🏓 ', '');
        btn.textContent = originalName;
      });
      
      this.selectedServer = index;
      this.selectedServerSide = side;
      this.selectedServerName = name;
      this.selectedReceiver = undefined;
      this.selectedReceiverSide = undefined;
      this.selectedReceiverName = undefined;
      clickedBtn.classList.add('selected-server');
      clickedBtn.textContent = '🏓 ' + name;
      
      // Update serving team and court highlighting
      this.servingTeam = side;
      this.updateCourtPreview();
    }
    
    this.updateConfigStatus();
  }
  
  updateConfigStatus() {
    const statusDiv = document.getElementById('config-status');
    
    if (!this.selectedServerSide) {
      statusDiv.innerHTML = '<p class="config-waiting">Select a player to serve first</p>';
    } else if (!this.selectedReceiverSide) {
      statusDiv.innerHTML = `
        <p class="config-progress">✓ Server: <strong>${this.selectedServerName}</strong></p>
        <p class="config-waiting">Now select receiver from opposite court</p>
      `;
    } else {
      statusDiv.innerHTML = `
        <p class="config-complete">✓ Server: <strong>${this.selectedServerName}</strong> (${this.selectedServerSide.toUpperCase()} court)</p>
        <p class="config-complete">✓ Receiver: <strong>${this.selectedReceiverName}</strong> (${this.selectedReceiverSide.toUpperCase()} court)</p>
        <p class="config-ready">Ready to start game!</p>
      `;
    }
  }

  applyPlayerSelections() {
    const teamAPlayers = this.loadedMatch.players.filter(p => p.team === 'A');
    const teamBPlayers = this.loadedMatch.players.filter(p => p.team === 'B');
    
    // Get team players based on side selection
    const leftTeamPlayers = this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers;
    const rightTeamPlayers = this.teamAssignment.teamA === 'left' ? teamBPlayers : teamAPlayers;
    
    // Get selected players by name
    const serverName = this.selectedServerName;
    const receiverName = this.selectedReceiverName;
    
    // Find partner players with their IDs
    let serverPartner, receiverPartner, server, receiver;
    if (this.selectedServerSide === 'left') {
      server = leftTeamPlayers.find(p => p.name === serverName);
      serverPartner = leftTeamPlayers.find(p => p.name !== serverName);
      receiver = rightTeamPlayers.find(p => p.name === receiverName);
      receiverPartner = rightTeamPlayers.find(p => p.name !== receiverName);
    } else {
      server = rightTeamPlayers.find(p => p.name === serverName);
      serverPartner = rightTeamPlayers.find(p => p.name !== serverName);
      receiver = leftTeamPlayers.find(p => p.name === receiverName);
      receiverPartner = leftTeamPlayers.find(p => p.name !== receiverName);
    }
    
    // Apply cross-court positioning: server and receiver are diagonally opposite
    if (this.selectedServerSide === 'left') {
      // Left team serves: server at BOTTOM, receiver at TOP (cross-court)
      this.gameState.teams.left.players = [
        { playerId: serverPartner.playerId, name: serverPartner.name, position: 'top' },
        { playerId: server.playerId, name: server.name, position: 'bottom' }
      ];
      this.gameState.teams.right.players = [
        { playerId: receiver.playerId, name: receiver.name, position: 'top' },
        { playerId: receiverPartner.playerId, name: receiverPartner.name, position: 'bottom' }
      ];
    } else {
      // Right team serves: server at TOP (cross-court), receiver at BOTTOM
      this.gameState.teams.left.players = [
        { playerId: receiverPartner.playerId, name: receiverPartner.name, position: 'top' },
        { playerId: receiver.playerId, name: receiver.name, position: 'bottom' }
      ];
      // Put selected server at index 1 (server #2 position) with 'top' position
      this.gameState.teams.right.players = [
        { playerId: serverPartner.playerId, name: serverPartner.name, position: 'bottom' },
        { playerId: server.playerId, name: server.name, position: 'top' }
      ];
    }
  }

  switchSides() {
    // Toggle team assignments
    this.teamAssignment = {
      teamA: this.teamAssignment.teamA === 'left' ? 'right' : 'left',
      teamB: this.teamAssignment.teamB === 'left' ? 'right' : 'left'
    };
    
    // Clear player selections when switching sides
    this.servingTeam = null;
    this.selectedServer = undefined;
    this.selectedReceiver = undefined;
    this.selectedServerSide = undefined;
    this.selectedReceiverSide = undefined;
    this.selectedServerName = undefined;
    this.selectedReceiverName = undefined;
    
    // Clear visual selections
    document.querySelectorAll('.config-player-btn').forEach(btn => {
      btn.classList.remove('selected-server', 'selected-receiver');
    });
    
    this.updateCourtPreview();
    this.showPlayerSelection();
    this.updateConfigStatus();
  }

  startGame() {
    // Check if match is already in submission queue
    const queuedSubmissions = JSON.parse(localStorage.getItem('scoreSubmissionQueue') || '[]');
    const matchInQueue = queuedSubmissions.find(item => item.matchId === this.gameState.matchId);
    
    if (matchInQueue) {
      this.showMatchError(`Match ${this.gameState.matchId} is already in the submission queue. Please process the queue first.`);
      return;
    }
    if (!this.loadedMatch) {
      alert('Please load a match first!');
      return;
    }
    
    this.gameState.matchId = this.loadedMatch.matchId;
    this.gameState.gameMode = this.loadedMatch.gameMode;
    this.gameState.gameStatus = 'active';
    
    // Start game timer
    this.gameStartTime = Date.now();
    this.gameDuration = 0;
    
    // Set serving team based on selection (default to left if none selected)
    this.gameState.serving.team = this.servingTeam || 'left';
    
    // Setup players from loaded match data with team assignments
    this.setupPlayersFromMatch(this.loadedMatch);
    
    // Apply custom player selections if doubles mode
    if (this.gameState.gameMode === 'doubles' && this.selectedServerSide && this.selectedReceiverSide) {
      this.applyPlayerSelections();
    }
    
    // Ensure serving side is set correctly for the serving team
    this.updateServingSide();
    
    this.showGameScreen();
  }
  
  setupPlayersFromMatch(match) {
    const teamAPlayers = match.players.filter(p => p.team === 'A');
    const teamBPlayers = match.players.filter(p => p.team === 'B');
    
    // Assign teams based on referee selection
    const leftTeamPlayers = this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers;
    const rightTeamPlayers = this.teamAssignment.teamA === 'left' ? teamBPlayers : teamAPlayers;
    
    if (match.gameMode === 'singles') {
      this.gameState.teams.left.players = [{ playerId: leftTeamPlayers[0].playerId, name: leftTeamPlayers[0].name }];
      this.gameState.teams.right.players = [{ playerId: rightTeamPlayers[0].playerId, name: rightTeamPlayers[0].name }];
    } else {
      // Set up players so server #2 is always in cross-court serving position
      if (this.gameState.serving.team === 'left') {
        // Left team serves: server #2 (Lisa Chen) at BOTTOM (cross-court)
        this.gameState.teams.left.players = [
          { playerId: leftTeamPlayers[0].playerId, name: leftTeamPlayers[0].name, position: 'top' },    // Mike at index 0
          { playerId: leftTeamPlayers[1].playerId, name: leftTeamPlayers[1].name, position: 'bottom' }  // Lisa at index 1 (server #2)
        ];
        this.gameState.teams.right.players = [
          { playerId: rightTeamPlayers[0].playerId, name: rightTeamPlayers[0].name, position: 'top' },
          { playerId: rightTeamPlayers[1].playerId, name: rightTeamPlayers[1].name, position: 'bottom' }
        ];
      } else {
        // Right team serves: server #2 should be at CRT (right-hand side = top position)
        this.gameState.teams.left.players = [
          { playerId: leftTeamPlayers[0].playerId, name: leftTeamPlayers[0].name, position: 'top' },
          { playerId: leftTeamPlayers[1].playerId, name: leftTeamPlayers[1].name, position: 'bottom' }
        ];
        // Server #2 at index 1 should be at top position (CRT)
        this.gameState.teams.right.players = [
          { playerId: rightTeamPlayers[0].playerId, name: rightTeamPlayers[0].name, position: 'bottom' },  // David at bottom  
          { playerId: rightTeamPlayers[1].playerId, name: rightTeamPlayers[1].name, position: 'top' }      // Emma at top (server #2)
        ];
      }
      
      // First game always starts with server #2
      this.gameState.serving.player = 2;
    }
  }
  
  setupDefaultPlayers(mode) {
    if (mode === 'singles') {
      this.gameState.teams.left.players = [{ name: 'Player 1' }];
      this.gameState.teams.right.players = [{ name: 'Player 2' }];
    } else {
      this.gameState.teams.left.players = [
        { name: 'Player 1A', position: 'top' },
        { name: 'Player 1B', position: 'bottom' }
      ];
      this.gameState.teams.right.players = [
        { name: 'Player 2A', position: 'top' },
        { name: 'Player 2B', position: 'bottom' }
      ];
      this.gameState.serving.player = 2; // First game starts with server #2
    }
  }

  showGameScreen() {
    // Create game screen directly (no fetch needed)
    this.createGameScreen();
    
    // Initialize touch feedback after game screen is created
    if (typeof TouchFeedback !== 'undefined') {
      this.touchFeedback = new TouchFeedback(document.querySelector('.court'));
    }
    

  }

  createGameScreen() {
    document.body.innerHTML = `
      <div class="court">
        <div class="connection-indicator" id="connection-status">📶 Online</div>
        <div id="score-display">0 - 0</div>
        <div class="left-side">
          <div class="left-top"></div>
          <div class="left-bottom"></div>
        </div>
        <div class="kitchen"></div>
        <div class="right-side">
          <div class="right-top"></div>
          <div class="right-bottom"></div>
        </div>
        <div class="net"></div>
      </div>
      <div class="orientation-warning">
        <h2>⚠️ Rotate Device</h2>
        <p>This scoring system is designed for landscape orientation.</p>
        <p>Please rotate your device to landscape mode for the best experience.</p>
        <p>📱 ➡️ 📱</p>
      </div>
    `;
    
    this.addGameElements();
    this.setupEventListeners();
    this.updateDisplay();
  }

  addGameElements() {
    // Add score display if not exists
    if (!document.getElementById('score-display')) {
      const scoreDisplay = document.createElement('div');
      scoreDisplay.id = 'score-display';
      scoreDisplay.textContent = '0 - 0';
      document.querySelector('.court').appendChild(scoreDisplay);
    }
    
    // Add control buttons
    this.addControlButtons();
    
    // Add home button
    this.addHomeButton();
    
    // Add player names
    this.addPlayerNames();
  }

  addPlayerNames() {
    const leftSide = document.querySelector('.left-side');
    const rightSide = document.querySelector('.right-side');
    
    if (this.gameState.gameMode === 'singles') {
      // Initial positioning based on serving side (0-0 = even = right-hand side = bottom)
      const servingSide = 'bottom'; // At 0-0, even score = right-hand side = bottom position
      
      // Both players positioned on same hand side (cross-court)
      leftSide.innerHTML += `<div class="player-1 player-${servingSide}">${this.gameState.teams.left.players[0].name}</div>`;
      rightSide.innerHTML += `<div class="player-1 player-${servingSide}">${this.gameState.teams.right.players[0].name}</div>`;
    } else {
      // Doubles: position players based on their current court position
      const leftPlayers = this.gameState.teams.left.players;
      const rightPlayers = this.gameState.teams.right.players;
      
      // Fix right team positions for cross-court serving
      if (this.gameState.serving.team === 'right') {
        // Ensure server #2 is at top position (CRT)
        if (rightPlayers[1].position !== 'top') {
          rightPlayers[0].position = 'bottom';
          rightPlayers[1].position = 'top';
        }
      }
      
      const leftTop = leftPlayers.find(p => p.position === 'top');
      const leftBottom = leftPlayers.find(p => p.position === 'bottom');
      const rightTop = rightPlayers.find(p => p.position === 'top');
      const rightBottom = rightPlayers.find(p => p.position === 'bottom');
      
      leftSide.innerHTML += `
        <div class="player-top">${leftTop.name}</div>
        <div class="player-bottom">${leftBottom.name}</div>
      `;
      rightSide.innerHTML += `
        <div class="player-top">${rightTop.name}</div>
        <div class="player-bottom">${rightBottom.name}</div>
      `;
    }
  }

  saveGameState() {
    this.gameHistory.push(JSON.parse(JSON.stringify(this.gameState)));
    if (this.gameHistory.length > 20) {
      this.gameHistory.shift();
    }
  }

  undoLastPoint() {
    if (this.gameHistory.length === 0) return;
    
    const undoBtn = document.getElementById('undo-btn');
    undoBtn.classList.add('loading');
    
    setTimeout(() => {
      this.gameState = this.gameHistory.pop();
      this.updateDisplay();
      undoBtn.classList.remove('loading');
    }, 100);
  }

  resetGame() {
    if (!confirm('Reset game to 0-0? This cannot be undone.')) return;
    
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.classList.add('loading');
    
    setTimeout(() => {
      this.gameState.teams.left.score = 0;
      this.gameState.teams.right.score = 0;
      this.gameState.serving.team = this.servingTeam || 'left';
      this.gameState.serving.player = this.gameState.gameMode === 'doubles' ? 2 : 1;
      this.gameState.serving.side = 'right';
      this.gameState.gameStatus = 'active';
      this.gameHistory = [];
      
      // Reset game timer
      this.gameStartTime = Date.now();
      this.gameDuration = 0;
      
      if (this.gameState.gameMode === 'doubles') {
        this.resetPlayerPositions();
      }
      
      this.updateDisplay();
      resetBtn.classList.remove('loading');
    }, 200);
  }

  resetPlayerPositions() {
    // Restore original player positions from match data
    if (this.loadedMatch && this.gameState.gameMode === 'doubles') {
      const teamAPlayers = this.loadedMatch.players.filter(p => p.team === 'A');
      const teamBPlayers = this.loadedMatch.players.filter(p => p.team === 'B');
      
      // Assign teams based on current assignment
      const leftTeamPlayers = this.teamAssignment.teamA === 'left' ? teamAPlayers : teamBPlayers;
      const rightTeamPlayers = this.teamAssignment.teamA === 'left' ? teamBPlayers : teamAPlayers;
      
      // Reset to original positions
      this.gameState.teams.left.players = [
        { name: leftTeamPlayers[0].name, position: 'top' },
        { name: leftTeamPlayers[1].name, position: 'bottom' }
      ];
      this.gameState.teams.right.players = [
        { name: rightTeamPlayers[0].name, position: 'top' },
        { name: rightTeamPlayers[1].name, position: 'bottom' }
      ];
    }
  }

  addControlButtons() {
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'game-controls';
    controlsDiv.innerHTML = `
      <button onclick="app.undoLastPoint()" id="undo-btn" title="Undo Last Point">↶</button>
      <button onclick="app.showScoreAdjustment()" id="adjust-btn" title="Adjust Score">✎</button>
      <button onclick="app.resetGame()" id="reset-btn" title="Reset Game">⟲</button>
    `;
    document.querySelector('.court').appendChild(controlsDiv);
  }
  
  addHomeButton() {
    const homeDiv = document.createElement('div');
    homeDiv.id = 'home-control';
    homeDiv.innerHTML = `
      <button onclick="app.goHome()" id="home-btn" title="Return to Match Setup">⌂</button>
    `;
    document.querySelector('.court').appendChild(homeDiv);
  }
  
  goHome() {
    if (confirm('Return to match setup? Current game progress will be lost.')) {
      this.showMatchSetup();
    }
  }
  
  showScoreAdjustment() {
    const modal = document.createElement('div');
    modal.id = 'score-modal';
    
    let serverOptions = '';
    if (this.gameState.gameMode === 'doubles') {
      serverOptions = `
        <div class="server-controls">
          <h4>Server Settings</h4>
          <div class="server-inputs">
            <div class="server-team">
              <label>Serving Team:</label>
              <select id="serving-team" onchange="app.updateServerNames()">
                <option value="left" ${this.gameState.serving.team === 'left' ? 'selected' : ''}>Left Team</option>
                <option value="right" ${this.gameState.serving.team === 'right' ? 'selected' : ''}>Right Team</option>
              </select>
            </div>
            <div class="server-number">
              <label>Current Server:</label>
              <select id="server-number">
                <option value="1" ${this.gameState.serving.player === 1 ? 'selected' : ''}>${this.getServerName(this.gameState.serving.team, 1)}</option>
                <option value="2" ${this.gameState.serving.player === 2 ? 'selected' : ''}>${this.getServerName(this.gameState.serving.team, 2)}</option>
              </select>
            </div>
          </div>
        </div>
      `;
    } else {
      serverOptions = `
        <div class="server-controls">
          <h4>Current Server</h4>
          <div class="server-inputs">
            <div class="server-team">
              <label>Serving Team:</label>
              <select id="serving-team">
                <option value="left" ${this.gameState.serving.team === 'left' ? 'selected' : ''}>Left Team</option>
                <option value="right" ${this.gameState.serving.team === 'right' ? 'selected' : ''}>Right Team</option>
              </select>
            </div>
          </div>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Adjust Game State</h3>
        <div class="score-inputs">
          <div class="team-score">
            <label>Left Team:</label>
            <input type="number" id="left-score" min="0" max="30" value="${this.gameState.teams.left.score}">
          </div>
          <div class="team-score">
            <label>Right Team:</label>
            <input type="number" id="right-score" min="0" max="30" value="${this.gameState.teams.right.score}">
          </div>
        </div>
        ${serverOptions}
        <div class="server-number-control">
          <h4>Server Number (Score Display)</h4>
          <div class="server-number-input">
            <label>Server Number:</label>
            <select id="display-server-number">
              <option value="1" ${this.gameState.serving.player === 1 ? 'selected' : ''}>1</option>
              <option value="2" ${this.gameState.serving.player === 2 ? 'selected' : ''}>2</option>
            </select>
          </div>
        </div>
        <div class="modal-buttons">
          <button onclick="app.applyScoreAdjustment()" class="confirm-btn">Apply</button>
          <button onclick="app.closeScoreAdjustment()" class="cancel-btn">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  applyScoreAdjustment() {
    const leftScore = parseInt(document.getElementById('left-score').value);
    const rightScore = parseInt(document.getElementById('right-score').value);
    const servingTeam = document.getElementById('serving-team').value;
    
    if (leftScore < 0 || rightScore < 0 || leftScore > 30 || rightScore > 30) {
      alert('Scores must be between 0 and 30');
      return;
    }
    
    const serverNumber = parseInt(document.getElementById('display-server-number').value);
    
    let confirmMessage = `Set score to ${leftScore} - ${rightScore} - ${serverNumber}, ${servingTeam} team serving`;
    
    if (this.gameState.gameMode === 'doubles') {
      const currentServerName = this.getServerName(servingTeam, parseInt(document.getElementById('server-number').value));
      confirmMessage += ` (Current: ${currentServerName})`;
    }
    
    if (confirm(confirmMessage + '?')) {
      this.saveGameState();
      
      // Update scores
      this.gameState.teams.left.score = leftScore;
      this.gameState.teams.right.score = rightScore;
      
      // Update serving info
      this.gameState.serving.team = servingTeam;
      
      // Server number for score display (what shows in 0-0-X)
      this.gameState.serving.player = parseInt(document.getElementById('display-server-number').value);
      
      // Current active server for highlighting and positioning
      if (this.gameState.gameMode === 'doubles') {
        this.gameState.serving.activeServer = parseInt(document.getElementById('server-number').value);
      } else {
        this.gameState.serving.activeServer = 1;
      }
      
      // Update serving side based on serving team's score
      const servingScore = this.gameState.teams[servingTeam].score;
      this.gameState.serving.side = (servingScore % 2 === 0) ? 'right' : 'left';
      
      // Update player positions if doubles
      if (this.gameState.gameMode === 'doubles') {
        this.updatePlayerPositions();
      }
      
      this.updateDisplay();
      this.checkGameCompletion();
      this.closeScoreAdjustment();
    }
  }
  
  closeScoreAdjustment() {
    const modal = document.getElementById('score-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  async submitScore() {
    if (!this.scoreSubmission) {
      console.error('ScoreSubmission not initialized');
      return;
    }
    
    // Prepare game state for submission
    const completedGameState = {
      ...this.gameState,
      gameStatus: 'completed',
      winner: this.gameState.teams.left.score > this.gameState.teams.right.score ? 'left' : 'right',
      completedAt: new Date().toISOString()
    };
    
    try {
      const result = await this.scoreSubmission.submitManually(completedGameState, true);
      
      if (result.success) {
        console.log('Score submitted successfully:', result.submissionId);
      } else {
        console.error('Score submission failed:', result.error);
      }
    } catch (error) {
      console.error('Score submission error:', error);
    }
  }
  
  async sendScoreToTournament() {
    // Get starting server and receiver information
    const startingServerInfo = this.getStartingServerInfo();
    
    const scoreData = {
      matchId: this.gameState.matchId || this.loadedMatch?.matchId || 'UNKNOWN',
      gameMode: this.gameState.gameMode,
      finalScore: {
        left: this.gameState.teams.left.score,
        right: this.gameState.teams.right.score
      },
      winner: this.gameState.teams.left.score > this.gameState.teams.right.score ? 'left' : 'right',
      players: {
        left: this.gameState.teams.left.players,
        right: this.gameState.teams.right.players
      },
      startingConfiguration: startingServerInfo,
      gameDuration: this.getGameDuration(),
      timestamp: new Date().toISOString(),
      refereeId: sessionStorage.getItem('refereeId'),
      tournamentEndpoint: this.config.apis.scores.endpoint
    };
    
    // Log the complete payload being submitted
    console.log('=== SCORE SUBMISSION PAYLOAD ===');
    console.log('Endpoint:', this.config.apis.scores.endpoint);
    console.log('Payload:', JSON.stringify(scoreData, null, 2));
    console.log('Demo Mode:', this.config.demo.enabled);
    console.log('================================');
    
    try {
      if (this.config.demo.enabled) {
        // Demo simulation
        console.log('Simulating API call...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Demo simulation - configurable success rate
        if (Math.random() < this.config.demo.successRate) {
          const response = {
            success: true,
            submissionId: 'SUB-' + Date.now(),
            message: 'Score submitted to tournament system'
          };
          console.log('✅ Submission SUCCESS:', response);
          return response;
        } else {
          // Simulate different types of demo errors
          const errorTypes = [
            { message: 'Tournament server unavailable', code: 500 },
            { message: 'Network timeout', code: 'TIMEOUT' },
            { message: 'Authentication failed', code: 401 },
            { message: 'Match not found', code: 404 }
          ];
          const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
          const error = new Error(randomError.message);
          error.code = randomError.code;
          console.log('❌ Submission FAILED:', error.message);
          throw error;
        }
      } else {
        // Real API call
        console.log('Making REAL API call...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.apis.timeout);
        
        const response = await fetch(this.config.apis.scores.endpoint, {
          method: this.config.apis.scores.method,
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` 
          },
          body: JSON.stringify(scoreData),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
          error.status = response.status;
          throw error;
        }
        
        const result = await response.json();
        console.log('✅ Real API SUCCESS:', result);
        return result;
      }
    } catch (error) {
      // Enhanced error details
      if (error.name === 'AbortError') {
        error.message = `Request timeout after ${this.config.apis.timeout}ms`;
      }
      console.error('❌ API Error Details:', {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code
      });
      throw error;
    }
  }
  
  showPendingSubmissions() {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions') || '[]');
    
    const modal = document.createElement('div');
    modal.id = 'pending-modal';
    modal.innerHTML = `
      <div class="pending-content">
        <h3>📤 Pending Submissions (${pendingSubmissions.length})</h3>
        <div class="pending-list">
          ${pendingSubmissions.map((sub, index) => `
            <div class="pending-item">
              <div class="pending-info">
                <strong>${sub.matchId}</strong> - ${sub.gameMode.toUpperCase()}<br>
                <small>${new Date(sub.timestamp).toLocaleString()}</small>
              </div>
              <button onclick="app.resubmitSingle(${index})" class="resubmit-btn">Resubmit</button>
            </div>
          `).join('')}
        </div>
        <div class="pending-actions">
          <button onclick="app.retryPendingSubmissions()" class="retry-all-btn">Retry All</button>
          <button onclick="app.clearPendingSubmissions()" class="clear-btn">Clear All</button>
          <button onclick="app.closePendingModal()" class="close-btn">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  async resubmitSingle(index) {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions') || '[]');
    const submission = pendingSubmissions[index];
    
    if (!submission) return;
    
    try {
      // Temporarily set game state for submission
      const originalState = this.gameState;
      this.gameState = {
        matchId: submission.matchId,
        gameMode: submission.gameMode,
        teams: {
          left: { score: submission.finalScore.left, players: submission.players.left },
          right: { score: submission.finalScore.right, players: submission.players.right }
        }
      };
      
      const result = await this.sendScoreToTournament();
      
      if (result.success) {
        // Remove from pending list
        pendingSubmissions.splice(index, 1);
        localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
        
        // Refresh the modal
        this.closePendingModal();
        this.showPendingSubmissions();
        
        alert('✅ Submission successful!');
      }
      
      // Restore original state
      this.gameState = originalState;
    } catch (error) {
      alert('❌ Submission failed: ' + error.message);
    }
  }
  
  clearPendingSubmissions() {
    if (confirm('Clear all pending submissions? This cannot be undone.')) {
      localStorage.removeItem('pendingSubmissions');
      this.closePendingModal();
    }
  }
  
  closePendingModal() {
    const modal = document.getElementById('pending-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  showSubmissionQueue() {
    if (!this.scoreSubmission) {
      alert('ScoreSubmission system not initialized');
      return;
    }
    
    const queuedSubmissions = this.scoreSubmission.getQueuedSubmissions();
    const auditLog = this.scoreSubmission.getAuditLog();
    
    const modal = document.createElement('div');
    modal.id = 'queue-modal';
    modal.innerHTML = `
      <div class="queue-content">
        <h3>🔄 Submission Queue (${queuedSubmissions.length})</h3>
        <div class="queue-list">
          ${queuedSubmissions.length === 0 ? 
            '<p class="empty-queue">No queued submissions</p>' :
            queuedSubmissions.map((sub, index) => `
              <div class="queue-item">
                <div class="queue-info">
                  <strong>${sub.matchId}</strong> - ${sub.gameMode.toUpperCase()}<br>
                  <small>Score: ${sub.teams.left.score}-${sub.teams.right.score} | ${new Date(sub.completedAt).toLocaleString()}</small>
                </div>
                <button onclick="app.processQueueItem(${index})" class="process-btn">Submit Now</button>
              </div>
            `).join('')
          }
        </div>
        <div class="audit-section">
          <h4>Recent Submissions (${auditLog.length})</h4>
          <div class="audit-list">
            ${auditLog.slice(-5).map(entry => `
              <div class="audit-item ${entry.status}">
                <span>${entry.matchId} - ${entry.status.toUpperCase()}</span>
                <small>${new Date(entry.timestamp).toLocaleString()}</small>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="queue-actions">
          <button onclick="app.processAllQueued()" class="process-all-btn" ${queuedSubmissions.length === 0 ? 'disabled' : ''}>Process All</button>
          <button onclick="app.clearSubmissionQueue()" class="clear-queue-btn" ${queuedSubmissions.length === 0 ? 'disabled' : ''}>Clear Queue</button>
          <button onclick="app.closeQueueModal()" class="close-btn">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  async processQueueItem(index) {
    if (!this.scoreSubmission) return;
    
    const queuedSubmissions = this.scoreSubmission.getQueuedSubmissions();
    const item = queuedSubmissions[index];
    
    if (!item) return;
    
    try {
      // Process single item
      const result = await this.scoreSubmission._performSubmission(item);
      
      if (result.success) {
        // Remove from queue
        queuedSubmissions.splice(index, 1);
        this.scoreSubmission.saveQueueToStorage();
        
        // Refresh modal
        this.closeQueueModal();
        this.showSubmissionQueue();
        
        alert('✅ Submission successful!');
      }
    } catch (error) {
      alert('❌ Submission failed: ' + error.message);
    }
  }
  
  async processAllQueued() {
    if (!this.scoreSubmission) return;
    
    try {
      const result = await this.scoreSubmission.processQueuedSubmissions();
      
      // Refresh modal
      this.closeQueueModal();
      this.showSubmissionQueue();
      
      alert(`✅ Processed ${result.processed} submissions. ${result.successful} successful.`);
      
      // Refresh match setup to update button
      setTimeout(() => {
        this.closeQueueModal();
        this.showMatchSetup();
      }, 2000);
    } catch (error) {
      alert('❌ Failed to process queue: ' + error.message);
    }
  }
  
  clearSubmissionQueue() {
    if (!this.scoreSubmission) return;
    
    if (confirm('Clear all queued submissions? This cannot be undone.')) {
      this.scoreSubmission.queuedSubmissions = [];
      this.scoreSubmission.saveQueueToStorage();
      this.closeQueueModal();
      this.showMatchSetup();
    }
  }
  
  closeQueueModal() {
    const modal = document.getElementById('queue-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  setDemoMode(mode) {
    switch(mode) {
      case 'success':
        this.config.demo.successRate = 1.0;  // Always succeed
        break;
      case 'fail':
        this.config.demo.successRate = 0.0;  // Always fail
        break;
      case 'random':
        this.config.demo.successRate = 0.8;  // 80% success
        break;
    }
    
    // Update button styles to show current mode
    document.querySelectorAll('.demo-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`.demo-btn.${mode}`).classList.add('active');
    
    // Show feedback
    const statusDiv = document.getElementById('submission-status');
    const modeText = mode === 'success' ? 'Always Succeed' : 
                     mode === 'fail' ? 'Always Fail' : 
                     'Random (80% success)';
    statusDiv.innerHTML = `<p class="demo-mode">🎮 Demo Mode: ${modeText}</p>`;
    
    this.updateDebugStatus();
  }
  
  toggleDemoMode() {
    this.config.demo.enabled = !this.config.demo.enabled;
    
    const toggleBtn = document.getElementById('demo-toggle');
    const statusDiv = document.getElementById('submission-status');
    
    if (this.config.demo.enabled) {
      toggleBtn.textContent = 'Real API Mode';
      toggleBtn.classList.remove('real-mode');
      statusDiv.innerHTML = '<p class="demo-mode">🎮 Demo Mode: Simulation enabled</p>';
    } else {
      toggleBtn.textContent = 'Demo Mode';
      toggleBtn.classList.add('real-mode');
      statusDiv.innerHTML = '<p class="real-mode">🌐 Real API Mode: Will make actual network calls</p>';
    }
    
    this.updateDebugStatus();
  }
  
  testTimeout() {
    // Set very short timeout to force timeout errors
    this.config.apis.timeout = 100;
    
    const statusDiv = document.getElementById('submission-status');
    statusDiv.innerHTML = '<p class="debug-mode">⏱️ Timeout Test: Set to 100ms (will likely fail)</p>';
    
    this.updateDebugStatus();
  }
  
  testOffline() {
    // Temporarily override isOnline to simulate offline
    const originalIsOnline = this.apiClient.isOnline;
    this.apiClient.isOnline = () => false;
    
    const statusDiv = document.getElementById('submission-status');
    statusDiv.innerHTML = '<p class="debug-mode">📵 Offline Test: Next submission will be queued</p>';
    
    // Restore after 10 seconds
    setTimeout(() => {
      this.apiClient.isOnline = originalIsOnline;
      console.log('Offline test ended - back online');
    }, 10000);
    
    this.updateDebugStatus();
  }
  
  updateDebugStatus() {
    const debugStatus = document.getElementById('debug-status');
    if (debugStatus) {
      const demoMode = this.config.demo.enabled ? 'ON' : 'OFF';
      const successRate = Math.round(this.config.demo.successRate * 100);
      const timeout = this.config.apis.timeout;
      
      debugStatus.textContent = `Demo: ${demoMode} | Success: ${successRate}% | Timeout: ${timeout}ms`;
    }
  }
  
  saveForOfflineSubmission() {
    const pendingSubmissions = JSON.parse(localStorage.getItem('pendingSubmissions') || '[]');
    
    // Check if this matchId already exists
    const existingIndex = pendingSubmissions.findIndex(sub => sub.matchId === this.gameState.matchId);
    
    const submission = {
      id: 'PENDING-' + Date.now(),
      matchId: this.gameState.matchId,
      gameMode: this.gameState.gameMode,
      finalScore: {
        left: this.gameState.teams.left.score,
        right: this.gameState.teams.right.score
      },
      winner: this.gameState.teams.left.score > this.gameState.teams.right.score ? 'left' : 'right',
      players: {
        left: this.gameState.teams.left.players,
        right: this.gameState.teams.right.players
      },
      timestamp: new Date().toISOString(),
      refereeId: sessionStorage.getItem('refereeId'),
      status: 'pending'
    };
    
    if (existingIndex >= 0) {
      // Update existing entry
      pendingSubmissions[existingIndex] = submission;
    } else {
      // Add new entry
      pendingSubmissions.push(submission);
    }
    
    localStorage.setItem('pendingSubmissions', JSON.stringify(pendingSubmissions));
  }
  
  async submitLater() {
    if (!this.scoreSubmission) {
      // Fallback to old method
      this.saveForOfflineSubmission();
      const statusDiv = document.getElementById('submission-status');
      statusDiv.innerHTML = '<p class="saved">💾 Scores saved for later submission</p>';
      setTimeout(() => {
        this.closeSubmissionModal();
      }, 2000);
      return;
    }
    
    // Force offline mode for "Submit Later"
    const originalIsOnline = this.apiClient.isOnline;
    this.apiClient.isOnline = () => false;
    
    try {
      const completedGameState = {
        ...this.gameState,
        gameStatus: 'completed',
        winner: this.gameState.teams.left.score > this.gameState.teams.right.score ? 'left' : 'right',
        completedAt: new Date().toISOString()
      };
      
      // This will queue the submission since we're "offline"
      const result = await this.scoreSubmission.submitOnGameEnd(completedGameState);
      
      if (result.queued) {
        const statusDiv = document.getElementById('submission-status');
        statusDiv.innerHTML = '<p class="saved">💾 Scores queued for later submission</p>';
        console.log('Score queued for later submission');
        setTimeout(() => {
          this.closeSubmissionModal();
        }, 2000);
      }
    } finally {
      // Restore original online status
      this.apiClient.isOnline = originalIsOnline;
    }
  }
  
  newGame() {
    this.closeSubmissionModal();
    this.showMatchSetup();
  }
  
  closeSubmissionModal() {
    const modal = document.getElementById('submission-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  getServerName(team, serverNumber) {
    const players = this.gameState.teams[team].players;
    
    if (serverNumber === 1) {
      return players[0]?.name || 'Server #1';
    } else {
      return players[1]?.name || 'Server #2';
    }
  }
  
  updateServerNames() {
    const selectedTeam = document.getElementById('serving-team').value;
    const serverSelect = document.getElementById('server-number');
    
    serverSelect.innerHTML = `
      <option value="1">${this.getServerName(selectedTeam, 1)}</option>
      <option value="2">${this.getServerName(selectedTeam, 2)}</option>
    `;
  }
  


  showGameComplete() {
    const leftScore = this.gameState.teams.left.score;
    const rightScore = this.gameState.teams.right.score;
    
    // Get winner names
    let winnerNames;
    if (leftScore > rightScore) {
      winnerNames = this.gameState.teams.left.players.map(p => p.name).join(' & ');
    } else {
      winnerNames = this.gameState.teams.right.players.map(p => p.name).join(' & ');
    }
    
    const winnerScore = Math.max(leftScore, rightScore);
    const loserScore = Math.min(leftScore, rightScore);
    
    setTimeout(() => {
      this.showSubmissionScreen(winnerNames, winnerScore, loserScore);
    }, 500);
  }
  
  showSubmissionScreen(winner, winnerScore, loserScore) {
    const modal = document.createElement('div');
    modal.id = 'submission-modal';
    modal.innerHTML = `
      <div class="submission-content">
        <h2>🏆 Game Complete!</h2>
        <div class="game-result">
          <h3>${winner} Wins</h3>
          <div class="final-score">${winnerScore} - ${loserScore}</div>
        </div>
        <div class="match-details">
          <p><strong>Match:</strong> ${this.gameState.matchId || 'Demo Match'}</p>
          <p><strong>Mode:</strong> ${this.gameState.gameMode.toUpperCase()}</p>
          <p><strong>Duration:</strong> ${this.getGameDuration()}</p>
        </div>
        <div class="submission-status" id="submission-status">
          <p>Ready to submit scores to tournament system</p>
        </div>
        <div class="demo-controls">
          <p><strong>Demo Mode:</strong> Test different scenarios</p>
          <button onclick="app.setDemoMode('success')" class="demo-btn success">Force Success</button>
          <button onclick="app.setDemoMode('fail')" class="demo-btn fail">Force Failure</button>
          <button onclick="app.setDemoMode('random')" class="demo-btn random">Random (80%)</button>
        </div>
        <div class="debug-panel">
          <p><strong>Debug Panel:</strong> Test real scenarios</p>
          <div class="debug-row">
            <button onclick="app.toggleDemoMode()" class="debug-btn" id="demo-toggle">Real API Mode</button>
            <button onclick="app.testTimeout()" class="debug-btn">Test Timeout</button>
            <button onclick="app.testOffline()" class="debug-btn">Test Offline</button>
          </div>
          <div class="debug-status" id="debug-status">Demo Mode: ON | Success Rate: 80%</div>
        </div>
        <div class="submission-buttons">
          <button onclick="app.submitScore()" id="submit-btn" class="submit-btn">Submit to Tournament</button>
          <button onclick="app.submitLater()" class="later-btn">Submit Later</button>
          <button onclick="app.newGame()" class="new-game-btn">New Game</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  getGameDuration() {
    if (!this.gameStartTime) {
      return '0:00';
    }
    
    // Calculate actual game duration
    const endTime = Date.now();
    const durationMs = endTime - this.gameStartTime;
    const durationSeconds = Math.floor(durationMs / 1000);
    
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Offline Mode Event Handlers
  onConnectionLost() {
    if (this.offlineManager) {
      this.offlineManager.onConnectionLost();
      
      // Save current game state if in active game
      if (this.gameState.gameStatus === 'active') {
        this.offlineManager.saveGameState(this.gameState);
      }
    }
  }
  
  async onConnectionRestored() {
    if (this.offlineManager) {
      this.offlineManager.showNotification('Connection restored. Syncing data...', 'success');
      
      try {
        const syncResult = await this.offlineManager.syncOfflineData();
        
        if (syncResult.actionsProcessed > 0) {
          this.offlineManager.showNotification(
            `Synced ${syncResult.actionsProcessed} offline actions`, 
            'success'
          );
        }
        
        this.offlineManager.onConnectionRestored();
      } catch (error) {
        console.error('Failed to sync offline data:', error);
        this.offlineManager.showNotification('Sync failed. Data preserved offline.', 'warning');
      }
    }
  }
  
  async processOfflineAction(action) {
    switch (action.type) {
      case 'SCORE_UPDATE':
        // Process score update
        this.gameState.teams[action.data.team].score = action.data.newScore;
        this.updateDisplay();
        break;
        
      case 'SIDEOUT':
        // Process sideout
        this.performSideOut();
        this.updateDisplay();
        break;
        
      case 'SCORE_SUBMISSION':
        // Process score submission
        if (this.scoreSubmissionHandler) {
          return await this.scoreSubmissionHandler(action.data);
        }
        break;
        
      default:
        console.warn('Unknown offline action type:', action.type);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PickleballApp();
});

// Add destroy method for cleanup
PickleballApp.prototype.destroy = function() {
  if (this.performanceOptimizer) {
    this.performanceOptimizer.destroy();
  }
  
  if (this.touchFeedback) {
    this.touchFeedback.destroy && this.touchFeedback.destroy();
  }
  
  if (this.offlineManager) {
    this.offlineManager.destroy && this.offlineManager.destroy();
  }
  
  // Clear game state
  this.gameState = null;
  this.gameHistory = [];
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PickleballApp };
}