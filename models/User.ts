import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MIN_PASSWORD_LENGTH } from '../lib/passwordConfig';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: MIN_PASSWORD_LENGTH,
        select: false // Don't return password by default
    },
    role: {
        type: String,
        enum: ['Manager', 'Member'],
        required: true
    },
    roomStatus: {
        type: String,
        enum: ['NoRoom', 'Pending', 'Approved'],
        default: 'NoRoom'
    },
    khataId: {
        type: String,
        default: null
    },
    avatarUrl: {
        type: String,
        default: null
    },
    whatsapp: {
        type: String,
        default: null
    },
    facebook: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null,
        select: false // Don't return OTP by default
    },
    otpExpires: {
        type: Date,
        default: null,
        select: false // Don't return OTP expiry by default
    },
    foodPreferences: {
        likes: {
            type: [String],
            default: []
        },
        dislikes: {
            type: [String],
            default: []
        },
        avoidance: {
            type: [String],
            default: []
        },
        notes: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

// Hash password and OTP before saving
userSchema.pre('save', async function () {
    // Hash password if modified
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
    }

    // Hash OTP if modified and not null
    if (this.isModified('otp') && this.otp !== null && this.otp !== undefined) {
        const salt = await bcrypt.genSalt(10);
        this.otp = await bcrypt.hash(this.otp as string, salt);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare OTP
userSchema.methods.compareOTP = async function (plainOtp: string) {
    if (!this.otp) {
        return false;
    }
    return await bcrypt.compare(plainOtp, this.otp);
};

// Remove password and OTP fields from JSON output
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.otp;
    delete obj.otpExpires;
    return obj;
};

// Add indexes for faster queries (email index already exists via unique: true)
userSchema.index({ khataId: 1 });
userSchema.index({ khataId: 1, roomStatus: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
