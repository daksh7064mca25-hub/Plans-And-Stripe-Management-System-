import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Shield, Compass, Layers, Users, LogIn, UserPlus, TrendingUp, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 py-4 px-4 sm:px-6 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors">
            <Layers className="h-6 w-6 text-indigo-500" />
            <span>SaaSFlow</span>
          </Link>

          {/* Navigation Links - Desktop Only */}
          <div className="hidden lg:flex items-center space-x-6">
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

          {/* User Actions - Desktop Only */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="text-right hover:text-indigo-400 group transition-all">
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

          {/* Mobile Hamburguer Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-50 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Header/Logo */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xl font-bold tracking-tight text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Layers className="h-6 w-6 text-indigo-500" />
              <span>SaaSFlow</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Account Info inside mobile sidebar */}
          {user && (
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Users className="h-5 w-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
            </Link>
          )}

          {/* Navigation Links */}
          <div className="flex flex-col space-y-2">
            <Link
              to="/plans"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-all"
            >
              <Compass className="h-5 w-5 text-indigo-400" />
              <span>Explore Plans</span>
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-all"
                >
                  <Layers className="h-5 w-5 text-indigo-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/billing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-all"
                >
                  <Compass className="h-5 w-5 text-indigo-400" />
                  <span>Billing History</span>
                </Link>
                {(user.role === 'Owner' || user.role === 'Employee' || user.role === 'Admin') && (
                  <Link
                    to="/revenue-dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-all"
                  >
                    <Layers className="h-5 w-5 text-indigo-400" />
                    <span>Wallet Dashboard</span>
                  </Link>
                )}
                {(user.role === 'Owner' || user.role === 'Admin') && (
                  <Link
                    to="/admin/revenue-settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-all"
                  >
                    <Compass className="h-5 w-5 text-indigo-400" />
                    <span>Revenue Settings</span>
                  </Link>
                )}
                {user.role === 'Owner' && (
                  <Link
                    to="/owner/refunds"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-slate-300 hover:text-white text-sm font-medium transition-all"
                  >
                    <Layers className="h-5 w-5 text-indigo-400" />
                    <span>Refund Management</span>
                  </Link>
                )}
              </>
            )}

            {isAdmin && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="px-3 text-xxs uppercase tracking-wider text-slate-500 font-bold">Admin Controls</p>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-indigo-400 hover:text-indigo-350 text-sm font-medium transition-all"
                >
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  <span>Admin Dashboard</span>
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-emerald-400 hover:text-emerald-350 text-sm font-medium transition-all"
                >
                  <Users className="h-5 w-5 text-emerald-400" />
                  <span>Manage Users</span>
                </Link>
                <Link
                  to="/admin/plans"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 text-rose-400 hover:text-rose-350 text-sm font-medium transition-all"
                >
                  <Shield className="h-5 w-5 text-rose-400" />
                  <span>Manage Plans</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-800">
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-3 rounded-xl text-sm font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 text-slate-300 hover:text-white py-2.5 text-sm font-semibold rounded-xl border border-slate-800 hover:bg-slate-800/40 transition-colors"
              >
                <LogIn className="h-4.5 w-4.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <UserPlus className="h-4.5 w-4.5" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
