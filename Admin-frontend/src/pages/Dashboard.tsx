import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboard } from '@/contexts/AdminDashboardContext';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { ResponsivePie } from '@nivo/pie';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { TooltipProps } from 'recharts';
import './Dashboard.css';
import HorizontalStackedBarChart from 'react-horizontal-stacked-bar-chart';

type PendingDepartment = {
  name: string;
  pending_count: number;
};

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip-background">
        <div><strong>{label}</strong></div>
        <div>Overall : {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

// New custom tooltip component for the Pie Chart
interface PieTooltipProps {
  datum: {
    id: string | number;
    label: string | number;
    value: number;
    color: string; // The hex color string from Nivo (still passed but not used for text color)
  };
}

// Removed the getTooltipColorClass helper function as it's no longer needed

const PieTooltip = ({ datum }: PieTooltipProps) => {
  return (
    // Apply only the base tooltip-content class; color is now handled by CSS directly
    <div className="tooltip-content">
      <strong>{datum.label}</strong>: {datum.value}
    </div>
  );
};

const COLORS = ['#4ade80', '#f97316', '#8b5cf6']; // green, orange, purple (changed yellow and red)

const Dashboard = () => {
  const { stats, loading, error } = useAdminDashboard();
  const navigate = useNavigate();
  const [pendingDepartments, setPendingDepartments] = useState<PendingDepartment[]>([]);
  const [surveyAttendanceStats, setSurveyAttendanceStats] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    axios.get<{ total_not_submitted: number; pending_departments: PendingDepartment[] }>('/api/dashboard/pending-surveys', { withCredentials: true })
      .then(res => {
        if (res.data && Array.isArray(res.data.pending_departments)) {
          setPendingDepartments(res.data.pending_departments);
        } else {
          setPendingDepartments([]);
        }
      })
      .catch(() => setPendingDepartments([]));
  }, []);

  useEffect(() => {
    if (!loading && !error && stats) {
      const attendanceData = [
        { name: 'On Time', value: stats.survey_attendance_stats?.on_time || 0 },
        { name: 'Late', value: stats.survey_attendance_stats?.late || 0 },
        { name: 'Missed', value: stats.survey_attendance_stats?.missed || 0 },
      ];
      setSurveyAttendanceStats(attendanceData);
    }
  }, [loading, error, stats]);

  if (loading) return <div>Loading...</div>;
  if (error || !stats) return <div className="text-red-500">{error || "No data"}</div>;

  const { total_surveys_assigned, total_surveys_submitted, surveys_not_submitted, department_performance, below_80_departments, attendance_departments } = stats;

  // Function to determine bar color based on super_overall
  const getBarColor = (entry: any) => {
    return entry.super_overall < 80 ? '#ef4444' : '#a5b4fc';
  };

  // Optional: handle bar click for departments below 80%
  const handleBarClick = (data: any) => {
    if (data.super_overall < 80) {
      // Example: navigate to remarks page or show modal
      navigate('/customer-focus');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Admin Dashboard
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Surveys Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {total_surveys_assigned}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Surveys Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-insight-danger">
              {total_surveys_submitted}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Surveys Not Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-insight-warning">
              {surveys_not_submitted}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Charts and User Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Bar Chart */}
        <Card className="col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Department Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-start">
                <div className="w-full h-[300px] min-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={department_performance}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    barCategoryGap={30}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
                    <Tooltip
                      content={<CustomTooltip />}
                      wrapperStyle={{ display: department_performance.length === 0 ? 'none' : undefined }}
                    />
                    {department_performance.length > 0 && (
                      <Bar dataKey="super_overall" onClick={handleBarClick}>
                        {department_performance.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(entry)}
                            stroke={entry.super_overall >= 80 ? '#9b87f5' : '#FF6B6B'}
                            strokeWidth={1}
                          />
                        ))}
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              *Click on Red Bar to view the remarks / improvement suggestions
            </div>
          </CardContent>
        </Card>
        {/* Pie Chart for Survey Attendance */}
        {/* Moved Survey Attendance section down below Pending Surveys */}
      </div>
      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-insight-danger">
            Alert: Departments Below 80% Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          {below_80_departments.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {below_80_departments.map((dept) => (
                <li key={dept} className="text-gray-700">
                  <span className="font-medium">{dept}</span>
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Needs Attention
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No departments currently below threshold.</p>
          )}
        </CardContent>
      </Card>
      {/* Pending Surveys Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-insight-warning">
            Department yet to complete surveys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingDepartments.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {pendingDepartments.map((dept) => (
                <li key={dept.name} className="text-gray-700 flex items-center justify-between">
                  <span className="font-medium">{dept.name}</span>
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {dept.pending_count} Pending
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">All departments have completed their surveys.</p>
          )}
        </CardContent>
      </Card>
      {/* Survey Attendance Section Moved Here */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">
            Survey Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="pie-chart-container">
            <ResponsivePie
              data={surveyAttendanceStats.map((d) => ({
                id: d.name,
                label: d.name,
                value: d.value,
              }))}
              colors={COLORS} // Use the COLORS array
              margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
              innerRadius={0.5}
              padAngle={1}
              cornerRadius={3}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              enableArcLabels={true}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor="#333333"
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              tooltip={({ datum }) => (
                // Use the new PieTooltip component here
                <PieTooltip datum={datum} />
              )}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateY: 36,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemsSpacing: 0,
                  symbolSize: 18,
                  symbolShape: 'circle',
                },
              ]}
              onClick={(data, event) => {
                // Replace alert with a custom modal or message box if needed
                console.log(`Clicked on ${data.id}: ${data.value}`);
              }}
              role="img"
              arcLabel="Survey attendance pie chart"
            />
          </div>
          {/* Subsections for On Time, Late, Missed with department names */}
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-semibold text-green-600">On Time Submission</h4>
              {attendance_departments?.on_time_departments.length ? (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {attendance_departments.on_time_departments.map((dept) => (
                    <li key={dept}>{dept}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No departments with on time submissions.</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-orange-600">Late Submission</h4>
              {attendance_departments?.late_departments.length ? (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {attendance_departments.late_departments.map((dept) => (
                    <li key={dept}>{dept}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No departments with late submissions.</p>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-purple-600">Not Submitted</h4>
              {attendance_departments?.missed_departments.length ? (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {attendance_departments.missed_departments.map((dept) => (
                    <li key={dept}>{dept}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No departments with missed submissions.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Summary */}
      <div className="mt-6 bg-muted p-4 rounded-md">
        <h3 className="text-sm font-medium mb-2">Summary</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Total surveys Assigned: {total_surveys_assigned}</li>
          <li>Surveys Submitted: {total_surveys_submitted}</li>
          <li>Surveys not submitted: {surveys_not_submitted}</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
