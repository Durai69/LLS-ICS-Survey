import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { DepartmentsProvider } from "@/contexts/DepartmentContext"; 
import { SurveyProvider } from "@/contexts/SurveyContext";

// Import axios to configure it globally
import axios from 'axios';
import { useEffect } from 'react'; // Import useEffect



import Login from "../../Shared/Login"; 
import Dashboard from "./pages/Dashboard";
import DepartmentSelection from "../src/pages/DepartmentSelection"; 
import SurveyForm from "./pages/SurveyForm";
import SubmissionSuccess from "./pages/SubmissionSuccess";
import ExcelExport from "./pages/ExcelExport";
import RemarksResponse from "./pages/RemarksResponse";
import Account from "./pages/Account"; 
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

// ProtectedRoute component to guard routes that require authentication
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


const AppRoutes = () => {
  // Configure Axios to send cookies with all requests
  // This needs to be done once when the app starts.
  useEffect(() => {
    axios.defaults.withCredentials = true;
    console.log("Axios withCredentials set to true globally.");
  }, []); // Empty dependency array means this runs once on mount

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/submission-success" element={<SubmissionSuccess />} />
      <Route path="*" element={<NotFound />} />

      {/* Default redirect: If user goes to '/', redirect to dashboard (protected) */}
      <Route 
        path="/" 
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      /> 

      {/* Protected Routes - require authentication for all standard user pages */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/departments"
        element={<ProtectedRoute><DepartmentSelection /></ProtectedRoute>}
      />
      <Route
        path="/survey/:departmentId"
        element={<ProtectedRoute><SurveyForm /></ProtectedRoute>}
      />
      <Route
        path="/excel"
        element={<ProtectedRoute><ExcelExport /></ProtectedRoute>}
      />
      <Route
        path="/action-plan"
        element={<ProtectedRoute><RemarksResponse /></ProtectedRoute>}
      />
      <Route
        path="/remarks-response"
        element={<ProtectedRoute><RemarksResponse /></ProtectedRoute>}
      />
      <Route
        path="/account"
        element={<ProtectedRoute><Account /></ProtectedRoute>}
      />
      <Route
        path="/help"
        element={<ProtectedRoute><Help /></ProtectedRoute>}
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DepartmentsProvider> 
      <SurveyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes /> 
        </TooltipProvider>
      </SurveyProvider>
    </DepartmentsProvider>
  </QueryClientProvider>
);

export default App;
