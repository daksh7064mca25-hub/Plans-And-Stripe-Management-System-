import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import PlansList from './pages/PlansList';
import ManagePlans from './pages/ManagePlans';
import Unauthorized from './pages/Unauthorized';
import Checkout from './pages/Checkout';
import PaymentsList from './pages/PaymentsList';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import RevenueSettings from './pages/RevenueSettings';
import RevenueDashboard from './pages/RevenueDashboard';
import PaymentDetails from './pages/PaymentDetails';
import RefundsManagement from './pages/RefundsManagement';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          <Navbar />
          <div className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/plans" element={<PlansList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route element={<ProtectedRoute allowedRoles={['User', 'Admin', 'Owner', 'Employee']} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/checkout/:planId" element={<Checkout />} />
                <Route path="/billing" element={<PaymentsList />} />
                <Route path="/billing/:paymentId" element={<PaymentDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Protected Revenue Sharing Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Owner', 'Admin']} />}>
                <Route path="/admin/revenue-settings" element={<RevenueSettings />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['Owner', 'Employee', 'Admin']} />}>
                <Route path="/revenue-dashboard" element={<RevenueDashboard />} />
              </Route>

              {/* Protected Owner-Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Owner']} />}>
                <Route path="/owner/refunds" element={<RefundsManagement />} />
              </Route>

              {/* Protected Admin-Only Routes */}
              <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminPanel />} />
                <Route path="/admin/plans" element={<ManagePlans />} />
              </Route>

              {/* Redirect any other path to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
