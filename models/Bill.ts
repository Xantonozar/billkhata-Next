import mongoose from 'mongoose';

const billShareSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['Unpaid', 'Pending Approval', 'Paid', 'Overdue'],
        default: 'Unpaid'
    }
}, { _id: false });

const billSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Rent', 'Electricity', 'Water', 'Gas', 'Wi-Fi', 'Maid', 'Others']
    },
    totalAmount: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shares: [billShareSchema]
}, {
    timestamps: true
});

const Bill = mongoose.models.Bill || mongoose.model('Bill', billSchema);

export default Bill;
