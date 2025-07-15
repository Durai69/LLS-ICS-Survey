import { useState, useEffect } from 'react';
import { downloadAdminExcel } from '@/contexts/ReportsContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// Define types for departments and reports if possible
interface Department {
  id: number;
  name: string;
}

interface SurveyReport {
  id: number;
  fromDept: string;
  toDept: string;
  date: string;
  avgRating?: number;
  remark?: string;
}

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

const SurveyReports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [fromDept, setFromDept] = useState('all');
  const [toDept, setToDept] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [reports, setReports] = useState<SurveyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const surveyPeriods = getSurveyPeriods();

  // Fetch departments for dropdowns
  useEffect(() => {
    setLoading(true);
    axios.get<Department[]>('/api/departments')
      .then(res => {
        if (Array.isArray(res.data)) {
          setDepartments(res.data.map((dept) => dept.name).filter(Boolean));
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

  // Fetch reports from backend when filters change
  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get<any[]>('/api/admin/reports', {
      params: {
        fromDept,
        toDept,
        timePeriod: selectedPeriod,
      }
    })
      .then(res => {
        if (Array.isArray(res.data)) {
          setReports(res.data.map((r, idx) => ({
            id: r.id ?? idx,
            fromDept: r.from_department ?? '',
            toDept: r.to_department ?? '',
            date: r.date ?? '',
            avgRating: r.avgRating ?? undefined,
            remark: r.remark ?? undefined,
          })));
        } else {
          setReports([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load reports');
        setLoading(false);
      });
  }, [fromDept, toDept, selectedPeriod]);

  const handleDownloadExcel = () => {
    downloadAdminExcel(fromDept, toDept, selectedPeriod);
  };

  const handleApplyFilter = () => {
    if (!selectedPeriod) {
      setError('Please select a survey period.');
      return;
    }
    setError('');
    // Triggers useEffect to fetch reports
  };

  // Adjust filtering to treat "all" as no filter
  useEffect(() => {
    if (fromDept === 'all') setFromDept('');
    if (toDept === 'all') setToDept('');
  }, [fromDept, toDept]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Survey Reports</h1>
        <p className="text-muted-foreground mb-4">
          View and analyze department survey data. Use the filters below to narrow down results.
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
        <div className="flex-1">
          <Select value={fromDept} onValueChange={setFromDept} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="From Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={toDept} onValueChange={setToDept} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="To Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleApplyFilter} disabled={loading} className="bg-primary">
          Apply
        </Button>
      </div>

      {error && (
        <div className="text-red-600 font-medium mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500"></span>
          <span className="ml-3 text-lg text-gray-500">Loading reports...</span>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-insight-light-blue bg-opacity-30">
                <TableRow>
                  <TableHead>From Dept.</TableHead>
                  <TableHead>To Dept.</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow
                      key={report.id}
                    >
                      <TableCell>{report.fromDept}</TableCell>
                      <TableCell>{report.toDept}</TableCell>
                      <TableCell>
                        {new Date(report.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No reports match your filters
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleDownloadExcel}
              disabled={loading || reports.length === 0}
              variant="outline"
              className="text-green-600 border-green-600"
            >
              Download
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SurveyReports;
