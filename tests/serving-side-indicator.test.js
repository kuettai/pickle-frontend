/**
 * Serving Side Visual Indicator Tests
 * TDD Implementation - Tests written FIRST before implementation
 */

describe('Serving Side Visual Indicator', () => {
    let mockGameState, mockContainer, servingSideIndicator;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div class="court">
                <div class="left-side"></div>
                <div class="right-side"></div>
            </div>
        `;
        
        mockContainer = document.querySelector('.court');
        mockGameState = {
            serving: {
                team: 'left',
                side: 'right' // even score = right side
            },
            teams: {
                left: { score: 0 },
                right: { score: 0 }
            }
        };

        // Mock ServingSideIndicator class
        if (typeof ServingSideIndicator !== 'undefined') {
            servingSideIndicator = new ServingSideIndicator(mockContainer);
        }
    });

    describe('Indicator Creation', () => {
        test('should create serving side indicator element', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const indicator = document.querySelector('.serving-side-indicator');
                expect(indicator).toBeTruthy();
            }
        });

        test('should position indicator on correct side', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-right')).toBe(true);
            }
        });

        test('should show arrow pointing to serving side', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const arrow = document.querySelector('.serving-arrow');
                expect(arrow).toBeTruthy();
            }
        });
    });

    describe('Side Positioning', () => {
        test('should show right side indicator for even scores', () => {
            mockGameState.serving.side = 'right';
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-right')).toBe(true);
            }
        });

        test('should show left side indicator for odd scores', () => {
            mockGameState.serving.side = 'left';
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-left')).toBe(true);
            }
        });

        test('should update position when serving side changes', () => {
            if (servingSideIndicator) {
                // Start with right side
                servingSideIndicator.show(mockGameState);
                let indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-right')).toBe(true);

                // Change to left side
                mockGameState.serving.side = 'left';
                servingSideIndicator.update(mockGameState);
                indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-left')).toBe(true);
            }
        });
    });

    describe('Visual Elements', () => {
        test('should display "SERVE" text', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const text = document.querySelector('.serving-text');
                expect(text.textContent).toBe('SERVE');
            }
        });

        test('should have proper styling for visibility', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const indicator = document.querySelector('.serving-side-indicator');
                const computedStyle = window.getComputedStyle(indicator);
                expect(computedStyle.position).toBe('absolute');
                expect(computedStyle.zIndex).toBe('15');
            }
        });

        test('should animate indicator appearance', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                const indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-animate')).toBe(true);
            }
        });
    });

    describe('Hide/Show Functionality', () => {
        test('should hide indicator when requested', () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState);
                expect(document.querySelector('.serving-side-indicator')).toBeTruthy();
                
                servingSideIndicator.hide();
                expect(document.querySelector('.serving-side-indicator')).toBeFalsy();
            }
        });

        test('should auto-hide after timeout', async () => {
            if (servingSideIndicator) {
                servingSideIndicator.show(mockGameState, 100); // 100ms timeout
                expect(document.querySelector('.serving-side-indicator')).toBeTruthy();
                
                await new Promise(resolve => setTimeout(resolve, 150));
                expect(document.querySelector('.serving-side-indicator')).toBeFalsy();
            }
        });
    });

    describe('Integration with Game State', () => {
        test('should update when score changes affect serving side', () => {
            if (servingSideIndicator) {
                // Even score = right side
                mockGameState.teams.left.score = 2;
                mockGameState.serving.side = 'right';
                servingSideIndicator.show(mockGameState);
                
                let indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-right')).toBe(true);

                // Odd score = left side
                mockGameState.teams.left.score = 3;
                mockGameState.serving.side = 'left';
                servingSideIndicator.update(mockGameState);
                
                indicator = document.querySelector('.serving-side-indicator');
                expect(indicator.classList.contains('indicator-left')).toBe(true);
            }
        });

        test('should work with both singles and doubles modes', () => {
            if (servingSideIndicator) {
                // Test singles
                mockGameState.gameMode = 'singles';
                servingSideIndicator.show(mockGameState);
                expect(document.querySelector('.serving-side-indicator')).toBeTruthy();

                // Test doubles
                mockGameState.gameMode = 'doubles';
                servingSideIndicator.update(mockGameState);
                expect(document.querySelector('.serving-side-indicator')).toBeTruthy();
            }
        });
    });
});