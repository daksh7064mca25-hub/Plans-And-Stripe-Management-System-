const Plan = require('../models/Plan');

const getPlansList = async (includeInactive = false) => {
  const query = includeInactive ? {} : { isActive: true };
  return await Plan.find(query).lean();
};

const getPlanDetails = async (id) => {
  return await Plan.findById(id);
};

const createPlan = async (planData) => {
  return await Plan.create(planData);
};

const updatePlan = async (id, planData) => {
  return await Plan.findByIdAndUpdate(id, planData, { new: true, runValidators: true });
};

const deletePlan = async (id) => {
  return await Plan.findByIdAndDelete(id);
};

module.exports = {
  getPlansList,
  getPlanDetails,
  createPlan,
  updatePlan,
  deletePlan,
};
