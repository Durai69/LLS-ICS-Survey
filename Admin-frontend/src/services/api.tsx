import axios from 'axios';

// Import AxiosError type correctly
type AxiosError = {
    response?: {
        status: number;
        data: any;
    };
    message: string;
};

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for cookies
});

// API response types
interface User {
    id: number;
    username: string;
    name: string;
    email: string;
    department: string;
    role: string;
    is_active: boolean;
}

interface LoginResponse {
    message: string;
    user: User;
}

interface Survey {
    id: number;
    title: string;
    description: string;
    rated_department_id: number;
    managing_department_id: number;
    questions: Question[];
}

interface Question {
    id: number;
    text: string;
    type: 'rating' | 'text' | 'multiple_choice';
    order: number;
    category?: string;
    options?: Option[];
}

interface Option {
    id: number;
    text: string;
    value: string;
    order: number;
}

interface SurveySubmission {
    user_id: number;
    answers: Array<{
        id: number;
        rating?: number;
        text_response?: string;
        selected_option_id?: number;
        remarks?: string;
    }>;
    suggestion?: string;
}

// Error handling
const handleError = (error: unknown) => {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 401) {
        // Handle unauthorized access - redirect to login
        window.location.href = '/login';
    }
    throw error;
};

// Auth API
export const login = async (username: string, password: string) => {
    try {
        const response = await api.post<LoginResponse>('/login', { username, password });
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await api.post('/logout');
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const verifyAuth = async () => {
    try {
        const response = await api.get('/verify_auth');
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Survey API
export const getSurvey = async (surveyId: string) => {
    try {
        const response = await api.get<Survey>(`/api/surveys/${surveyId}`);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

export const submitSurvey = async (surveyId: string, data: SurveySubmission) => {
    try {
        const response = await api.post(`/api/surveys/${surveyId}/submit`, data);
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Department API
export const getDepartments = async () => {
    try {
        const response = await api.get('/api/departments');
        return response.data;
    } catch (error) {
        handleError(error);
        throw error;
    }
};

// Add request interceptor to handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear any stored auth state and redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
