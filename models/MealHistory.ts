import mongoose from 'mongoose';

const mealHistorySchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    changedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    breakfast: {
        type: Number,
        default: 0
    },
    lunch: {
        type: Number,
        default: 0
    },
    dinner: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

mealHistorySchema.index({ khataId: 1, targetUserId: 1, date: 1 });

const MealHistory = mongoose.models.MealHistory || mongoose.model('MealHistory', mealHistorySchema);

export default MealHistory;
