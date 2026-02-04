import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
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
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['bKash', 'Nagad', 'Rocket', 'Cash', 'Bank Transfer', 'Manager Adjustment'],
        required: true
    },
    calculationPeriodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalculationPeriod',
        default: null,
        index: true
    },
    transactionId: {
        type: String,
        default: ''
    },
    screenshotUrl: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    approvedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
depositSchema.index({ khataId: 1, status: 1 });
depositSchema.index({ khataId: 1, userId: 1 });
depositSchema.index({ khataId: 1, calculationPeriodId: 1, createdAt: -1 });
depositSchema.index({ khataId: 1, createdAt: -1, status: 1 });

// Delete the cached model to force using the updated schema
if (mongoose.models.Deposit) {
    delete mongoose.models.Deposit;
}

const Deposit = mongoose.model('Deposit', depositSchema);

export default Deposit;
