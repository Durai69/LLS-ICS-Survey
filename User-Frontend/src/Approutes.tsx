import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import Login from "../../Shared/Login";
import Dashboard from "./pages/Dashboard";
import DepartmentSelection from "./pages/DepartmentSelection";
import SurveyForm from "./pages/SurveyForm";
import SubmissionSuccess from "./pages/SubmissionSuccess";
import ExcelExport from "./pages/ExcelExport";
import RemarksResponse from "./pages/RemarksResponse";
import Account from "./pages/Account";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

// ProtectedRoute component
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
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/submission-success" element={<SubmissionSuccess />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><DepartmentSelection /></ProtectedRoute>} />
            <Route path="/survey/:departmentId" element={<ProtectedRoute><SurveyForm /></ProtectedRoute>} />
            <Route path="/excel" element={<ProtectedRoute><ExcelExport /></ProtectedRoute>} />
            <Route path="/action-plan" element={<ProtectedRoute><RemarksResponse /></ProtectedRoute>} />
            <Route path="/remarks-response" element={<ProtectedRoute><RemarksResponse /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;