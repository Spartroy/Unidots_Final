import axios from 'axios';

// Create axios instance with base URL
const API_URL = 'http://localhost:4000';

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