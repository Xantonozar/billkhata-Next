// Comprehensive API Test Suite for BillKhata Next.js
const BASE_URL = 'http://localhost:3000';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

let passCount = 0;
let failCount = 0;
let skipCount = 0;

async function testEndpoint(method, path, expectedStatus, description, body = null, headers = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(`${BASE_URL}${path}`, options);
        const status = res.status;

        if (status === expectedStatus) {
            console.log(`${colors.green}✓${colors.reset} [${method} ${path}] ${description} - Status: ${status}`);
            passCount++;
            return { success: true, status, data: await res.json().catch(() => null) };
        } else {
            console.log(`${colors.red}✗${colors.reset} [${method} ${path}] ${description} - Expected: ${expectedStatus}, Got: ${status}`);
            failCount++;
            return { success: false, status };
        }
    } catch (e) {
        console.log(`${colors.red}✗${colors.reset} [${method} ${path}] ${description} - Error: ${e.message}`);
        failCount++;
        return { success: false, error: e.message };
    }
}

async function runAllTests() {
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}BillKhata API Comprehensive Test Suite${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

    // ============ STATIC PAGES ============
    console.log(`${colors.yellow}📄 Testing Static Pages...${colors.reset}`);
    await testEndpoint('GET', '/', 200, 'Home page loads');
    await testEndpoint('GET', '/login', 200, 'Login page loads');
    await testEndpoint('GET', '/signup', 200, 'Signup page loads');
    await testEndpoint('GET', '/dashboard', 200, 'Dashboard page loads');

    // ============ AUTH API ============
    console.log(`\n${colors.yellow}🔐 Testing Auth API...${colors.reset}`);
    await testEndpoint('GET', '/api/auth/me', 401, 'Auth/me without token returns 401');
    await testEndpoint('POST', '/api/auth/login', 400, 'Login without credentials returns 400', {});
    await testEndpoint('POST', '/api/auth/signup', 400, 'Signup without data returns 400', {});

    // ============ BILLS API ============
    console.log(`\n${colors.yellow}💰 Testing Bills API...${colors.reset}`);
    await testEndpoint('POST', '/api/bills', 401, 'Create bill without auth returns 401', {});

    // ============ ROOMS API ============
    console.log(`\n${colors.yellow}🏠 Testing Rooms API...${colors.reset}`);
    await testEndpoint('POST', '/api/rooms/create', 401, 'Create room without auth returns 401', {});
    await testEndpoint('POST', '/api/rooms/join', 400, 'Join room without data returns 400', {});

    // ============ NOTIFICATIONS API ============
    console.log(`\n${colors.yellow}🔔 Testing Notifications API...${colors.reset}`);
    await testEndpoint('GET', '/api/notifications', 401, 'Get notifications without auth returns 401');
    await testEndpoint('GET', '/api/notifications/unread-count', 401, 'Unread count without auth returns 401');

    // ============ MENU API ============
    console.log(`\n${colors.yellow}📋 Testing Menu API...${colors.reset}`);
    // Menu requires khataId which we don't have without auth, so test returns 401

    // ============ SHOPPING API ============
    console.log(`\n${colors.yellow}🛒 Testing Shopping API...${colors.reset}`);
    // Shopping requires khataId which we don't have without auth

    // ============ MEALS API ============
    console.log(`\n${colors.yellow}🍽️  Testing Meals API...${colors.reset}`);
    // Meals require khataId which we don't have without auth

    // ============ DEPOSITS API ============
    console.log(`\n${colors.yellow}💵 Testing Deposits API...${colors.reset}`);
    // Deposits require khataId which we don't have without auth

    // ============ EXPENSES API ============
    console.log(`\n${colors.yellow}💳 Testing Expenses API...${colors.reset}`);
    // Expenses require khataId which we don't have without auth

    // ============ 404 TESTS ============
    console.log(`\n${colors.yellow}🚫 Testing Error Handling...${colors.reset}`);
    await testEndpoint('GET', '/api/nonexistent-route', 404, '404 for non-existent API route');
    await testEndpoint('GET', '/nonexistent-page', 404, '404 for non-existent page');

    // ============ SUMMARY ============
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}Test Summary${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
    console.log(`${colors.yellow}Skipped: ${skipCount}${colors.reset}`);
    console.log(`Total: ${passCount + failCount + skipCount}`);

    const successRate = ((passCount / (passCount + failCount)) * 100).toFixed(1);
    console.log(`\nSuccess Rate: ${successRate}%`);

    if (failCount === 0) {
        console.log(`\n${colors.green}✅ All tests passed!${colors.reset}`);
    } else {
        console.log(`\n${colors.red}❌ Some tests failed. Please review the output above.${colors.reset}`);
    }
}

// Run tests
runAllTests().catch(console.error);
