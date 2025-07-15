import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { downloadExcel } from "@/contexts/ExcelContext"; // Import the function

const getSurveyPeriods = () => {
  const SERVICE_START_YEAR = 2025;
  const now = new Date();
  // Academic year starts in July
  const currentAcademicYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;

  // Only show periods from SERVICE_START_YEAR up to currentAcademicYear, max 3 years
  const periods: string[] = [];
  // Calculate the earliest year to show (max 3 years, but not before SERVICE_START_YEAR)
  const earliestYear = Math.max(SERVICE_START_YEAR, currentAcademicYear - 2);

  for (let year = earliestYear; year <= currentAcademicYear; year++) {
    const nextYear = year + 1;
    periods.unshift(`${year}-${nextYear} 2nd Survey`);
    periods.unshift(`${year}-${nextYear} 1st Survey`);
  }
  return periods;
};

interface DownloadRecord {
  fileName: string;
  date: string;
}

const ExcelExport = () => {
  const { toast } = useToast();
  const [timePeriod, setTimePeriod] = useState('');
  const [downloads, setDownloads] = useState<DownloadRecord[]>([
    { fileName: 'surveys_packaging.xls', date: '14 May 2025' },
    { fileName: 'dept_rating_aug.xls', date: '14 Aug 2025' },
  ]);
  const surveyPeriods = getSurveyPeriods(); // Show 3 years ahead

  const handleDownload = async (type: string) => {
    toast({
      title: 'Download Started',
      description: `${type} data is being downloaded.`,
    });

    try {
      await downloadExcel(type, timePeriod);
      toast({
        title: 'Download Complete',
        description: `${type} has been downloaded successfully.`,
      });
    } catch (err) {
      toast({
        title: 'Download Failed',
        description: 'There was an error downloading the file.',
        variant: 'destructive',
      });
    }
  };

  const handleReDownload = (fileName: string) => {
    toast({
      title: 'Re-downloading File',
      description: `Re-downloading ${fileName}...`,
    });
    
    // Mock re-download
    setTimeout(() => {
      toast({
        title: 'Download Complete',
        description: `${fileName} has been downloaded successfully.`,
      });
    }, 1000);
  };

  const handleApplyFilter = () => {
    if (!timePeriod) {
      toast({
        title: 'Filter Error',
        description: 'Please select a time period first.',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Filter Applied',
      description: `Filtering data for ${timePeriod}.`,
    });
  };

  return (
    <MainLayout>
      <div className="px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          Download Your Data
        </h2>

        <div className="space-y-12">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-lg font-medium w-48">Select Survey Period:</div>
            <div className="flex-1 flex space-x-4">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Survey Period" />
                </SelectTrigger>
                <SelectContent>
                  {surveyPeriods.map(period => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleApplyFilter} className="bg-primary">
                Apply
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">My Submitted Surveys</div>
                <div className="text-gray-600 text-sm max-w-xl">
                  This file contains all details about the surveys you have submitted, including:
                  <ul className="list-disc ml-6">
                    <li>Survey ID, Department, Date of Submission</li>
                    <li>All questions and answers (ratings, remarks, categories)</li>
                    <li>Any suggestions or comments provided</li>
                    <li>Your own details (username, department)</li>
                  </ul>
                  <span className="block mt-2">Purpose: Keep a complete record of your survey activity.</span>
                </div>
              </div>
              <Button onClick={() => handleDownload('My Submitted Surveys')} variant="outline" className="text-green-600 border-green-600">
                Download
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">My Submitted Action Plans</div>
                <div className="text-gray-600 text-sm max-w-xl">
                  This file provides a detailed view of all feedback and action plans related to your submissions, including:
                  <ul className="list-disc ml-6">
                    <li>Who rated you and which department gave the rating</li>
                    <li>Rating value and category</li>
                    <li>Explanation for poor performance (if any)</li>
                    <li>Action plan proposed by the managed department</li>
                    <li>Responsible person for the action plan</li>
                    <li>Target date for resolution</li>
                    <li>Whether the managed department acknowledged the feedback</li>
                  </ul>
                  <span className="block mt-2">Purpose: Track all remarks, responses, and accountability for improvements.</span>
                </div>
              </div>
              <Button onClick={() => handleDownload('My Submitted Action Plans')} variant="outline" className="text-green-600 border-green-600">
                Download
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
            </div>
          </div>

          
        </div>
      </div>
    </MainLayout>
  );
};

export default ExcelExport;
