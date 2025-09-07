/**
 * Performance Optimizer Module
 * Implements performance optimizations for touch response, DOM updates, and battery efficiency
 */

class PerformanceOptimizer {
  constructor() {
    this.domCache = new Map();
    this.animationFrameId = null;
    this.pendingUpdates = new Set();
    this.touchStartTime = 0;
    this.isOptimized = false;
    
    this.init();
  }
  
  init() {
    this.setupPassiveEventListeners();
    this.optimizeAnimations();
    this.setupDOMCaching();
    this.setupMemoryManagement();
    this.isOptimized = true;
  }
  
  // Touch Response Optimization
  setupPassiveEventListeners() {
    const options = { passive: true };
    
    // Override addEventListener to use passive listeners for touch events
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type.startsWith('touch') && typeof options !== 'object') {
        options = { passive: true };
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
  
  measureTouchResponse(callback) {
    return (...args) => {
      this.touchStartTime = performance.now();
      const result = callback.apply(this, args);
      
      // Schedule immediate visual feedback
      requestAnimationFrame(() => {
        const responseTime = performance.now() - this.touchStartTime;
        if (responseTime > 100) {
          console.warn(`Touch response time: ${responseTime.toFixed(2)}ms (target: <100ms)`);
        }
      });
      
      return result;
    };
  }
  
  // DOM Update Optimization
  setupDOMCaching() {
    // Cache frequently accessed DOM elements
    this.cacheElement('score-display', '#score-display');
    this.cacheElement('left-side', '.left-side');
    this.cacheElement('right-side', '.right-side');
    this.cacheElement('connection-status', '#connection-status');
  }
  
  cacheElement(key, selector) {
    const element = document.querySelector(selector);
    if (element) {
      this.domCache.set(key, element);
    }
  }
  
  getCachedElement(key) {
    return this.domCache.get(key);
  }
  
  batchDOMUpdates(updates) {
    // Cancel previous frame if pending
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Add updates to pending set
    updates.forEach(update => this.pendingUpdates.add(update));
    
    // Schedule batched update
    this.animationFrameId = requestAnimationFrame(() => {
      this.processPendingUpdates();
      this.animationFrameId = null;
    });
  }
  
  processPendingUpdates() {
    // Process all pending updates in single frame
    this.pendingUpdates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.error('DOM update error:', error);
      }
    });
    
    this.pendingUpdates.clear();
  }
  
  // Animation Performance Optimization
  optimizeAnimations() {
    // Add CSS for hardware acceleration
    const style = document.createElement('style');
    style.textContent = `
      .score-display {
        will-change: transform;
        transform: translateZ(0);
      }
      
      .touch-ripple {
        will-change: transform, opacity;
        transform: translateZ(0);
      }
      
      .current-server {
        will-change: transform;
        transform: translateZ(0);
      }
      
      .updating {
        transition: transform 0.2s ease-out;
        transform: scale(1.1) translateZ(0);
      }
    `;
    document.head.appendChild(style);
  }
  
  createOptimizedAnimation(element, keyframes, options = {}) {
    // Use Web Animations API for better performance
    const defaultOptions = {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards'
    };
    
    const animation = element.animate(keyframes, { ...defaultOptions, ...options });
    
    // Clean up after animation
    animation.addEventListener('finish', () => {
      element.style.willChange = 'auto';
    });
    
    return animation;
  }
  
  // Memory Management
  setupMemoryManagement() {
    // Cleanup interval for memory optimization
    setInterval(() => {
      this.cleanupMemory();
    }, 30000); // Every 30 seconds
  }
  
  cleanupMemory() {
    // Clear expired cache entries
    this.domCache.forEach((element, key) => {
      if (!document.contains(element)) {
        this.domCache.delete(key);
      }
    });
    
    // Force garbage collection if available (dev tools)
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }
  
  // Network Performance
  optimizeNetworkRequests() {
    // Implement request debouncing
    const requestCache = new Map();
    const pendingRequests = new Map();
    
    return {
      fetch: async (url, options = {}) => {
        const cacheKey = `${url}-${JSON.stringify(options)}`;
        
        // Check cache first
        if (requestCache.has(cacheKey)) {
          const cached = requestCache.get(cacheKey);
          if (Date.now() - cached.timestamp < 5000) { // 5 second cache
            return cached.response;
          }
        }
        
        // Check if request is already pending
        if (pendingRequests.has(cacheKey)) {
          return pendingRequests.get(cacheKey);
        }
        
        // Make new request
        const requestPromise = fetch(url, options).then(response => {
          const clonedResponse = response.clone();
          requestCache.set(cacheKey, {
            response: clonedResponse,
            timestamp: Date.now()
          });
          pendingRequests.delete(cacheKey);
          return response;
        }).catch(error => {
          pendingRequests.delete(cacheKey);
          throw error;
        });
        
        pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
      }
    };
  }
  
  // Battery Optimization
  optimizeBatteryUsage() {
    // Reduce animation frequency when on battery
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (!battery.charging && battery.level < 0.2) {
          // Reduce animations when battery is low
          this.enablePowerSaveMode();
        }
        
        battery.addEventListener('levelchange', () => {
          if (!battery.charging && battery.level < 0.2) {
            this.enablePowerSaveMode();
          } else {
            this.disablePowerSaveMode();
          }
        });
      });
    }
  }
  
  enablePowerSaveMode() {
    document.body.classList.add('power-save-mode');
    
    // Add CSS for reduced animations
    const style = document.createElement('style');
    style.id = 'power-save-style';
    style.textContent = `
      .power-save-mode * {
        animation-duration: 0.1s !important;
        transition-duration: 0.1s !important;
      }
      
      .power-save-mode .touch-ripple {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }
  
  disablePowerSaveMode() {
    document.body.classList.remove('power-save-mode');
    const style = document.getElementById('power-save-style');
    if (style) {
      style.remove();
    }
  }
  
  // Performance Monitoring
  startPerformanceMonitoring() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          console.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure', 'navigation'] });
    
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        if (fps < 50) {
          console.warn(`Low FPS detected: ${fps} (target: 60)`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  // Utility Methods
  measurePerformance(name, fn) {
    return (...args) => {
      performance.mark(`${name}-start`);
      const result = fn.apply(this, args);
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      return result;
    };
  }
  
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
  
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // Cleanup
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.domCache.clear();
    this.pendingUpdates.clear();
    this.isOptimized = false;
  }
}

// Export for use in main app
if (typeof window !== 'undefined') {
  window.PerformanceOptimizer = PerformanceOptimizer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceOptimizer };
}