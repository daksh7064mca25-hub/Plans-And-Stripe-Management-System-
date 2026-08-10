const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, updateUserRole, getProfile, triggerCronJobs } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all routes here to require authentication
router.use(protect);

// User Profile Actions
router.get('/profile', getProfile);
router.post('/cron/trigger', authorize('Admin'), triggerCronJobs);

// Admin-only actions
router.route('/')
  .get(authorize('Admin'), getUsers);

router.route('/:id')
  .delete(authorize('Admin'), deleteUser);

router.route('/:id/role')
  .put(authorize('Admin'), updateUserRole);

module.exports = router;
