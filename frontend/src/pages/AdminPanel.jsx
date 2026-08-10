import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, Trash2, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useContext(AuthContext);
  const [cronLoading, setCronLoading] = useState(false);

  const handleTriggerCron = async (jobType) => {
    try {
      setCronLoading(true);
      const payload = jobType === 'all' ? {} : { job: jobType };
      const res = await api.post('/users/cron/trigger', payload);
      
      if (res.data.success) {
        let detailsMsg = '';
        if (jobType === 'expire') {
          detailsMsg = ` (Expired: ${res.data.result?.expiredCount ?? 0} subscriptions)`;
        } else if (jobType === 'analytics') {
          detailsMsg = ` (Payments total: ₹${res.data.result?.totalSuccessfulPayments ?? 0})`;
        } else if (jobType === 'reminders') {
          detailsMsg = ` (Dispatched: ${res.data.result?.sentCount ?? 0} reminders)`;
        } else {
          detailsMsg = ` (All cron tasks finished)`;
        }
        toast.success(`${res.data.message}${detailsMsg}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to trigger cron task');
    } finally {
      setCronLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated successfully to ${newRole}`);
      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
              <Users className="h-8 w-8 text-indigo-500" />
              <span>User Administration Panel</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Manage registered accounts, modify permission scopes, and remove profiles.
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 w-fit"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* System Cron Scheduler Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-indigo-500" />
            <span>System Cron Scheduler Controls</span>
          </h2>
          <p className="text-slate-455 text-xs mb-5">
            Manually trigger background sync tasks. The results will propagate live to your Mongo database.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleTriggerCron('expire')}
              disabled={cronLoading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Expire Subscriptions</span>
            </button>
            <button
              onClick={() => handleTriggerCron('analytics')}
              disabled={cronLoading}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Compile Daily Analytics</span>
            </button>
            <button
              onClick={() => handleTriggerCron('reminders')}
              disabled={cronLoading}
              className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Send Expiry Reminders</span>
            </button>
            <button
              onClick={() => handleTriggerCron('all')}
              disabled={cronLoading}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Run All Jobs</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            No registered users found.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-850 border-b border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">User ID</th>
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6">Role</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {users.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-850/30 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">{item._id}</td>
                        <td className="py-4 px-6 font-semibold text-white">{item.name}</td>
                        <td className="py-4 px-6 text-slate-300">{item.email}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                            item.role === 'Admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {item._id !== currentUser._id ? (
                            <>
                              <button
                                onClick={() => handleRoleToggle(item._id, item.role)}
                                className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Toggle Role
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item._id)}
                                className="inline-flex items-center text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 p-2 rounded-lg transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 italic">Active Self Session</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden space-y-4">
              {users.map((item) => (
                <div key={item._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white text-base leading-tight">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{item.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      item.role === 'Admin' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-350'
                    }`}>
                      {item.role}
                    </span>
                  </div>
                  
                  <div className="border-t border-slate-800/60 pt-2.5 flex justify-between items-center text-xxs font-mono text-slate-500">
                    <span>User ID</span>
                    <span className="select-all">{item._id}</span>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 flex gap-2 justify-end">
                    {item._id !== currentUser._id ? (
                      <>
                        <button
                          onClick={() => handleRoleToggle(item._id, item.role)}
                          className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-305 border border-indigo-500/20 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex-1 text-center font-medium"
                        >
                          Toggle Role
                        </button>
                        <button
                          onClick={() => handleDeleteUser(item._id)}
                          className="inline-flex items-center justify-center text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-305 border border-red-500/20 p-2.5 rounded-xl transition-all cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 italic py-1">Active Self Session</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
