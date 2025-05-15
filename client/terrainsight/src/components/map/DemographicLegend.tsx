import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { colorSchemes, demographicMetrics, generateColor } from '@/services/neighborhoodDemographicService';
import { cn } from '@/lib/utils';

interface DemographicLegendProps {
  metric: string;
  colorScheme: string;
  minValue: number;
  maxValue: number;
  className?: string;
  onClose?: () => void;
}

export const DemographicLegend: React.FC<DemographicLegendProps> = ({
  metric,
  colorScheme,
  minValue,
  maxValue,
  className,
  onClose
}) => {
  // Get metric info for proper formatting
  const metricInfo = demographicMetrics.find(m => m.id === metric);
  
  if (!metricInfo) return null;
  
  // Generate steps for the legend
  const steps = 5;
  const stepValues = Array.from({ length: steps }, (_, i) => {
    const value = minValue + (maxValue - minValue) * (i / (steps - 1));
    return value;
  });
  
  // Format values based on metric type
  const formatValue = (value: number) => {
    if (metricInfo.format === 'currency') {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(value);
    } else if (metricInfo.format === 'percent') {
      return `${value.toFixed(1)}%`;
    } else {
      return value.toFixed(1);
    }
  };
  
  return (
    <Card className={cn("w-56 shadow-md", className)}>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">{metricInfo.label} Legend</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col gap-1">
          {stepValues.map((value, index) => (
            <div key={index} className="flex items-center justify-between">
              <div 
                className="w-6 h-6 rounded-sm mr-2" 
                style={{ backgroundColor: generateColor(value, minValue, maxValue, colorScheme) }}
              />
              <span className="text-xs">{formatValue(value)}</span>
            </div>
          )).reverse()}
        </div>
      </CardContent>
    </Card>
  );
};

export default DemographicLegend;