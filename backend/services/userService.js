const User = require('../models/User');

const getUsersList = async () => {
  return await User.find({}).select('-password').lean();
};

const deleteUserById = async (id, requesterId) => {
  if (id === requesterId.toString()) {
    throw new Error('You cannot delete your own admin account');
  }
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return await User.findByIdAndDelete(id);
};

const updateUserRoleById = async (id, role, requesterId) => {
  if (id === requesterId.toString()) {
    throw new Error('You cannot change your own role');
  }
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  user.role = role || user.role;
  return await user.save();
};

const getUserProfileById = async (id) => {
  return await User.findById(id)
    .select('-password')
    .populate('subscription.planId', 'name monthlyPrice yearlyPrice features');
};

module.exports = {
  getUsersList,
  deleteUserById,
  updateUserRoleById,
  getUserProfileById,
};
