import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User, Shield, Mail, Key, Lock, Crown, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [premiumData, setPremiumData] = useState(null);
  const [premiumError, setPremiumError] = useState(null);
  const [loadingPremium, setLoadingPremium] = useState(true);

  const fetchPremiumData = async () => {
    try {
      setLoadingPremium(true);
      const res = await api.get('/premium/data');
      setPremiumData(res.data.premiumData);
      setPremiumError(null);
    } catch (err) {
      setPremiumError(err.response?.data || { message: 'Access denied. Premium features locked.' });
      setPremiumData(null);
    } finally {
      setLoadingPremium(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPremiumData();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 border border-slate-800 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-lg">
          <div className="absolute right-0 bottom-0 translate-y-10 translate-x-10 text-indigo-500/10 pointer-events-none">
            <Shield className="h-64 w-64" />
          </div>

          <div className="relative z-10">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              User Portal
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-4">Welcome back, {user.name}!</h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm leading-relaxed">
              Your MERN Authentication session is active. You can browse plans, update details, or test administrator features.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-md">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-400" />
            <span>Profile Account Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-850/50 p-5 rounded-2xl border border-slate-800 flex items-start space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Full Name</p>
                <p className="text-base font-semibold text-white mt-0.5">{user.name}</p>
              </div>
            </div>

            <div className="bg-slate-850/50 p-5 rounded-2xl border border-slate-800 flex items-start space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Email Address</p>
                <p className="text-base font-semibold text-white mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="bg-slate-850/50 p-5 rounded-2xl border border-slate-800 flex items-start space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Authorized Role</p>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    user.role === 'Admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-850/50 p-5 rounded-2xl border border-slate-800 flex items-start space-x-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Authorization Mechanism</p>
                <p className="text-sm font-semibold text-white mt-0.5">Signed JSON Web Token (JWT)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Portal Panel */}
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-y-[-10px] translate-x-[10px] text-yellow-500/5 pointer-events-none">
            <Crown className="h-48 w-48" />
          </div>

          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>SaaS Premium Portal</span>
          </h2>

          {loadingPremium ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
            </div>
          ) : premiumData ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/25 border border-yellow-500/20 rounded-2xl p-4 sm:p-6 relative overflow-hidden">
              <div className="flex items-center space-x-3 text-yellow-400 font-bold mb-4">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <span className="text-sm tracking-wider uppercase">Subscription Premium Active</span>
              </div>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Your subscription checks successfully cleared the backend middleware. Below is the secure premium resource content:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl">
                  <p className="text-xxs text-slate-400 uppercase font-semibold">Premium Analytics Score</p>
                  <p className="text-lg font-extrabold text-white mt-1">{premiumData.analyticsScore}%</p>
                </div>
                <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl">
                  <p className="text-xxs text-slate-400 uppercase font-semibold">Active Enterprise Users</p>
                  <p className="text-lg font-extrabold text-white mt-1">{premiumData.activeUsersCount}</p>
                </div>
                <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl col-span-1 sm:col-span-2">
                  <p className="text-xxs text-slate-400 uppercase font-semibold">Authorized Enterprise Key</p>
                  <p className="text-xs font-mono text-slate-300 mt-1 truncate bg-slate-900/50 py-1.5 px-3 rounded-lg border border-slate-800" title={premiumData.enterpriseToken}>
                    {premiumData.enterpriseToken}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/50 border border-slate-800/85 rounded-2xl p-4 sm:p-6 text-center">
              <div className="bg-slate-900 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 border border-slate-800 text-slate-400">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Premium Content Locked</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                {premiumError?.message || 'Active subscription required. Please review our plans to purchase or renew.'}
              </p>
              <a
                href="/plans"
                className="inline-flex items-center space-x-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
              >
                <span>Unlock Premium & View Plans</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
