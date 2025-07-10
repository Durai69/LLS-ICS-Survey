// src/pages/SurveyForm.tsx
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarRating from '@/components/StarRating';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';
import { useSurvey } from '@/contexts/SurveyContext';

interface QuestionAnswer {
  id: number;
  category: string;
  question: string;
  rating: number;
  remarks: string;
}

const CATEGORIES = ['QUALITY', 'DELIVERY', 'COMMUNICATION', 'RESPONSIVENESS', 'IMPROVEMENT'];

const SurveyForm = () => {
  const { toast } = useToast();
  const { departmentId } = useParams<{ departmentId: string }>();
  const { currentSurvey, loading, error, fetchSurveyById, submitSurveyResponse } = useSurvey();
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [finalSuggestion, setFinalSuggestion] = useState('');
  const draftKey = `survey_draft_${departmentId}`;

  // Fetch survey on mount or when departmentId changes
  useEffect(() => {
    if (departmentId) {
      fetchSurveyById(Number(departmentId));
    }
  }, [departmentId, fetchSurveyById]);

  // Initialize answers when currentSurvey changes
  useEffect(() => {
    if (currentSurvey?.questions) {
      const defaultAnswers = currentSurvey.questions.map(q => ({
        id: q.id,
        category: q.category,
        question: q.text,
        rating: 0,
        remarks: '',
      }));
      setAnswers(defaultAnswers);
    }
  }, [currentSurvey]);

  const deptName =
    currentSurvey?.rated_dept_name ||
    localStorage.getItem('selectedDepartment') ||
    'Department';

  const handleRatingChange = (questionId: number, rating: number) => {
    console.log(`handleRatingChange called for questionId=${questionId} with rating=${rating}`);
    setAnswers(prev => {
      const updated = prev.map(answer =>
        answer.id === questionId ? { ...answer, rating } : answer
      );
      console.log('Updated answers:', updated);
      return updated;
    });
  };
  
  // Add useEffect to log answers state changes for debugging
  React.useEffect(() => {
    console.log('Answers state updated:', answers);
  }, [answers]);

  const handleRemarksChange = (questionId: number, remarks: string) => {
    setAnswers(prev =>
      prev.map(answer =>
        answer.id === questionId ? { ...answer, remarks } : answer
      )
    );
  };

  const validateSurvey = () => {
    // Check if all questions are rated
    const unratedQuestion = answers.find(answer => answer.rating === 0);
    if (unratedQuestion) {
      toast({
        title: 'Incomplete Survey',
        description: `Please rate all questions.`,
        variant: 'destructive',
      });
      return false;
    }

    // Check if remarks are provided for low ratings
    const lowRatingWithoutRemarks = answers.find(
      answer => answer.rating <= 2 && !answer.remarks.trim()
    );

    if (lowRatingWithoutRemarks) {
      toast({
        title: 'Incomplete Survey',
        description: `Please provide remarks for ratings below 3 stars.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateSurvey()) return;

    if (!departmentId) {
      toast({
        title: 'Error',
        description: 'Survey ID is missing.',
        variant: 'destructive',
      });
      return;
    }

    // Replace with actual user ID from auth context if available
    const userId = 1;

    const payload = {
      user_id: userId,
      answers: answers.map(({ id, rating, remarks }) => ({
        id,
        rating,
        ...(remarks.trim() ? { remarks } : {}),
      })),
      ...(finalSuggestion.trim() ? { suggestion: finalSuggestion } : {}),
    };

    const success = await submitSurveyResponse(Number(departmentId), payload);
    if (success) {
      localStorage.removeItem(draftKey);
      toast({
        title: 'Submitted!',
        description: 'Your survey has been submitted.',
        variant: 'default',
      });
      // Optionally reset form or redirect here
    }
  };

  const handleSaveDraft = async () => {
    await fetch(`/api/surveys/${departmentId}/save_draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        answers,
        suggestion: finalSuggestion,
        rated_department_id: currentSurvey?.rated_department_id,
      }),
    });
    toast({
      title: 'Draft Saved',
      description: 'You can resume this survey later.',
      variant: 'default',
    });
  };

  // Remove undefined logs
  console.log('departmentId:', departmentId);
  console.log('currentSurvey:', currentSurvey);

  // Optional: loading/error UI
  if (loading) {
    return <MainLayout><div>Loading...</div></MainLayout>;
  }
  if (error) {
    return <MainLayout><div>Error: {error}</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-[80vh] bg-gray-50 py-12">
        <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-10">
          <h2 className="text-3xl font-bold mb-10 text-center tracking-wide">
            INTERNAL CUSTOMER SATISFACTION SURVEY FOR{' '}
            <span className="text-primary">{deptName.toUpperCase()}</span> DEPARTMENT
          </h2>

          <div className="space-y-14">
            {CATEGORIES.map(category => (
              <div key={category} className="mb-10">
                <h3 className="font-bold text-xl mb-6 text-primary tracking-wide">{category}</h3>
                <div className="space-y-8">
                  {currentSurvey?.questions
                    .filter(q => q.category === category)
                    .map((question, idx) => {
                      const answer = answers.find(a => a.id === question.id);
                      const requiresRemarks = answer?.rating && answer.rating <= 2;
                      return (
                        <div
                          key={question.id}
                          className="mb-4 pb-4 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
                        >
                          <div className="mb-2 font-medium text-base flex items-start">
                            <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                            <span>{question.text}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <StarRating
                              rating={answer?.rating || 0}
                              onRatingChange={r => handleRatingChange(question.id, r)}
                            />
                            {requiresRemarks && (
                              <Textarea
                                placeholder="*Reason for rating 1 or 2"
                                value={answer?.remarks || ''}
                                onChange={e => handleRemarksChange(question.id, e.target.value)}
                                required
                                className="w-full sm:w-1/2 min-h-[36px]"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}

            <div className="space-y-3">
              <label htmlFor="suggestion" className="text-gray-800 font-medium">
                Additional Suggestions or Feedback
              </label>
              <Textarea
                id="suggestion"
                placeholder="Add any suggestions or feedback here..."
                value={finalSuggestion}
                onChange={e => setFinalSuggestion(e.target.value)}
                className="resize-none"
              />
            </div>

            <div className="flex justify-center gap-6 mt-10">
              <Button
                onClick={handleSaveDraft}
                className="bg-gray-400 text-white px-10 py-3 rounded-lg"
                type="button"
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-primary text-white px-10 py-3 rounded-lg"
              >
                SUBMIT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyForm;
