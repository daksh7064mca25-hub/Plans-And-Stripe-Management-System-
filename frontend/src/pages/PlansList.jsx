import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Check, Info, Layers, RefreshCw } from 'lucide-react';

const PlansList = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-[calc(100vh-73px)] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4">Pricing Plans</h1>
          <p className="text-slate-400 max-w-xl mx-auto text-base">
            Choose the plan that fits your business needs. Scale up or down at any time.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <span className={`text-sm font-semibold ${billingPeriod === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="bg-slate-800 hover:bg-slate-700 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-indigo-500 shadow ring-0 transition duration-200 ease-in-out ${
                  billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-semibold ${billingPeriod === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
              Yearly <span className="ml-1 text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Admin Info Banner */}
        {user?.role === 'Admin' && (
          <div className="mb-8 bg-slate-900 border border-indigo-500/20 p-4 rounded-xl flex items-start space-x-3 max-w-3xl mx-auto">
            <Info className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-300 leading-relaxed">
              <strong>Admin Mode:</strong> You are viewing all available plans. Plans that are currently inactive are marked with an <strong>Inactive</strong> badge. You can modify these in the <a href="/admin/plans" className="underline font-bold text-white hover:text-indigo-200">Manage Plans</a> section.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            No active subscription plans available at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => {
              const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const periodLabel = billingPeriod === 'monthly' ? '/mo' : '/yr';

              return (
                <div
                  key={plan._id}
                  className={`bg-slate-900 border ${
                    !plan.isActive ? 'border-dashed border-slate-700 opacity-75' : 'border-slate-800'
                  } rounded-2xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-slate-700`}
                >
                  <div>
                    {/* Active/Inactive Badge for Admin */}
                    {!plan.isActive && (
                      <span className="absolute top-4 right-4 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase">
                        Inactive
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-slate-400 text-xs mb-6 min-h-[40px]">{plan.description}</p>

                    {/* Price Display */}
                    <div className="mb-6 flex items-baseline">
                      <span className="text-4xl font-extrabold text-white">${price}</span>
                      <span className="text-slate-400 text-sm ml-2">{periodLabel}</span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-300">
                          <Check className="h-4 w-4 text-emerald-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      if (!user) {
                        toast.warn('Please log in or sign up to subscribe.');
                        navigate('/login');
                      } else {
                        navigate(`/checkout/${plan._id}?period=${billingPeriod}`);
                      }
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all cursor-pointer"
                  >
                    Select Plan
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansList;
