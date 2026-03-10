const express = require('express');
const router = express.Router();
const { getSystemAnalytics, getUsers, deleteUser } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.get('/analytics', protect, authorize('admin', 'teacher'), getSystemAnalytics);

// Admin only routes
router.get('/users', protect, authorize('admin'), getUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
