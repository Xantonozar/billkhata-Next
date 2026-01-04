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
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['bKash', 'Nagad', 'Rocket', 'Cash', 'Bank Transfer', 'Manager Adjustment'],
        required: true
    },
    transactionId: {
        type: String,
        default: ''
    },
    screenshotUrl: {
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
depositSchema.index({ khataId: 1, createdAt: -1, status: 1 });

const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema);

export default Deposit;
