import { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Define the DateRange type to be consistent with ManagePermissions.tsx
interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// Define the props interface for DateRangePicker
interface DateRangePickerProps {
  onSelectDateRange: (range: DateRange) => void;
  selectedDateRange?: DateRange; // <--- NEW: Add selectedDateRange prop
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onSelectDateRange, selectedDateRange }) => {
  // Initialize internal state with the prop, or undefined if prop is not provided
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(selectedDateRange?.from);

  // Effect to synchronize internal state with the `selectedDateRange` prop
  useEffect(() => {
    setSelectedDate(selectedDateRange?.from);
  }, [selectedDateRange]);

  // Effect to propagate the selected date to the parent component
  useEffect(() => {
    onSelectDateRange({ from: selectedDate, to: selectedDate });
  }, [selectedDate, onSelectDateRange]);

  return (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-sm font-medium">Select Date</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Select Date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
