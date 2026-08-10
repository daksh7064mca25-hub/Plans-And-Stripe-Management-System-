import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Shield, Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';

const ManagePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // plan object if editing, null if creating

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      toast.error('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    reset({
      name: '',
      description: '',
      monthlyPrice: '',
      yearlyPrice: '',
      featuresStr: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    reset({
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      featuresStr: plan.features.join(', '),
      isActive: plan.isActive,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data) => {
    const formattedFeatures = data.featuresStr
      ? data.featuresStr.split(',').map((f) => f.trim()).filter((f) => f !== '')
      : [];

    const payload = {
      name: data.name,
      description: data.description,
      monthlyPrice: Number(data.monthlyPrice),
      yearlyPrice: Number(data.yearlyPrice),
      features: formattedFeatures,
      isActive: data.isActive,
    };

    try {
      if (editingPlan) {
        // Edit existing plan
        const res = await api.put(`/plans/${editingPlan._id}`, payload);
        toast.success(`Plan "${res.data.name}" updated successfully.`);
        setPlans(plans.map((p) => (p._id === editingPlan._id ? res.data : p)));
      } else {
        // Create new plan
        const res = await api.post('/plans', payload);
        toast.success(`Plan "${res.data.name}" created successfully.`);
        setPlans([...plans, res.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.delete(`/plans/${planId}`);
      toast.success('Subscription plan removed successfully.');
      setPlans(plans.filter((p) => p._id !== planId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan.');
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const res = await api.put(`/plans/${plan._id}`, { isActive: !plan.isActive });
      toast.success(`Plan status toggled.`);
      setPlans(plans.map((p) => (p._id === plan._id ? res.data : p)));
    } catch (err) {
      toast.error('Failed to change status.');
    }
  };

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
              <Shield className="h-8 w-8 text-rose-500" />
              <span>Subscription Plans Dashboard</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Create, update, delete, or change visibility of subscription plans.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all cursor-pointer w-fit"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create New Plan</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            No plans configured yet. Click "Create New Plan" to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`bg-slate-900 border ${
                  plan.isActive ? 'border-slate-800' : 'border-rose-900/40 opacity-75'
                } rounded-2xl p-6 flex flex-col justify-between shadow-lg relative`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span
                      onClick={() => handleToggleStatus(plan)}
                      className={`px-2 py-0.5 rounded text-xxs font-bold uppercase cursor-pointer border select-none transition-all ${
                        plan.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/25'
                      }`}
                      title="Click to toggle active status"
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="font-mono text-xxs text-slate-500">{plan._id.substring(18)}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-xs mb-4 min-h-[32px] line-clamp-2">{plan.description}</p>

                  <div className="mb-4 grid grid-cols-2 gap-2 bg-slate-850 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-xxs text-slate-500 font-semibold uppercase">Monthly</p>
                      <p className="text-base font-bold text-white">${plan.monthlyPrice}</p>
                    </div>
                    <div>
                      <p className="text-xxs text-slate-500 font-semibold uppercase">Yearly</p>
                      <p className="text-base font-bold text-white">${plan.yearlyPrice}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xxs text-slate-500 font-semibold uppercase mb-1.5">Features ({plan.features.length})</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {plan.features.slice(0, 3).map((f, idx) => (
                        <li key={idx} className="truncate flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mr-2 flex-shrink-0"></span>
                          <span>{f}</span>
                        </li>
                      ))}
                      {plan.features.length > 3 && (
                        <li className="text-slate-500 text-xxs font-medium italic">
                          + {plan.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-800/80 pt-4 mt-auto">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex-1 inline-flex justify-center items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan._id)}
                    className="inline-flex justify-center items-center bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-550/20 p-2 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-4 sm:p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </h2>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                {/* Plan Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="e.g. Starter Plan"
                    {...register('name', { required: 'Plan Name is required' })}
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="Brief summary of target demographic..."
                    {...register('description')}
                  />
                </div>

                {/* Pricing Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Monthly Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      placeholder="9.99"
                      {...register('monthlyPrice', {
                        required: 'Monthly Price is required',
                        min: { value: 0, message: 'Price cannot be negative' },
                      })}
                    />
                    {errors.monthlyPrice && <p className="text-red-400 text-xs mt-1">{errors.monthlyPrice.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Yearly Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      placeholder="99.99"
                      {...register('yearlyPrice', {
                        required: 'Yearly Price is required',
                        min: { value: 0, message: 'Price cannot be negative' },
                      })}
                    />
                    {errors.yearlyPrice && <p className="text-red-400 text-xs mt-1">{errors.yearlyPrice.message}</p>}
                  </div>
                </div>

                {/* Features (Comma-Separated) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Features (comma-separated list)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="e.g. 5 projects, 24/7 Support, Analytics Dashboard"
                    {...register('featuresStr')}
                  />
                  <p className="text-slate-500 text-xxs mt-1">Separate individual features with commas.</p>
                </div>

                {/* Active Status Toggle */}
                <div className="flex items-center space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 bg-slate-850 border-slate-700 text-indigo-500 rounded focus:ring-indigo-500 cursor-pointer"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-300 font-medium cursor-pointer select-none">
                    Active (Show on public plans page)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-850 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{editingPlan ? 'Save Changes' : 'Create Plan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePlans;
