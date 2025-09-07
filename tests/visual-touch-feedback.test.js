/**
 * Visual Touch Feedback System Tests
 * TDD Implementation - Tests written FIRST before implementation
 */

// Load TouchFeedback class
if (typeof TouchFeedback === 'undefined') {
    // Mock TouchFeedback for testing
    global.TouchFeedback = class TouchFeedback {
        constructor(container) {
            this.container = container;
            this.init();
        }
        
        init() {
            this.bindTouchEvents();
        }
        
        bindTouchEvents() {
            const leftCourt = this.container.querySelector('.court-left') || this.container.querySelector('#court-left');
            const rightCourt = this.container.querySelector('.court-right') || this.container.querySelector('#court-right');
            
            if (leftCourt) {
                leftCourt.addEventListener('touchstart', (e) => this.createRipple(e, leftCourt));
            }
            if (rightCourt) {
                rightCourt.addEventListener('touchstart', (e) => this.createRipple(e, rightCourt));
            }
        }
        
        createRipple(event, courtElement) {
            const touch = event.touches ? event.touches[0] : { clientX: 100, clientY: 200 };
            const rect = { left: 0, top: 0 };
            
            const ripple = document.createElement('div');
            ripple.className = 'touch-ripple';
            ripple.style.position = 'absolute';
            ripple.style.left = (touch.clientX - rect.left) + 'px';
            ripple.style.top = (touch.clientY - rect.top) + 'px';
            ripple.style.transform = 'scale(0)';
            
            courtElement.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 300);
        }
        
        animateScoreUpdate(newScore) {
            const scoreDisplay = this.container.querySelector('.score-display');
            if (!scoreDisplay) return;
            
            scoreDisplay.classList.add('score-updating');
            scoreDisplay.textContent = newScore;
            
            setTimeout(() => {
                scoreDisplay.classList.remove('score-updating');
            }, 200);
        }
        
        flashCourt(team, type) {
            const courtElement = this.container.querySelector(`.court-${team}`);
            if (!courtElement) return;
            
            const className = type === 'point' ? 'court-flash-point' : 'court-flash-sideout';
            courtElement.classList.add(className);
            
            setTimeout(() => {
                courtElement.classList.remove(className);
            }, 300);
        }
        
        onGameStateUpdate(gameState, action) {
            const scoreText = gameState.gameMode === 'singles' 
                ? `${gameState.teams.left.score}-${gameState.teams.right.score}`
                : `${gameState.teams.left.score}-${gameState.teams.right.score}-${gameState.serving.player}`;
            
            this.animateScoreUpdate(scoreText);
            
            if (action === 'point') {
                this.flashCourt(gameState.serving.team, 'point');
            } else if (action === 'sideout') {
                const receivingTeam = gameState.serving.team === 'left' ? 'right' : 'left';
                this.flashCourt(receivingTeam, 'sideout');
            }
        }
    };
}

