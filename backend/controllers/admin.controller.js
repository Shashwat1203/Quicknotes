const User = require('../models/User');
const Note = require('../models/Note');

// @desc    Get total system analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getSystemAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalNotes = await Note.countDocuments();

        // Count roles
        const studentCount = await User.countDocuments({ role: 'student' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const adminCount = await User.countDocuments({ role: 'admin' });

        // Find most active user (user with most notes)
        const activeUsersPipeline = [
            { $group: { _id: '$user', noteCount: { $sum: 1 } } },
            { $sort: { noteCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $project: {
                    _id: 1,
                    noteCount: 1,
                    name: { $arrayElemAt: ['$userInfo.name', 0] },
                    email: { $arrayElemAt: ['$userInfo.email', 0] }
                }
            }
        ];

        const topUsers = await Note.aggregate(activeUsersPipeline);

        // Notes created per day (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentNotesTimeline = await Note.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            totals: {
                users: totalUsers,
                notes: totalNotes
            },
            roles: {
                students: studentCount,
                teachers: teacherCount,
                admins: adminCount
            },
            topUsers,
            timeline: recentNotesTimeline
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Optional: Prevent deleting themselves
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }
        await user.deleteOne();
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getSystemAnalytics,
    getUsers,
    deleteUser
};
