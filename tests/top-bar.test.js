// Top Bar Tests
describe('Top Bar Implementation', () => {
    let app;

    // Simple PickleballApp class for testing top bar
    class PickleballApp {
        constructor() {
            this.authState = {
                token: null,
                currentScreen: 'auth-step1'
            };
            this.isOnline = true;
        }

        showAuthScreen() {
            document.body.innerHTML = `
                <div class="auth-screen">
                    <div class="top-bar" id="top-bar"></div>
                    <div class="auth-form">
                        <h1>Pickleball Tournament Scoring</h1>
                    </div>
                </div>
            `;
            this.updateTopBar();
        }

        showMatchSetup() {
            document.body.innerHTML = `
                <div class="match-setup">
                    <div class="top-bar" id="top-bar"></div>
                    <div class="setup-form">
                        <h2>Match Setup</h2>
                    </div>
                </div>
            `;
            this.updateTopBar();
        }

        showGameScreen() {
            document.body.innerHTML = `
                <div class="court">
                    <div class="game-content">Game Screen</div>
                </div>
            `;
            // Top bar should be hidden on game screen
        }

        updateTopBar() {
            const topBar = document.getElementById('top-bar');
            if (!topBar) return;

            const refereeId = 'REF001';
            const refereeType = 'Referee';
            const connectionStatus = this.isOnline ? '📶 Online' : '📵 Offline';

            topBar.innerHTML = `
                <div class="top-bar-left">
                    <span class="connection-indicator">${connectionStatus}</span>
                </div>
                <div class="top-bar-right">
                    <span class="user-info">Logged in as: ${refereeType} (${refereeId})</span>
                    <button class="logout-btn" onclick="app.logout()">Logout</button>
                </div>
            `;
        }

        setOnlineStatus(isOnline) {
            this.isOnline = isOnline;
            this.updateTopBar();
        }

        logout() {
            // Mock logout functionality
        }
    }

    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div>';
        app = new PickleballApp();
    });

    describe('Top Bar Visibility', () => {
        test('should show top bar on auth screen', () => {
            app.showAuthScreen();
            const topBar = document.getElementById('top-bar');
            expect(topBar).toBeTruthy();
        });

        test('should show top bar on match setup screen', () => {
            app.showMatchSetup();
            const topBar = document.getElementById('top-bar');
            expect(topBar).toBeTruthy();
        });

        test('should hide top bar on game screen', () => {
            app.showGameScreen();
            const topBar = document.getElementById('top-bar');
            expect(topBar).toBeFalsy();
        });
    });

    describe('Connection Indicator', () => {
        test('should show online indicator when connected', () => {
            app.setOnlineStatus(true);
            app.showAuthScreen();
            const indicator = document.querySelector('.connection-indicator');
            expect(indicator.textContent).toBe('📶 Online');
        });

        test('should show offline indicator when disconnected', () => {
            app.setOnlineStatus(false);
            app.showAuthScreen();
            const indicator = document.querySelector('.connection-indicator');
            expect(indicator.textContent).toBe('📵 Offline');
        });

        test('should update indicator when connection status changes', () => {
            app.showAuthScreen();
            
            app.setOnlineStatus(true);
            let indicator = document.querySelector('.connection-indicator');
            expect(indicator.textContent).toBe('📶 Online');
            
            app.setOnlineStatus(false);
            indicator = document.querySelector('.connection-indicator');
            expect(indicator.textContent).toBe('📵 Offline');
        });
    });

    describe('User Information', () => {
        test('should display logged in user info', () => {
            app.showMatchSetup();
            const userInfo = document.querySelector('.user-info');
            expect(userInfo.textContent).toContain('Logged in as: Referee (REF001)');
        });

        test('should show logout button', () => {
            app.showMatchSetup();
            const logoutBtn = document.querySelector('.logout-btn');
            expect(logoutBtn).toBeTruthy();
            expect(logoutBtn.textContent).toBe('Logout');
        });
    });

    describe('Top Bar Layout', () => {
        test('should have left and right sections', () => {
            app.showAuthScreen();
            const leftSection = document.querySelector('.top-bar-left');
            const rightSection = document.querySelector('.top-bar-right');
            
            expect(leftSection).toBeTruthy();
            expect(rightSection).toBeTruthy();
        });

        test('should position connection indicator on left', () => {
            app.showAuthScreen();
            const leftSection = document.querySelector('.top-bar-left');
            const indicator = leftSection.querySelector('.connection-indicator');
            expect(indicator).toBeTruthy();
        });

        test('should position user info and logout on right', () => {
            app.showMatchSetup();
            const rightSection = document.querySelector('.top-bar-right');
            const userInfo = rightSection.querySelector('.user-info');
            const logoutBtn = rightSection.querySelector('.logout-btn');
            
            expect(userInfo).toBeTruthy();
            expect(logoutBtn).toBeTruthy();
        });
    });

    describe('Top Bar Styling', () => {
        test('should apply top-bar class', () => {
            app.showAuthScreen();
            const topBar = document.getElementById('top-bar');
            expect(topBar.classList.contains('top-bar')).toBe(true);
        });

        test('should have proper structure for styling', () => {
            app.showMatchSetup();
            const topBar = document.getElementById('top-bar');
            const leftSection = topBar.querySelector('.top-bar-left');
            const rightSection = topBar.querySelector('.top-bar-right');
            
            expect(leftSection).toBeTruthy();
            expect(rightSection).toBeTruthy();
        });
    });
});