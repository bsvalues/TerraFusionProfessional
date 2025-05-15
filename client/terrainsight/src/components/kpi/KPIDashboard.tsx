import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { kpiService } from '../../services/kpi/kpiService';
import { ValuationMetricsCard } from './ValuationMetricsCard';
import { MarketTrendCard } from './MarketTrendCard';
import { RegionalPerformanceCard } from './RegionalPerformanceCard';
import { ValueChangeCard } from './ValueChangeCard';

interface KPIDashboardProps {
  properties: Property[];
  className?: string;
  taxYear?: string;
}

/**
 * KPI Dashboard component with key performance indicators
 */
export const KPIDashboard: React.FC<KPIDashboardProps> = ({
  properties,
  className = '',
  taxYear
}) => {
  // Metric states
  const [valuationMetrics, setValuationMetrics] = useState(
    kpiService.calculateValuationMetrics(properties)
  );
  const [marketTrends, setMarketTrends] = useState(
    kpiService.calculateMarketTrends(properties)
  );
  const [regionalPerformance, setRegionalPerformance] = useState(
    kpiService.calculateRegionalPerformance(properties)
  );
  const [valueChanges, setValueChanges] = useState(
    kpiService.calculateValueChanges(properties)
  );
  
  // Update metrics when properties or tax year changes
  useEffect(() => {
    setValuationMetrics(kpiService.calculateValuationMetrics(properties));
    setMarketTrends(kpiService.calculateMarketTrends(properties));
    setRegionalPerformance(kpiService.calculateRegionalPerformance(properties));
    setValueChanges(kpiService.calculateValueChanges(properties));
  }, [properties, taxYear]);
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      <ValuationMetricsCard 
        metrics={valuationMetrics} 
        className="h-full"
      />
      
      <MarketTrendCard 
        trends={marketTrends}
        className="h-full" 
      />
      
      <RegionalPerformanceCard 
        performance={regionalPerformance}
        className="h-full" 
      />
      
      <ValueChangeCard 
        changes={valueChanges}
        className="h-full" 
      />
    </div>
  );
};