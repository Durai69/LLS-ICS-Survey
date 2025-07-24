import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface DepartmentPerformance {
  name: string;
  super_overall: number;
}

interface AdminDashboardStats {
  total_surveys_assigned: number;
  total_surveys_submitted: number;
  surveys_not_submitted: number;
  department_performance: DepartmentPerformance[];
  below_80_departments: string[];
  survey_attendance_stats?: {
    on_time: number;
    late: number;
    missed: number;
  };
  attendance_departments?: {
    on_time_departments: string[];
    late_departments: string[];
    missed_departments: string[];
    missed_count: number;
  };
}

interface AdminDashboardContextType {
  stats: AdminDashboardStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined);

export const AdminDashboardProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/dashboard/admin-stats', { withCredentials: true });
      const attendanceRes = await axios.get('/api/dashboard/attendance-departments', { withCredentials: true });
      setStats(Object.assign({}, res.data, { attendance_departments: attendanceRes.data }) as AdminDashboardStats);
    } catch (err: any) {
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchStats();
    }
  }, [isAuthenticated, isLoading]);

  return (
    <AdminDashboardContext.Provider value={{ stats, loading, error, refresh: fetchStats }}>
      {children}
    </AdminDashboardContext.Provider>
  );
};

export const useAdminDashboard = () => {
  const ctx = useContext(AdminDashboardContext);
  if (!ctx) throw new Error('useAdminDashboard must be used within AdminDashboardProvider');
  return ctx;
};