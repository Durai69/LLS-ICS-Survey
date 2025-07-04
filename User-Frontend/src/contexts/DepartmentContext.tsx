    // user-frontend/src/contexts/DepartmentsContext.tsx
    import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
    import axios from 'axios';

    // Ensure this matches your Flask backend URL
    const API_BASE_URL = 'http://localhost:5000/api'; 

    export interface Department { // IMPORTANT: Ensure 'export' is here
        id: number;
        name: string;
    }

    interface DepartmentsContextType {
        departments: Department[];
        loading: boolean;
        error: string | null;
        refreshDepartments: () => void; // Optional: to refetch departments if needed
    }

    const DepartmentsContext = createContext<DepartmentsContextType | undefined>(undefined);

    export const DepartmentsProvider = ({ children }: { children: ReactNode }) => {
        const [departments, setDepartments] = useState<Department[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        // --- NEW: Configure Axios to send cookies for this context's requests ---
        useEffect(() => {
            axios.defaults.withCredentials = true;
            console.log("DepartmentsContext: Axios withCredentials set to true.");
        }, []);
        // -----------------------------------------------------------------------

        const fetchDepartments = async () => {
            setLoading(true);
            setError(null);
            try {
                // Ensure this specific request (and all others using axios) send credentials
                const response = await axios.get<Department[]>(`${API_BASE_URL}/departments`); 
                setDepartments(response.data);
            } catch (err: any) { // Type 'any' for error to access `response.data`
                console.error("Failed to fetch departments:", err);
                setError(err.response?.data?.message || "Failed to load departments. Please ensure the backend is running and department data is populated.");
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            fetchDepartments();
        }, []);

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
