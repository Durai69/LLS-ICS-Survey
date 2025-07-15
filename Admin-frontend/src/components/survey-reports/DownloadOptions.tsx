import { Button } from '@/components/ui/button';
import { FileSpreadsheet } from 'lucide-react';

interface DownloadOptionsProps {
  onDownloadExcel: () => void;
  disabled?: boolean;
}

export const DownloadOptions = ({ 
  onDownloadExcel, 
  disabled 
}: DownloadOptionsProps) => {
  return (
    <div className="pt-4">
      <h3 className="font-medium text-gray-700 mb-2">Download Options</h3>
      <Button
        variant="outline"
        onClick={onDownloadExcel}
        className="flex items-center"
        disabled={disabled}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-500" /> Download as Excel
      </Button>
    </div>
  );
};
