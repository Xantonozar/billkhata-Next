// Native fetch in Node 18+

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Starting API Verification...');

    // 1. Test Static Page (Home)
    try {
        const res = await fetch(`${BASE_URL}/`);
        console.log(`[GET /] Status: ${res.status} ${res.status === 200 ? '✅' : '❌'}`);
    } catch (e) {
        console.error(`[GET /] Failed: ${e.message}`);
    }

    // 2. Test Auth Me (Should be 401 Unauthorized but DB connected)
    try {
        const res = await fetch(`${BASE_URL}/api/auth/me`);
        const json = await res.json();
        console.log(`[GET /api/auth/me] Status: ${res.status} ${res.status === 401 ? '✅' : '❌'}`);
        console.log(`   Response: ${JSON.stringify(json)}`);
    } catch (e) {
        console.error(`[GET /api/auth/me] Failed: ${e.message}`);
    }

    // 3. Test Invalid Route
    try {
        const res = await fetch(`${BASE_URL}/api/invalid-route-xyz`);
        console.log(`[GET /api/invalid] Status: ${res.status} ${res.status === 404 ? '✅' : '❌'}`);
    } catch (e) {
        console.error(`[GET /api/invalid] Failed: ${e.message}`);
    }

    console.log('✅ Verification Finished.');
}

// Support Node < 18 by checking if fetch exists
if (!globalThis.fetch) {
    console.log('Node version too old for global fetch. Please use Node 18+.');
} else {
    testAPI();
}
