/**
 * Database Index Synchronization Script
 * 
 * Run with: npx tsx scripts/ensure-indexes.ts
 * 
 * This script connects to MongoDB and ensures all model indexes are synced.
 * Use after adding new indexes to models to apply them to the database.
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function ensureIndexes() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in environment variables');
        process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');

    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Import all models to register their indexes
        const models = [
            await import('../models/User'),
            await import('../models/Bill'),
            await import('../models/Deposit'),
            await import('../models/Expense'),
            await import('../models/Meal'),
            await import('../models/MealFinalization'),
            await import('../models/MealHistory'),
            await import('../models/Menu'),
            await import('../models/Notification'),
            await import('../models/PushSubscription'),
            await import('../models/Room'),
            await import('../models/ShoppingDuty'),
            await import('../models/Staff'),
        ];

        console.log(`📚 Loaded ${models.length} models`);

        // Sync indexes for all models
        console.log('🔄 Syncing indexes...');

        let failedModels: string[] = [];
        const modelNames = mongoose.modelNames();
        for (const modelName of modelNames) {
            const model = mongoose.model(modelName);
            try {
                await model.syncIndexes();
                console.log(`  ✅ ${modelName} indexes synced`);
            } catch (error) {
                console.error(`  ❌ ${modelName} index sync failed:`, error);
                failedModels.push(modelName);
            }
        }
        
        if (failedModels.length > 0) {
            console.error(`\n❌ Index synchronization failed for ${failedModels.length} model(s): ${failedModels.join(', ')}`);
            process.exitCode = 1;
            throw new Error(`Failed to sync indexes for ${failedModels.length} model(s)`);
        }
        
        console.log('✅ All indexes synchronized successfully!');

        // List all indexes for verification
        console.log('\n📋 Current indexes:');
        for (const modelName of modelNames) {
            const model = mongoose.model(modelName);
            const indexes = await model.collection.indexes();
            console.log(`\n${modelName}:`);
            indexes.forEach((idx: any) => {
                const keys = Object.keys(idx.key).join(', ');
                console.log(`  - ${idx.name}: {${keys}}`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

ensureIndexes();
