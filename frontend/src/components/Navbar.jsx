import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Shield, Compass, Layers, Users, LogIn, UserPlus, TrendingUp } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 py-4 px-6 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors">
          <Layers className="h-6 w-6 text-indigo-500" />
          <span>SaaSFlow</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link to="/plans" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors text-sm font-medium">
            <Compass className="h-4 w-4" />
            <span>Plans</span>
          </Link>

          {user && (
            <>
              <Link to="/dashboard" className="hover:text-indigo-400 transition-colors text-sm font-medium">
                Dashboard
              </Link>
              <Link to="/billing" className="hover:text-indigo-400 transition-colors text-sm font-medium">
                Billing History
              </Link>
              {(user.role === 'Owner' || user.role === 'Employee' || user.role === 'Admin') && (
                <Link to="/revenue-dashboard" className="hover:text-indigo-400 transition-colors text-sm font-medium">
                  Wallet Dashboard
                </Link>
              )}
              {(user.role === 'Owner' || user.role === 'Admin') && (
                <Link to="/admin/revenue-settings" className="hover:text-indigo-400 transition-colors text-sm font-medium">
                  Revenue Settings
                </Link>
              )}
              {user.role === 'Owner' && (
                <Link to="/owner/refunds" className="hover:text-indigo-400 transition-colors text-sm font-medium">
                  Refund Management
                </Link>
              )}
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <span className="text-indigo-400">Admin Dashboard</span>
              </Link>
              <Link to="/admin/users" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors text-sm font-medium">
                <Users className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Manage Users</span>
              </Link>
              <Link to="/admin/plans" className="flex items-center space-x-1 hover:text-indigo-400 transition-colors text-sm font-medium">
                <Shield className="h-4 w-4 text-rose-400" />
                <span className="text-rose-400">Manage Plans</span>
              </Link>
            </>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/profile" className="text-right hidden sm:block hover:text-indigo-400 group transition-all">
                <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize group-hover:text-indigo-300 transition-colors">{user.role}</p>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-lg text-sm font-medium border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center space-x-1 text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
