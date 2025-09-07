// Score Submission System - Minimal Implementation (TDD Green Phase)
class ScoreSubmission {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.auditLog = [];
    this.queuedSubmissions = [];
    
    // Restore queue from localStorage
    this.loadQueueFromStorage();
  }
  
  loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('scoreSubmissionQueue');
      if (stored) {
        this.queuedSubmissions = JSON.parse(stored);
        console.log(`Restored ${this.queuedSubmissions.length} queued submissions from storage`);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }
  
  saveQueueToStorage() {
    try {
      localStorage.setItem('scoreSubmissionQueue', JSON.stringify(this.queuedSubmissions));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  async submitOnGameEnd(gameState) {
    if (gameState.gameStatus !== 'completed') {
      return { success: false, error: 'Game not completed' };
    }

    if (!this.apiClient.isOnline()) {
      this.queuedSubmissions.push(gameState);
      this.saveQueueToStorage();
      return { success: false, queued: true };
    }

    return await this._performSubmission(gameState);
  }

  async submitManually(gameState, confirmed) {
    if (!confirmed) {
      return { success: false, error: 'Submission cancelled' };
    }

    return await this._performSubmission(gameState);
  }

  async submitWithRetry(gameState) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await this.apiClient.submitScore({
          matchId: gameState.matchId,
          gameMode: gameState.gameMode,
          finalScore: {
            left: gameState.teams.left.score,
            right: gameState.teams.right.score
          },
          winner: gameState.winner,
          players: gameState.teams,
          timestamp: gameState.completedAt,
          refereeId: sessionStorage.getItem('refereeId') || 'REF001'
        });
        
        return { success: true, attempts, submissionId: response.submissionId };
      } catch (error) {
        if (attempts === maxAttempts) {
          return { success: false, attempts, error: error.message };
        }
      }
    }
  }

  async _performSubmission(gameState) {
    this._showLoadingIndicator();

    try {
      const submissionData = {
        matchId: gameState.matchId,
        gameMode: gameState.gameMode,
        finalScore: {
          left: gameState.teams.left.score,
          right: gameState.teams.right.score
        },
        winner: gameState.winner,
        players: gameState.teams,
        timestamp: gameState.completedAt,
        refereeId: sessionStorage.getItem('refereeId') || 'REF001'
      };

      const response = await this.apiClient.submitScore(submissionData);
      
      this._hideLoadingIndicator();
      this._showSuccessIndicator(response.submissionId);
      this._logSubmission(gameState.matchId, response.submissionId, 'success');
      
      return { success: true, submissionId: response.submissionId };
    } catch (error) {
      this._hideLoadingIndicator();
      
      // Enhanced error handling with detailed codes
      const errorDetails = this._parseError(error);
      this._showFailIndicator(errorDetails);
      this._logSubmission(gameState.matchId, null, 'failed', errorDetails.message, errorDetails.code);
      
      return { success: false, error: errorDetails.message, code: errorDetails.code };
    }
  }
  
  _parseError(error) {
    // Parse different types of errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed - check internet connection',
        type: 'network'
      };
    }
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR', 
        message: 'Request timeout - server took too long to respond',
        type: 'timeout'
      };
    }
    
    if (error.message.includes('404')) {
      return {
        code: 'API_NOT_FOUND',
        message: 'Tournament API endpoint not found (404)',
        type: 'api'
      };
    }
    
    if (error.message.includes('401')) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed - invalid token (401)',
        type: 'auth'
      };
    }
    
    if (error.message.includes('500')) {
      return {
        code: 'SERVER_ERROR',
        message: 'Tournament server error (500) - try again later',
        type: 'server'
      };
    }
    
    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown submission error',
      type: 'unknown'
    };
  }

  async processQueuedSubmissions() {
    let processed = 0;
    let successful = 0;

    for (const gameState of this.queuedSubmissions) {
      processed++;
      const result = await this._performSubmission(gameState);
      if (result.success) successful++;
    }

    this.queuedSubmissions = [];
    this.saveQueueToStorage();
    return { processed, successful };
  }

  getAuditLog() {
    return this.auditLog;
  }

  getQueuedSubmissions() {
    return this.queuedSubmissions;
  }

  _showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'submission-loading';
    indicator.textContent = 'Submitting Score...';
    document.body.appendChild(indicator);
  }

  _hideLoadingIndicator() {
    const indicator = document.querySelector('.submission-loading');
    if (indicator) indicator.remove();
  }

  _showSuccessIndicator(submissionId) {
    const indicator = document.createElement('div');
    indicator.className = 'submission-success success-animation';
    indicator.innerHTML = `
      <div class="indicator-title">✅ Score Submitted Successfully</div>
      <div class="indicator-details">ID: ${submissionId || 'N/A'}</div>
    `;
    document.body.appendChild(indicator);

    setTimeout(() => {
      indicator.style.display = 'none';
    }, 5000);
  }

  _showFailIndicator(errorDetails) {
    const indicator = document.createElement('div');
    indicator.className = 'submission-fail fail-animation';
    indicator.innerHTML = `
      <div class="indicator-title"><span class="clickable-close" onclick="this.closest('.submission-fail').remove()">❌</span> Submission Failed</div>
      <div class="indicator-code">Error: ${errorDetails.code}</div>
      <div class="indicator-details">${errorDetails.message}</div>
    `;
    document.body.appendChild(indicator);
    
    // Auto-hide after 10 seconds for errors (longer than success)
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.display = 'none';
      }
    }, 10000);
  }

  _logSubmission(matchId, submissionId, status, error = null, errorCode = null) {
    const logEntry = {
      matchId,
      status,
      timestamp: new Date().toISOString()
    };

    if (submissionId) logEntry.submissionId = submissionId;
    if (error) logEntry.error = error;
    if (errorCode) logEntry.errorCode = errorCode;

    this.auditLog.push(logEntry);
    
    // Enhanced console logging
    if (status === 'success') {
      console.log(`✅ Score submission SUCCESS:`, logEntry);
    } else {
      console.error(`❌ Score submission FAILED:`, logEntry);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreSubmission;
} else {
  window.ScoreSubmission = ScoreSubmission;
}