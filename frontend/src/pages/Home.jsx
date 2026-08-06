import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowRight, CheckCircle, Shield, Award, Sparkles, Activity } from 'lucide-react';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-20 px-6 sm:py-32 lg:px-8 flex-grow flex items-center">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 blur-3xl opacity-30 w-[500px] h-[500px] rounded-full bg-indigo-600 pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 blur-3xl opacity-20 w-[300px] h-[300px] rounded-full bg-emerald-500 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>MERN Auth & Subscriptions Showcase</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Deploy Subscription Billing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
              For Your SaaS Products
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A comprehensive boilerplate implementing Express role authorization, secure JWT token distribution, password hashing, and clean UI components for managing subscription plans.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/plans"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all text-base cursor-pointer"
            >
              <span>Explore Plans</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

            {!user ? (
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-100 hover:text-white px-6 py-3 rounded-xl font-semibold border border-slate-800 hover:border-slate-700 transition-all text-base cursor-pointer"
              >
                <span>Create Account</span>
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-100 hover:text-white px-6 py-3 rounded-xl font-semibold border border-slate-800 hover:border-slate-700 transition-all text-base cursor-pointer"
              >
                <span>Go to Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="border-t border-slate-900 bg-slate-900/30 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl">
            <div className="p-3 bg-indigo-500/10 rounded-xl w-fit mb-4 text-indigo-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Role Authorization</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Restrict routes securely. The application handles user vs administrator routes inside the backend controller & Router guards.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl">
            <div className="p-3 bg-emerald-500/10 rounded-xl w-fit mb-4 text-emerald-400">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">JWT & Hashing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Tokens are issued on registration/login, stored in HTTP-Only cookies, and passwords are encrypted using bcryptjs pre-save hooks.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl">
            <div className="p-3 bg-rose-500/10 rounded-xl w-fit mb-4 text-rose-400">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Subscription CRUD</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Admins can create, delete, and modify plans. regular users can review features and toggle monthly/yearly pricing plans.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} SaaSFlow. Built using MongoDB, Express, React, and Node.js.</p>
      </footer>
    </div>
  );
};

export default Home;
