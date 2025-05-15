import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, ChevronUp, ChevronDown, Info, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { ValuationMetrics } from '../../services/kpi/kpiService';
import { ValuationDistributionChart } from './charts/ValuationDistributionChart';

interface ValuationMetricsCardProps {
  metrics: ValuationMetrics;
  className?: string;
}

/**
 * Card displaying property valuation metrics
 */
export const ValuationMetricsCard: React.FC<ValuationMetricsCardProps> = ({
  metrics,
  className = ''
}) => {
  return (
    <Card className={`${className}`} data-testid="valuation-metrics-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Valuation Metrics</CardTitle>
            <CardDescription>Property value distribution</CardDescription>
          </div>
          <div>
            <Calculator className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Properties</div>
            <div className="text-lg font-medium">
              {metrics.totalProperties}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Value</div>
            <div className="text-lg font-medium">
              {formatCurrency(metrics.totalValue, { notation: 'compact' })}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Average Value</div>
            <div className="text-lg font-medium">
              {formatCurrency(metrics.averageValue)}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Median Value</div>
            <div className="text-lg font-medium">
              {formatCurrency(metrics.medianValue)}
            </div>
          </div>
        </div>
        
        <div className="h-60 mb-4">
          <ValuationDistributionChart data={metrics.valuationRanges} />
        </div>
        
        <div className="flex justify-between text-sm">
          <div className="">
            <span className="text-gray-500">Min:</span> {formatCurrency(metrics.minValue)}
          </div>
          <div className="">
            <span className="text-gray-500">Max:</span> {formatCurrency(metrics.maxValue)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};