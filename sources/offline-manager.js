/**
 * Offline Mode Manager
 * Handles network detection, data persistence, and offline queue management
 */

class OfflineManager {
    constructor() {
        this.offlineQueue = [];
        this.connectionCallbacks = [];
        this.actionProcessor = null;
        this.scoreSubmissionHandler = null;
        this.autoSaveEnabled = false;
    }

    // Connection Detection
    isOnline() {
        return navigator.onLine;
    }

    onConnectionChange(onlineCallback, offlineCallback) {
        this.connectionCallbacks.push({ onlineCallback, offlineCallback });
        
        window.addEventListener('online', onlineCallback);
        window.addEventListener('offline', offlineCallback);
    }

    // WiFi Connection Indicator
    updateConnectionIndicator() {
        const indicator = document.getElementById('connection-status');
        if (!indicator) return;

        indicator.classList.remove('online', 'offline', 'slow-connection');
        
        if (this.isOnline()) {
            indicator.classList.add('online');
            indicator.textContent = '📶 Online';
        } else {
            indicator.classList.add('offline');
            indicator.textContent = '📵 Offline';
        }
    }

    // Game State Persistence
    saveGameState(gameState) {
        localStorage.setItem('offlineGameState', JSON.stringify(gameState));
    }

    restoreGameState() {
        const saved = localStorage.getItem('offlineGameState');
        return saved ? JSON.parse(saved) : null;
    }

    enableAutoSave() {
        this.autoSaveEnabled = true;
    }

    onGameStateChange(gameState) {
        if (!this.isOnline() && this.autoSaveEnabled) {
            this.saveGameState(gameState);
        }
    }

    onConnectionRestored() {
        localStorage.removeItem('offlineGameState');
    }

    // Offline Queue Management
    queueAction(action) {
        this.offlineQueue.push(action);
    }

    getOfflineQueue() {
        return [...this.offlineQueue];
    }

    async processOfflineQueue() {
        let processedCount = 0;
        const totalActions = this.offlineQueue.length;

        for (let i = 0; i < totalActions; i++) {
            try {
                if (this.actionProcessor) {
                    await this.actionProcessor(this.offlineQueue[i]);
                }
                processedCount++;
            } catch (error) {
                console.error('Failed to process queued action:', error);
                break;
            }
        }

        // Remove processed actions
        this.offlineQueue.splice(0, processedCount);
        return processedCount;
    }

    setActionProcessor(processor) {
        this.actionProcessor = processor;
    }

    // Game Management
    startGame(gameState) {
        if (!this.isOnline()) {
            this.saveGameState(gameState);
        }
    }

    async syncOfflineData() {
        const gameState = this.restoreGameState();
        const actionsProcessed = await this.processOfflineQueue();
        
        return {
            success: true,
            gameStateSynced: !!gameState,
            actionsProcessed
        };
    }

    // Connection Monitoring
    startConnectionMonitoring(statusCallback) {
        this.onConnectionChange(
            () => statusCallback(true),
            () => statusCallback(false)
        );
    }

    async testConnectionQuality() {
        const startTime = Date.now();
        
        try {
            await fetch('/ping', { timeout: 3000 });
            const responseTime = Date.now() - startTime;
            
            return {
                speed: responseTime > 2000 ? 'slow' : 'fast',
                stable: responseTime < 3000
            };
        } catch (error) {
            return {
                speed: 'slow',
                stable: false
            };
        }
    }

    updateConnectionQuality(quality) {
        const indicator = document.getElementById('connection-status');
        if (!indicator) return;

        if (quality === 'slow') {
            indicator.classList.add('slow-connection');
            indicator.title = 'Slow connection detected';
        }
    }

    // Score Submission Integration
    queueScoreSubmission(scoreData) {
        this.queueAction({
            type: 'SCORE_SUBMISSION',
            data: scoreData,
            timestamp: Date.now()
        });
    }

    setScoreSubmissionHandler(handler) {
        this.scoreSubmissionHandler = handler;
    }

    // Connection Event Handlers
    onConnectionLost() {
        this.showNotification('Connection lost. Game will continue offline.', 'warning');
        this.updateConnectionIndicator();
    }

    // User Notifications
    showNotification(message, type) {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    updateSyncProgress(current, total) {
        console.log(`Sync progress: ${current}/${total}`);
    }
}

// Make available globally
window.OfflineManager = OfflineManager;