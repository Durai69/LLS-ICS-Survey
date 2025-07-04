import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import Waves from './Waves'; // Assuming Waves.tsx is in the same directory as Login.tsx
// Removed ShapeBlur import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const API_BASE_URL = 'http://localhost:5000'; // Define API base URL here for forgot password API call

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for "Forgot Password" modal
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Username and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(username, password);
      if (user) {
        navigate("/dashboard");
      } else {
        setError('Login failed. Please check your credentials.'); 
      }
    } catch (err) {
      console.error('Login submission error:', err);
      setError('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Forgot Password submission
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordMessage('Email address is required.');
      setForgotPasswordLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/request_password_reset`, { 
        email: forgotPasswordEmail 
      });

      const data = response.data as { message: string };
      setForgotPasswordMessage(data.message);
      toast({
        title: "Password Reset Request",
        description: data.message,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Forgot password request error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to send reset link. Please try again later.';
      setForgotPasswordMessage(errorMessage);
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    // Main container for Waves background and centered content
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-950">
      
      {/* Waves component as background (z-index 0) */}
      <Waves
        lineColor="#3C2A92" // Tailwind indigo-500 for lines
        backgroundColor="#ADADAD" // A darker gray for the base of the waves
        waveSpeedX={0.007}
        waveSpeedY={0.002}
        waveAmpX={20}
        waveAmpY={10}
        friction={0.9}
        tension={0.004}
        maxCursorMove={70}
        xGap={15}
        yGap={40}
        className="absolute inset-0 z-0" // Stretch to fill, ensure it's behind content
      />

      {/* Login Card - now solid white with shadow */}
      <div className="relative z-10 p-8 rounded-3xl bg-white w-full max-w-md mx-auto login-card-shadow"> {/* Changed rounded-xl to rounded-3xl for more curve */}
        
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight mb-2">
            Login
          </h1>
          <p className="text-gray-500 text-lg">Enter Your Login Credentials</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username" className="text-gray-700">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="text-right text-sm">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setIsForgotPasswordModalOpen(true); }}
                className="text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-70"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Use your credentials to login</p>
            </div>
          </div>
        </form>
      </div>

      {/* Forgot Password Dialog/Modal */}
      <Dialog open={isForgotPasswordModalOpen} onOpenChange={setIsForgotPasswordModalOpen}>
        <DialogContent className="sm:max-w-md bg-white text-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Forgot Password</DialogTitle>
            <DialogDescription className="text-gray-600">
              Enter your email address to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="forgotPasswordEmail" className="sr-only">
                Email
              </Label>
              <Input
                id="forgotPasswordEmail"
                type="email"
                placeholder="Enter your email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                disabled={forgotPasswordLoading}
                required
                className="bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-500"
              />
            </div>
            {forgotPasswordMessage && (
              <p className={`text-sm ${forgotPasswordMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                {forgotPasswordMessage}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsForgotPasswordModalOpen(false)} className="bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300">
                Cancel
              </Button>
              <Button type="submit" disabled={forgotPasswordLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
