import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface DepartmentRating {
  name: string;
  rating: number;
}

interface DashboardContextType {
  departmentRatings: DepartmentRating[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [departmentRatings, setDepartmentRatings] = useState<DepartmentRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/dashboard/department-ratings', { withCredentials: true });
      setDepartmentRatings(res.data as DepartmentRating[]); // <-- Add type assertion here
    } catch (err: any) {
      setError('Failed to load department ratings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchRatings();
    }
  }, [isAuthenticated, isLoading]);

  return (
    <DashboardContext.Provider value={{ departmentRatings, loading, error, refresh: fetchRatings }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
};