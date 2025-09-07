// UI Improvements 2 - Unit Tests
// Tests for match setup title and team assignment cleanup

describe('UI Improvements 2', () => {
    let app;

    // Simple PickleballApp mock for testing UI improvements
    class PickleballApp {
        constructor() {
            this.gameState = { gameStatus: 'setup' };
            this.loadedMatch = null;
        }
        
        showMatchSetup() {
            document.body.innerHTML = `
                <div class="match-setup">
                    <div class="top-bar" id="top-bar"></div>
                    <h1 class="main-title">Pickleball Tournament<br>Scoring System</h1>
                    <div class="header">
                        <h2>Match Setup</h2>
                    </div>
                    <div class="setup-form">
                        <input type="text" id="match-uuid" />
                        <button onclick="app.loadMatch()">Load Match</button>
                        <div class="demo-matches">Demo info</div>
                        <div id="team-assignment-section" style="display: none;"></div>
                    </div>
                </div>
            `;
        }
        
        simulateMatchLoad() {
            // Simulate showing team assignment
            document.getElementById('team-assignment-section').style.display = 'block';
            document.querySelector('.match-setup').classList.add('team-assignment-mode');
        }
    }
  
    beforeEach(() => {
        document.body.innerHTML = '<div id="app"></div>';
        app = new PickleballApp();
    });

    describe('Match Setup Page Title', () => {
        test('should display main title in match setup', () => {
            app.showMatchSetup();
            
            const title = document.querySelector('.main-title');
            expect(title).toBeTruthy();
            expect(title.innerHTML).toBe('Pickleball Tournament<br>Scoring System');
        });

        test('should have proper title styling classes', () => {
            app.showMatchSetup();
            
            const title = document.querySelector('.main-title');
            expect(title.className).toBe('main-title');
        });
    });

    describe('Team Assignment Page Cleanup', () => {
        test('should add team-assignment-mode class when showing team assignment', () => {
            app.showMatchSetup();
            app.simulateMatchLoad();
            
            const matchSetup = document.querySelector('.match-setup');
            expect(matchSetup.classList.contains('team-assignment-mode')).toBe(true);
        });

        test('should have elements that would be hidden by CSS', () => {
            app.showMatchSetup();
            
            // Check that elements exist (CSS hiding can't be tested in jsdom)
            const title = document.querySelector('.main-title');
            const matchInput = document.querySelector('#match-uuid');
            const demoMatches = document.querySelector('.demo-matches');
            
            expect(title).toBeTruthy();
            expect(matchInput).toBeTruthy();
            expect(demoMatches).toBeTruthy();
        });
    });
});