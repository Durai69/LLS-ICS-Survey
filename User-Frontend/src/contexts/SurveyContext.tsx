// Assuming your SurveyContext.tsx looks something like this.
// You need to ensure all Axios instances or fetch calls in it send cookies.

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext'; // Assuming you use useAuth to check auth status
import { useToast } from '@/components/ui/use-toast';

// IMPORTANT: Updated API_BASE_URL to include the /api prefix
const API_BASE_URL = 'http://localhost:5000/api'; 

// Configure Axios instance to always send cookies
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Define your interfaces
export interface QuestionData {
  id: number;
  text: string;
  type: 'rating' | 'text' | 'multiple_choice';
  order: number;
  category: string;
  options?: { id: number; text: string; value: string | null }[];
}

export interface SurveyData {
  id: number;
  title: string;
  description: string;
  created_at: string;
  rated_dept_name: string; // The name of the department being rated
  managing_dept_name: string; // The name of the department managing this survey
  rated_department_id: number;
  managing_department_id: number;
  questions: QuestionData[];
}

// Interface for user's own survey submissions (for DepartmentSelection)
export interface UserSubmission {
  id: number;
  survey_id: number;
  submitter_user_id: number;
  submitter_department_id: number;
  rated_department_id: number;
  submitted_at: string;
  overall_customer_rating: number;
  suggestions: string | null;
  submitter_department_name: string;
  rated_department_name: string;
}

// Interfaces for Dashboard Metrics
interface OverallStats {
  totalSurveysSubmitted: number;
  averageOverallRating: number;
  latestSubmissions: {
    responseId: number;
    surveyTitle: string;
    ratedDepartmentName: string;
    overallRating: number;
    submittedBy: string;
    submittedAt: string;
  }[];
}

interface DepartmentMetric {
  department_id: number;
  department_name: string;
  average_rating: number;
  total_surveys: number;
}

interface SurveyContextType {
  currentSurvey: SurveyData | null;
  loading: boolean;
  error: string | null;
  fetchSurveyById: (id: number) => Promise<void>;
  submitSurveyResponse: (surveyId: number, payload: any) => Promise<boolean>;
  surveys: SurveyData[];
  userSubmissions: UserSubmission[];
  isLoadingSurveys: boolean;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export const SurveyProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Get auth state and loading
  const { toast } = useToast();

  const [surveys, setSurveys] = useState<SurveyData[]>([]);
  const [currentSurvey, setCurrentSurvey] = useState<SurveyData | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null); // New state
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetric[]>([]); // New state

  const [isLoadingSurveys, setIsLoadingSurveys] = useState(true); // For general surveys list / user submissions
  const [isLoadingSurveyForm, setIsLoadingSurveyForm] = useState(false); // For single survey fetch
  const [error, setError] = useState<string | null>(null);

  // Fetch all survey templates (for admin or general listing)
  const fetchSurveys = useCallback(async () => {
    setIsLoadingSurveys(true);
    setError(null);
    try {
      // Change this line:
      // const response = await axiosInstance.get<SurveyData[]>('/surveys');
      const response = await axiosInstance.get<SurveyData[]>('/assigned-surveys');
      setSurveys(response.data);
    } catch (err: any) {
      setError('Failed to fetch assigned surveys');
    } finally {
      setIsLoadingSurveys(false);
    }
  }, []);

  // Fetch a single survey template by ID (for SurveyForm)
  const fetchSurveyById = useCallback(async (id: number): Promise<void> => {
    setIsLoadingSurveyForm(true);
    setError(null);
    try {
      // Request path no longer needs /api because it's in the baseURL
      const response = await axiosInstance.get<SurveyData>(`/surveys/${id}`);
      setCurrentSurvey(response.data);
    } catch (err: any) {
      console.error(`Failed to fetch survey with ID ${id}:`, err);
      setError(err.response?.data?.detail || `Failed to load survey with ID ${id}.`);
      setCurrentSurvey(null);
    } finally {
      setIsLoadingSurveyForm(false);
    }
  }, []);

  // Fetch survey submissions made by the current user
  const fetchUserSubmissions = useCallback(async () => {
    setIsLoadingSurveys(true); 
    setError(null);
    try {
      // Request path no longer needs /api because it's in the baseURL
      const response = await axiosInstance.get<UserSubmission[]>('/user-submissions');
      setUserSubmissions(response.data);
    } catch (err: any) {
      console.error("Failed to fetch user submissions:", err);
      setError(err.response?.data?.detail || "Failed to load your past surveys.");
    } finally {
      setIsLoadingSurveys(false);
    }
  }, []);

  // NEW: Fetch overall dashboard statistics
  const fetchOverallDashboardStats = useCallback(async () => {
    try {
      // Request path no longer needs /api because it's in the baseURL
      const response = await axiosInstance.get<OverallStats>('/dashboard/overall-stats');
      setOverallStats(response.data);
    } catch (err: any) {
      console.error("Failed to fetch overall dashboard stats:", err);
    }
  }, []);

  // NEW: Fetch department-wise dashboard metrics
  const fetchDepartmentDashboardMetrics = useCallback(async () => {
    try {
      // Request path no longer needs /api because it's in the baseURL
      const response = await axiosInstance.get<DepartmentMetric[]>('/dashboard/department-metrics');
      setDepartmentMetrics(response.data);
    } catch (err: any) {
      console.error("Failed to fetch department dashboard metrics:", err);
    }
  }, []);


  const submitSurveyResponse = async (surveyId: number, payload: any): Promise<boolean> => {
    try {
      // Request path no longer needs /api because it's in the baseURL
      const response = await axiosInstance.post(`/surveys/${surveyId}/submit_response`, payload);
      toast({
        title: "Survey Submitted",
        description: (response.data as { message?: string })?.message || "Your survey has been submitted successfully!",
      });
      fetchUserSubmissions(); // Refresh user submissions after a successful submission
      // Also refresh dashboard metrics after a submission
      fetchOverallDashboardStats();
      fetchDepartmentDashboardMetrics();
      return true;
    } catch (err: any) {
      console.error('Failed to submit survey response:', err);
      toast({
        title: "Submission Failed",
        description: err.response?.data?.detail || "There was an error submitting your survey.",
        variant: "destructive",
      });
      return false;
    }
  };


  // Effect to fetch initial data when authenticated and auth state is ready
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchSurveys(); 
      fetchUserSubmissions();
    } else if (!isAuthLoading && !isAuthenticated) {
      setIsLoadingSurveys(false);
    }
  }, [isAuthenticated, isAuthLoading, fetchSurveys, fetchUserSubmissions]);


  return (
    <SurveyContext.Provider value={{ 
        currentSurvey, 
        loading: isLoadingSurveyForm, 
        error, 
        fetchSurveyById, 
        submitSurveyResponse,
        surveys,
        userSubmissions,
        isLoadingSurveys
    }}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurvey = (): SurveyContextType => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error('useSurvey must be used within a SurveyProvider');
  }
  return context;
};

