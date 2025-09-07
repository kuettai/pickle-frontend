// Score Submission System - Unit Tests (TDD)
// Written BEFORE implementation to define expected behavior

import ScoreSubmission from '../sources/score-submission.js';

describe('Score Submission System', () => {
  let mockGameState, mockApiClient, scoreSubmission;

  beforeEach(() => {
    // Mock game state for completed game
    mockGameState = {
      matchId: 'MATCH-002',
      gameMode: 'doubles',
      teams: {
        left: { 
          score: 11, 
          players: [
            { name: 'Mike Wilson', position: 'top' },
            { name: 'Lisa Chen', position: 'bottom' }
          ]
        },
        right: { 
          score: 7, 
          players: [
            { name: 'David Brown', position: 'bottom' },
            { name: 'Emma Davis', position: 'top' }
          ]
        }
      },
      serving: { team: 'left', player: 1, activeServer: 1, side: 'right' },
      gameStatus: 'completed',
      winner: 'left',
      completedAt: '2024-12-15T14:30:00Z'
    };

    // Mock API client
    mockApiClient = {
      submitScore: vi.fn(),
      isOnline: vi.fn(() => true)
    };

    // Reset DOM
    document.body.innerHTML = '';
  });

  describe('Automatic Score Submission', () => {
    test('should automatically submit score when game ends', async () => {
      mockApiClient.submitScore.mockResolvedValue({ success: true, submissionId: 'SUB123' });
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitOnGameEnd(mockGameState);
      
      expect(mockApiClient.submitScore).toHaveBeenCalledWith({
        matchId: 'MATCH-002',
        gameMode: 'doubles',
        finalScore: { left: 11, right: 7 },
        winner: 'left',
        players: mockGameState.teams,
        timestamp: mockGameState.completedAt,
        refereeId: expect.any(String)
      });
      expect(result.success).toBe(true);
    });

    test('should not submit if game is not completed', async () => {
      mockGameState.gameStatus = 'active';
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitOnGameEnd(mockGameState);
      
      expect(mockApiClient.submitScore).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not completed');
    });

    test('should handle API submission failure', async () => {
      mockApiClient.submitScore.mockRejectedValue(new Error('Network error'));
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitOnGameEnd(mockGameState);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Manual Score Submission', () => {
    test('should allow manual submission with confirmation', async () => {
      mockApiClient.submitScore.mockResolvedValue({ success: true, submissionId: 'SUB456' });
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitManually(mockGameState, true);
      
      expect(mockApiClient.submitScore).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    test('should not submit without confirmation', async () => {
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitManually(mockGameState, false);
      
      expect(mockApiClient.submitScore).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Submission cancelled');
    });
  });

  describe('Retry Mechanism', () => {
    test('should retry failed submissions up to 3 times', async () => {
      mockApiClient.submitScore
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ success: true, submissionId: 'SUB789' });
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitWithRetry(mockGameState);
      
      expect(mockApiClient.submitScore).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    test('should fail after 3 retry attempts', async () => {
      mockApiClient.submitScore.mockRejectedValue(new Error('Network error'));
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitWithRetry(mockGameState);
      
      expect(mockApiClient.submitScore).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
    });
  });

  describe('Visual Feedback', () => {
    test('should show SUCCESS visual indicator on successful submission', async () => {
      mockApiClient.submitScore.mockResolvedValue({ success: true, submissionId: 'SUB123' });
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      await scoreSubmission.submitOnGameEnd(mockGameState);
      
      const successIndicator = document.querySelector('.submission-success');
      expect(successIndicator).toBeTruthy();
      expect(successIndicator.textContent).toContain('Score Submitted Successfully');
      expect(successIndicator.classList.contains('success-animation')).toBe(true);
    });

    test('should show FAIL visual indicator on failed submission', async () => {
      mockApiClient.submitScore.mockRejectedValue(new Error('Network error'));
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      await scoreSubmission.submitOnGameEnd(mockGameState);
      
      const failIndicator = document.querySelector('.submission-fail');
      expect(failIndicator).toBeTruthy();
      expect(failIndicator.textContent).toContain('Submission Failed');
      expect(failIndicator.classList.contains('fail-animation')).toBe(true);
    });

    test('should show loading indicator during submission', async () => {
      let resolveSubmission;
      mockApiClient.submitScore.mockReturnValue(new Promise(resolve => {
        resolveSubmission = resolve;
      }));
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const submissionPromise = scoreSubmission.submitOnGameEnd(mockGameState);
      
      // Check loading state
      const loadingIndicator = document.querySelector('.submission-loading');
      expect(loadingIndicator).toBeTruthy();
      expect(loadingIndicator.textContent).toContain('Submitting Score...');
      
      // Resolve and check completion
      resolveSubmission({ success: true, submissionId: 'SUB123' });
      await submissionPromise;
      
      expect(document.querySelector('.submission-loading')).toBeFalsy();
    });

    test('should auto-hide success indicator after 5 seconds', async () => {
      vi.useFakeTimers();
      mockApiClient.submitScore.mockResolvedValue({ success: true, submissionId: 'SUB123' });
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      await scoreSubmission.submitOnGameEnd(mockGameState);
      
      const successIndicator = document.querySelector('.submission-success');
      expect(successIndicator.style.display).not.toBe('none');
      
      vi.advanceTimersByTime(5000);
      
      expect(successIndicator.style.display).toBe('none');
      vi.useRealTimers();
    });
  });

  describe('Audit Trail', () => {
    test('should log successful submissions', async () => {
      mockApiClient.submitScore.mockResolvedValue({ success: true, submissionId: 'SUB123' });
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      await scoreSubmission.submitOnGameEnd(mockGameState);
      
      const auditLog = scoreSubmission.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0]).toMatchObject({
        matchId: 'MATCH-002',
        submissionId: 'SUB123',
        status: 'success',
        timestamp: expect.any(String)
      });
    });

    test('should log failed submissions', async () => {
      mockApiClient.submitScore.mockRejectedValue(new Error('Network error'));
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      await scoreSubmission.submitOnGameEnd(mockGameState);
      
      const auditLog = scoreSubmission.getAuditLog();
      expect(auditLog).toHaveLength(1);
      expect(auditLog[0]).toMatchObject({
        matchId: 'MATCH-002',
        status: 'failed',
        error: 'Network error',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Offline Handling', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });
    
    test('should queue submissions when offline', async () => {
      mockApiClient.isOnline.mockReturnValue(false);
      
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      const result = await scoreSubmission.submitOnGameEnd(mockGameState);
      
      expect(mockApiClient.submitScore).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.queued).toBe(true);
      
      const queuedSubmissions = scoreSubmission.getQueuedSubmissions();
      expect(queuedSubmissions).toHaveLength(1);
    });

    test('should process queued submissions when back online', async () => {
      mockApiClient.isOnline.mockReturnValue(false);
      const scoreSubmission = new ScoreSubmission(mockApiClient);
      
      // Queue submission while offline
      await scoreSubmission.submitOnGameEnd(mockGameState);
      
      // Come back online
      mockApiClient.isOnline.mockReturnValue(true);
      mockApiClient.submitScore.mockResolvedValue({ success: true, submissionId: 'SUB123' });
      
      const result = await scoreSubmission.processQueuedSubmissions();
      
      expect(mockApiClient.submitScore).toHaveBeenCalledTimes(1);
      expect(result.processed).toBe(1);
      expect(result.successful).toBe(1);
    });
  });
});