import mongoose from 'mongoose';

const calculationPeriodSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Ended'],
        default: 'Active'
    },
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    endedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
calculationPeriodSchema.index({ khataId: 1, status: 1 });
calculationPeriodSchema.index({ khataId: 1, startDate: -1 });

// Ensure only one active period per room
calculationPeriodSchema.index({ khataId: 1, status: 1 }, {
    unique: true,
    partialFilterExpression: { status: 'Active' }
});

const CalculationPeriod = mongoose.models.CalculationPeriod || mongoose.model('CalculationPeriod', calculationPeriodSchema);

export default CalculationPeriod;
