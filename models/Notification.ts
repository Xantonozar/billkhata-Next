import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    khataId: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['bill', 'payment', 'meal', 'room', 'deposit', 'expense'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    actionText: {
        type: String,
        trim: true
    },
    link: {
        type: String,
        trim: true
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        // This can reference different collections depending on type
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ khataId: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
