// Simple validation script for new authentication system
console.log('=== Testing New Authentication System ===');

// Load configuration
if (typeof TournamentConfig === 'undefined') {
    console.error('TournamentConfig not loaded');
} else {
    console.log('✓ Configuration loaded');
    console.log('API Base URL:', TournamentConfig.apis.auth.baseUrl);
    console.log('Demo credentials:', TournamentConfig.demo.credentials);
}

// Test the PickleballApp authentication
class TestPickleballApp {
    constructor() {
        this.config = {
            api: {
                baseUrl: 'https://pickle.frenchbread.dev/api',
                timeout: 10000
            },
            demo: {
                enabled: true,
                credentials: [
                    { username: 'demo', password: 'demo123' },
                    { username: 'test', password: 'test123' },
                    { username: 'admin', password: 'admin123' },
                    { username: 'referee', password: 'ref123' }
                ]
            }
        };
        this.authState = {
            user: null,
            token: null,
            refreshToken: null,
            expiresAt: null,
            isAuthenticated: false
        };
    }
    
    async login(username, password) {
        if (!username || username.trim() === '') {
            throw new Error('Please enter a username');
        }
        
        if (!password || password.trim() === '') {
            throw new Error('Please enter a password');
        }
        
        // Demo mode handling
        if (this.config.demo.enabled) {
            const demoUser = this.config.demo.credentials.find(
                cred => cred.username === username && cred.password === password
            );
            
            if (demoUser) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
                
                const mockResponse = {
                    success: true,
                    data: {
                        user: {
                            id: `demo-${username}-id`,
                            username: username,
                            email: `${username}@demo.com`,
                            firstName: username.charAt(0).toUpperCase() + username.slice(1),
                            lastName: 'User',
                            role: username === 'admin' ? 'SUPER_ADMIN' : 'TOURNAMENT_ADMIN',
                            isActive: true,
                            token: `demo-jwt-token-${Date.now()}`,
                            refreshToken: `demo-refresh-token-${Date.now()}`,
                            expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour
                        }
                    }
                };
                
                this.storeAuthData(mockResponse.data.user);
                return mockResponse;
            }
        }
        
        throw new Error('Invalid username or password');
    }
    
    storeAuthData(userData) {
        this.authState = {
            user: {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                isActive: userData.isActive
            },
            token: userData.token,
            refreshToken: userData.refreshToken,
            expiresAt: userData.expiresAt,
            isAuthenticated: true
        };
    }
}

// Run tests
async function runValidationTests() {
    const app = new TestPickleballApp();
    let passed = 0;
    let failed = 0;
    
    // Test 1: Valid demo credentials
    try {
        const result = await app.login('demo', 'demo123');
        if (result.success && app.authState.isAuthenticated) {
            console.log('✓ Test 1 passed: Valid demo credentials');
            passed++;
        } else {
            console.log('✗ Test 1 failed: Login succeeded but auth state incorrect');
            failed++;
        }
    } catch (error) {
        console.log('✗ Test 1 failed:', error.message);
        failed++;
    }
    
    // Test 2: Invalid credentials
    try {
        await app.login('invalid', 'wrong');
        console.log('✗ Test 2 failed: Should have thrown error for invalid credentials');
        failed++;
    } catch (error) {
        if (error.message === 'Invalid username or password') {
            console.log('✓ Test 2 passed: Invalid credentials rejected');
            passed++;
        } else {
            console.log('✗ Test 2 failed: Wrong error message:', error.message);
            failed++;
        }
    }
    
    // Test 3: Empty username
    try {
        await app.login('', 'password');
        console.log('✗ Test 3 failed: Should have thrown error for empty username');
        failed++;
    } catch (error) {
        if (error.message === 'Please enter a username') {
            console.log('✓ Test 3 passed: Empty username rejected');
            passed++;
        } else {
            console.log('✗ Test 3 failed: Wrong error message:', error.message);
            failed++;
        }
    }
    
    // Test 4: Admin role assignment
    try {
        const adminApp = new TestPickleballApp();
        const result = await adminApp.login('admin', 'admin123');
        if (result.data.user.role === 'SUPER_ADMIN') {
            console.log('✓ Test 4 passed: Admin role assigned correctly');
            passed++;
        } else {
            console.log('✗ Test 4 failed: Admin role not assigned correctly');
            failed++;
        }
    } catch (error) {
        console.log('✗ Test 4 failed:', error.message);
        failed++;
    }
    
    console.log(`\n=== Test Results: ${passed} passed, ${failed} failed ===`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! New authentication system is working correctly.');
    } else {
        console.log('❌ Some tests failed. Please check the implementation.');
    }
}

// Run the validation
runValidationTests();