import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ExportService } from '@/services/exportService';

interface OneClickExportProps {
  text: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  icon?: React.ReactNode;
  className?: string;
}

export const OneClickExport: React.FC<OneClickExportProps> = ({
  text,
  variant = 'default',
  size = 'default',
  icon,
  className = '',
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Display a loading toast
      toast({
        title: 'Preparing Export',
        description: 'Generating and packaging all analysis reports...',
        variant: 'default',
      });
      
      // Call the export service
      const result = await ExportService.exportAllReports();
      
      // Check if export was successful
      if (result.success) {
        toast({
          title: 'Export Complete',
          description: `Successfully exported ${result.count} reports to ${result.fileName}`,
          variant: 'default',
        });
      } else {
        throw new Error(result.error || 'Unknown error during export');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <>
          <span className="animate-spin mr-2">◌</span>
          <span>Exporting...</span>
        </>
      ) : (
        <>
          {icon}
          <span>{text}</span>
        </>
      )}
    </Button>
  );
};