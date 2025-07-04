// src/pages/SurveyForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout/MainLayout';
import { useSurvey } from '@/contexts/SurveyContext'; 
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarRating from '@/components/StarRating';
// REMOVE: import { surveyCategories } from '@/data/surveyQuestions'; // Remove this line
import { useToast } from '@/components/ui/use-toast';

interface QuestionAnswer {
    id: number; // Changed to number to match backend Question ID
    category: string; // This might be less relevant if questions aren't strictly categorized by backend
    question: string;
    rating: number;
    remarks: string;
}

const SurveyForm = () => {
    // Assuming departmentId from route, but for a specific survey, you might need surveyId
    // If your URL is /survey/2, then departmentId is '2'. If it's a survey ID, rename it.
    // Let's assume `departmentId` is actually the `surveyId` for now, or update your routing.
    const { departmentId: surveyId } = useParams<{ departmentId: string }>(); // Rename departmentId to surveyId
    const { currentSurvey, loading, error, fetchSurveyById, submitSurveyResponse } = useSurvey();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
    const [finalSuggestion, setFinalSuggestion] = useState('');
    
    // The survey itself might define who it's for; department lookup removed as departments is not available

    useEffect(() => {
        if (surveyId) {
            fetchSurveyById(surveyId);
        }
    }, [surveyId, fetchSurveyById]);

    useEffect(() => {
        if (currentSurvey && currentSurvey.questions.length > 0) {
            const initialAnswers: QuestionAnswer[] = currentSurvey.questions.map(question => ({
                id: question.id,
                category: "General", // Placeholder if backend doesn't provide explicit categories
                question: question.text,
                rating: 0,
                remarks: '',
            }));
            setAnswers(initialAnswers);
        }
    }, [currentSurvey]);

    const handleRatingChange = (questionId: number, rating: number) => { // id is number now
        setAnswers(prev => 
            prev.map(answer => 
                answer.id === questionId ? { ...answer, rating } : answer
            )
        );
    };

    const handleRemarksChange = (questionId: number, remarks: string) => { // id is number now
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
        
        // Check if remarks are provided for low ratings (assuming backend knows required status for questions)
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

    const handleSubmit = async () => { // Make handleSubmit async
        if (!validateSurvey() || !currentSurvey) return; // Ensure survey data is loaded

        // IMPORTANT: Replace `1` with the actual authenticated user's ID
        // This will come from your AuthContext or similar authenticated state
        const userId = 1; // Placeholder: Replace with actual logged-in user ID

        const payload = {
            user_id: userId,
            answers: answers.map(({ id, rating, remarks }) => ({ // Only send data backend needs
                id, // This is the question ID
                rating,
                ...(remarks.trim() ? { remarks } : {}),
                // If you have multiple choice questions, add selected_option_id here
            })),
            ...(finalSuggestion.trim() ? { suggestion: finalSuggestion } : {}),
        };
        
        const success = await submitSurveyResponse(currentSurvey.id, payload); // Pass currentSurvey.id
        
        if (success) {
            navigate('/submission-success');
        }
        // Toast is handled by SurveyContext now
    };

    if (loading) {
        return <MainLayout><div className="px-6 max-w-4xl mx-auto text-center py-10">Loading Survey...</div></MainLayout>;
    }

    if (error) {
        return <MainLayout><div className="px-6 max-w-4xl mx-auto text-center py-10 text-red-600">{error}</div></MainLayout>;
    }

    if (!currentSurvey) {
        return <MainLayout><div className="px-6 max-w-4xl mx-auto text-center py-10">Survey not found or invalid ID.</div></MainLayout>;
    }

    return (
        <MainLayout>
            <div className="px-6 max-w-4xl mx-auto">
                <h2 className="text-2xl font-semibold mb-8 text-center">
                    INTERNAL CUSTOMER SATISFACTION SURVEY: {currentSurvey.title}
                </h2>

                <div className="space-y-12">
                    {currentSurvey.questions
                        .sort((a, b) => a.order - b.order) // Sort questions by order
                        .map((question, questionIndex) => {
                        const answer = answers.find(a => a.id === question.id);
                        const requiresRemarks = answer?.rating && answer.rating <= 2; // Keep frontend validation

                        return (
                            <div key={question.id} className="space-y-3">
                                <div className="text-gray-800">
                                    {String.fromCharCode(97 + questionIndex)}) {question.text}
                                </div>
                                
                                {question.type === 'rating' && ( // Conditionally render based on question type
                                    <StarRating
                                        rating={answer?.rating || 0}
                                        onRatingChange={(rating) => handleRatingChange(question.id, rating)}
                                    />
                                )}
                                {question.type === 'text' && (
                                    <Textarea
                                        placeholder={`Enter your response here...`}
                                        value={answer?.remarks || ''}
                                        onChange={(e) => handleRemarksChange(question.id, e.target.value)}
                                        className="resize-none"
                                    />
                                )}
                                {/* Add more question types here if needed (e.g., multiple_choice with radio buttons) */}
                                
                                {requiresRemarks && question.type === 'rating' && ( // Only show for low ratings on rating type
                                    <div className="mt-2">
                                        <Textarea
                                            placeholder={`*Reason for rating 1 or 2`}
                                            value={answer?.remarks || ''}
                                            onChange={(e) => handleRemarksChange(question.id, e.target.value)}
                                            className="resize-none"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="space-y-3">
                        <label htmlFor="suggestion" className="text-gray-800">
                            Additional Suggestions or Feedback
                        </label>
                        <Textarea
                            id="suggestion"
                            placeholder="Add any suggestions or feedback here..."
                            value={finalSuggestion}
                            onChange={(e) => setFinalSuggestion(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <div className="flex justify-center">
                        <Button
                            onClick={handleSubmit}
                            className="bg-primary text-white px-8 py-2"
                        >
                            SUBMIT
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SurveyForm;