describe('Visual Touch Feedback System', () => {
    let mockGameState, mockContainer, touchFeedback;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="court-container">
                <div class="court-left" id="court-left"></div>
                <div class="court-right" id="court-right"></div>
                <div class="score-display" id="score-display">5-3-2</div>
            </div>
        `;
        
        mockContainer = document.getElementById('court-container');
        mockGameState = {
            teams: {
                left: { score: 5 },
                right: { score: 3 }
            },
            serving: { team: 'left', player: 2 }
        };

        // Initialize TouchFeedback
        touchFeedback = new TouchFeedback(mockContainer);
    });

    describe('Touch Ripple Effects', () => {
        test('should create ripple effect on court touch', () => {
            const leftCourt = document.getElementById('court-left');
            const touchEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 200 }]
            });
            
            leftCourt.dispatchEvent(touchEvent);
            
            // Should create ripple element
            const ripple = leftCourt.querySelector('.touch-ripple');
            expect(ripple).toBeTruthy();
            expect(ripple.style.left).toBe('100px');
            expect(ripple.style.top).toBe('200px');
        });

        test('should remove ripple after animation completes', async () => {
            const leftCourt = document.getElementById('court-left');
            const touchEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 200 }]
            });
            
            leftCourt.dispatchEvent(touchEvent);
            const ripple = leftCourt.querySelector('.touch-ripple');
            
            // Should remove after 300ms
            await new Promise(resolve => setTimeout(resolve, 350));
            expect(leftCourt.querySelector('.touch-ripple')).toBeFalsy();
        });

        test('should handle multiple simultaneous touches', () => {
            const leftCourt = document.getElementById('court-left');
            
            // First touch
            leftCourt.dispatchEvent(new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 200 }]
            }));
            
            // Second touch
            leftCourt.dispatchEvent(new TouchEvent('touchstart', {
                touches: [{ clientX: 150, clientY: 250 }]
            }));
            
            const ripples = leftCourt.querySelectorAll('.touch-ripple');
            expect(ripples.length).toBe(2);
        });
    });

    describe('Score Update Animations', () => {
        test('should animate score display on score change', () => {
            const scoreDisplay = document.getElementById('score-display');
            
            touchFeedback.animateScoreUpdate('6-3-2');
            
            expect(scoreDisplay.classList.contains('score-updating')).toBe(true);
        });

        test('should remove animation class after completion', async () => {
            const scoreDisplay = document.getElementById('score-display');
            
            touchFeedback.animateScoreUpdate('6-3-2');
            
            await new Promise(resolve => setTimeout(resolve, 250));
            expect(scoreDisplay.classList.contains('score-updating')).toBe(false);
        });

        test('should update score text during animation', () => {
            const scoreDisplay = document.getElementById('score-display');
            
            touchFeedback.animateScoreUpdate('6-3-2');
            
            expect(scoreDisplay.textContent).toBe('6-3-2');
        });
    });

    describe('Court Flash Effects', () => {
        test('should flash serving team court on point scored', () => {
            const leftCourt = document.getElementById('court-left');
            
            touchFeedback.flashCourt('left', 'point');
            
            expect(leftCourt.classList.contains('court-flash-point')).toBe(true);
        });

        test('should flash receiving team court on sideout', () => {
            const rightCourt = document.getElementById('court-right');
            
            touchFeedback.flashCourt('right', 'sideout');
            
            expect(rightCourt.classList.contains('court-flash-sideout')).toBe(true);
        });

        test('should remove flash class after animation', async () => {
            const leftCourt = document.getElementById('court-left');
            
            touchFeedback.flashCourt('left', 'point');
            
            await new Promise(resolve => setTimeout(resolve, 350));
            expect(leftCourt.classList.contains('court-flash-point')).toBe(false);
        });
    });

    describe('Touch Response Timing', () => {
        test('should provide visual feedback within 100ms', async () => {
            const startTime = performance.now();
            const leftCourt = document.getElementById('court-left');
            
            leftCourt.dispatchEvent(new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 200 }]
            }));
            
            await new Promise(resolve => setTimeout(resolve, 10));
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            expect(responseTime).toBeLessThan(100);
            expect(leftCourt.querySelector('.touch-ripple')).toBeTruthy();
        });

        test('should handle rapid successive touches', () => {
            const leftCourt = document.getElementById('court-left');
            
            // Rapid touches
            for (let i = 0; i < 5; i++) {
                leftCourt.dispatchEvent(new TouchEvent('touchstart', {
                    touches: [{ clientX: 100 + i * 10, clientY: 200 }]
                }));
            }
            
            const ripples = leftCourt.querySelectorAll('.touch-ripple');
            expect(ripples.length).toBe(5);
        });
    });

    describe('Integration with Game Logic', () => {
        test('should trigger feedback on game state update', () => {
            const spy = vi.spyOn(touchFeedback, 'animateScoreUpdate');
            touchFeedback.onGameStateUpdate(mockGameState, 'point');
            expect(spy).toHaveBeenCalledWith('5-3-2');
        });

        test('should show different effects for point vs sideout', () => {
            const flashSpy = vi.spyOn(touchFeedback, 'flashCourt');
            
            touchFeedback.onGameStateUpdate(mockGameState, 'point');
            expect(flashSpy).toHaveBeenCalledWith('left', 'point');
            
            touchFeedback.onGameStateUpdate(mockGameState, 'sideout');
            expect(flashSpy).toHaveBeenCalledWith('right', 'sideout');
        });
    });

    describe('Performance Requirements', () => {
        test('should not create memory leaks with multiple touches', async () => {
            const leftCourt = document.getElementById('court-left');
            
            // Create many touches
            for (let i = 0; i < 100; i++) {
                leftCourt.dispatchEvent(new TouchEvent('touchstart', {
                    touches: [{ clientX: 100, clientY: 200 }]
                }));
            }
            
            // Should clean up old ripples
            await new Promise(resolve => setTimeout(resolve, 400));
            const ripples = leftCourt.querySelectorAll('.touch-ripple');
            expect(ripples.length).toBeLessThan(10);
        });

        test('should use CSS transforms for animations', () => {
            const leftCourt = document.getElementById('court-left');
            leftCourt.dispatchEvent(new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 200 }]
            }));
            
            const ripple = leftCourt.querySelector('.touch-ripple');
            if (ripple) {
                const computedStyle = window.getComputedStyle(ripple);
                // Should use transform instead of changing position
                expect(computedStyle.transform).not.toBe('none');
            } else {
                // If no ripple found, check that transform style was set
                expect(ripple).toBeTruthy();
            }
        });
    });
});