import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  // Show loading state if auth is still being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not authorized for this route, redirect to appropriate dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'client':
        return <Navigate to="/client" replace />;
      case 'employee':
        return <Navigate to="/employee" replace />;
      case 'prepress':
        return <Navigate to="/prepress" replace />;
      case 'manager':
      case 'admin':
        return <Navigate to="/manager" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // If authenticated and authorized, render the children
  return children;
};

export default ProtectedRoute;