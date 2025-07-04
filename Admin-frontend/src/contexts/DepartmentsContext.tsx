    import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
    import axios from 'axios';

    // IMPORTANT: WITH /api prefix here, as these routes are part of a blueprint
    const API_BASE_URL = 'http://127.0.0.1:5000/api'; 

    // Configure Axios instance to always send cookies
    const axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
    });

    export interface Department {
        id: number;
        name: string;
    }

    interface DepartmentsContextType {
        departments: Department[];
        loading: boolean;
        error: string | null;
        refreshDepartments: () => void;
    }

    const DepartmentsContext = createContext<DepartmentsContextType | undefined>(undefined);

    export const DepartmentsProvider = ({ children }: { children: ReactNode }) => {
        const [departments, setDepartments] = useState<Department[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        const fetchDepartments = useCallback(async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.get<Department[]>('/departments'); 
                setDepartments(response.data);
            } catch (err: any) {
                console.error("Failed to fetch departments:", err);
                setError(err.response?.data?.detail || "Failed to load departments. Please ensure the backend is running and department data is populated.");
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => {
            fetchDepartments();
        }, [fetchDepartments]);

        const refreshDepartments = () => {
            fetchDepartments();
        };

        return (
            <DepartmentsContext.Provider value={{ departments, loading, error, refreshDepartments }}>
                {children}
            </DepartmentsContext.Provider>
        );
    };

    export const useDepartments = () => {
        const context = useContext(DepartmentsContext);
        if (context === undefined) {
            throw new Error('useDepartments must be used within a DepartmentsProvider');
        }
        return context;
    };
