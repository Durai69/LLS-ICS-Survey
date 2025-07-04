
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SubmissionSuccess = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800">
              Survey Submitted Successfully
            </h2>

            <p className="text-gray-600">
              Thank you for your valuable feedback. Your responses help us improve our interdepartmental services.
            </p>

            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-primary text-white px-6 py-2"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SubmissionSuccess;
