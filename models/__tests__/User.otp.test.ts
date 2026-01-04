/**
 * Test file for User model OTP hashing and comparison
 * 
 * To run this test:
 * 1. Ensure you have a test database connection configured
 * 2. Run: npx ts-node models/__tests__/User.otp.test.ts
 * 
 * Note: This test requires a MongoDB connection. For production use,
 * consider setting up Jest/Vitest with a test database.
 */

import mongoose from 'mongoose';
import User from '../User';
import connectDB from '../../lib/db';
import bcrypt from 'bcryptjs';

const TEST_EMAIL = 'test-otp@example.com';
const TEST_PASSWORD = 'testpassword123';

async function cleanup() {
    try {
        await User.deleteOne({ email: TEST_EMAIL });
    } catch (error) {
        // Ignore cleanup errors
    }
}

async function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name: string, fn: () => Promise<void> | void) {
        return async () => {
            try {
                await fn();
                console.log(`✓ ${name}`);
                passed++;
            } catch (error: any) {
                console.error(`✗ ${name}: ${error.message}`);
                failed++;
            }
        };
    }

    console.log('🧪 Running User Model OTP Tests\n');

    // Cleanup before starting
    await cleanup();

    // Test 1: OTP is hashed when saving
    await test('OTP is hashed when saving a user', async () => {
        const plainOtp = '123456';
        const user = new User({
            name: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            role: 'Member',
            otp: plainOtp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000)
        });

        await user.save();

        // Fetch user with OTP field selected
        const savedUser = await User.findById(user._id).select('+otp');
        if (!savedUser) {
            throw new Error('User not found after save');
        }

        // Verify OTP is hashed (should start with $2a$ or $2b$ for bcrypt)
        if (!savedUser.otp || !savedUser.otp.startsWith('$2')) {
            throw new Error('OTP was not hashed - it should start with $2');
        }

        // Verify OTP is not the plain text
        if (savedUser.otp === plainOtp) {
            throw new Error('OTP was stored in plain text');
        }

        // Verify we can compare with the plain OTP
        const isValid = await savedUser.compareOTP(plainOtp);
        if (!isValid) {
            throw new Error('compareOTP failed for correct OTP');
        }
    })();

    // Test 2: compareOTP works correctly
    await test('compareOTP returns true for correct OTP', async () => {
        const plainOtp = '789012';
        const user = await User.findOne({ email: TEST_EMAIL }).select('+otp');
        if (!user) {
            throw new Error('User not found');
        }

        user.otp = plainOtp;
        await user.save();

        const isValid = await user.compareOTP(plainOtp);
        if (!isValid) {
            throw new Error('compareOTP should return true for correct OTP');
        }
    })();

    // Test 3: compareOTP returns false for incorrect OTP
    await test('compareOTP returns false for incorrect OTP', async () => {
        const user = await User.findOne({ email: TEST_EMAIL }).select('+otp');
        if (!user || !user.otp) {
            throw new Error('User or OTP not found');
        }

        const isValid = await user.compareOTP('wrong-otp');
        if (isValid) {
            throw new Error('compareOTP should return false for incorrect OTP');
        }
    })();

    // Test 4: compareOTP returns false when OTP is null
    await test('compareOTP returns false when OTP is null', async () => {
        const user = await User.findOne({ email: TEST_EMAIL });
        if (!user) {
            throw new Error('User not found');
        }

        user.otp = null;
        await user.save();

        const userWithOtp = await User.findById(user._id).select('+otp');
        const isValid = await userWithOtp!.compareOTP('any-otp');
        if (isValid) {
            throw new Error('compareOTP should return false when OTP is null');
        }
    })();

    // Test 5: OTP is not re-hashed if not modified
    await test('OTP is not re-hashed if not modified', async () => {
        const plainOtp = '555555';
        const user = await User.findOne({ email: TEST_EMAIL });
        if (!user) {
            throw new Error('User not found');
        }

        user.otp = plainOtp;
        await user.save();

        const savedUser = await User.findById(user._id).select('+otp');
        if (!savedUser || !savedUser.otp) {
            throw new Error('User or OTP not found');
        }

        const firstHash = savedUser.otp;

        // Modify another field but not OTP
        user.name = 'Updated Name';
        await user.save();

        const updatedUser = await User.findById(user._id).select('+otp');
        if (!updatedUser || !updatedUser.otp) {
            throw new Error('User or OTP not found after update');
        }

        // OTP should remain the same
        if (updatedUser.otp !== firstHash) {
            throw new Error('OTP was re-hashed even though it was not modified');
        }
    })();

    // Test 6: toJSON excludes OTP and otpExpires
    await test('toJSON excludes otp and otpExpires fields', async () => {
        const plainOtp = '999999';
        const user = await User.findOne({ email: TEST_EMAIL });
        if (!user) {
            throw new Error('User not found');
        }

        user.otp = plainOtp;
        user.otpExpires = new Date();
        await user.save();

        const userWithOtp = await User.findById(user._id).select('+otp +otpExpires');
        if (!userWithOtp) {
            throw new Error('User not found');
        }

        const json = userWithOtp.toJSON();

        if ('otp' in json) {
            throw new Error('toJSON should not include otp field');
        }

        if ('otpExpires' in json) {
            throw new Error('toJSON should not include otpExpires field');
        }

        // Verify other fields are still present
        if (!json.name || !json.email) {
            throw new Error('toJSON should still include other fields');
        }
    })();

    // Test 7: OTP hashing uses same saltRounds as password (10)
    await test('OTP hashing uses saltRounds 10 (same as password)', async () => {
        const plainOtp = '111111';
        const user = new User({
            name: 'Salt Test User',
            email: 'salt-test@example.com',
            password: TEST_PASSWORD,
            role: 'Member',
            otp: plainOtp,
            otpExpires: new Date(Date.now() + 10 * 60 * 1000)
        });

        await user.save();

        const savedUser = await User.findById(user._id).select('+otp +password');
        if (!savedUser || !savedUser.otp || !savedUser.password) {
            throw new Error('User, OTP, or password not found');
        }

        // Both should be bcrypt hashes with salt rounds 10
        // Bcrypt hashes start with $2a$10$ or $2b$10$ for salt rounds 10
        const otpRounds = savedUser.otp.split('$')[2];
        const passwordRounds = savedUser.password.split('$')[2];

        if (otpRounds !== '10' || passwordRounds !== '10') {
            throw new Error(`OTP salt rounds (${otpRounds}) should match password salt rounds (${passwordRounds})`);
        }

        // Cleanup test user
        await User.deleteOne({ email: 'salt-test@example.com' });
    })();

    // Cleanup
    await cleanup();

    console.log(`\n✅ Tests completed: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (require.main === module) {
    connectDB()
        .then(() => runTests())
        .catch((error) => {
            console.error('❌ Test setup failed:', error);
            process.exit(1);
        })
        .finally(() => {
            mongoose.connection.close();
        });
}

export { runTests };


