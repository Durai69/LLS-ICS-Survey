import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  selectedPeriod: string;
  setSelectedPeriod: (value: string) => void;
  fromDept: string;
  setFromDept: (value: string) => void;
  toDept: string;
  setToDept: (value: string) => void;
  departments: string[];
  disabled?: boolean;
}

export const FilterBar = ({
  selectedPeriod,
  setSelectedPeriod,
  fromDept,
  setFromDept,
  toDept,
  setToDept,
  departments,
  disabled,
}: FilterBarProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Filters */}
      <div className="flex items-center space-x-2 w-full md:w-auto">
        <Select
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          disabled={disabled}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Survey Period" />
          </SelectTrigger>
          <SelectContent>
            {/* Replace with your dynamic academic year logic */}
            <SelectItem value="">All Periods</SelectItem>
            <SelectItem value="2025-2026 1st Survey">2025-2026 1st Survey</SelectItem>
            <SelectItem value="2025-2026 2nd Survey">2025-2026 2nd Survey</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={fromDept}
          onValueChange={setFromDept}
          disabled={disabled}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="From Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.filter(Boolean).map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={toDept}
          onValueChange={setToDept}
          disabled={disabled}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="To Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.filter(Boolean).map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
