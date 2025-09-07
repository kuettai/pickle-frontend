/**
 * Serving Side Visual Indicator
 * Shows clear visual indication of which side to serve from
 */

class ServingSideIndicator {
    constructor(container) {
        this.container = container;
        this.currentIndicator = null;
        this.hideTimeout = null;
    }

    show(gameState, autoHideMs = 3000) {
        this.hide(); // Remove any existing indicator
        
        const indicator = document.createElement('div');
        indicator.className = 'serving-side-indicator indicator-animate';
        
        // Position based on serving side
        if (gameState.serving.side === 'right') {
            indicator.classList.add('indicator-right');
        } else {
            indicator.classList.add('indicator-left');
        }
        
        // Create arrow
        const arrow = document.createElement('div');
        arrow.className = 'serving-arrow';
        
        // Create text
        const text = document.createElement('div');
        text.className = 'serving-text';
        text.textContent = 'SERVE';
        
        indicator.appendChild(arrow);
        indicator.appendChild(text);
        
        // Style the indicator
        indicator.style.position = 'absolute';
        indicator.style.zIndex = '15';
        indicator.style.top = '20vh';
        indicator.style.display = 'flex';
        indicator.style.flexDirection = 'column';
        indicator.style.alignItems = 'center';
        indicator.style.transition = 'all 0.3s ease';
        
        if (gameState.serving.side === 'right') {
            indicator.style.right = '5vh';
        } else {
            indicator.style.left = '5vh';
        }
        
        this.container.appendChild(indicator);
        this.currentIndicator = indicator;
        
        // Auto-hide after timeout
        if (autoHideMs > 0) {
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, autoHideMs);
        }
    }
    
    update(gameState) {
        if (this.currentIndicator) {
            // Remove old position classes
            this.currentIndicator.classList.remove('indicator-left', 'indicator-right');
            
            // Add new position class
            if (gameState.serving.side === 'right') {
                this.currentIndicator.classList.add('indicator-right');
                this.currentIndicator.style.right = '5vh';
                this.currentIndicator.style.left = 'auto';
            } else {
                this.currentIndicator.classList.add('indicator-left');
                this.currentIndicator.style.left = '5vh';
                this.currentIndicator.style.right = 'auto';
            }
        }
    }
    
    hide() {
        if (this.currentIndicator) {
            this.currentIndicator.remove();
            this.currentIndicator = null;
        }
        
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }
}

// Make available globally
window.ServingSideIndicator = ServingSideIndicator;