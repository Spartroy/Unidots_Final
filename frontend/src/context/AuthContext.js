import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { getPostLoginPath } from '../utils/roleRoutes';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Load user from localStorage on initial render
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser && parsedUser.token) {
            setUser(parsedUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
          } else {
            localStorage.removeItem('user');
          }
        } catch (e) {
          // Corrupted JSON, clear and continue unauthenticated
          localStorage.removeItem('user');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Login user
  const login = async (email, password, from) => {
    try {
      // NOTE: no global setLoading here. Toggling it unmounts every ProtectedRoute page.
      setError(null);
      
      const response = await api.post('/api/auth/login', { email, password });
      
      // Ensure address is properly structured for old accounts
      if (response.data.role === 'client' && response.data.address) {
        // If address is a string or missing fields, convert to proper structure
        if (typeof response.data.address === 'string') {
          response.data.address = {
            street: response.data.address,
            city: '',
            state: '',
            postalCode: '',
            country: ''
          };
        } else if (!response.data.address.street) {
          // Ensure all address fields exist
          response.data.address = {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: '',
            ...response.data.address
          };
        }
      }
      
      // Ensure phone exists
      if (response.data.role === 'client' && !response.data.phone) {
        response.data.phone = '';
      }
      
      // Save user to state and localStorage
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Set axios default header with token
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Redirect to the page the user originally asked for (if allowed), else their portal home
      redirectBasedOnRole(response.data.role, from);

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during login');
      throw err;
    }
  };

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      
      const response = await api.post('/api/auth/register', userData);
      
      // Save user to state and localStorage
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      // Set axios default header with token
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Redirect based on role
      redirectBasedOnRole(response.data.role);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
        (err.response?.status === 400 ? 'Invalid registration data' :
         err.response?.status === 403 ? 'Not authorized to create this type of account' :
         err.response?.status === 409 ? 'User already exists' :
         'An error occurred during registration');
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout user
  const logout = () => {
    // Remove user from state and localStorage
    setUser(null);
    localStorage.removeItem('user');
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Redirect to login
    navigate('/login');
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      
      const response = await api.put('/api/users/profile', userData);
      
      // Update user in state and localStorage with preserved token
      const token = user.token;
      const updatedUser = { ...response.data, token };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating profile');
      throw err;
    }
  };

  // Helper function to redirect based on role
  const redirectBasedOnRole = (role, from) => {
    navigate(getPostLoginPath(role, from), { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;