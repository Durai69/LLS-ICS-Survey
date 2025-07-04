
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Modal from '@/components/Modal';

const Account = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'New password and confirmation do not match.',
        variant: 'destructive',
      });
      return;
    }

    // Here you would make an API call to change the password
    // For this demo, we'll just show a success message
    setIsChangePasswordModalOpen(false);
    
    toast({
      title: 'Password Changed Successfully.',
      description: 'Your password has been updated.',
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <MainLayout>
      <div className="px-6 py-8 max-w-xl mx-auto">
        <div className="bg-secondary p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Account Informations
          </h2>
          
          <div className="space-y-4">
            <div className="flex">
              <span className="font-medium w-32">Name</span>
              <span>: {user.name}</span>
            </div>
            
            <div className="flex">
              <span className="font-medium w-32">Email - ID</span>
              <span>: {user.email}</span>
            </div>
            
            <div className="flex">
              <span className="font-medium w-32">Number</span>
              <span>: {user.number}</span>
            </div>
            
            <div className="flex">
              <span className="font-medium w-32">Department</span>
              <span>: {user.department}</span>
            </div>
            
            <div className="flex space-x-4 pt-4 justify-between">
              <Button onClick={() => setIsChangePasswordModalOpen(true)} className="bg-primary text-white">
                Change password
              </Button>
              <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        title="Change Password"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="w-44">Current Password</label>
              <span className="mr-2">:</span>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="w-44">New Password</label>
              <span className="mr-2">:</span>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="w-44">Confirm New Password</label>
              <span className="mr-2">:</span>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              className="bg-primary text-white"
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default Account;
