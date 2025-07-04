import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSurvey } from '@/contexts/SurveyContext'; // Import useSurvey
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const DepartmentSelection = () => {
  const { user } = useAuth();
  const { surveys, userSubmissions, isLoadingSurveys, error } = useSurvey(); // Use surveys and userSubmissions
  const navigate = useNavigate();
  const { toast } = useToast();

  if (isLoadingSurveys) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full min-h-[60vh]">
          <p className="text-gray-600">Loading departments and your past surveys...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full min-h-[60vh] text-red-500">
          <p>Error: {error}</p>
        </div>
      </MainLayout>
    );
  }

  // Filter out user's own department
  const availableDepartments = surveys.filter(
    (survey) => survey.rated_dept_name !== user?.department // Filter by rated department name
  );

  // Create a set of completed survey's rated_department_id for easy lookup
  const completedSurveyDepartmentIds = new Set(
    userSubmissions.map((submission) => submission.rated_department_id)
  );

  const handleDepartmentSelect = (surveyId: number, departmentName: string, ratedDepartmentId: number) => {
    // Check if a survey for this department has already been submitted by the user
    if (completedSurveyDepartmentIds.has(ratedDepartmentId)) {
      toast({
        title: 'Already Completed',
        description: `You have already submitted a survey for ${departmentName}.`,
      });
      return;
    }

    // Navigate to the survey form using the surveyId (template ID)
    navigate(`/survey/${surveyId}`);
  };

  return (
    <MainLayout>
      <div className="px-6 py-8 bg-gray-50 min-h-screen">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">
          Select a Department to Rate
        </h2>

        {availableDepartments.length === 0 ? (
          <div className="text-center text-gray-600 text-lg py-10">
            No departments available for you to survey at this time, or you have already completed all available surveys.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {availableDepartments.map((survey) => {
              const isCompleted = completedSurveyDepartmentIds.has(survey.rated_department_id);
              return (
                <Card
                  key={survey.id} // Use survey.id as key
                  className={cn(
                    "rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer",
                    isCompleted ? "bg-green-50 ring-2 ring-green-400 opacity-80" : "bg-white border border-gray-200"
                  )}
                  onClick={() => handleDepartmentSelect(survey.id, survey.rated_dept_name, survey.rated_department_id)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-4 flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full text-blue-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-8 h-8"
                      >
                        <path
                          fillRule="evenodd"
                          d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {isCompleted && (
                        <svg
                          className="absolute bottom-0 right-0 w-6 h-6 text-green-500 bg-white rounded-full p-[2px]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4.003-6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="font-semibold text-lg text-gray-800 mt-2">{survey.rated_dept_name}</span>
                    <p className="text-sm text-gray-500 mt-1">{survey.description}</p>
                    {isCompleted && (
                      <div className="mt-2 px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                        Completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 p-6 bg-blue-50 rounded-xl shadow-inner max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V6.375c0-.621.504-1.125 1.125-1.125H9.75v.375c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V4.5M12 7.5v-3C12 3.243 11.457 2.75 10.75 2.75h-2.5c-.707 0-1.25.493-1.25 1.25V7.5m5.5 0v3A2.25 2.25 0 0110 12.75H7.75c-.707 0-1.25-.493-1.25-1.25v-3" />
            </svg>
            Survey Rules Reminder
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 leading-relaxed">
            <li>You cannot rate your own department.</li>
            <li>You can rate each department only once per designated survey period. No edits are allowed after submission.</li>
            <li>All survey questions are mandatory. You must answer all questions for a complete submission.</li>
            <li>Remarks are mandatory if you rate below 3 stars (i.e., 1 or 2 stars).</li>
            <li>You can add overall suggestions or feedback, which is optional.</li>
            <li>Submit before the deadline. Surveys may close after a specific date.</li>
            <li>Be honest and constructive. Your ratings are confidential but help improve department performance.</li>
            <li>Once submitted, surveys are locked. Contact the administrator if you believe an error occurred.</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  );
};

export default DepartmentSelection;
