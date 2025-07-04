import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();

  // Redirect to /dashboard if user is logged in, else to /login
  return <Navigate to={user ? "/dashboard" : "/login"} />;
};

export default Index;
