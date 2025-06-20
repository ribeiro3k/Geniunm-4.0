
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CurrentUserType } from '../types'; // Updated to CurrentUserType

interface ProtectedRouteProps {
  user: CurrentUserType; 
  redirectPath?: string;
  children?: React.ReactNode; 
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, redirectPath = '/home', children }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // Specific logic for admin-only routes can be handled here or by wrapping specific routes
  // For now, this just checks if a user exists. Type-specific checks are in App.tsx routing.
  
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
