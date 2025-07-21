import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

// IMPORTANT: NO /api prefix here, as these routes are on the root app
const API_BASE_URL = 'http://localhost:5000';

const AUTH_LOCAL_STORAGE_KEY = 'insightPulseUser';

export interface User {
  id: number; 
  username: string;
  name: string;
  email: string;
  department: string;
  role: string;
  is_active: boolean; 
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshAuth = async () => {
    setIsLoading(true);
    try {
      console.log("Attempting to verify authentication status...");
      const response = await fetch(`${API_BASE_URL}/verify_auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // IMPORTANT: Include cookies with the request
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, JSON.stringify(data.user));
          console.log("Authentication refreshed: User is authenticated.");
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
          console.log("Authentication refreshed: User is NOT authenticated.");
        }
      } else {
        console.warn("Auth verification response not OK:", response.status, await response.json());
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error during authentication refresh:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial check on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_LOCAL_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        refreshAuth(); 
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
        refreshAuth(); // Fetch fresh state if stored data is invalid
      }
    } else {
      refreshAuth(); // Always verify with backend, even if no stored user
    }
  }, []); 


  const login = async (usernameInput: string, passwordInput: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, { // Uses API_BASE_URL without /api
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
        credentials: 'include', 
      });

      const data = await response.json();

      if (response.ok) {
        const loggedInUser: User = data.user;
        if (loggedInUser.role.toLowerCase() !== 'admin') {
          toast({
            title: "Login Failed",
            description: "Only Admin can login into Admin Portal.",
            variant: "destructive",
          });
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
          return null;
        }
        setUser(loggedInUser);
        setIsAuthenticated(true);
        localStorage.setItem(AUTH_LOCAL_STORAGE_KEY, JSON.stringify(loggedInUser));
        toast({
          title: "Login Successful",
          description: `Welcome, ${loggedInUser.name}!`,
        });
        navigate('/dashboard');
        return loggedInUser;
      } else {
        toast({
          title: "Login Failed",
          description: data.detail || "Invalid username or password.",
          variant: "destructive",
        });
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
        return null;
      }
    } catch (error) {
      console.error('Login request failed:', error);
      toast({
        title: "Login failed",
        description: "Unable to connect to the server or unexpected network error.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true); 
    try {
        console.log("Attempting logout...");
        const response = await fetch(`${API_BASE_URL}/logout`, { // Uses API_BASE_URL without /api
            method: 'POST',
            credentials: 'include', 
        });
        if (!response.ok) {
            console.error("Logout failed on server:", await response.json());
            toast({ title: "Logout Failed", description: "Could not log out on the server.", variant: "destructive" });
        } else {
            console.log("Logout successful on server.");
        }
    } catch (error) {
        console.error("Error during logout request:", error);
        toast({
            title: "Network Error",
            description: "An error occurred during logout. Please try again.",
            variant: "destructive",
        });
    } finally {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem(AUTH_LOCAL_STORAGE_KEY);
        toast({
            title: "Logged out",
            description: "You have been successfully logged out",
            variant: "default", 
        });
        navigate('/login');
        setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
