import mongoose from 'mongoose';

const shoppingDutyItemSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    userName: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Upcoming', 'Assigned', 'Completed'],
        default: 'Upcoming'
    },
    amount: {
        type: Number,
        default: 0
    }
}, { _id: false });

const shoppingDutySchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    weekStart: {
        type: Date,
        required: true
    },
    items: [shoppingDutyItemSchema]
}, {
    timestamps: true
});

// Compound index for efficient queries
shoppingDutySchema.index({ khataId: 1, weekStart: 1 });

const ShoppingDuty = mongoose.models.ShoppingDuty || mongoose.model('ShoppingDuty', shoppingDutySchema);

export default ShoppingDuty;
