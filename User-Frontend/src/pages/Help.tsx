
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const Help = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');

  const faqItems: FaqItem[] = [
    {
      id: 'q1',
      question: 'How do I submit a survey?',
      answer: 'Go to Survey > Choose the department > Answer the 5 questions > Submit.'
    },
    {
      id: 'q2',
      question: 'Why can\'t I see some departments?',
      answer: 'You can only rate departments assigned to you by the Admin. Self-rating is disabled.'
    },
    {
      id: 'q3',
      question: 'Can I edit a survey after submission?',
      answer: 'No, once submitted, surveys are locked for transparency.'
    },
    {
      id: 'q4',
      question: 'I forgot my password. What do I do?',
      answer: 'You can change your password Account > Change password. The Default Password is your ID Number.'
    },
    {
      id: 'q5',
      question: 'What happens if I skip a survey?',
      answer: 'Surveys must be completed before the internal deadline. Admin may send reminders or escalate.'
    }
  ];

  const handleSubmitQuery = () => {
    if (!query.trim()) {
      toast({
        title: 'Empty Query',
        description: 'Please enter your question before submitting.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Query Submitted',
      description: 'Your question has been submitted. Support will respond shortly.',
    });

    setQuery('');
  };

  return (
    <MainLayout>
      <div className="px-6 py-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          Help Center
        </h2>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <h3 className="text-xl font-medium mb-4">FAQ/Instruction :-</h3>
            
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 px-4">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        
      </div>
    </MainLayout>
  );
};

export default Help;
