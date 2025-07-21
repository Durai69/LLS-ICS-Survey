import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminDashboard } from '@/contexts/AdminDashboardContext';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { TooltipProps } from 'recharts';

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded shadow p-2">
        <div><strong>{label}</strong></div>
        <div>Overall : {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

interface PendingDepartment {
  name: string;
  pending_count: number;
}

const Dashboard = () => {
  const { stats, loading, error } = useAdminDashboard();
  const navigate = useNavigate();
  const [pendingDepartments, setPendingDepartments] = useState<PendingDepartment[]>([]);

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

  if (loading) return <div>Loading...</div>;
  if (error || !stats) return <div className="text-red-500">{error || "No data"}</div>;

  const { total_surveys_assigned, total_surveys_submitted, surveys_not_submitted, department_performance, below_80_departments } = stats;

  // Departments below 80% for alerts
  const lowRatingDepts = department_performance.filter(dept => dept.super_overall < 80);

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
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bar Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              Department Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-start">
              <div className="w-[400px] h-[300px]">
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
