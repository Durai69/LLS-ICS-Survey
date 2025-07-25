import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/MainLayout/MainLayout';
import { Check } from 'lucide-react';
import { useRemarks } from '@/contexts/RemarksContext';
import { DateRangePicker } from '@/components/DateRangePicker'; // Import if not already

const RemarksResponse = () => {
  const { toast } = useToast();
  const {
    incoming,
    outgoing,
    loadingIncoming,
    loadingOutgoing,
    errorIncoming,
    errorOutgoing,
    fetchIncoming,
    fetchOutgoing,
    respondToFeedback,
    acknowledgeFeedback,
  } = useRemarks();

  // Fetch data on mount
  useEffect(() => {
    fetchIncoming();
    fetchOutgoing();
  }, []);

  // State for selected feedback
  const [selectedIncomingIndex, setSelectedIncomingIndex] = useState<number | null>(null);
  const [selectedOutgoingIndex, setSelectedOutgoingIndex] = useState<number | null>(null);

  // Automatically select the first incoming/outgoing feedback if available
  useEffect(() => {
    if (incoming.length > 0 && selectedIncomingIndex === null) {
      setSelectedIncomingIndex(0);
    }
  }, [incoming, selectedIncomingIndex]);

  useEffect(() => {
    if (outgoing.length > 0 && selectedOutgoingIndex === null) {
      setSelectedOutgoingIndex(0);
    }
  }, [outgoing, selectedOutgoingIndex]);

  // Form state for incoming feedback response
  const [responseForm, setResponseForm] = useState({
    actionPlan: '',
    responsiblePerson: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setResponseForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // New state for target date
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !responseForm.actionPlan.trim() ||
      !responseForm.responsiblePerson.trim()
    ) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required to submit your response.',
        variant: 'destructive',
      });
      return;
    }

    const currentIncomingFeedback =
      selectedIncomingIndex !== null ? incoming[selectedIncomingIndex] : undefined;
    if (!currentIncomingFeedback) return;

    try {
      await respondToFeedback({
        id: currentIncomingFeedback.id,
        explanation: '',
        action_plan: responseForm.actionPlan,
        responsible_person: responseForm.responsiblePerson,
        target_date: targetDate ? targetDate.toISOString() : undefined, // <-- Send as ISO string
      });
      toast({
        title: 'Response Submitted',
        description: 'Your response has been submitted successfully.',
        variant: 'default',
      });
      setResponseForm({
        actionPlan: '',
        responsiblePerson: '',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit response.',
        variant: 'destructive',
      });
    }
  };

  // Replace outgoingList state with useState so you can update it locally
  const [outgoingList, setOutgoingList] = useState<typeof outgoing>([]);
  useEffect(() => {
    setOutgoingList(outgoing);
  }, [outgoing]);

  // Function to handle acknowledging outgoing feedback
  const handleAcknowledge = async (feedbackId: number) => {
    try {
      await acknowledgeFeedback(feedbackId);
      toast({
        title: 'Feedback Acknowledged',
        description: `Outgoing feedback ID ${feedbackId} has been acknowledged.`,
        variant: 'default',
      });

      // Remove the acknowledged feedback from outgoingList state to close it
      setOutgoingList((prev) => {
        const newList = prev.filter(fb => fb.id !== feedbackId);
        // Update selectedOutgoingIndex accordingly
        if (newList.length === 0) {
          setSelectedOutgoingIndex(null);
        } else {
          // If the current selected index is out of bounds, adjust it
          setSelectedOutgoingIndex((currentIndex) => {
            if (currentIndex === null) return null;
            if (currentIndex >= newList.length) {
              return newList.length - 1;
            }
            return currentIndex;
          });
        }
        return newList;
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge feedback.',
        variant: 'destructive',
      });
    }
  };

  const currentIncomingFeedback =
    selectedIncomingIndex !== null ? incoming[selectedIncomingIndex] : undefined;
  const currentOutgoingFeedback =
    selectedOutgoingIndex !== null ? outgoingList[selectedOutgoingIndex] : undefined;

  // Tab state: 'received' | 'actionPlan'
  const [activeTab, setActiveTab] = useState<'received' | 'actionPlan'>('received');

  return (
    <MainLayout title="Action Plan">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Tab Switcher */}
        <div className="flex gap-4 mb-8">
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold transition-colors border-b-2 ${
              activeTab === 'received'
                ? 'border-purple-600 text-purple-700 bg-purple-50'
                : 'border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('received')}
          >
            Received Feedback
          </button>
          <button
            className={`px-6 py-2 rounded-t-lg font-semibold transition-colors border-b-2 ${
              activeTab === 'actionPlan'
                ? 'border-purple-600 text-purple-700 bg-purple-50'
                : 'border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('actionPlan')}
          >
            Action Plan Received
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'received' && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Incoming Feedback</h2>
            {/* Department Navigation Tabs (using buttons) */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {loadingIncoming ? (
                  <div className="text-center w-full py-8 text-gray-500">Loading incoming feedback...</div>
                ) : errorIncoming ? (
                  <div className="text-center w-full py-8 text-red-600">{errorIncoming}</div>
                ) : incoming.length === 0 ? (
                  <div className="text-center w-full py-8 text-gray-500">No incoming feedback to display.</div>
                ) : (
                  incoming.map((feedback, index) => (
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
                  ))
                )}
              </div>
            </div>

            {loadingIncoming ? null : errorIncoming ? null : incoming.length > 0 && currentIncomingFeedback ? (
              <>
                <Card className="bg-green-50 border-green-200 mb-6">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-gray-700 min-w-[140px]">From Department:</span>
                        <span className="text-gray-800">{currentIncomingFeedback?.fromDepartment}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <span className="font-medium text-gray-700 min-w-[140px]">Rating Given:</span>
                        <span className="text-gray-800">{currentIncomingFeedback?.ratingGiven}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Remark:</span>
                        <span className="text-gray-800">"{currentIncomingFeedback?.remark}"</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <span className="font-medium text-gray-700 min-w-[140px]">Category:</span>
                        <span className="text-gray-800">{currentIncomingFeedback?.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

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

                      {/* New Target Date Field */}
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          Target Date (Deadline):
                        </label>
                        <DateRangePicker
                          onSelectDateRange={({ from }) => setTargetDate(from)}
                          selectedDateRange={{ from: targetDate, to: targetDate }}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-primary hover:bg-primary/90 text-white px-8"
                        >
                          Submit
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'actionPlan' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Outgoing Feedback</h2>
            {/* Department Navigation Tabs (using buttons) */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {loadingOutgoing ? (
                  <div className="text-center w-full py-8 text-gray-500">Loading outgoing feedback...</div>
                ) : errorOutgoing ? (
                  <div className="text-center w-full py-8 text-red-600">{errorOutgoing}</div>
                ) : outgoingList.length === 0 ? (
                  <div className="text-center w-full py-8 text-gray-500">No pending outgoing feedback to display.</div>
                ) : (
                  outgoingList.map((feedback, index) => (
                    <button
                      key={feedback.id}
                      onClick={() => setSelectedOutgoingIndex(index)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        currentOutgoingFeedback && currentOutgoingFeedback.id === feedback.id
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {feedback.department}
                    </button>
                  ))
                )}
              </div>
            </div>

            {loadingOutgoing ? null : errorOutgoing ? null : outgoingList.length > 0 && currentOutgoingFeedback ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 min-w-[120px]">You rated:</span>
                      <span className="text-gray-800">
                        {currentOutgoingFeedback?.department} - {currentOutgoingFeedback?.rating}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="font-medium text-gray-700 min-w-[120px]">Your Remark:</span>
                      <span className="text-gray-800">"{currentOutgoingFeedback?.yourRemark}"</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="font-medium text-gray-700 min-w-[120px]">Category:</span>
                      <span className="text-gray-800">{currentOutgoingFeedback?.category}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start">
                      <span className="font-medium text-gray-700 min-w-[120px]">Target Date:</span>
                      <span className="text-gray-800">
                        {currentOutgoingFeedback?.target_date
                          ? new Date(currentOutgoingFeedback.target_date).toLocaleDateString('en-GB')
                          : '—'}
                      </span>
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
                        disabled={currentOutgoingFeedback === undefined}
                      >
                        <Check size={16} />
                        <span>Acknowledge</span>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RemarksResponse;
