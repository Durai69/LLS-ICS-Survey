
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

  const handleDownload = (type: string) => {
    toast({
      title: 'Download Started',
      description: `${type} data is being downloaded.`,
    });
    
    // In a real app, this would trigger an actual download
    setTimeout(() => {
      const newRecord: DownloadRecord = {
        fileName: `${type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.xls`,
        date: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      };
      
      setDownloads([newRecord, ...downloads]);
      
      toast({
        title: 'Download Complete',
        description: `${type} has been downloaded successfully.`,
      });
    }, 1500);
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
            <div className="text-lg font-medium w-48">Filter by Date Range:</div>
            <div className="flex-1 flex space-x-4">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 6 Months</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleApplyFilter} className="bg-primary">
                Apply
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">My Submitted Surveys</div>
              <Button onClick={() => handleDownload('My Submitted Surveys')} variant="outline" className="text-green-600 border-green-600">
                Download
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Department Ratings</div>
              <Button onClick={() => handleDownload('Department Ratings')} variant="outline" className="text-green-600 border-green-600">
                Download
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Submitted Remarks Only</div>
              <Button onClick={() => handleDownload('Submitted Remarks')} variant="outline" className="text-green-600 border-green-600">
                Download
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-medium">Recent Downloads :</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2 border">File name</th>
                    <th className="px-4 py-2 border">Date Downloaded</th>
                    <th className="px-4 py-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((download, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2 border">{download.fileName}</td>
                      <td className="px-4 py-2 border">{download.date}</td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => handleReDownload(download.fileName)}
                          className="text-green-600 hover:text-green-800"
                        >
                          [Re-download]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-gray-600 mt-4 text-sm">
              Note: Data reflects your submission history and assigned departments only. Contact admin for full access.
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ExcelExport;
