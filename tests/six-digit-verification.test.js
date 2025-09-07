// 6-Digit Verification Input Tests
describe('6-Digit Verification Input', () => {
    let app;
    let container;

    // Simple PickleballApp class for testing 6-digit verification
    class PickleballApp {
        constructor() {
            this.authState = {
                refId: null,
                verificationCode: null,
                token: null,
                codeRequestTime: null,
                attempts: 0,
                currentScreen: 'auth-step1'
            };
            this.mockVerificationCode = null;
        }

        showVerificationStep() {
            document.body.innerHTML = `
                <div class="auth-screen">
                    <div class="auth-form">
                        <div class="digit-container" id="digit-container"></div>
                    </div>
                </div>
            `;
            this.setup6DigitInput();
        }

        setup6DigitInput() {
            const container = document.getElementById('digit-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            for (let i = 0; i < 6; i++) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'digit-input';
                input.maxLength = 1;
                input.setAttribute('inputmode', 'numeric');
                input.dataset.index = i;
                
                // Input event for auto-advance and validation
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    
                    // Only allow numeric characters - keep first digit if mixed
                    if (value.length > 1) {
                        // If multiple characters, keep only the first digit if it's numeric
                        const firstChar = value[0];
                        if (/^[0-9]$/.test(firstChar)) {
                            e.target.value = firstChar;
                        } else {
                            e.target.value = '';
                            return;
                        }
                    } else if (!/^[0-9]$/.test(value) && value !== '') {
                        e.target.value = '';
                        return;
                    }
                    
                    // Auto-advance to next input
                    const nextIndex = parseInt(e.target.dataset.index) + 1;
                    if (nextIndex < 6) {
                        const nextInput = container.querySelector(`[data-index="${nextIndex}"]`);
                        if (nextInput) {
                            nextInput.focus();
                        }
                    }
                    
                    // Check for auto-submit
                    this.checkAutoSubmit();
                });
                
                // Keydown event for backspace navigation
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace') {
                        if (e.target.value !== '') {
                            // Clear current input if it has a value
                            e.target.value = '';
                        } else {
                            // Move to previous input if current is empty
                            const prevIndex = parseInt(e.target.dataset.index) - 1;
                            if (prevIndex >= 0) {
                                const prevInput = container.querySelector(`[data-index="${prevIndex}"]`);
                                if (prevInput) {
                                    prevInput.focus();
                                }
                            }
                        }
                    }
                });
                
                // Paste event for distributing 6-digit codes
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    const pastedData = e.clipboardData.getData('text/plain');
                    
                    if (/^[0-9]{6}$/.test(pastedData)) {
                        // Distribute digits across inputs
                        for (let j = 0; j < 6; j++) {
                            const digitInput = container.querySelector(`[data-index="${j}"]`);
                            if (digitInput) {
                                digitInput.value = pastedData[j];
                            }
                        }
                        
                        // Focus last input
                        const lastInput = container.querySelector(`[data-index="5"]`);
                        if (lastInput) {
                            lastInput.focus();
                        }
                        
                        // Check for auto-submit
                        this.checkAutoSubmit();
                    }
                });
                
                container.appendChild(input);
            }
            
            // Focus first input
            const firstInput = container.querySelector('[data-index="0"]');
            if (firstInput) {
                firstInput.focus();
            }
        }
        
        getVerificationCode() {
            const container = document.getElementById('digit-container');
            if (!container) return '';
            
            let code = '';
            for (let i = 0; i < 6; i++) {
                const input = container.querySelector(`[data-index="${i}"]`);
                if (input) {
                    code += input.value;
                }
            }
            
            return code;
        }
        
        checkAutoSubmit() {
            const code = this.getVerificationCode();
            if (code.length === 6) {
                this.handleVerification(code);
            }
        }
        
        handleVerification(code) {
            // Mock verification handler
            this.mockVerificationCode = code;
        }
    }

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div>';
        container = document.getElementById('app');
        app = new PickleballApp();
    });

    describe('Input Creation', () => {
        test('should create 6 separate input boxes', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            expect(inputs.length).toBe(6);
        });

        test('should set maxlength=1 for each input', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            inputs.forEach(input => {
                expect(input.maxLength).toBe(1);
            });
        });

        test('should set inputmode=numeric for each input', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            inputs.forEach(input => {
                expect(input.getAttribute('inputmode')).toBe('numeric');
            });
        });
    });

    describe('Auto-Advance Functionality', () => {
        test('should auto-advance to next input when digit entered', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs[0].value = '1';
            inputs[0].dispatchEvent(new Event('input'));
            
            expect(document.activeElement).toBe(inputs[1]);
        });

        test('should not advance from last input', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs[5].focus();
            inputs[5].value = '6';
            inputs[5].dispatchEvent(new Event('input'));
            
            expect(document.activeElement).toBe(inputs[5]);
        });
    });

    describe('Backspace Navigation', () => {
        test('should move to previous input on backspace when current is empty', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs[2].focus();
            inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            
            expect(document.activeElement).toBe(inputs[1]);
        });

        test('should clear current input on backspace when has value', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs[2].value = '5';
            inputs[2].focus();
            inputs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
            
            expect(inputs[2].value).toBe('');
        });
    });

    describe('Paste Functionality', () => {
        test('should distribute 6-digit paste across all inputs', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            // Mock paste event with clipboardData
            const pasteEvent = new Event('paste');
            pasteEvent.clipboardData = {
                getData: () => '123456'
            };
            
            inputs[0].dispatchEvent(pasteEvent);
            
            expect(inputs[0].value).toBe('1');
            expect(inputs[1].value).toBe('2');
            expect(inputs[2].value).toBe('3');
            expect(inputs[3].value).toBe('4');
            expect(inputs[4].value).toBe('5');
            expect(inputs[5].value).toBe('6');
        });

        test('should focus last input after paste', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            // Mock paste event with clipboardData
            const pasteEvent = new Event('paste');
            pasteEvent.clipboardData = {
                getData: () => '123456'
            };
            
            inputs[0].dispatchEvent(pasteEvent);
            
            expect(document.activeElement).toBe(inputs[5]);
        });
    });

    describe('Auto-Submit', () => {
        test('should auto-submit when all 6 digits entered', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            // Fill all inputs
            inputs.forEach((input, index) => {
                input.value = (index + 1).toString();
                input.dispatchEvent(new Event('input'));
            });
            
            expect(app.mockVerificationCode).toBe('123456');
        });

        test('should not auto-submit with incomplete code', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            // Fill only 5 inputs
            for (let i = 0; i < 5; i++) {
                inputs[i].value = (i + 1).toString();
                inputs[i].dispatchEvent(new Event('input'));
            }
            
            expect(app.mockVerificationCode).toBeNull();
        });
    });

    describe('Visual Styling', () => {
        test('should apply digit-input class to all inputs', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs.forEach(input => {
                expect(input.classList.contains('digit-input')).toBe(true);
            });
        });

        test('should have digit-container wrapper', () => {
            app.showVerificationStep();
            const container = document.querySelector('.digit-container');
            expect(container).toBeTruthy();
        });
    });

    describe('Input Validation', () => {
        test('should only accept numeric characters', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs[0].value = 'a';
            inputs[0].dispatchEvent(new Event('input'));
            
            expect(inputs[0].value).toBe('');
        });

        test('should replace non-numeric with empty', () => {
            app.showVerificationStep();
            const inputs = document.querySelectorAll('.digit-input');
            
            inputs[0].value = '1a';
            inputs[0].dispatchEvent(new Event('input'));
            
            expect(inputs[0].value).toBe('1');
        });
    });
});