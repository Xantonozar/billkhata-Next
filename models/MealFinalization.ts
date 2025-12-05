import mongoose from 'mongoose';

const mealFinalizationSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    finalizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    finalizedByName: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Unique index to ensure only one finalization per khata per day
mealFinalizationSchema.index({ khataId: 1, date: 1 }, { unique: true });

const MealFinalization = mongoose.models.MealFinalization || mongoose.model('MealFinalization', mealFinalizationSchema);

export default MealFinalization;
