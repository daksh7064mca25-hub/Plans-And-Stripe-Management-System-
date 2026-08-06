# SaaSFlow StripeGateway & Revenue Sharing System

A production-ready MERN (MongoDB, Express, React, Node.js) application featuring secure Stripe Payment Intent integrations, HMAC webhook signature verifications, a configurable revenue sharing model, wallet ledgers, and role-based analytical dashboards.

---

## 📁 Repository Layout

```text
StripeGateway/
├── backend/
│   ├── config/             # DB Connection configs
│   ├── models/             # Mongoose schemas (User, Plan, Payment, WebhookLog,          RevenueSettings, RevenueDistribution)
│   ├── middleware/         # Auth controllers, async wrappers, centralized error handler
│   ├── services/           # Business logic layer (auth, plans, payments, revenue splits)
│   ├── controllers/        # Express handlers directing traffic to services
│   ├── routes/             # API routing configurations
│   ├── utils/              # Custom response constructs and helpers
│   ├── verifyWebhook.js    # Local signature simulation testing script
│   └── server.js           # Express main mount
└── frontend/
    ├── src/
    │   ├── context/        # Auth status state provider
    │   ├── services/       # Axios instance with auth interceptors
    │   ├── components/     # Protected Route wrapper, Navbar
    │   ├── pages/          # React views (Dashboards, Settings, Profiles, Checkout, ManagePlans)
    │   ├── App.jsx         # Routes mapping
    │   └── main.jsx        # Boot React render
```

---

## 🛠️ Tech Stack

- **Frontend**: React, React Router Dom, Axios, Tailwind CSS, Lucide Icons, React Toastify.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Stripe SDK, express-validator.

---

## 🚀 Key Functional Flows

### 1. Registration & Authorization
- Users register with roles: `User` (Customer), `Admin` (Manager), `Owner` (Business Admin), or `Employee`.
- JWT authentication is secured via **HTTP-only cookies** and authorization restrictions block access to endpoints by role.

### 2. Plans Checkout & Stripe Webhooks
- Customers select monthly or yearly subscriptions which are priced dynamically in INR.
- Successful Stripe confirmations trigger webhook events to `/api/payments/webhook`.
- HMAC-SHA256 headers are verified on the backend, updating the subscription to `'Active'` and triggering the revenue sharing engine.

### 3. Configurable Revenue Sharing
- **Equal Split**: Revenue is split equally among the 1 Owner and all registered Employees.
- **Percentage Split**: Owner receives a configurable percentage (e.g. 70%), and the remaining share (30%) is split equally among employees.
- Wallets are incremented dynamically, and receipts are logged inside the `RevenueDistribution` collection for audits.

---

## 🚦 Getting Started

### 1. Prerequisites
- Install [Node.js](https://nodejs.org) (v16+)
- Install and run [MongoDB](https://www.mongodb.com/try/download/community) locally on port `27017`

### 2. Backend Setup
1. Navigate to `/backend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file containing:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/mern-auth-db
   JWT_SECRET=super_secret_key_123_abc_xyz
   JWT_EXPIRES_IN=30d
   NODE_ENV=development
   STRIPE_SECRET_KEY=mock_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_test_mock_webhook_secret_value
   ```
4. Start backend:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start frontend:
   ```bash
   npm run dev
   ```
4. Open your browser to `http://localhost:5173`

---

## 🧪 E2E Webhook & Splits Verification
To test the Stripe webhook integrations, signature validations, and wallet balance shares without connecting to real Stripe credentials, execute the script inside the `/backend` folder:

```bash
node verifyWebhook.js
```

---

## 🔑 Seeding & Testing Credentials
Use the following credentials to audit the distinct dashboard flows:

| Role | Email | Password | Dashboard Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `password123` | Analytics chart, Manage Plans CRUD, Users List |
| **Owner** | `owner@test.com` | `password123` | Settings Mode splits, Wallet balance history |
| **Employee** | `employee1@test.com` | `password123` | Wallet balance ledger records |
| **User** | `customer123@test.com` | `password123` | Plans pricing list, Checkout elements, active profile |
