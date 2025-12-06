import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    breakfast: {
        type: Number,
        default: 0,
        min: 0,
        max: 20
    },
    lunch: {
        type: Number,
        default: 0,
        min: 0,
        max: 20
    },
    dinner: {
        type: Number,
        default: 0,
        min: 0,
        max: 20
    },
    totalMeals: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

mealSchema.index({ khataId: 1, date: 1 });
// Compound index for unique user entry per date per room
mealSchema.index({ khataId: 1, userId: 1, date: 1 }, { unique: true });

mealSchema.pre('save', function () {
    // Explicitly cast 'this' to any to avoid TS errors in loose mode
    const doc = this as any;
    doc.totalMeals = (doc.breakfast || 0) + (doc.lunch || 0) + (doc.dinner || 0);
});

const Meal = mongoose.models.Meal || mongoose.model('Meal', mealSchema);

export default Meal;
