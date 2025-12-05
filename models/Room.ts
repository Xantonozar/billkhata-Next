import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved'],
            default: 'Pending'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

export default Room;
