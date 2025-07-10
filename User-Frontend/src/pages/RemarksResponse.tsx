import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/MainLayout/MainLayout';
import { Check } from 'lucide-react'; // Import the Check icon
import { useRemarks } from '@/contexts/RemarksContext';

interface IncomingFeedback {
  id: string;
  fromDepartment: string;
  ratingGiven: number;
  remark: string;
  category: string;
}

interface OutgoingFeedback {
  id: string;
  department: string;
  rating: number;
  yourRemark: string;
  category: string;
  theirResponse: {
    explanation: string;
    actionPlan: string;
    responsiblePerson: string;
  };
}

const RemarksResponse = () => {
  const { toast } = useToast();
  const { incoming, fetchIncoming, respondToFeedback } = useRemarks();

  // State to manage acknowledged outgoing feedback items
  const [acknowledgedItems, setAcknowledgedItems] = useState<Set<string>>(new Set());

  // Mock multiple incoming feedback data
  const [incomingFeedbackList] = useState<IncomingFeedback[]>([
    {
      id: '1',
      fromDepartment: 'Production',
      ratingGiven: 2,
      remark: 'Slow response to inventory requests',
      category: 'Efficiency'
    },
    {
      id: '2',
      fromDepartment: 'Mktg IA',
      ratingGiven: 1,
      remark: 'Communication could be improved for better coordination',
      category: 'Communication'
    },
    {
      id: '3',
      fromDepartment: 'Planning',
      ratingGiven: 1,
      remark: 'Delays in processing our resource allocation requests',
      category: 'Resource Management'
    },
    {
      id: '4',
      fromDepartment: 'HR',
      ratingGiven: 2,
      remark: 'Great support during hiring process',
      category: 'Service Quality'
    }
  ]);

  // Mock multiple outgoing feedback data
  const [outgoingFeedbackList] = useState<OutgoingFeedback[]>([
    {
      id: '1',
      department: 'QA Department',
      rating: 2,
      yourRemark: 'Delayed reports submission',
      category: 'Process Improvement',
      theirResponse: {
        explanation: 'We were understaffed due to resignations',
        actionPlan: 'Hiring 2 more analysts by next month',
        responsiblePerson: 'Mr. Arjun'
      }
    },
    {
      id: '2',
      department: 'Mktg IA',
      rating: 1,
      yourRemark: 'Good collaboration but needs faster turnaround',
      category: 'Collaboration',
      theirResponse: {
        explanation: 'Resource constraints limited our response time',
        actionPlan: 'Implementing new workflow management system',
        responsiblePerson: 'Ms. Priya'
      }
    },
    {
      id: '3',
      department: 'Planning',
      rating: 2,
      yourRemark: 'Excellent strategic planning support',
      category: 'Strategic Planning',
      theirResponse: {
        explanation: 'Thank you for the positive feedback',
        actionPlan: 'Continue maintaining current service levels',
        responsiblePerson: 'Mr. Raj'
      }
    },
    {
        id: '4',
        department: 'IT Support',
        rating: 1,
        yourRemark: 'Slow response time on ticket resolution.',
        category: 'Responsiveness',
        theirResponse: {
            explanation: 'Experienced a surge in ticket volume.',
            actionPlan: 'Hiring additional support staff and optimizing ticketing system.',
            responsiblePerson: 'Ms. Emily'
        }
    }
  ]);

  const [selectedIncomingIndex, setSelectedIncomingIndex] = useState(0);
  const [selectedOutgoingIndex, setSelectedOutgoingIndex] = useState(0);

  // Form state for incoming feedback response
  const [responseForm, setResponseForm] = useState({
    yourResponse: '',
    actionPlan: '',
    responsiblePerson: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setResponseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!responseForm.yourResponse.trim() || !responseForm.actionPlan.trim() || !responseForm.responsiblePerson.trim()) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required to submit your response.',
        variant: 'destructive',
      });
      return;
    }

    // Mock submission - In a real app, you'd send this to your backend
    console.log('Response submitted:', {
      response: responseForm.yourResponse,
      actionPlan: responseForm.actionPlan,
      responsiblePerson: responseForm.responsiblePerson
    });

    toast({
      title: 'Response Submitted',
      description: 'Your response has been submitted successfully.',
      variant: 'default',
    });

    // Reset form
    setResponseForm({
      yourResponse: '',
      actionPlan: '',
      responsiblePerson: ''
    });
  };

  // Function to handle acknowledging outgoing feedback
  const handleAcknowledge = (feedbackId: string) => {
    setAcknowledgedItems(prev => new Set(prev).add(feedbackId));
    toast({
      title: 'Feedback Acknowledged',
      description: `Outgoing feedback ID ${feedbackId} has been acknowledged.`,
      variant: 'default',
    });
    console.log('Acknowledged outgoing feedback ID:', feedbackId);
  };

  // Filter out acknowledged items from outgoing feedback for display
  const visibleOutgoingFeedback = outgoingFeedbackList.filter(
    feedback => !acknowledgedItems.has(feedback.id)
  );

  const currentIncomingFeedback = incomingFeedbackList[selectedIncomingIndex];
  // Ensure we don't try to access elements that don't exist after filtering
  const currentOutgoingFeedback = visibleOutgoingFeedback[selectedOutgoingIndex];


  return (
    <MainLayout title="Action Plan">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Incoming Feedback Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Incoming Feedback</h2>

          {/* Department Navigation Tabs (using buttons) */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {incomingFeedbackList.map((feedback, index) => (
                <button
                  key={feedback.id}
                  onClick={() => setSelectedIncomingIndex(index)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedIncomingIndex === index
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {feedback.fromDepartment}
                </button>
              ))}
            </div>
          </div>

          <Card className="bg-green-50 border-green-200 mb-6">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 min-w-[140px]">From Department:</span>
                  <span className="text-gray-800">{currentIncomingFeedback.fromDepartment}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span className="font-medium text-gray-700 min-w-[140px]">Rating Given:</span>
                  <span className="text-gray-800">{currentIncomingFeedback.ratingGiven}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <span className="font-medium text-gray-700 min-w-[140px]">Remark:</span>
                  <span className="text-gray-800">"{currentIncomingFeedback.remark}"</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-start">
                  <span className="font-medium text-gray-700 min-w-[140px]">Category:</span>
                  <span className="text-gray-800">{currentIncomingFeedback.category}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Your Response (Explanation):
                  </label>
                  <Textarea
                    placeholder="Enter Your Explanation"
                    value={responseForm.yourResponse}
                    onChange={(e) => handleInputChange('yourResponse', e.target.value)}
                    className="min-h-[100px] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Action Plan:
                  </label>
                  <Textarea
                    placeholder="Enter your Action Plan"
                    value={responseForm.actionPlan}
                    onChange={(e) => handleInputChange('actionPlan', e.target.value)}
                    className="min-h-[100px] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Responsible Person:
                  </label>
                  <Input
                    placeholder="Enter the name of the responsible person"
                    value={responseForm.responsiblePerson}
                    onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                    className="bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8">
                    Submit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Outgoing Feedback Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Outgoing Feedback</h2>

          {/* Department Navigation Tabs (using buttons) */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {visibleOutgoingFeedback.map((feedback, index) => (
                <button
                  key={feedback.id}
                  // Only update selectedOutgoingIndex if the item is visible
                  onClick={() => setSelectedOutgoingIndex(visibleOutgoingFeedback.indexOf(feedback))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    (currentOutgoingFeedback && currentOutgoingFeedback.id === feedback.id)
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {feedback.department}
                </button>
              ))}
            </div>
          </div>

          {visibleOutgoingFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending outgoing feedback to display.
            </div>
          ) : (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="font-medium text-gray-700 min-w-[120px]">You rated:</span>
                    <span className="text-gray-800">{currentOutgoingFeedback?.department} - {currentOutgoingFeedback?.rating}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <span className="font-medium text-gray-700 min-w-[120px]">Your Remark:</span>
                    <span className="text-gray-800">"{currentOutgoingFeedback?.yourRemark}"</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start">
                    <span className="font-medium text-gray-700 min-w-[120px]">Category:</span>
                    <span className="text-gray-800">{currentOutgoingFeedback?.category}</span>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 underline">Their Response:</h3>

                    <div className="space-y-4 pl-4">
                      <div>
                        <span className="font-medium text-gray-700">Explanation: </span>
                        <span className="text-gray-800">{currentOutgoingFeedback?.theirResponse.explanation}</span>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Action Plan: </span>
                        <span className="text-gray-800">{currentOutgoingFeedback?.theirResponse.actionPlan}</span>
                      </div>

                      <div>
                        <span className="font-medium text-gray-700">Responsible Person: </span>
                        <span className="text-gray-800">{currentOutgoingFeedback?.theirResponse.responsiblePerson}</span>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledge Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => currentOutgoingFeedback && handleAcknowledge(currentOutgoingFeedback.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      disabled={currentOutgoingFeedback === undefined} // Disable if no current outgoing feedback to acknowledge
                    >
                      <Check size={16} />
                      <span>Acknowledge</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default RemarksResponse;
