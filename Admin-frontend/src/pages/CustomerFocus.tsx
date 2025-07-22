import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomerFocus } from "@/contexts/CustomerFocusContext";
import { useDepartments } from "@/contexts/DepartmentsContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CustomerFocus = () => {
  const { data, loading, error } = useCustomerFocus();
  const { departments } = useDepartments();
  const [selectedDept, setSelectedDept] = React.useState<string>("All");

  const filteredData = selectedDept === "All"
    ? data
    : data.filter(item => item.toDepartment === selectedDept || item.fromDepartment === selectedDept);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Focus – ICS Survey Action Plan</h1>
        <p className="text-muted-foreground">
          Manage and track customer survey action plans
        </p>
      </div>
      <div className="mb-4">
        <Select
          value={selectedDept}
          onValueChange={setSelectedDept}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SL No</TableHead>
              <TableHead>Survey Date</TableHead>
              <TableHead>To Department</TableHead>
              <TableHead>From Department</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Action Planned</TableHead>
              <TableHead>Responsibility</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>Acknowledgement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading...</TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9}>{error}</TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.survey_date}</TableCell>
                  <TableCell>{item.toDepartment}</TableCell>
                  <TableCell>{item.fromDepartment}</TableCell>
                  <TableCell>{item.remark}</TableCell>
                  <TableCell>{item.action_plan}</TableCell>
                  <TableCell>{item.responsible_person}</TableCell>
                  <TableCell>{item.target_date}</TableCell>
                  <TableCell>{item.acknowledged ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9}>No records found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerFocus;
