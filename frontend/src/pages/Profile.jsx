import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { User, Shield, Mail, Calendar, Key, CreditCard, Sparkles, Layers, ArrowUpRight, Lock } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndPayments = async () => {
    try {
      setLoading(true);
      // 1. Fetch populated profile
      const profileRes = await api.get('/users/profile');
      setProfile(profileRes.data);

      // 2. Fetch user's recent payment logs
      const paymentsRes = await api.get('/payments/history', {
        params: {
          page: 1,
          limit: 3, // only show 3 most recent
        },
      });
      setPayments(paymentsRes.data.payments);
    } catch (err) {
      toast.error('Failed to load user profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40 min-h-[calc(100vh-73px)] bg-slate-955 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-slate-950 text-slate-400 p-12 text-center min-h-[calc(100vh-73px)] flex items-center justify-center">
        Error loading profile data. Please try signing in again.
      </div>
    );
  }

  // Calculate subscription details
  const sub = profile.subscription;
  const plan = sub?.planId;
  const isActive = sub?.status === 'Active' && plan;
  
  let priceINR = 0;
  let renewalDate = null;

  if (isActive) {
    const usdPrice = sub.billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    priceINR = usdPrice * 80; // conversion rate

    const lastBilling = sub.updatedAt ? new Date(sub.updatedAt) : new Date();
    renewalDate = new Date(lastBilling);
    if (sub.billingPeriod === 'monthly') {
      renewalDate.setDate(renewalDate.getDate() + 30);
    } else {
      renewalDate.setDate(renewalDate.getDate() + 365);
    }
  }

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <User className="h-8 w-8 text-indigo-500" />
            <span>My Profile & Subscription</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Manage your account settings, check your premium renewal schedule, and view recent payments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Column 1: User details */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg h-full">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <User className="h-5 w-5 text-indigo-400" />
              <span>Personal Details</span>
            </h2>

            <div className="space-y-5">
              <div>
                <p className="text-xxs text-slate-500 uppercase font-semibold">Full Name</p>
                <p className="text-sm font-semibold text-white mt-1">{profile.name}</p>
              </div>
              <div className="border-t border-slate-850 pt-3">
                <p className="text-xxs text-slate-500 uppercase font-semibold">Email Address</p>
                <p className="text-sm font-semibold text-white mt-1 truncate">{profile.email}</p>
              </div>
              <div className="border-t border-slate-850 pt-3">
                <p className="text-xxs text-slate-500 uppercase font-semibold">Access Privilege Role</p>
                <span className={`inline-block px-2.5 py-0.5 mt-1 rounded text-xxs font-semibold uppercase ${
                  profile.role === 'Admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {profile.role}
                </span>
              </div>
              <div className="border-t border-slate-850 pt-3">
                <p className="text-xxs text-slate-500 uppercase font-semibold">Member Since</p>
                <div className="flex items-center space-x-1.5 mt-1 text-slate-300 text-sm">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  <span>
                    {new Date(profile.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Subscription Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg lg:col-span-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-[10px] text-indigo-500/5 pointer-events-none">
              <Layers className="h-48 w-48" />
            </div>

            <h2 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              <span>Current Subscription Info</span>
            </h2>

            {isActive ? (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-indigo-500/25 rounded-2xl p-6 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-1">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        <span className="text-sm tracking-wider uppercase">{plan.name}</span>
                      </div>
                      <p className="text-slate-400 text-xs">Active subscription plan</p>
                    </div>
                    <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 px-3 py-0.5 rounded-full text-xs font-semibold uppercase">
                      {sub.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-8">
                    <div>
                      <p className="text-xxs text-slate-500 uppercase font-semibold">Pricing Cycle Price</p>
                      <p className="text-xl font-extrabold text-white mt-1">₹{priceINR.toFixed(2)} INR</p>
                      <p className="text-xxs text-slate-400 capitalize">Billed {sub.billingPeriod}</p>
                    </div>
                    <div>
                      <p className="text-xxs text-slate-500 uppercase font-semibold">Renewal Rollover Date</p>
                      <p className="text-xl font-extrabold text-white mt-1">
                        {renewalDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xxs text-indigo-400 font-medium">Auto-renew active</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <a
                    href="/plans"
                    className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                  >
                    <span>Upgrade or Switch Plan</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 text-center h-full flex flex-col justify-center items-center py-10">
                <div className="bg-slate-900 p-4 rounded-full w-14 h-14 flex items-center justify-center mb-4 border border-slate-800 text-slate-450">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No Active Subscription</h3>
                <p className="text-slate-400 text-xs max-w-sm mb-6 leading-relaxed">
                  You are currently using SaaSFlow on the free demo tier. Purchase a pricing package to unlock exclusive features and premium resources.
                </p>
                <a
                  href="/plans"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  View Available Plans
                </a>
              </div>
            )}
          </div>
        </div>

        {/* User's Recent Payment History */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            <span>Recent Payments History Log</span>
          </h2>

          {payments.length === 0 ? (
            <div className="bg-slate-950/30 border border-slate-850 p-8 rounded-2xl text-center text-slate-500 text-sm">
              No transactions recorded for this account.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto border border-slate-850 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-850 border-b border-slate-800 text-slate-355 text-xxs font-semibold uppercase tracking-wider">
                      <th className="py-3.5 px-5">Plan</th>
                      <th className="py-3.5 px-5">Billing Cycle</th>
                      <th className="py-3.5 px-5">Amount</th>
                      <th className="py-3.5 px-5">Transaction Date</th>
                      <th className="py-3.5 px-5">Stripe Transaction ID</th>
                      <th className="py-3.5 px-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {payments.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-850/10 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-white">{tx.planId?.name || 'Deleted Plan'}</td>
                        <td className="py-3.5 px-5 capitalize text-slate-400">{tx.billingPeriod}</td>
                        <td className="py-3.5 px-5 font-mono font-bold text-white">₹{tx.amount.toFixed(2)}</td>
                        <td className="py-3.5 px-5 text-slate-455">
                          {new Date(tx.paymentDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-slate-500" title={tx.stripePaymentIntentId}>
                          {tx.stripePaymentIntentId.startsWith('sim_')
                            ? tx.stripePaymentIntentId.substring(0, 15) + '...'
                            : tx.stripePaymentIntentId}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xxs font-semibold ${
                              tx.status === 'Succeeded'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="block lg:hidden space-y-4">
                {payments.map((tx) => (
                  <div key={tx._id} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white text-base leading-tight">{tx.planId?.name || 'Deleted Plan'}</h3>
                        <p className="text-xs text-slate-400 mt-1 capitalize">{tx.billingPeriod} Cycle</p>
                      </div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xxs font-semibold ${
                          tx.status === 'Succeeded'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850/60 pt-3 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Amount</p>
                        <p className="font-mono font-bold text-white mt-1">₹{tx.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Date</p>
                        <p className="text-slate-300 mt-1">
                          {new Date(tx.paymentDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3">
                      <p className="text-[10px] text-slate-505 uppercase font-semibold">Stripe Transaction ID</p>
                      <p className="font-mono text-slate-400 text-xxs mt-1 truncate" title={tx.stripePaymentIntentId}>
                        {tx.stripePaymentIntentId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
