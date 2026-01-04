import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    breakfast: {
        type: String,
        default: ''
    },
    lunch: {
        type: String,
        default: ''
    },
    dinner: {
        type: String,
        default: ''
    }
}, { _id: false });

const menuSchema = new mongoose.Schema({
    khataId: {
        type: String,
        required: true,
        index: true
    },
    weekStart: {
        type: Date,
        required: true
    },
    items: [menuItemSchema],
    isPermanent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
menuSchema.index({ khataId: 1, weekStart: 1 });
menuSchema.index({ khataId: 1, isPermanent: 1 }); // For dashboard quick menu lookup

const Menu = mongoose.models.Menu || mongoose.model('Menu', menuSchema);

export default Menu;
