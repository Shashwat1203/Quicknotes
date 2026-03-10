const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General',
        enum: ['General', 'Work', 'Personal', 'Ideas']
    },
    color: {
        type: String,
        default: '#ffffff'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        enum: ['personal', 'homework'],
        default: 'personal' // Notes are personal by default
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
