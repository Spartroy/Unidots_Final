import axios from 'axios';

// Create axios instance with base URL
// Normalize REACT_APP_API_URL. If not provided, use '' in production (Vercel proxy) and localhost in dev.
const normalizeBaseUrl = (value) => {
  if (!value) return null;
  let url = String(value).trim();
  // Add scheme if missing
  if (!/^https?:\/\//i.test(url)) {
    // If it looks like a relative path, return as-is (let Vercel proxy handle it)
    if (url.startsWith('/')) return url;
    url = `https://${url}`;
  }
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  // Remove trailing /api to avoid duplication when callers use '/api/...'
  url = url.replace(/\/api$/i, '');
  return url;
};

const explicitBaseUrl = normalizeBaseUrl(process.env.REACT_APP_API_URL);
const API_URL = explicitBaseUrl ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

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

// Global response interceptor: handle 401/403 by clearing user and redirecting to login
api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('user');
      } catch (_) {}
      // Avoid infinite loops if already on login
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api; 