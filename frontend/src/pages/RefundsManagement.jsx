import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  PlusCircle,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingDown,
  Users,
  X,
  Eye,
  Copy,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

const RefundsManagement = () => {
  const { user } = useContext(AuthContext);

  const [refunds, setRefunds] = useState([]);
  const [payments, setPayments] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');

  // Modals State
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showInitiateModal, setShowInitiateModal] = useState(false);

  // Initiate Refund Form State
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [refundType, setRefundType] = useState('Full'); 
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchRefunds = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/refunds');
      setRefunds(res.data.refunds || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch refunds');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchSuccessfulPayments = async () => {
    try {
      const res = await api.get('/payments/history?limit=1000');
      const eligible = (res.data.payments || []).filter(
        (p) => p.status === 'Succeeded' && p.refundStatus !== 'Full'
      );
      setPayments(eligible);
    } catch (err) {
      console.error('Failed to load eligible payments:', err);
    }
  };

  useEffect(() => {
    fetchRefunds();
    fetchSuccessfulPayments();
  }, []);

  useEffect(() => {
    if (selectedPaymentId) {
      const p = payments.find((x) => x._id === selectedPaymentId);
      if (p) {
        const remaining = p.amount - (p.refundedAmount || 0);
        if (refundType === 'Full') {
          setRefundAmount(remaining.toFixed(2));
        } else {
          setRefundAmount('');
        }
      }
    }
  }, [selectedPaymentId, refundType, payments]);

  const handleInitiateRefundSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPaymentId) {
      toast.error('Please select a payment');
      return;
    }

    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    setSubmittingRefund(true);
    try {
      const res = await api.post('/refunds', {
        paymentId: selectedPaymentId,
        amount: amountNum,
        reason: refundReason,
      });

      toast.success(res.data.message || 'Refund successfully created!');
      setShowInitiateModal(false);
      setSelectedPaymentId('');
      setRefundAmount('');
      setRefundReason('');
      
      fetchRefunds();
      fetchSuccessfulPayments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Refund failed to process');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Filter Logic
  const filteredRefunds = refunds.filter((ref) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      ref.stripeRefundId?.toLowerCase().includes(query) ||
      ref.stripePaymentIntentId?.toLowerCase().includes(query) ||
      ref.payment?.userId?.name?.toLowerCase().includes(query) ||
      ref.payment?.userId?.email?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' || ref.refundStatus.toLowerCase() === statusFilter.toLowerCase();

    const uQuery = userFilter.toLowerCase();
    const matchesUser =
      !userFilter ||
      ref.payment?.userId?.name?.toLowerCase().includes(uQuery) ||
      ref.payment?.userId?.email?.toLowerCase().includes(uQuery);

    const matchesMinAmount = !minAmount || ref.refundAmount >= parseFloat(minAmount);

    if (dateFilter === 'all') return matchesSearch && matchesStatus && matchesUser && matchesMinAmount;
    
    const refDate = new Date(ref.createdAt);
    const now = new Date();
    let matchesDate = false;

    if (dateFilter === 'today') {
      matchesDate = refDate.toDateString() === now.toDateString();
    } else if (dateFilter === '7days') {
      const diffTime = Math.abs(now - refDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays <= 7;
    } else if (dateFilter === '30days') {
      const diffTime = Math.abs(now - refDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesStatus && matchesUser && matchesMinAmount && matchesDate;
  });

  const totalRefundedSum = filteredRefunds
    .filter((r) => r.refundStatus === 'succeeded')
    .reduce((sum, r) => sum + r.refundAmount, 0);

  const totalRefundCount = filteredRefunds.length;
  const avgRefundSize = totalRefundCount > 0 ? (totalRefundedSum / totalRefundCount) : 0;
  
  const uniqueCustomersCount = new Set(
    filteredRefunds.map((r) => r.payment?.userId?._id).filter(Boolean)
  ).size;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-350">
        <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Loading Refund Records...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Refund Management
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage stripe refunds, filter transactions, and monitor platform split reversals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchRefunds}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2.5 bg-slate-900 border border-slate-800 text-sm font-semibold text-slate-350 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Sync Lists
            </button>
            {user?.role === 'Owner' && (
              <button
                onClick={() => setShowInitiateModal(true)}
                className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white rounded-2xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Initiate Refund
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md flex items-center space-x-4">
            <div className="p-3.5 bg-rose-500/10 rounded-2xl text-rose-450 border border-rose-500/20">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-medium uppercase tracking-wider">Total Refunded</p>
              <p className="text-xl font-black text-white mt-1">₹{totalRefundedSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md flex items-center space-x-4">
            <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-455 font-medium uppercase tracking-wider">Total Count</p>
              <p className="text-xl font-black text-white mt-1">{totalRefundCount} Refunds</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md flex items-center space-x-4">
            <div className="p-3.5 bg-amber-500/10 rounded-2xl text-amber-405 border border-amber-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-medium uppercase tracking-wider">Avg Refund Size</p>
              <p className="text-xl font-black text-white mt-1">₹{avgRefundSize.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md flex items-center space-x-4">
            <div className="p-3.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-450 font-medium uppercase tracking-wider">Unique Customers</p>
              <p className="text-xl font-black text-white mt-1">{uniqueCustomersCount} Users</p>
            </div>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-350 flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
              <span>Search & Filter Toolbar</span>
            </h3>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('all');
                setUserFilter('');
                setMinAmount('');
              }}
              className="text-xs text-slate-400 hover:text-indigo-405 transition-colors font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Stripe ID, Customer Name, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 pl-10 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-550 focus:outline-none focus:border-indigo-550 transition-all"
              />
            </div>

            {/* Status Select */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-sm text-slate-350 focus:outline-none focus:border-indigo-550 transition-all cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="succeeded">Status: Succeeded</option>
                <option value="pending">Status: Pending</option>
                <option value="failed">Status: Failed</option>
              </select>
            </div>

            {/* Date Select */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-sm text-slate-350 focus:outline-none focus:border-indigo-550 transition-all cursor-pointer"
              >
                <option value="all">Date: All Time</option>
                <option value="today">Date: Today</option>
                <option value="7days">Date: Last 7 Days</option>
                <option value="30days">Date: Last 30 Days</option>
              </select>
            </div>

            {/* User Search Input */}
            <div>
              <input
                type="text"
                placeholder="Customer Name/Email..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-550 transition-all"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/40 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs text-slate-400">Min Amount:</span>
            <input
              type="number"
              placeholder="Min amount (e.g. 500)"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-40 bg-slate-955 border border-slate-850 px-3 py-1.5 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-550"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-md overflow-hidden">
          {filteredRefunds.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              <ShieldAlert className="h-10 w-10 text-slate-700 mx-auto mb-3" />
              No refund transactions found matching current filter values.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900/80">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Stripe Refund ID
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Refund Amount
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 bg-slate-900/20">
                    {filteredRefunds.map((refund) => (
                      <tr key={refund._id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-350">
                          {new Date(refund.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}{' '}
                          <span className="text-slate-550 font-mono text-xs">
                            {new Date(refund.createdAt).toLocaleTimeString(undefined, {
                              timeStyle: 'short',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                          {refund.stripeRefundId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          <p className="font-semibold text-white">{refund.payment?.userId?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500">{refund.payment?.userId?.email || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${
                              refund.refundType === 'Full'
                                ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            }`}
                          >
                            {refund.refundType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-450 font-bold">
                          ₹{refund.refundAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              refund.refundStatus === 'succeeded'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                                : 'bg-slate-800 text-slate-450 border border-slate-700'
                            }`}
                          >
                            {refund.refundStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => setSelectedRefund(refund)}
                            className="inline-flex items-center px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked card view */}
              <div className="block lg:hidden divide-y divide-slate-850">
                {filteredRefunds.map((refund) => (
                  <div key={refund._id} className="p-4 sm:p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-slate-450">
                          {new Date(refund.createdAt).toLocaleDateString(undefined, {
                            dateStyle: 'medium',
                          })}{' '}
                          <span className="text-slate-550 font-mono text-xxs">
                            {new Date(refund.createdAt).toLocaleTimeString(undefined, {
                              timeStyle: 'short',
                            })}
                          </span>
                        </p>
                        <p className="font-mono text-xxs text-slate-500 mt-1 truncate max-w-[150px] sm:max-w-xs" title={refund.stripeRefundId}>
                          ID: {refund.stripeRefundId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          refund.refundStatus === 'succeeded'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                            : 'bg-slate-800 text-slate-450 border border-slate-700'
                        }`}
                      >
                        {refund.refundStatus}
                      </span>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3">
                      <p className="text-[10px] text-slate-550 uppercase font-semibold">Customer</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{refund.payment?.userId?.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-400">{refund.payment?.userId?.email || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-850/60 pt-3 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-550 uppercase font-semibold">Refund Type</p>
                        <span
                          className={`inline-flex px-2 py-0.5 mt-1 rounded text-xxs font-semibold border ${
                            refund.refundType === 'Full'
                              ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}
                        >
                          {refund.refundType}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-550 uppercase font-semibold">Refunded Amount</p>
                        <p className="text-base font-bold text-rose-400 mt-0.5">₹{refund.refundAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-850/60 pt-3 flex justify-end">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-800 w-full sm:w-auto"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Refund Details Modal */}
        {selectedRefund && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl relative space-y-6">
              
              <button
                onClick={() => setSelectedRefund(null)}
                className="absolute right-5 top-5 p-1 text-slate-405 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <span>Refund Transaction Details</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">Stripe Refund ID: {selectedRefund.stripeRefundId}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-800 pb-5">
                <div>
                  <span className="text-slate-500 text-xs font-medium">Refund Amount</span>
                  <p className="text-xl font-black text-rose-400 mt-0.5">₹{selectedRefund.refundAmount.toFixed(2)} INR</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Refund Type</span>
                  <p className="text-sm font-semibold text-white mt-1">{selectedRefund.refundType} Refund</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Original Payment Intent</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-xs font-mono text-slate-350 select-all bg-slate-950 py-1 px-2 rounded border border-slate-850 inline-block truncate max-w-[170px]">
                      {selectedRefund.stripePaymentIntentId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedRefund.stripePaymentIntentId)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-850 cursor-pointer"
                    >
                      <Copy className="h-3 w-3 text-slate-405" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Date & Time</span>
                  <p className="text-sm font-semibold text-white mt-1">
                    {new Date(selectedRefund.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Customer Details</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedRefund.payment?.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{selectedRefund.payment?.userId?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-medium">Refund Triggered By</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedRefund.refundedBy?.name || 'Owner'}</p>
                  <p className="text-xs text-slate-500">{selectedRefund.refundedBy?.email || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 text-xs font-medium">Reason</span>
                  <p className="text-sm font-semibold text-white mt-1 italic">"{selectedRefund.refundReason}"</p>
                </div>
              </div>

              {/* Revenue Reversal Summary Card */}
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                  <span>Revenue Reversal Summary</span>
                  <span className="text-xxs uppercase bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded font-semibold border border-rose-500/20">
                    Distribution Mode: {selectedRefund.distributionMode}
                  </span>
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-850">
                    <span className="text-slate-400">Total Revenue Reversed:</span>
                    <span className="font-bold text-rose-450">-₹{selectedRefund.refundAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between py-1 border-b border-slate-850/60">
                    <span className="text-slate-400">Owner Share Reversal:</span>
                    <span className="font-bold text-rose-450">-₹{Math.abs(selectedRefund.ownerShareReversal).toFixed(2)}</span>
                  </div>

                  {selectedRefund.employeeShareTotalReversal !== undefined && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Employee Share Reversal Total:</span>
                      <span className="font-bold text-rose-450">-₹{Math.abs(selectedRefund.employeeShareTotalReversal).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Individual Split List */}
                {selectedRefund.reversalSplits && selectedRefund.reversalSplits.length > 0 && (
                  <div className="pt-2 border-t border-slate-850 space-y-2">
                    <p className="text-xxs uppercase font-semibold text-slate-400 tracking-wider">Affected Wallets Deductions</p>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {selectedRefund.reversalSplits.map((split, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-900/60 py-1.5 px-3 rounded-lg border border-slate-850/40">
                          <div>
                            <span className="font-semibold text-slate-200">{split.userName}</span>{' '}
                            <span className="text-xxs text-slate-405">({split.role})</span>
                          </div>
                          <span className="font-bold text-rose-400 font-mono">-₹{Math.abs(split.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Link
                  to={`/billing/${selectedRefund.payment?._id}`}
                  className="inline-flex items-center px-4 py-2.5 bg-slate-900 border border-slate-850 text-xs font-bold text-indigo-400 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Go to Payment Details
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Link>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="px-4 py-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-350 rounded-xl transition-all cursor-pointer"
                >
                  Close details
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Initiate Refund Modal */}
        {showInitiateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl relative space-y-6">
              
              <button
                onClick={() => setShowInitiateModal(false)}
                className="absolute right-5 top-5 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h3 className="text-xl font-bold text-white">Initiate New Refund</h3>
                <p className="text-xs text-slate-400 mt-1">Submit a full or partial refund to Stripe and reverse platform revenue sharing splits.</p>
              </div>

              <form onSubmit={handleInitiateRefundSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Active Payment</label>
                  <select
                    value={selectedPaymentId}
                    onChange={(e) => setSelectedPaymentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-indigo-550 transition-all cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Successful Payment --</option>
                    {payments.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.userId?.name || 'User'} - ₹{p.amount.toFixed(2)} ({p.stripePaymentIntentId?.substring(0, 14)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Refund Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRefundType('Full')}
                      className={`py-3 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                        refundType === 'Full'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold'
                          : 'bg-slate-950 border-slate-850 text-slate-405 font-medium'
                      }`}
                    >
                      Full Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefundType('Partial')}
                      className={`py-3 rounded-2xl text-sm font-bold border transition-all cursor-pointer ${
                        refundType === 'Partial'
                          ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold'
                          : 'bg-slate-950 border-slate-850 text-slate-405 font-medium'
                      }`}
                    >
                      Partial Refund
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-30-0 uppercase tracking-wider mb-2">Refund Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={refundAmount}
                    disabled={refundType === 'Full'}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-550 disabled:opacity-60 transition-all"
                    required
                  />
                  {selectedPaymentId && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Max refundable: ₹{
                        (payments.find(x => x._id === selectedPaymentId)?.amount - 
                         (payments.find(x => x._id === selectedPaymentId)?.refundedAmount || 0)).toFixed(2)
                      }
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. customer_request, duplicate, fraud"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 px-4 py-3 rounded-2xl text-sm text-white focus:outline-none focus:border-indigo-550 transition-all"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowInitiateModal(false)}
                    className="px-5 py-3 bg-slate-950 hover:bg-slate-850 text-sm font-semibold text-slate-400 rounded-2xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRefund}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white rounded-2xl cursor-pointer disabled:opacity-50 inline-flex items-center"
                  >
                    {submittingRefund ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Initiate Refund'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RefundsManagement;
