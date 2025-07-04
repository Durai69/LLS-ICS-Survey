import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Adjust path if necessary

interface ProtectedRouteProps {
  // You can add roles here if needed, e.g., allowedRoles?: string[];
  children?: React.ReactNode; // For wrapping components
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth(); // Get auth state from context

  if (isLoading) {
    // You might want to render a loading spinner here
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to the login page
    return <Navigate to="/" replace />; // Redirect to "/" which is your login page
  }

  // User is authenticated, render the children or the Outlet (if used in a parent route)
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
