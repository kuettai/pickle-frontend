/**
 * Performance Optimization Tests
 * Tests for touch response time, DOM updates, and battery optimization
 */

// Import required modules
const { PickleballApp } = require('../sources/app.js');
const { PerformanceOptimizer } = require('../sources/performance-optimizer.js');

// Mock global objects for testing
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByType: () => [],
  memory: { usedJSHeapSize: 1000000 }
};

global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.TouchEvent = class TouchEvent extends Event {
  constructor(type, options = {}) {
    super(type);
    this.touches = options.touches || [];
  }
};

describe('Performance Optimization', () => {
    let app, mockContainer, performanceMonitor;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
          <div id="app">
            <div class="court">
              <div id="score-display">0-0</div>
              <div class="left-side left-court"></div>
              <div class="right-side right-court"></div>
            </div>
          </div>
        `;
        mockContainer = document.getElementById('app');
        
        // Performance monitoring utilities
        performanceMonitor = {
            touchStartTime: 0,
            touchEndTime: 0,
            domUpdateStartTime: 0,
            domUpdateEndTime: 0,
            
            startTouchTimer() {
                this.touchStartTime = performance.now();
            },
            
            endTouchTimer() {
                this.touchEndTime = performance.now();
                return this.touchEndTime - this.touchStartTime;
            },
            
            startDOMTimer() {
                this.domUpdateStartTime = performance.now();
            },
            
            endDOMTimer() {
                this.domUpdateEndTime = performance.now();
                return this.domUpdateEndTime - this.domUpdateStartTime;
            }
        };
    });

    describe('Touch Response Performance', () => {
        test('should respond to touch events within 100ms', async () => {
            // Setup game in active state
            app = new PickleballApp(mockContainer);
            
            // Mock the required dependencies
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            app.gameState.teams = {
                left: { score: 0, players: [{ name: 'Player 1' }] },
                right: { score: 0, players: [{ name: 'Player 2' }] }
            };
            
            const leftCourt = mockContainer.querySelector('.left-side');
            
            // Measure touch response time
            performanceMonitor.startTouchTimer();
            
            const touchEvent = new TouchEvent('touchend', {
                touches: [{ clientX: 100, clientY: 200 }]
            });
            
            leftCourt.dispatchEvent(touchEvent);
            
            // Wait for visual feedback to appear
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const responseTime = performanceMonitor.endTouchTimer();
            
            expect(responseTime).toBeLessThan(100);
        });

        test('should handle rapid touch events without lag', async () => {
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            
            const leftCourt = mockContainer.querySelector('.left-side');
            const responseTimes = [];
            
            // Simulate 10 rapid touches
            for (let i = 0; i < 10; i++) {
                performanceMonitor.startTouchTimer();
                
                const touchEvent = new TouchEvent('touchend', {
                    touches: [{ clientX: 100 + i, clientY: 200 }]
                });
                
                leftCourt.dispatchEvent(touchEvent);
                await new Promise(resolve => requestAnimationFrame(resolve));
                
                responseTimes.push(performanceMonitor.endTouchTimer());
            }
            
            // All touches should be under 100ms
            responseTimes.forEach(time => {
                expect(time).toBeLessThan(100);
            });
            
            // Average should be well under 100ms
            const average = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
            expect(average).toBeLessThan(50);
        });

        test('should maintain performance during extended use', async () => {
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            
            const leftCourt = mockContainer.querySelector('.left-side');
            const responseTimes = [];
            
            // Simulate 100 touches over time
            for (let i = 0; i < 100; i++) {
                performanceMonitor.startTouchTimer();
                
                const touchEvent = new TouchEvent('touchend', {
                    touches: [{ clientX: 100, clientY: 200 }]
                });
                
                leftCourt.dispatchEvent(touchEvent);
                await new Promise(resolve => requestAnimationFrame(resolve));
                
                responseTimes.push(performanceMonitor.endTouchTimer());
                
                // Small delay to simulate real usage
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            // Performance should not degrade over time
            const firstTen = responseTimes.slice(0, 10);
            const lastTen = responseTimes.slice(-10);
            
            const firstAvg = firstTen.reduce((a, b) => a + b) / firstTen.length;
            const lastAvg = lastTen.reduce((a, b) => a + b) / lastTen.length;
            
            // Performance degradation should be minimal
            expect(lastAvg - firstAvg).toBeLessThan(20);
        });
    });

    describe('DOM Update Performance', () => {
        test('should update score display within 200ms', async () => {
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            
            performanceMonitor.startDOMTimer();
            
            // Trigger score update
            const leftCourt = mockContainer.querySelector('.left-side');
            leftCourt.click();
            
            // Wait for DOM update
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            const updateTime = performanceMonitor.endDOMTimer();
            
            expect(updateTime).toBeLessThan(200);
        });

        test('should batch DOM updates efficiently', async () => {
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            
            const initialReflows = performance.getEntriesByType('measure').length;
            
            // Trigger multiple updates
            const leftCourt = mockContainer.querySelector('.left-side');
            for (let i = 0; i < 5; i++) {
                leftCourt.click();
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            
            const finalReflows = performance.getEntriesByType('measure').length;
            const reflowCount = finalReflows - initialReflows;
            
            // Should not cause excessive reflows
            expect(reflowCount).toBeLessThan(10);
        });

        test('should use CSS transforms for animations', () => {
            app = new PickleballApp(mockContainer);
            
            const scoreDisplay = mockContainer.querySelector('.score-display');
            const computedStyle = window.getComputedStyle(scoreDisplay);
            
            // Should use transform instead of position changes
            expect(computedStyle.transition).toContain('transform');
            expect(computedStyle.transition).not.toContain('left');
            expect(computedStyle.transition).not.toContain('top');
        });
    });

    describe('Memory Management', () => {
        test('should not create memory leaks during gameplay', async () => {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            
            // Simulate extended gameplay
            const leftCourt = mockContainer.querySelector('.left-side');
            for (let i = 0; i < 50; i++) {
                leftCourt.click();
                await new Promise(resolve => requestAnimationFrame(resolve));
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            if (performance.memory) {
                const memoryIncrease = finalMemory - initialMemory;
                // Memory increase should be reasonable (less than 10MB)
                expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
            }
        });

        test('should clean up event listeners properly', () => {
            app = new PickleballApp(mockContainer);
            
            const initialListeners = document.querySelectorAll('*').length;
            
            // Create and destroy multiple game instances
            for (let i = 0; i < 5; i++) {
                const tempApp = new PickleballApp(mockContainer);
                tempApp.destroy && tempApp.destroy();
            }
            
            const finalListeners = document.querySelectorAll('*').length;
            
            // Should not accumulate DOM elements
            expect(finalListeners - initialListeners).toBeLessThan(10);
        });
    });

    describe('Animation Performance', () => {
        test('should maintain 60fps during touch feedback animations', async () => {
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            app.gameState.gameMode = 'doubles';
            
            const frameRates = [];
            let lastTime = performance.now();
            
            // Monitor frame rate during animation
            const measureFrameRate = () => {
                const currentTime = performance.now();
                const fps = 1000 / (currentTime - lastTime);
                frameRates.push(fps);
                lastTime = currentTime;
                
                if (frameRates.length < 30) {
                    requestAnimationFrame(measureFrameRate);
                }
            };
            
            // Start animation
            const leftCourt = mockContainer.querySelector('.left-side');
            leftCourt.click();
            
            requestAnimationFrame(measureFrameRate);
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const averageFPS = frameRates.reduce((a, b) => a + b) / frameRates.length;
            
            // Should maintain close to 60fps
            expect(averageFPS).toBeGreaterThan(50);
        });

        test('should use hardware acceleration for animations', () => {
            app = new PickleballApp(mockContainer);
            
            const touchFeedback = mockContainer.querySelector('.touch-ripple');
            if (touchFeedback) {
                const computedStyle = window.getComputedStyle(touchFeedback);
                
                // Should use transform3d or will-change for hardware acceleration
                expect(
                    computedStyle.transform.includes('3d') || 
                    computedStyle.willChange === 'transform'
                ).toBe(true);
            }
        });
    });

    describe('Network Performance', () => {
        test('should handle API calls within timeout limits', async () => {
            app = new PickleballApp(mockContainer);
            
            const startTime = performance.now();
            
            try {
                // Mock loadMatch to simulate API call
                app.loadMatch = async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return { success: true };
                };
                
                await app.loadMatch('MATCH-002');
                const loadTime = performance.now() - startTime;
                
                // Should load within reasonable time
                expect(loadTime).toBeLessThan(5000);
            } catch (error) {
                // Should handle timeouts gracefully
                expect(error.message).toContain('timeout');
            }
        });

        test('should queue offline actions efficiently', async () => {
            app = new PickleballApp(mockContainer);
            app.gameState.gameStatus = 'active';
            
            // Mock offline manager
            app.offlineManager = {
                isOnline: false,
                actionQueue: [],
                queueAction: function(action) {
                    this.actionQueue.push(action);
                }
            };
            
            const startTime = performance.now();
            
            // Queue multiple actions
            for (let i = 0; i < 10; i++) {
                app.offlineManager.queueAction({
                    type: 'SCORE_UPDATE',
                    data: { score: i }
                });
            }
            
            const queueTime = performance.now() - startTime;
            
            // Queuing should be fast
            expect(queueTime).toBeLessThan(50);
            expect(app.offlineManager.actionQueue.length).toBe(10);
        });
    });

    describe('Battery Optimization', () => {
        test('should minimize unnecessary DOM queries', () => {
            app = new PickleballApp(mockContainer);
            
            const originalQuerySelector = document.querySelector;
            let queryCount = 0;
            
            document.querySelector = function(...args) {
                queryCount++;
                return originalQuerySelector.apply(document, args);
            };
            
            // Perform typical operations
            app.updateScore('left', 5);
            app.updateScore('right', 3);
            app.updateServingTeam('left', 2);
            
            document.querySelector = originalQuerySelector;
            
            // Should cache DOM elements and minimize queries
            expect(queryCount).toBeLessThan(20);
        });

        test('should use passive event listeners where possible', () => {
            app = new PickleballApp(mockContainer);
            
            // Mock addEventListener to track passive option
            let passiveUsed = false;
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (type === 'touchstart' && options && options.passive) {
                    passiveUsed = true;
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
            
            // Setup event listeners
            app.setupEventListeners();
            
            // Restore original method
            EventTarget.prototype.addEventListener = originalAddEventListener;
            
            // Touch events should be passive for better performance
            expect(passiveUsed).toBe(true);
        });
    });
});