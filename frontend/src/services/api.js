import axios from 'axios';

const api = axios.create({
  baseURL: 'https://plans-and-stripe-management-system.onrender.com',
  withCredentials: true, // Crucial for HTTP-only cookies
});

// Add request interceptor to attach JWT token if it exists in localStorage
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
