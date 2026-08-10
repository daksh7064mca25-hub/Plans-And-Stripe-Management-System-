import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  Wallet,
  TrendingUp,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Undo,
  ShieldAlert
} from 'lucide-react';

const RevenueDashboard = () => {
  const { user } = useContext(AuthContext);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [history, setHistory] = useState([]);
  const [refundTransactions, setRefundTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Refunds tab states
  const [activeTab, setActiveTab] = useState('earnings'); // 'earnings' or 'refunds'
  const [refunds, setRefunds] = useState([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  const fetchStats = async (pageNumber = 1) => {
    try {
      const res = await api.get(`/revenue/stats?page=${pageNumber}&limit=10`);
      setWalletBalance(res.data.walletBalance);
      setTotalEarnings(res.data.totalEarnings);
      setHistory(res.data.history);
      setRefundTransactions(res.data.refundTransactions || []);
      setPage(res.data.page);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch wallet stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRefunds = async () => {
    if (user?.role !== 'Owner' && user?.role !== 'Admin') return;
    try {
      setLoadingRefunds(true);
      const res = await api.get('/refunds');
      setRefunds(res.data.refunds || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch refunds history');
    } finally {
      setLoadingRefunds(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(1);
    if (user && (user.role === 'Owner' || user.role === 'Admin')) {
      fetchRefunds();
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'earnings') {
      fetchStats(page);
    } else {
      fetchRefunds();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      fetchStats(newPage);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied payment ID to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-955 text-white py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wallet & Revenue Sharing</h1>
            <p className="text-sm text-slate-400 mt-1">Track your wallet balance, splits distributions, and transaction records.</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer w-fit"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Wallet Balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-indigo-500/10 rounded-xl">
                <Wallet className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Balance</p>
                <h3 className="text-3xl font-extrabold text-white mt-1">₹{(walletBalance ?? 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>

          {/* Card 2: Total Earnings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-emerald-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lifetime Earnings</p>
                <h3 className="text-3xl font-extrabold text-white mt-1">₹{(totalEarnings ?? 0).toFixed(2)}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher for Owner / Admin */}
        {(user?.role === 'Owner' || user?.role === 'Admin') && (
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('earnings')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'earnings'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Earnings History
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'refunds'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Refunds History
            </button>
          </div>
        )}

        {/* History Table */}
        {activeTab === 'earnings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Earnings History</h2>
              <span className="px-2.5 py-1 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-full">
                {total} transactions
              </span>
            </div>

            <div className="overflow-x-auto">
              {history.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Calendar className="mx-auto h-12 w-12 text-slate-700 mb-4" />
                  <p className="text-lg font-medium text-slate-400">No transactions recorded yet</p>
                  <p className="text-sm mt-1 text-slate-500">Distributions appear here automatically when payments succeed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                      <thead className="bg-slate-955">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Split Mode
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Total Revenue
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Your Share
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {history.map((row) => (
                          <tr key={row._id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                              {new Date(row.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-[150px]">{row.stripePaymentIntentId}</span>
                                <button
                                  onClick={() => copyToClipboard(row.stripePaymentIntentId)}
                                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                  row.mode === 'Equal' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10'
                                }`}
                              >
                                {row.mode} Split
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                              row.amount < 0 ? 'text-rose-400' : 'text-slate-300'
                            }`}>
                              {row.amount < 0 ? '-' : ''}₹{Math.abs(row.amount).toFixed(2)}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                              row.yourShare < 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {row.yourShare < 0 ? '-' : '+'}₹{Math.abs(row.yourShare).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile stacked card view */}
                  <div className="block lg:hidden divide-y divide-slate-850">
                    {history.map((row) => (
                      <div key={row._id} className="p-4 sm:p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-slate-405">
                              {new Date(row.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-1.5 font-mono text-xxs text-slate-500">
                              <span className="truncate max-w-[150px]">{row.stripePaymentIntentId}</span>
                              <button
                                onClick={() => copyToClipboard(row.stripePaymentIntentId)}
                                className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-all cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xxs font-medium ${
                              row.mode === 'Equal' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10'
                            }`}
                          >
                            {row.mode} Split
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-850/60 pt-3 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Revenue</p>
                            <p className={`font-semibold mt-0.5 ${row.amount < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                              {row.amount < 0 ? '-' : ''}₹{Math.abs(row.amount).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Your Share</p>
                            <p className={`font-bold mt-0.5 ${row.yourShare < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {row.yourShare < 0 ? '-' : '+'}₹{Math.abs(row.yourShare).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{pages}</strong>
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === pages}
                    className="p-2 border border-slate-800 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Refunds History Table */}
        {activeTab === 'refunds' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Refund Transactions</h2>
              <span className="px-2.5 py-1 text-xs font-medium text-rose-400 bg-rose-500/10 rounded-full">
                {refunds.length} refunds
              </span>
            </div>

            <div className="overflow-x-auto">
              {loadingRefunds ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 text-rose-500 animate-spin mx-auto" />
                  <p className="text-sm text-slate-400 mt-2">Loading refund history...</p>
                </div>
              ) : refunds.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Undo className="mx-auto h-12 w-12 text-slate-700 mb-4" />
                  <p className="text-lg font-medium text-slate-400">No refunds recorded yet</p>
                  <p className="text-sm mt-1 text-slate-500">Issued refunds will appear here.</p>
                </div>
                            <div className="space-y-4">
                  {/* Desktop View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-800">
                      <thead className="bg-slate-950">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Stripe Refund ID
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Original Payment
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Refunded By
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Reason
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Refunded Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                        {refunds.map((refund) => (
                          <tr key={refund._id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                              {new Date(refund.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-[150px]">{refund.stripeRefundId}</span>
                                <button
                                  onClick={() => copyToClipboard(refund.stripeRefundId)}
                                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                              <Link
                                to={`/billing/${refund.payment?._id}`}
                                className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors"
                              >
                                {refund.payment?.stripePaymentIntentId ? (
                                  <span>{refund.payment.stripePaymentIntentId.substring(0, 15)}...</span>
                                ) : (
                                  <span>View Payment</span>
                                )}
                              </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-355">
                              <p className="font-semibold text-white">{refund.refundedBy?.name || 'Owner'}</p>
                              <p className="text-xxs text-slate-500">{refund.refundedBy?.email || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-405 max-w-[180px] truncate" title={refund.refundReason}>
                              {refund.refundReason}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-400 font-bold">
                              -₹{refund.refundAmount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile stacked card view */}
                  <div className="block lg:hidden divide-y divide-slate-850">
                    {refunds.map((refund) => (
                      <div key={refund._id} className="p-4 sm:p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs text-slate-400">
                              {new Date(refund.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            <div className="flex items-center space-x-1.5 mt-1.5 font-mono text-xxs text-slate-500">
                              <span className="truncate max-w-[150px]">{refund.stripeRefundId}</span>
                              <button
                                onClick={() => copyToClipboard(refund.stripeRefundId)}
                                className="p-1 text-slate-505 hover:text-slate-300 rounded hover:bg-slate-800 transition-all cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-rose-455 font-bold font-mono">-₹{refund.refundAmount.toFixed(2)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-850/60 pt-3 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold">Original Payment</p>
                            <Link
                              to={`/billing/${refund.payment?._id}`}
                              className="text-indigo-400 hover:text-indigo-305 underline font-semibold transition-colors mt-1 block truncate max-w-[120px]"
                            >
                              {refund.payment?.stripePaymentIntentId ? (
                                <span>{refund.payment.stripePaymentIntentId.substring(0, 10)}...</span>
                              ) : (
                                <span>View</span>
                              )}
                            </Link>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-505 uppercase font-semibold">Refunded By</p>
                            <p className="font-semibold text-white mt-1">{refund.refundedBy?.name || 'Owner'}</p>
                          </div>
                        </div>

                        {refund.refundReason && (
                          <div className="border-t border-slate-850/60 pt-3 text-xs">
                            <p className="text-[10px] text-slate-505 uppercase font-semibold">Reason</p>
                            <p className="text-slate-400 mt-1 italic">"{refund.refundReason}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        )}

        {/* Refund Reversals Transaction History Logs */}
        {refundTransactions && refundTransactions.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl mt-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              <span>Refund Reversal Wallet Logs</span>
            </h2>
            <div className="space-y-4">
              {refundTransactions.map((tx) => (
                <div key={tx._id} className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-colors">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2 bg-rose-500/10 rounded-xl text-rose-450 mt-0.5 border border-rose-500/20">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {tx.transactionType === 'OwnerReversal' ? 'Owner Share Reversal' : 'Employee Split Reversal'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Stripe Refund: <span className="font-mono">{tx.refund?.stripeRefundId || 'N/A'}</span>
                      </p>
                      {tx.transactionType === 'EmployeeReversal' && user?.role === 'Owner' && (
                        <p className="text-xxs text-slate-400 mt-1">
                          Employee: <span className="font-medium text-slate-300">{tx.employee?.name || 'N/A'}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0 gap-1 border-t sm:border-0 border-slate-850 pt-2 sm:pt-0">
                    <span className="text-sm font-black text-rose-400 font-mono">-₹{tx.amountReversed.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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

export default RevenueDashboard;
