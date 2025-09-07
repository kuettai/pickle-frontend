/**
 * Offline Mode Support Tests
 * TDD Implementation - Tests written FIRST before implementation
 */

describe('Offline Mode Support', () => {
    let mockApp, mockGameState, offlineManager;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div class="court">
                <div class="connection-indicator" id="connection-status"></div>
            </div>
        `;

        mockGameState = {
            matchId: 'MATCH-001',
            gameMode: 'doubles',
            teams: {
                left: { score: 5, players: [{ name: 'Player 1' }] },
                right: { score: 3, players: [{ name: 'Player 2' }] }
            },
            serving: { team: 'left', player: 1 },
            gameStatus: 'active'
        };

        // Mock OfflineManager class
        if (typeof OfflineManager !== 'undefined') {
            offlineManager = new OfflineManager();
        }

        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
    });

    describe('Connection Detection', () => {
        test('should detect online status', () => {
            navigator.onLine = true;
            if (offlineManager) {
                expect(offlineManager.isOnline()).toBe(true);
            }
        });

        test('should detect offline status', () => {
            navigator.onLine = false;
            if (offlineManager) {
                expect(offlineManager.isOnline()).toBe(false);
            }
        });

        test('should listen for online/offline events', () => {
            if (offlineManager) {
                const onlineHandler = jest.fn();
                const offlineHandler = jest.fn();
                
                offlineManager.onConnectionChange(onlineHandler, offlineHandler);
                
                // Simulate going offline
                navigator.onLine = false;
                window.dispatchEvent(new Event('offline'));
                
                expect(offlineHandler).toHaveBeenCalled();
                
                // Simulate going online
                navigator.onLine = true;
                window.dispatchEvent(new Event('online'));
                
                expect(onlineHandler).toHaveBeenCalled();
            }
        });
    });

    describe('WiFi Connection Indicator', () => {
        test('should show online indicator when connected', () => {
            if (offlineManager) {
                navigator.onLine = true;
                offlineManager.updateConnectionIndicator();
                
                const indicator = document.getElementById('connection-status');
                expect(indicator.classList.contains('online')).toBe(true);
                expect(indicator.textContent).toContain('📶');
            }
        });

        test('should show offline indicator when disconnected', () => {
            if (offlineManager) {
                navigator.onLine = false;
                offlineManager.updateConnectionIndicator();
                
                const indicator = document.getElementById('connection-status');
                expect(indicator.classList.contains('offline')).toBe(true);
                expect(indicator.textContent).toContain('📵');
            }
        });

        test('should update indicator on connection change', () => {
            if (offlineManager) {
                // Start online
                navigator.onLine = true;
                offlineManager.updateConnectionIndicator();
                let indicator = document.getElementById('connection-status');
                expect(indicator.classList.contains('online')).toBe(true);
                
                // Go offline
                navigator.onLine = false;
                offlineManager.updateConnectionIndicator();
                indicator = document.getElementById('connection-status');
                expect(indicator.classList.contains('offline')).toBe(true);
            }
        });
    });

    describe('Game State Persistence', () => {
        test('should save game state to localStorage when offline', () => {
            if (offlineManager) {
                navigator.onLine = false;
                offlineManager.saveGameState(mockGameState);
                
                const saved = JSON.parse(localStorage.getItem('offlineGameState'));
                expect(saved.matchId).toBe('MATCH-001');
                expect(saved.teams.left.score).toBe(5);
            }
        });

        test('should restore game state from localStorage', () => {
            if (offlineManager) {
                localStorage.setItem('offlineGameState', JSON.stringify(mockGameState));
                
                const restored = offlineManager.restoreGameState();
                expect(restored.matchId).toBe('MATCH-001');
                expect(restored.teams.left.score).toBe(5);
            }
        });

        test('should auto-save game state on score changes when offline', () => {
            if (offlineManager) {
                navigator.onLine = false;
                offlineManager.enableAutoSave();
                
                // Simulate score change
                mockGameState.teams.left.score = 6;
                offlineManager.onGameStateChange(mockGameState);
                
                const saved = JSON.parse(localStorage.getItem('offlineGameState'));
                expect(saved.teams.left.score).toBe(6);
            }
        });

        test('should clear saved state when back online', () => {
            if (offlineManager) {
                // Save state while offline
                navigator.onLine = false;
                offlineManager.saveGameState(mockGameState);
                expect(localStorage.getItem('offlineGameState')).toBeTruthy();
                
                // Go back online
                navigator.onLine = true;
                offlineManager.onConnectionRestored();
                expect(localStorage.getItem('offlineGameState')).toBeFalsy();
            }
        });
    });

    describe('Offline Queue Management', () => {
        test('should queue actions when offline', () => {
            if (offlineManager) {
                navigator.onLine = false;
                
                const action = {
                    type: 'SCORE_UPDATE',
                    data: { team: 'left', newScore: 6 },
                    timestamp: Date.now()
                };
                
                offlineManager.queueAction(action);
                
                const queue = offlineManager.getOfflineQueue();
                expect(queue.length).toBe(1);
                expect(queue[0].type).toBe('SCORE_UPDATE');
            }
        });

        test('should process queued actions when back online', async () => {
            if (offlineManager) {
                // Queue actions while offline
                navigator.onLine = false;
                offlineManager.queueAction({ type: 'SCORE_UPDATE', data: { score: 6 } });
                offlineManager.queueAction({ type: 'SIDEOUT', data: { newServer: 'right' } });
                
                expect(offlineManager.getOfflineQueue().length).toBe(2);
                
                // Go back online and process
                navigator.onLine = true;
                const processedCount = await offlineManager.processOfflineQueue();
                
                expect(processedCount).toBe(2);
                expect(offlineManager.getOfflineQueue().length).toBe(0);
            }
        });

        test('should handle queue processing failures gracefully', async () => {
            if (offlineManager) {
                // Mock a failing action processor
                offlineManager.setActionProcessor(() => {
                    throw new Error('Processing failed');
                });
                
                navigator.onLine = false;
                offlineManager.queueAction({ type: 'SCORE_UPDATE', data: {} });
                
                navigator.onLine = true;
                const processedCount = await offlineManager.processOfflineQueue();
                
                // Should handle failure without crashing
                expect(processedCount).toBe(0);
                expect(offlineManager.getOfflineQueue().length).toBe(1); // Action remains queued
            }
        });
    });

    describe('Data Loss Prevention', () => {
        test('should prevent data loss during network outages', () => {
            if (offlineManager) {
                // Simulate network outage during game
                navigator.onLine = true;
                offlineManager.startGame(mockGameState);
                
                // Network goes down
                navigator.onLine = false;
                window.dispatchEvent(new Event('offline'));
                
                // Continue playing offline
                mockGameState.teams.left.score = 7;
                offlineManager.onGameStateChange(mockGameState);
                
                // Verify data is preserved
                const saved = offlineManager.restoreGameState();
                expect(saved.teams.left.score).toBe(7);
            }
        });

        test('should sync data when connection restored', async () => {
            if (offlineManager) {
                // Setup offline state
                navigator.onLine = false;
                offlineManager.saveGameState(mockGameState);
                offlineManager.queueAction({ type: 'SCORE_UPDATE', data: { score: 8 } });
                
                // Connection restored
                navigator.onLine = true;
                const syncResult = await offlineManager.syncOfflineData();
                
                expect(syncResult.success).toBe(true);
                expect(syncResult.gameStateSynced).toBe(true);
                expect(syncResult.actionsProcessed).toBe(1);
            }
        });
    });

    describe('Connection Status Monitoring', () => {
        test('should monitor connection status continuously', () => {
            if (offlineManager) {
                const statusCallback = jest.fn();
                offlineManager.startConnectionMonitoring(statusCallback);
                
                // Simulate connection changes
                navigator.onLine = false;
                window.dispatchEvent(new Event('offline'));
                
                expect(statusCallback).toHaveBeenCalledWith(false);
                
                navigator.onLine = true;
                window.dispatchEvent(new Event('online'));
                
                expect(statusCallback).toHaveBeenCalledWith(true);
            }
        });

        test('should detect slow/unstable connections', async () => {
            if (offlineManager) {
                // Mock slow network response
                global.fetch = jest.fn(() => 
                    new Promise(resolve => 
                        setTimeout(() => resolve({ ok: true }), 5000)
                    )
                );
                
                const connectionQuality = await offlineManager.testConnectionQuality();
                expect(connectionQuality.speed).toBe('slow');
                expect(connectionQuality.stable).toBe(false);
            }
        });

        test('should provide connection quality feedback', () => {
            if (offlineManager) {
                offlineManager.updateConnectionQuality('slow');
                
                const indicator = document.getElementById('connection-status');
                expect(indicator.classList.contains('slow-connection')).toBe(true);
                expect(indicator.title).toContain('slow');
            }
        });
    });

    describe('Integration with Score Submission', () => {
        test('should queue score submissions when offline', () => {
            if (offlineManager) {
                navigator.onLine = false;
                
                const scoreData = {
                    matchId: 'MATCH-001',
                    finalScore: { left: 11, right: 9 },
                    winner: 'left'
                };
                
                offlineManager.queueScoreSubmission(scoreData);
                
                const queue = offlineManager.getOfflineQueue();
                const submission = queue.find(item => item.type === 'SCORE_SUBMISSION');
                expect(submission).toBeTruthy();
                expect(submission.data.matchId).toBe('MATCH-001');
            }
        });

        test('should auto-submit queued scores when back online', async () => {
            if (offlineManager) {
                // Queue submission while offline
                navigator.onLine = false;
                const scoreData = { matchId: 'MATCH-001', finalScore: { left: 11, right: 9 } };
                offlineManager.queueScoreSubmission(scoreData);
                
                // Mock successful submission
                const mockSubmit = jest.fn().mockResolvedValue({ success: true });
                offlineManager.setScoreSubmissionHandler(mockSubmit);
                
                // Go back online
                navigator.onLine = true;
                await offlineManager.processOfflineQueue();
                
                expect(mockSubmit).toHaveBeenCalledWith(scoreData);
            }
        });
    });

    describe('User Notifications', () => {
        test('should notify user when going offline', () => {
            if (offlineManager) {
                const notificationSpy = jest.spyOn(offlineManager, 'showNotification');
                
                navigator.onLine = false;
                offlineManager.onConnectionLost();
                
                expect(notificationSpy).toHaveBeenCalledWith(
                    'Connection lost. Game will continue offline.',
                    'warning'
                );
            }
        });

        test('should notify user when back online', () => {
            if (offlineManager) {
                const notificationSpy = jest.spyOn(offlineManager, 'showNotification');
                
                navigator.onLine = true;
                offlineManager.onConnectionRestored();
                
                expect(notificationSpy).toHaveBeenCalledWith(
                    'Connection restored. Syncing data...',
                    'success'
                );
            }
        });

        test('should show sync progress during data synchronization', async () => {
            if (offlineManager) {
                const progressSpy = jest.spyOn(offlineManager, 'updateSyncProgress');
                
                // Setup offline data
                navigator.onLine = false;
                offlineManager.queueAction({ type: 'ACTION1' });
                offlineManager.queueAction({ type: 'ACTION2' });
                
                // Sync when back online
                navigator.onLine = true;
                await offlineManager.syncOfflineData();
                
                expect(progressSpy).toHaveBeenCalledWith(0, 2); // Start
                expect(progressSpy).toHaveBeenCalledWith(2, 2); // Complete
            }
        });
    });
});