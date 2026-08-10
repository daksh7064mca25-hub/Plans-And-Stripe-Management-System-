import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { CreditCard, Search, ArrowLeft, ArrowRight, RefreshCw, Layers } from 'lucide-react';

const PaymentsList = () => {
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query to prevent excessive API requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on search
    }, 4500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments/history', {
        params: {
          page,
          limit,
          status: statusFilter,
          search: debouncedSearch,
        },
      });
      setPayments(res.data.payments);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery);
    setPage(1);
  };

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center space-x-3">
            <CreditCard className="h-8 w-8 text-indigo-500" />
            <span>Billing & Transaction History</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {user?.role === 'Admin'
              ? 'Administration View: Monitor and search global user subscriptions.'
              : 'Review your pricing plans, transaction dates, and invoices.'}
          </p>
        </div>

        {/* Filters and Search row */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              placeholder={
                user?.role === 'Admin'
                  ? 'Search by User Name or Email...'
                  : 'Search transaction records...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-500" />
            </div>
          </form>

          {/* Filters */}
          <div className="flex w-full md:w-auto items-center gap-3 justify-between sm:justify-end">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Filter Status:
            </span>
            <select
              className="bg-slate-850 border border-slate-700 rounded-xl text-white py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer w-full sm:w-auto"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Transactions</option>
              <option value="Succeeded">Succeeded</option>
              <option value="Failed">Failed</option>
            </select>

            <button
              onClick={fetchPayments}
              className="p-2.5 bg-slate-850 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reload data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            No payments found matching the selected filters.
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Desktop View */}
            <div className="hidden lg:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-850 border-b border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                      {user?.role === 'Admin' && <th className="py-4 px-6">User</th>}
                      <th className="py-4 px-6">Plan Name</th>
                      <th className="py-4 px-6">Billing Cycle</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Payment Date</th>
                      <th className="py-4 px-6">Stripe ID</th>
                      <th className="py-4 px-6 text-right">Status</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {payments.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-850/20 transition-colors">
                        {user?.role === 'Admin' && (
                          <td className="py-4 px-6">
                            <p className="font-semibold text-white">{item.userId?.name || 'Deleted User'}</p>
                            <p className="text-xs text-slate-500">{item.userId?.email || 'N/A'}</p>
                          </td>
                        )}
                        <td className="py-4 px-6 font-semibold text-white flex items-center space-x-1.5">
                          <Layers className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                          <span>{item.planId?.name || 'Deleted Plan'}</span>
                        </td>
                        <td className="py-4 px-6 capitalize text-slate-350">{item.billingPeriod}</td>
                        <td className="py-4 px-6 font-mono font-bold text-white">₹{item.amount.toFixed(2)} INR</td>
                        <td className="py-4 px-6 text-slate-400">
                          {new Date(item.paymentDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-500" title={item.stripePaymentIntentId}>
                          {item.stripePaymentIntentId.startsWith('sim_')
                            ? item.stripePaymentIntentId.substring(0, 15) + '...'
                            : item.stripePaymentIntentId}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${
                                item.status === 'Succeeded'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : 'bg-red-500/10 text-red-400 border-red-500/25'
                              }`}
                            >
                               {item.status}
                            </span>
                            {item.refundStatus && item.refundStatus !== 'None' && (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  item.refundStatus === 'Full'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                }`}
                              >
                                {item.refundStatus === 'Full' ? 'Fully Refunded' : 'Partially Refunded'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            to={`/billing/${item._id}`}
                            className="inline-flex px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Stacked View */}
            <div className="block lg:hidden space-y-4">
              {payments.map((item) => (
                <div key={item._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
                        <h3 className="font-semibold text-white text-base leading-tight">{item.planId?.name || 'Deleted Plan'}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 capitalize">{item.billingPeriod} Billing Cycle</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${
                          item.status === 'Succeeded'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-red-500/10 text-red-400 border-red-500/25'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.refundStatus && item.refundStatus !== 'None' && (
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.refundStatus === 'Full'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                          }`}
                        >
                          {item.refundStatus === 'Full' ? 'Fully Refunded' : 'Partially Refunded'}
                        </span>
                      )}
                    </div>
                  </div>

                  {user?.role === 'Admin' && (
                    <div className="border-t border-slate-850 pt-3">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">User</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{item.userId?.name || 'Deleted User'}</p>
                      <p className="text-xs text-slate-400">{item.userId?.email || 'N/A'}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Amount</p>
                      <p className="font-mono font-bold text-white mt-0.5">₹{item.amount.toFixed(2)} INR</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Payment Date</p>
                      <p className="text-slate-305 mt-0.5">
                        {new Date(item.paymentDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-3 flex justify-between items-center text-xs">
                    <div className="truncate max-w-[170px] sm:max-w-xs">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Stripe ID</span>
                      <span className="font-mono text-slate-455 text-xxs truncate block" title={item.stripePaymentIntentId}>
                        {item.stripePaymentIntentId}
                      </span>
                    </div>
                    <Link
                      to={`/billing/${item._id}`}
                      className="inline-flex px-4 py-2 bg-slate-850 hover:bg-slate-800 text-indigo-400 hover:text-indigo-305 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && pages > 1 && (
          <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl">
            <span className="text-xs text-slate-400 font-medium">
              Showing page <strong className="text-white">{page}</strong> of{' '}
              <strong className="text-white">{pages}</strong> ({total} total records)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsList;
