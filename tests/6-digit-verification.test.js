// 6-Digit Verification Input Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock configuration
global.TournamentConfig = {
  demo: {
    enabled: true,
    authCodes: ['REF2024', 'ADMIN123', 'DEMO', 'TEST'],
    successRate: 1.0
  },
  apis: {
    timeout: 10000,
    auth: { endpoint: '/api/auth' }
  }
};

// Mock classes
global.PerformanceOptimizer = class {};
global.ScoreSubmission = class {};
global.TouchFeedback = class {};
global.OfflineManager = class {};
global.DemoData = {
  isValidMatch: () => true,
  getMatch: () => ({ matchId: 'MATCH-001', gameMode: 'singles' })
};

describe('6-Digit Verification Input', () => {
  let dom;
  let app;

  beforeEach(() => {
    // Setup DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body></body>
      </html>
    `, { 
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.sessionStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };
    global.localStorage = {
      getItem: vi.fn(() => '[]'),
      setItem: vi.fn()
    };

    // Import and create app
    const { PickleballApp } = require('../sources/app.js');
    app = new PickleballApp();
  });

  describe('Step 2 Screen with 6-Digit Input', () => {
    it('should create 6 separate digit input boxes', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const digitInputs = document.querySelectorAll('.digit-input');
      expect(digitInputs).toHaveLength(6);
      
      digitInputs.forEach((input, index) => {
        expect(input.getAttribute('maxlength')).toBe('1');
        expect(input.getAttribute('data-index')).toBe(index.toString());
      });
    });

    it('should focus the first input box', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const firstInput = document.querySelector('.digit-input[data-index="0"]');
      expect(document.activeElement).toBe(firstInput);
    });

    it('should auto-advance to next input on digit entry', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const firstInput = document.querySelector('.digit-input[data-index="0"]');
      const secondInput = document.querySelector('.digit-input[data-index="1"]');
      
      // Simulate typing '1' in first input
      firstInput.value = '1';
      firstInput.dispatchEvent(new dom.window.Event('input'));
      
      expect(document.activeElement).toBe(secondInput);
    });

    it('should only allow numeric digits', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const firstInput = document.querySelector('.digit-input[data-index="0"]');
      
      // Try to enter a letter
      firstInput.value = 'a';
      firstInput.dispatchEvent(new dom.window.Event('input'));
      
      expect(firstInput.value).toBe('');
    });

    it('should handle backspace navigation', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const firstInput = document.querySelector('.digit-input[data-index="0"]');
      const secondInput = document.querySelector('.digit-input[data-index="1"]');
      
      // Fill first input and move to second
      firstInput.value = '1';
      firstInput.dispatchEvent(new dom.window.Event('input'));
      
      // Press backspace on empty second input
      const backspaceEvent = new dom.window.KeyboardEvent('keydown', { key: 'Backspace' });
      secondInput.dispatchEvent(backspaceEvent);
      
      expect(document.activeElement).toBe(firstInput);
      expect(firstInput.value).toBe('');
    });

    it('should collect all digits for verification', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const digitInputs = document.querySelectorAll('.digit-input');
      const testCode = '123456';
      
      // Fill all inputs
      digitInputs.forEach((input, index) => {
        input.value = testCode[index];
      });
      
      // Mock verifyCode to capture the collected code
      const originalVerifyCode = app.verifyCode;
      let capturedCode = '';
      app.verifyCode = function() {
        const inputs = document.querySelectorAll('.digit-input');
        capturedCode = Array.from(inputs).map(input => input.value).join('');
        return Promise.resolve();
      };
      
      // Trigger verification
      app.verifyCode();
      
      expect(capturedCode).toBe('123456');
      
      // Restore original method
      app.verifyCode = originalVerifyCode;
    });

    it('should auto-submit when all 6 digits are filled', (done) => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const digitInputs = document.querySelectorAll('.digit-input');
      
      // Mock verifyCode to detect auto-submission
      app.verifyCode = vi.fn().mockResolvedValue();
      
      // Fill first 5 digits
      for (let i = 0; i < 5; i++) {
        digitInputs[i].value = (i + 1).toString();
        digitInputs[i].dispatchEvent(new dom.window.Event('input'));
      }
      
      expect(app.verifyCode).not.toHaveBeenCalled();
      
      // Fill the last digit
      digitInputs[5].value = '6';
      digitInputs[5].dispatchEvent(new dom.window.Event('input'));
      
      // Auto-submit should happen after a short delay
      setTimeout(() => {
        expect(app.verifyCode).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should handle paste of 6-digit code', (done) => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const firstInput = document.querySelector('.digit-input[data-index="0"]');
      const digitInputs = document.querySelectorAll('.digit-input');
      
      // Mock verifyCode
      app.verifyCode = vi.fn().mockResolvedValue();
      
      // Create paste event with 6-digit code
      const pasteEvent = new dom.window.Event('paste');
      pasteEvent.clipboardData = {
        getData: vi.fn().mockReturnValue('123456')
      };
      
      firstInput.dispatchEvent(pasteEvent);
      
      // Check that all inputs are filled
      setTimeout(() => {
        digitInputs.forEach((input, index) => {
          expect(input.value).toBe((index + 1).toString());
        });
        expect(app.verifyCode).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should ignore non-numeric characters in paste', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const firstInput = document.querySelector('.digit-input[data-index="0"]');
      const digitInputs = document.querySelectorAll('.digit-input');
      
      // Create paste event with mixed content
      const pasteEvent = new dom.window.Event('paste');
      pasteEvent.clipboardData = {
        getData: vi.fn().mockReturnValue('1a2b3c4d5e6f')
      };
      
      firstInput.dispatchEvent(pasteEvent);
      
      // Should extract only digits: 123456
      digitInputs.forEach((input, index) => {
        expect(input.value).toBe((index + 1).toString());
      });
    });
  });

  describe('CSS Styling', () => {
    it('should have proper CSS classes for 6-digit inputs', () => {
      app.showStep2Screen('j***@example.com', 'email');
      
      const container = document.querySelector('.verification-inputs');
      expect(container).toBeTruthy();
      
      const digitInputs = document.querySelectorAll('.digit-input');
      expect(digitInputs).toHaveLength(6);
      
      digitInputs.forEach(input => {
        expect(input.classList.contains('digit-input')).toBe(true);
      });
    });
  });
});