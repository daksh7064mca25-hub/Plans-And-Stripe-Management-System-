const express = require('express');
const router = express.Router();
const {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getPlans)
  .post(protect, authorize('Admin'), createPlan);

router.route('/:id')
  .get(getPlanById)
  .put(protect, authorize('Admin'), updatePlan)
  .delete(protect, authorize('Admin'), deletePlan);

module.exports = router;
