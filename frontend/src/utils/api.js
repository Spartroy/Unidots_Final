import axios from 'axios';

// Create axios instance with base URL
// In production on Vercel, we default to relative '/api' so Vercel routes proxy to Railway.
const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

const api = axios.create({
  baseURL: API_URL
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  config => {
    const user = localStorage.getItem('user');
    if (user) {
      const { token } = JSON.parse(user);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api; 