import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const localUser = localStorage.getItem('user');
        if (localUser) {
          const parsedUser = JSON.parse(localUser);
          setUser(parsedUser);
          
          // Verify with backend
          const res = await api.get('/auth/me');
          // Update user state with fresh DB data
          setUser({ ...parsedUser, ...res.data });
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        // Clear local storage if token expired or invalid
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success(`Welcome back, ${res.data.name}!`);
      return res.data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const signup = async (name, email, password, role) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/signup', { name, email, password, role });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success(`Account created successfully! Welcome ${res.data.name}`);
      return res.data;
    } catch (err) {
      // Check if express-validator returned field errors
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach(e => toast.error(e.msg));
      } else {
        const errMsg = err.response?.data?.message || 'Registration failed.';
        toast.error(errMsg);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      toast.info('Logged out successfully.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin: user?.role === 'Admin' }}>
      {children}
    </AuthContext.Provider>
  );
};
