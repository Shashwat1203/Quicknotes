const Note = require('../models/Note');

// @desc    Get notes based on roles and filters
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    try {
        const { search, category, page = 1, limit = 50, view } = req.query;
        let query = {};

        // Base Role Visibility Logic
        if (req.user.role === 'admin' && view === 'all') {
            // Admin Global View: No base user filter, fetch everything.
            query = {};
        } else if (req.user.role === 'teacher' && view === 'students') {
            // Teacher Insight View: Fetch notes created by all students
            const User = require('../models/User');
            const students = await User.find({ role: 'student' }).select('_id');
            const studentIds = students.map(s => s._id);
            query = { user: { $in: studentIds } };
        } else {
            // Standard User View: User's own notes OR notes marked as homework
            query = {
                $or: [
                    { user: req.user.id },
                    { type: 'homework' }
                ]
            };
        }

        // Apply additional Search and Category Filters
        const filters = {};
        if (search) {
            filters.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            filters.category = category;
        }

        // If there are filters to apply, combine them cleanly with the base query
        if (Object.keys(filters).length > 0) {
            if (query.$or) {
                // We already have an $or (Standard User View), wrap in $and to prevent overwriting
                query = { $and: [query, filters] };
            } else {
                // Admin or Teacher view base, just merge properties
                query = { ...query, ...filters };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notes = await Note.find(query)
            .populate('user', 'name role')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Note.countDocuments(query);

        res.status(200).json({
            count: notes.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: notes
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Set note
// @route   POST /api/notes
// @access  Private
const setNote = async (req, res) => {
    try {
        const { title, content, category, color, isPinned, type } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Please add a title and text field' });
        }

        // Only allow teachers/admins to create homework notes
        let assignedType = 'personal';
        if (type === 'homework' && (req.user.role === 'teacher' || req.user.role === 'admin')) {
            assignedType = 'homework';
        }

        const note = await Note.create({
            title,
            content,
            category,
            color,
            isPinned,
            type: assignedType,
            user: req.user.id
        });

        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure the logged in user matches the note user
        if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Make sure the logged in user matches the note user
        if (note.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await note.deleteOne();

        res.status(200).json({ id: req.params.id, message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotes,
    setNote,
    updateNote,
    deleteNote
};
