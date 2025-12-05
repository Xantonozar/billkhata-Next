import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
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
    items: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    receiptUrl: {
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
expenseSchema.index({ khataId: 1, status: 1 });
expenseSchema.index({ khataId: 1, userId: 1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

export default Expense;
