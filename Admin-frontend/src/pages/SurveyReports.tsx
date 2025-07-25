import { useState, useEffect } from 'react';
import { downloadAdminUserRatings, downloadAdminActionPlans, downloadAdminOverallResponse } from '@/contexts/ReportsContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const getSurveyPeriods = () => {
  const SERVICE_START_YEAR = 2025;
  const now = new Date();
  // Academic year starts in July
  const currentAcademicYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const periods: string[] = [];
  const earliestYear = Math.max(SERVICE_START_YEAR, currentAcademicYear - 2);
  for (let year = earliestYear; year <= currentAcademicYear; year++) {
    const nextYear = year + 1;
    periods.unshift(`${year}-${nextYear} 2nd Survey`);
    periods.unshift(`${year}-${nextYear} 1st Survey`);
  }
  return periods;
};

const SurveyReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const surveyPeriods = getSurveyPeriods();

  useEffect(() => {
    setLoading(true);
    axios.get('/api/departments')
      .then(res => {
        if (Array.isArray(res.data)) {
          setDepartments(res.data.map((dept: any) => dept.name).filter(Boolean));
        } else {
          setDepartments([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load departments');
        setLoading(false);
      });
  }, []);

  const handleDownloadUserRatings = async () => {
    if (!selectedDept || !selectedPeriod) {
      setError('Please select both department and time period.');
      return;
    }
    setError('');
    await downloadAdminUserRatings(selectedDept, selectedPeriod);
  };

  const handleDownloadActionPlans = async () => {
    if (!selectedDept || !selectedPeriod) {
      setError('Please select both department and time period.');
      return;
    }
    setError('');
    await downloadAdminActionPlans(selectedDept, selectedPeriod);
  };

  const handleDownloadOverallResponse = async () => {
    if (!selectedPeriod) {
      setError('Please select a time period.');
      return;
    }
    setError('');
    await downloadAdminOverallResponse(selectedPeriod);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Admin Excel Export</h1>
        <p className="text-muted-foreground mb-4">
          Download survey data for any department and period. Select a survey period and department (if required) to export the desired report.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Survey Period" />
            </SelectTrigger>
            <SelectContent>
              {surveyPeriods.map(period => (
                <SelectItem key={period} value={period}>{period}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="text-red-600 font-medium mb-4">{error}</div>
      )}

      <div className="space-y-8 mt-8">
        {/* Individual User Data (User's Overall Rating) */}
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <div className="text-lg font-medium">Individual User Data (User's Overall Rating)</div>
            <div className="text-gray-600 text-sm max-w-xl">
              Download the overall ratings for a specific department/user for the selected period.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadUserRatings} variant="outline" className="text-green-600 border-green-600">
              Download
            </Button>
          </div>
        </div>

        {/* Individual Action Planned */}
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <div className="text-lg font-medium">Individual Action Planned</div>
            <div className="text-gray-600 text-sm max-w-xl">
              Download the action plans for a specific department for the selected period.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDept} onValueChange={setSelectedDept} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadActionPlans} variant="outline" className="text-green-600 border-green-600">
              Download
            </Button>
          </div>
        </div>

        {/* Overall Response (All Departments) */}
        <div className="flex items-center justify-between border rounded-lg p-4">
          <div>
            <div className="text-lg font-medium">Overall Response (All Departments)</div>
            <div className="text-gray-600 text-sm max-w-xl">
              Download the overall survey response data for all departments for the selected period.
            </div>
          </div>
          <Button onClick={handleDownloadOverallResponse} variant="outline" className="text-green-600 border-green-600">
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SurveyReports;
