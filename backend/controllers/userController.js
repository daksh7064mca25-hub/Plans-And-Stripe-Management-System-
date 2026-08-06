const userService = require('../services/userService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res, next) => {
  const users = await userService.getUsersList();
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res, next) => {
  await userService.deleteUserById(req.params.id, req.user._id);
  res.json({ message: 'User removed' });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res, next) => {
  const updatedUser = await userService.updateUserRoleById(req.params.id, req.body.role, req.user._id);
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
  });
});

// @desc    Get user profile (includes subscription plan populated)
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res, next) => {
  const userProfile = await userService.getUserProfileById(req.user._id);
  if (!userProfile) {
    return next(new ErrorResponse('User profile not found', 404));
  }
  res.json(userProfile);
});

module.exports = {
  getUsers,
  deleteUser,
  updateUserRole,
  getProfile,
};
