import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import api from '../services/api';
import CheckoutForm, { MockCheckoutForm } from '../components/CheckoutForm';
import { toast } from 'react-toastify';
import { ArrowLeft, ShieldCheck, HelpCircle, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const billingPeriod = searchParams.get('period') || 'monthly';
  const navigate = useNavigate();

  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripeConfigError, setStripeConfigError] = useState(false);

  useEffect(() => {
    // 1. Initialize Stripe JS promise with client key
    const pubKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_publishable_key';
    setStripePromise(loadStripe(pubKey));

    // 2. Fetch plan details and Stripe PaymentIntent client secret
    const initializeCheckout = async () => {
      try {
        setLoading(true);
        
        // Fetch Plan details
        const planRes = await api.get(`/plans/${planId}`);
        setPlan(planRes.data);

        // Fetch client secret
        const paymentRes = await api.post('/payments/create-intent', {
          planId,
          billingPeriod,
        });
        setClientSecret(paymentRes.data.clientSecret);
        if (paymentRes.data.clientSecret.startsWith('mock_')) {
          setStripeConfigError(true);
        }
      } catch (err) {
        console.error('Checkout initialization failed:', err);
        const errMsg = err.response?.data?.message || '';
        
        // If Stripe keys are unconfigured on server, fall back to simulation mode
        if (errMsg.includes('Stripe is not configured') || errMsg.includes('stripe')) {
          setStripeConfigError(true);
          setClientSecret('mock_secret_key_simulated_for_development');
          toast.warning('Stripe keys not set up on server. Running in Simulation Mode.');
        } else {
          toast.error(errMsg || 'Failed to initialize checkout session.');
          navigate('/plans');
        }
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [planId, billingPeriod, navigate]);

  const handleSuccess = () => {
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-sm text-slate-400">Securing payment connection...</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-955 text-slate-100 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <button
          onClick={() => navigate('/plans')}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-white mb-8 text-sm font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Back to pricing plans</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Order Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Order Summary
            </span>
            <h2 className="text-2xl font-bold text-white mt-4">{plan.name}</h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{plan.description}</p>

            <div className="border-t border-slate-800 my-6 pt-6">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm text-slate-400">Subscription cycle</span>
                <span className="text-sm font-semibold text-white capitalize">{billingPeriod}</span>
              </div>
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-sm text-slate-400">Pricing tier</span>
                <span className="text-sm font-semibold text-white">${price} USD</span>
              </div>
              <div className="flex justify-between items-baseline pt-4 border-t border-slate-850">
                <span className="text-base font-bold text-white">Amount Due</span>
                <span className="text-3xl font-extrabold text-indigo-400">₹{(price * 80).toFixed(2)} INR</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-right">
                * Converted to INR at a fixed sandbox rate of 80 ₹/$.
              </p>
            </div>

            {/* Verification highlights */}
            <div className="bg-slate-850 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-start space-x-2 text-xs text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>SSL Encrypted transactions via Stripe API.</span>
              </div>
              <div className="flex items-start space-x-2 text-xs text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>Zero card numbers are processed on our servers.</span>
              </div>
            </div>
          </div>

          {/* Checkout Elements */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-2">Checkout</h2>
            <p className="text-slate-400 text-xs mb-6">Confirm and authorize your subscription securely.</p>

            {stripeConfigError && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-2.5">
                <HelpCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-300 space-y-1">
                  <p className="font-bold">Sandbox Simulation Mode Active</p>
                  <p className="leading-relaxed">
                    Stripe keys were not detected in `.env`. You can input mock card info or use the simulation button to verify page redirects.
                  </p>
                </div>
              </div>
            )}

            {stripePromise && clientSecret && (
              clientSecret.startsWith('mock_') ? (
                <MockCheckoutForm
                  plan={plan}
                  billingPeriod={billingPeriod}
                  onSuccess={handleSuccess}
                />
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    clientSecret={clientSecret}
                    plan={plan}
                    billingPeriod={billingPeriod}
                    onSuccess={handleSuccess}
                  />
                </Elements>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
