import { Property } from '@shared/schema';
import { ReportGenerator } from './ReportGenerator';

interface PropertyReportGeneratorProps {
  property?: Property;
  className?: string;
}

/**
 * Property Report Generator Component
 * A wrapper around the generic report generator that pre-configures it for a specific property
 */
export const PropertyReportGenerator = ({ property, className }: PropertyReportGeneratorProps) => {
  if (!property) {
    return (
      <div className="text-center p-4 bg-muted/20 rounded-md">
        <p className="text-muted-foreground">Select a property to generate a report</p>
      </div>
    );
  }
  
  return (
    <ReportGenerator 
      propertyId={property.id}
      className={className}
    />
  );
};