/**
 * Visual Touch Feedback System
 * Provides immediate visual feedback for touch interactions
 */

class TouchFeedback {
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
        const rect = courtElement.getBoundingClientRect ? courtElement.getBoundingClientRect() : { left: 0, top: 0 };
        
        // Create large, bright ripple
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.position = 'absolute';
        ripple.style.left = (touch.clientX - rect.left - 75) + 'px';
        ripple.style.top = (touch.clientY - rect.top - 75) + 'px';
        ripple.style.width = '150px';
        ripple.style.height = '150px';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.8)';
        ripple.style.border = '2px solid white';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '1000';

        courtElement.appendChild(ripple);

        // Trigger dramatic animation
        if (typeof requestAnimationFrame !== 'undefined') {
            requestAnimationFrame(() => {
                ripple.style.transform = 'scale(3)';
                ripple.style.opacity = '0';
            });
        } else {
            ripple.style.transform = 'scale(3)';
            ripple.style.opacity = '0';
        }

        // Remove after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 500);
    }

    animateScoreUpdate(newScore) {
        const scoreDisplay = this.container.querySelector('.score-display');
        if (!scoreDisplay) return;

        // Dramatic score update animation
        scoreDisplay.style.transform = 'scale(1.3)';
        scoreDisplay.style.background = 'rgba(255, 165, 0, 0.9)';
        scoreDisplay.style.boxShadow = '0 0 30px rgba(255, 165, 0, 0.8)';
        scoreDisplay.style.transition = 'all 0.3s ease-out';
        scoreDisplay.textContent = newScore;

        setTimeout(() => {
            scoreDisplay.style.transform = 'scale(1)';
            scoreDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
            scoreDisplay.style.boxShadow = 'none';
        }, 400);
    }

    flashCourt(team, type) {
        const courtElement = this.container.querySelector(`.${team}-side`);
        if (!courtElement) return;

        // Dramatic court flash with bright colors
        if (type === 'point') {
            courtElement.style.background = '#00FF00';
            courtElement.style.boxShadow = 'inset 0 0 50px rgba(0, 255, 0, 0.8)';
        } else {
            courtElement.style.background = '#FF4500';
            courtElement.style.boxShadow = 'inset 0 0 50px rgba(255, 69, 0, 0.8)';
        }
        
        courtElement.style.transition = 'all 0.1s ease-out';

        setTimeout(() => {
            courtElement.style.background = '#00AA00';
            courtElement.style.boxShadow = 'none';
            courtElement.style.transition = 'all 0.5s ease-out';
        }, 400);
    }

    onGameStateUpdate(gameState, action) {
        const scoreText = gameState.gameMode === 'singles' 
            ? `${gameState.teams.left.score}-${gameState.teams.right.score}`
            : `${gameState.teams.left.score}-${gameState.teams.right.score}-${gameState.serving.player}`;
        
        this.animateScoreUpdate(scoreText);

        // Only flash the side that benefits
        if (action === 'point') {
            // Point scored - flash serving team GREEN (they got the point)
            this.flashCourt(gameState.serving.team, 'point');
        }
        // No flash for sideout - just serve changes, no visual confusion
    }
}

// Make available globally
window.TouchFeedback = TouchFeedback;