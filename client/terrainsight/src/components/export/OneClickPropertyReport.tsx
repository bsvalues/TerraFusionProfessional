import React from 'react';
import { Property } from '@/shared/schema';
import { OneClickExport } from './OneClickExport';
import { FileText } from 'lucide-react';

interface OneClickPropertyReportProps {
  property?: Property;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonText?: string;
  className?: string;
}

/**
 * One-click property report component that generates a detailed report
 * for a specific property without additional configuration
 */
export const OneClickPropertyReport: React.FC<OneClickPropertyReportProps> = ({
  property,
  variant = 'default',
  buttonText = 'Generate Property Report',
  className,
}) => {
  if (!property) {
    return null;
  }
  
  return (
    <OneClickExport 
      propertyId={property.id as number}
      text={buttonText}
      icon={<FileText className="mr-2 h-4 w-4" />}
      variant={variant}
      className={className}
    />
  );
};

export default OneClickPropertyReport;