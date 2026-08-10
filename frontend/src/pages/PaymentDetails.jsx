import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  CreditCard,
  ArrowLeft,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CornerDownRight,
  Shield,
  Tag,
  DollarSign,
  Percent
} from 'lucide-react';

const PaymentDetails = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [payment, setPayment] = useState(null);
  const [refunds, setRefunds] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Refund Form State
  const [refundType, setRefundType] = useState('full'); // 'full' or 'partial'
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSyncStatus = async () => {
    setSyncing(true);
    try {
      const res = await api.post(`/payments/${paymentId}/sync`);
      toast.success(res.data.message || 'Status synchronized with Stripe');
      setPayment(res.data.payment);
      setRefunds(res.data.refunds || []);
      setDistribution(res.data.distribution || null);
      
      // Update refund amount preset
      const remaining = res.data.payment.amount - (res.data.payment.refundedAmount || 0);
      setRefundAmount(remaining.toFixed(2));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Synchronization failed');
    } finally {
      setSyncing(false);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payments/${paymentId}`);
      setPayment(res.data.payment);
      setRefunds(res.data.refunds || []);
      setDistribution(res.data.distribution || null);
      
      // Pre-fill amount for full refund or if partial is selected later
      const remaining = res.data.payment.amount - (res.data.payment.refundedAmount || 0);
      setRefundAmount(remaining.toFixed(2));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payment details');
      navigate('/billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  // Sync refund amount when type changes
  useEffect(() => {
    if (payment) {
      const remaining = payment.amount - (payment.refundedAmount || 0);
      if (refundType === 'full') {
        setRefundAmount(remaining.toFixed(2));
      } else {
        setRefundAmount('');
      }
    }
  }, [refundType, payment]);

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    
    const amountNum = parseFloat(refundAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive refund amount');
      return;
    }

    const remaining = payment.amount - (payment.refundedAmount || 0);
    if (amountNum > remaining + 0.001) {
      toast.error(`Refund amount cannot exceed remaining refundable balance of ₹${remaining.toFixed(2)}`);
      return;
    }

    setShowConfirmModal(true);
  };

  const executeRefund = async () => {
    setShowConfirmModal(false);
    setSubmittingRefund(true);
    try {
      const res = await api.post('/refunds', {
        paymentId: payment._id,
        amount: parseFloat(refundAmount),
        reason: refundReason || 'requested_by_customer',
      });
      toast.success(res.data.message || 'Refund successfully issued!');
      setRefundReason('');
      setRefundType('full');
      // Reload payment details
      await fetchPaymentDetails();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!payment) return null;

  const remainingRefundable = payment.amount - (payment.refundedAmount || 0);

  return (
    <div className="bg-slate-955 text-slate-100 min-h-[calc(100vh-73px)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          to="/billing"
          className="inline-flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Billing History</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center space-x-3">
              <CreditCard className="h-8 w-8 text-indigo-500" />
              <span>Transaction Details</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Secure record ID: <span className="font-mono text-slate-300">{payment._id}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncStatus}
              disabled={syncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync Status</span>
            </button>
            <span
              className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                payment.status === 'Succeeded'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-red-500/10 text-red-400 border-red-500/25'
              }`}
            >
              Payment: {payment.status}
            </span>
            {payment.refundStatus && payment.refundStatus !== 'None' && (
              <span
                className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  payment.refundStatus === 'Full'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}
              >
                Refund: {payment.refundStatus === 'Full' ? 'Fully Refunded' : 'Partially Refunded'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Refund Alert Banner */}
            {payment.refundStatus === 'Partial' && (
              <div className="bg-amber-500/10 border border-amber-550/20 text-amber-400 p-5 rounded-3xl text-sm flex items-start space-x-3.5 shadow-md">
                <AlertCircle className="h-5.5 w-5.5 mt-0.5 flex-shrink-0 text-amber-400" />
                <div>
                  <p className="font-bold text-amber-300">Partial Refund Active</p>
                  <p className="text-xs text-slate-400 mt-1">
                    This transaction has been partially refunded. The remaining refundable balance is <span className="font-bold text-white">₹{remainingRefundable.toFixed(2)} INR</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Overview Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-md">
              <h2 className="text-xl font-bold text-white mb-6">Payment Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Plan Subscribed</p>
                  <p className="text-lg font-bold text-white mt-1 capitalize">
                    {payment.planId?.name || 'Deleted Plan'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Billing Period</p>
                  <p className="text-base font-semibold text-slate-350 mt-1 capitalize">
                    {payment.billingPeriod}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Charge Amount</p>
                  <p className="text-2xl font-extrabold text-white mt-1">₹{payment.amount.toFixed(2)} INR</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Remaining Refundable</p>
                  <p className="text-lg font-bold text-indigo-400 mt-1">₹{remainingRefundable.toFixed(2)} INR</p>
                </div>
                {payment.refundedAmount > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Refunded Amount</p>
                    <p className="text-lg font-bold text-rose-400 mt-1">₹{payment.refundedAmount.toFixed(2)} INR</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Distribution Card */}
            {distribution && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-md">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-indigo-400" />
                  <span>Revenue Sharing Split Details</span>
                </h2>
                <div className="bg-slate-950 rounded-2xl p-5 border border-slate-850 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-850 pb-3">
                    <div>
                      <span className="text-slate-500 font-medium uppercase tracking-wider">Total Distributed</span>
                      <p className="text-base font-extrabold text-white mt-0.5">₹{distribution.amount.toFixed(2)} INR</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium uppercase tracking-wider">Distribution Mode</span>
                      <p className="text-base font-extrabold text-indigo-400 mt-0.5 capitalize">{distribution.mode} Split</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Recipient Splits Breakdown</p>
                    <div className="space-y-2">
                      {distribution.splits.map((split, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs bg-slate-900/40 p-3.5 rounded-xl border border-slate-850/60"
                        >
                          <div>
                            <p className="font-semibold text-slate-200">
                              {split.userId?.name || 'Deleted User'}{' '}
                              {split.userId?._id === user?._id && (
                                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md font-bold ml-1">You</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{split.userId?.email || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">+₹{split.amount.toFixed(2)}</span>
                            <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">{split.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-md">
              <h2 className="text-xl font-bold text-white mb-6">Stripe & Customer Info</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3.5">
                  <User className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Customer Details</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {payment.userId?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500">{payment.userId?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 border-t border-slate-800/80 pt-4">
                  <Calendar className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Payment Date & Time</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {new Date(payment.paymentDate).toLocaleString(undefined, {
                        dateStyle: 'long',
                        timeStyle: 'medium',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 border-t border-slate-800/80 pt-4">
                  <Clock className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Stripe Payment Intent ID</p>
                    <p className="text-xs font-mono text-slate-350 mt-1 select-all bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800 inline-block">
                      {payment.stripePaymentIntentId}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Refund History Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-md">
              <h2 className="text-xl font-bold text-white mb-6">Refund Transaction History</h2>
              {refunds.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <AlertCircle className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                  No refund attempts recorded for this payment.
                </div>
              ) : (
                <div className="space-y-4">
                  {refunds.map((refund, idx) => (
                    <div
                      key={refund._id}
                      className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <CornerDownRight className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-rose-400">₹{refund.refundAmount.toFixed(2)} Refund</span>
                            <span className="text-[10px] uppercase bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded font-semibold border border-rose-500/20">
                              {refund.refundStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Reason: {refund.refundReason}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Issued by: {refund.refundedBy?.name || 'Owner'} ({refund.refundedBy?.email || 'N/A'})
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">Stripe Ref: {refund.stripeRefundId}</p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-slate-500 flex-shrink-0">
                        {new Date(refund.createdAt).toLocaleString(undefined, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Refund Panel (Owner only) */}
          <div className="lg:col-span-1">
            {user?.role === 'Owner' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-md sticky top-24">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-rose-500" />
                  <span>Owner Actions</span>
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  As the Owner, you can process partial or full refunds. The requested amount will be processed back to the original Stripe checkout instrument.
                </p>

                {remainingRefundable <= 0.01 ? (
                  <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-rose-300">Fully Refunded</p>
                    <p className="text-xxs text-slate-500 mt-1">No remaining refundable balance.</p>
                  </div>
                ) : (
                  <form onSubmit={handleRefundSubmit} className="space-y-4">
                    {/* Refund Type */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Refund Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setRefundType('full')}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            refundType === 'full'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-md shadow-rose-950/20'
                              : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          Full Refund
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefundType('partial')}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                            refundType === 'partial'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-md shadow-rose-950/20'
                              : 'bg-slate-850 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          Partial Refund
                        </button>
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Refund Amount (INR)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
                          ₹
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={remainingRefundable}
                          disabled={refundType === 'full'}
                          className="w-full pl-7 pr-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-mono"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          required
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Max refundable: ₹{remainingRefundable.toFixed(2)}
                      </span>
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Reason for Refund
                      </label>
                      <textarea
                        rows="2"
                        className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all resize-none"
                        placeholder="e.g. customer requested, double payment"
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submittingRefund}
                      className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg shadow-rose-950/20 disabled:opacity-50"
                    >
                      {submittingRefund ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <span>Issue Refund</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-slate-500" />
                  <span>Roles & Privileges</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Only the **Owner** of the platform can initiate refunds.
                </p>
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-slate-500 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-slate-600 flex-shrink-0" />
                  <span>Your current role is: <strong className="text-slate-400 capitalize">{user?.role}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h4 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <span>Confirm Refund Request</span>
            </h4>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to issue a refund of <strong className="text-white">₹{parseFloat(refundAmount).toFixed(2)} INR</strong>? This operation will interact with the Stripe gateway and is irreversible.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeRefund}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer"
              >
                Yes, Issue Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
