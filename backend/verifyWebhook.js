const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');
const Plan = require('./models/Plan');
const WebhookLog = require('./models/WebhookLog');
const Payment = require('./models/Payment');
const RevenueDistribution = require('./models/RevenueDistribution');

const WEBHOOK_URL = 'http://localhost:5000/api/payments/webhook';
const WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret_value';

// Helper to sign webhook payloads using Stripe's algorithm
const generateStripeSignature = (payloadString, secret) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${payloadString}`;
  const hmac = crypto.createHmac('sha256', secret);
  const signatureHash = hmac.update(signaturePayload).digest('hex');
  return `t=${timestamp},v1=${signatureHash}`;
};

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect('mongodb://127.0.0.1:27017/mern-auth-db');
    console.log('DB Connected.');

    // 1. Fetch test User and Plan
    const user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      console.error('Error: Run browser tests first to create "admin@test.com"');
      process.exit(1);
    }
    console.log(`Found test User: ${user.name} (${user.email}), ID: ${user._id}`);

    // Seed Owner and Employee for testing revenue sharing
    let ownerUser = await User.findOne({ email: 'owner@test.com' });
    if (!ownerUser) {
      ownerUser = await User.create({
        name: 'Owner Test',
        email: 'owner@test.com',
        password: 'password123',
        role: 'Owner',
        walletBalance: 0
      });
      console.log(`Created test Owner: ${ownerUser.email}`);
    } else {
      console.log(`Found test Owner: ${ownerUser.email}`);
    }

    let employeeUser = await User.findOne({ email: 'employee1@test.com' });
    if (!employeeUser) {
      employeeUser = await User.create({
        name: 'Employee One',
        email: 'employee1@test.com',
        password: 'password123',
        role: 'Employee',
        walletBalance: 0
      });
      console.log(`Created test Employee: ${employeeUser.email}`);
    } else {
      console.log(`Found test Employee: ${employeeUser.email}`);
    }

    let plan = await Plan.findOne({});
    if (!plan) {
      // Create a dummy plan for testing
      plan = await Plan.create({
        name: 'Pro Webhook Plan',
        description: 'Webhook testing tier',
        monthlyPrice: 30,
        yearlyPrice: 300,
        features: ['feature 1', 'feature 2'],
      });
      console.log(`Created test Plan: ${plan.name}, ID: ${plan._id}`);
    } else {
      console.log(`Found test Plan: ${plan.name}, ID: ${plan._id}`);
    }

    // --- TEST 1: SUCCESSFUL PAYMENT INTENT ---
    console.log('\n--- Test 1: Sending payment_intent.succeeded with valid signature ---');
    const paymentIntentSucceededEvent = {
      id: `evt_success_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_success_${Date.now()}`,
          amount: 240000,
          currency: 'inr',
          metadata: {
            userId: user._id.toString(),
            planId: plan._id.toString(),
            billingPeriod: 'monthly',
          },
        },
      },
    };

    const successBody = JSON.stringify(paymentIntentSucceededEvent);
    const successSig = generateStripeSignature(successBody, WEBHOOK_SECRET);

    let res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': successSig,
      },
      body: successBody,
    });

    console.log(`Response Status: ${res.status}`);
    const successData = await res.json();
    console.log('Response Body:', successData);

    // Verify DB update
    const updatedUserSuccess = await User.findById(user._id);
    console.log('Updated User Subscription State:', updatedUserSuccess.subscription);
    
    // Verify Webhook Log
    const successLog = await WebhookLog.findOne({ eventId: paymentIntentSucceededEvent.id });
    console.log(`Webhook Log in DB: Found? ${!!successLog}, Status: ${successLog ? successLog.status : 'N/A'}`);

    if (updatedUserSuccess.subscription.status !== 'Active') {
      throw new Error('Test 1 Failed: Subscription status is not "Active"');
    }

    // Verify Revenue Sharing splits allocation
    const createdPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntentSucceededEvent.data.object.id });
    if (createdPayment) {
      const distLog = await RevenueDistribution.findOne({ paymentId: createdPayment._id });
      if (distLog) {
        console.log(`Found Revenue Distribution log: total amount: ₹${distLog.amount}, mode: ${distLog.mode}`);
        console.log(`Owner Share: ₹${distLog.ownerShare}, Employee Share per person: ₹${distLog.employeeSharePerPerson}`);
        const updatedOwner = await User.findOne({ email: 'owner@test.com' });
        const updatedEmployee = await User.findOne({ email: 'employee1@test.com' });
        console.log(`Updated Owner Wallet Balance: ₹${updatedOwner.walletBalance}`);
        console.log(`Updated Employee Wallet Balance: ₹${updatedEmployee.walletBalance}`);
      } else {
        console.error('Warning: Revenue distribution log was not generated.');
      }
    }

    // --- TEST 2: FAILED PAYMENT INTENT ---
    console.log('\n--- Test 2: Sending payment_intent.payment_failed with valid signature ---');
    const paymentIntentFailedEvent = {
      id: `evt_fail_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: `pi_fail_${Date.now()}`,
          amount: 240000,
          currency: 'inr',
          metadata: {
            userId: user._id.toString(),
            planId: plan._id.toString(),
            billingPeriod: 'monthly',
          },
        },
      },
    };

    const failBody = JSON.stringify(paymentIntentFailedEvent);
    const failSig = generateStripeSignature(failBody, WEBHOOK_SECRET);

    res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': failSig,
      },
      body: failBody,
    });

    console.log(`Response Status: ${res.status}`);
    const failData = await res.json();
    console.log('Response Body:', failData);

    // Verify DB update
    const updatedUserFail = await User.findById(user._id);
    console.log('Updated User Subscription State:', updatedUserFail.subscription);

    // Verify Webhook Log
    const failLog = await WebhookLog.findOne({ eventId: paymentIntentFailedEvent.id });
    console.log(`Webhook Log in DB: Found? ${!!failLog}, Status: ${failLog ? failLog.status : 'N/A'}`);

    if (updatedUserFail.subscription.status !== 'Past Due') {
      throw new Error('Test 2 Failed: Subscription status is not "Past Due"');
    }

    // --- TEST 3: INVALID SIGNATURE REJECTION ---
    console.log('\n--- Test 3: Sending webhook with invalid signature ---');
    const test3Event = {
      id: `evt_invalid_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dummy' } },
    };

    const invalidBody = JSON.stringify(test3Event);
    const invalidSig = 't=1234567,v1=bad_hash_value_here';

    const resInvalid = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': invalidSig,
      },
      body: invalidBody,
    });

    if (resInvalid.status === 400) {
      console.log(`Successfully rejected invalid signature. Status: ${resInvalid.status}`);
      console.log(`Server error output: "${await resInvalid.text()}"`);
    } else {
      console.error('Error: Server accepted invalid signature! Test 3 failed. Status:', resInvalid.status);
      process.exit(1);
    }

    console.log('\nAll webhook signature and database verification tests completed successfully!');
  } catch (err) {
    console.error('Test script failure:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('DB Connection closed.');
  }
};

runTest();
