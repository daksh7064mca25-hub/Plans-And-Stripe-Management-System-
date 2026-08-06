import React, { useState, useContext } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const CheckoutForm = ({ clientSecret, plan, billingPeriod, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useContext(AuthContext);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const cardElementOptions = {
    style: {
      base: {
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '15px',
        '::placeholder': {
          color: '#64748b', // slate-500
        },
      },
      invalid: {
        color: '#ef4444', // red-500
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.name,
            email: user.email,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error(error.message);
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setSuccess(true);
        toast.success(`Payment successful! You are now subscribed to ${plan.name}.`);
        onSuccess();
      } else {
        setErrorMessage('Payment confirmation failed. Unexpected status: ' + paymentIntent.status);
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during payment processing.');
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="bg-emerald-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Subscription Confirmed</h3>
        <p className="text-slate-400 text-sm">
          Thank you! Your payment for the <strong>{plan.name}</strong> ({billingPeriod}) has been processed successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <CreditCard className="h-4 w-4 text-indigo-400" />
          <span>Card Information</span>
        </label>
        <div className="py-2.5 px-1">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-550 disabled:opacity-50 transition-all cursor-pointer"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Processing Payment...
          </span>
        ) : (
          `Pay ${billingPeriod === 'monthly' ? `$${plan.monthlyPrice}` : `$${plan.yearlyPrice}`} INR`
        )}
      </button>
    </form>
  );
};

export const MockCheckoutForm = ({ plan, billingPeriod, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await api.post('/payments/simulate-payment', {
        planId: plan._id,
        billingPeriod,
      });
      setSuccess(true);
      toast.success(`[Simulation] Payment succeeded for ${plan.name}!`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="bg-emerald-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Subscription Confirmed</h3>
        <p className="text-slate-400 text-sm">
          Thank you! Your payment for the <strong>{plan.name}</strong> ({billingPeriod}) has been processed successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <CreditCard className="h-4 w-4 text-indigo-400" />
          <span>Card Information (Test Sandbox)</span>
        </label>
        <div className="py-2.5 px-1 space-y-3">
          <input
            type="text"
            disabled={isProcessing}
            placeholder="4242 4242 4242 4242 (Test Card Number)"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              disabled={isProcessing}
              placeholder="MM / YY"
              className="w-full px-3 py-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-400 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
            <input
              type="text"
              disabled={isProcessing}
              placeholder="CVC"
              className="w-full px-3 py-2 bg-slate-850 border border-slate-750 rounded-xl text-slate-400 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-550 disabled:opacity-50 transition-all cursor-pointer"
      >
        {isProcessing ? (
          <span className="flex items-center">
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Processing Payment...
          </span>
        ) : (
          `Simulate Successful Payment`
        )}
      </button>
    </form>
  );
};

export default CheckoutForm;
