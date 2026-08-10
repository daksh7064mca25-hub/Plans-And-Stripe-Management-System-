import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { CreditCard, TrendingUp, Users, AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/stats');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40 min-h-[calc(100vh-73px)] bg-slate-955 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-slate-950 text-slate-400 p-12 text-center min-h-[calc(100vh-73px)] flex items-center justify-center">
        Error loading statistics. Please verify backend state.
      </div>
    );
  }

  // Find max revenue value for scaling the custom SVG bar chart
  const maxRevenue = Math.max(...stats.dailyRevenue.map((d) => d.revenue), 100);
  const svgHeight = 220;
  const svgWidth = 600;
  const paddingX = 40;
  const paddingY = 30;
  const chartHeight = svgHeight - paddingY * 2;
  const chartWidth = svgWidth - paddingX * 2;
  const barWidth = 45;
  const gap = (chartWidth - barWidth * 7) / 6;

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-indigo-500" />
              <span>Admin Revenue & Analytics</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Real-time subscription totals, expired accounts, and transaction records.
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer w-fit"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload</span>
          </button>
        </div>

        {/* Analytics Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {/* Card 1: Total Revenue */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-all">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-xl font-extrabold text-white mt-2">₹{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xxs text-emerald-400 font-medium mt-1">Succeeded Payments</p>
          </div>

          {/* Card 2: Active Subscriptions */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-all border-l-4 border-l-emerald-500">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Subs</p>
            <p className="text-xl font-extrabold text-white mt-2">{stats.activeSubscriptions}</p>
            <p className="text-xxs text-slate-400 font-medium mt-1">Users status: Active</p>
          </div>

          {/* Card 3: Expired Subscriptions */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-all border-l-4 border-l-rose-500">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Expired Subs</p>
            <p className="text-xl font-extrabold text-white mt-2">{stats.expiredSubscriptions}</p>
            <p className="text-xxs text-slate-400 font-medium mt-1">Past Due or Inactive</p>
          </div>

          {/* Card 4: Monthly Revenue */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-all">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
            <p className="text-xl font-extrabold text-white mt-2">₹{stats.monthlyRevenue.toFixed(2)}</p>
            <p className="text-xxs text-indigo-400 font-medium mt-1">Current Calendar Month</p>
          </div>

          {/* Card 5: Today's Payments */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md hover:border-slate-700 transition-all">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Today's Payments</p>
            <p className="text-xl font-extrabold text-white mt-2">₹{stats.todayPayments.toFixed(2)}</p>
            <p className="text-xxs text-slate-400 font-medium mt-1">Processed since 12:00 AM</p>
          </div>
        </div>

        {/* Charting Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
          {/* Custom SVG Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-indigo-400" />
              <span>Daily Revenue Trend (Last 7 Days)</span>
            </h2>
            <p className="text-slate-400 text-xs mb-6">Revenue totals mapped in INR Rupees.</p>

            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[600px] h-[220px]">
                {/* Y Axis Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = paddingY + chartHeight * (1 - ratio);
                  return (
                    <g key={index}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={svgWidth - paddingX}
                        y2={y}
                        stroke="#1e293b" // slate-800
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        fill="#64748b" // slate-500
                        fontSize="10"
                        textAnchor="end"
                      >
                        ₹{Math.round(maxRevenue * ratio)}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Bars */}
                {stats.dailyRevenue.map((d, index) => {
                  const barHeight = (d.revenue / maxRevenue) * chartHeight;
                  const x = paddingX + index * (barWidth + gap);
                  const y = svgHeight - paddingY - barHeight;

                  return (
                    <g key={index} className="group cursor-pointer">
                      {/* Interactive glowing bar */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(barHeight, 4)} // show a min height for visibility
                        rx="6"
                        fill="url(#indigoPurpleGradient)"
                        className="transition-all duration-200 hover:opacity-90"
                      />

                      {/* Hover Tooltip Value */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900"
                      >
                        ₹{d.revenue.toFixed(0)}
                      </text>

                      {/* X Axis Label */}
                      <text
                        x={x + barWidth / 2}
                        y={svgHeight - 10}
                        fill="#94a3b8" // slate-400
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {d.date.split(',')[0]} {/* Short day name */}
                      </text>
                    </g>
                  );
                })}

                {/* SVG Definitions for Gradients */}
                <defs>
                  <linearGradient id="indigoPurpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" /> {/* indigo-500 */}
                    <stop offset="100%" stopColor="#a855f7" /> {/* purple-500 */}
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-full">
            <div>
              <h2 className="text-lg font-bold text-white mb-1 flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-indigo-400" />
                <span>Recent Operations</span>
              </h2>
              <p className="text-slate-400 text-xs mb-4">Latest 5 payment transactions.</p>

              {stats.recentTransactions.length === 0 ? (
                <p className="text-slate-500 text-sm py-10 text-center">No transactions registered yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentTransactions.map((tx) => (
                    <div key={tx._id} className="flex justify-between items-center border-b border-slate-850 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-white truncate max-w-[150px]">{tx.userId?.name || 'Deleted User'}</p>
                        <p className="text-xxs text-slate-400 capitalize">
                          {tx.planId?.name || 'Deleted Plan'} ({tx.billingPeriod})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">₹{tx.amount.toFixed(0)}</p>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xxs font-semibold ${
                            tx.status === 'Succeeded' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <a
              href="/billing"
              className="mt-6 inline-flex justify-center items-center w-full bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-300 hover:text-white py-2 rounded-xl text-xs font-semibold transition-all"
            >
              View Full Transaction Logs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
