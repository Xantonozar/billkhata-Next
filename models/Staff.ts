import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    designation: {
        type: String,
        required: [true, 'Designation is required'], // e.g., 'Maid', 'Electrician'
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    avatarUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Prevent overwrite model error in dev
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Staff;
}

const Staff = mongoose.models.Staff || mongoose.model('Staff', staffSchema);

export default Staff;
