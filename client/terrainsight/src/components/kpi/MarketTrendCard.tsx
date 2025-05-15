import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Layers, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { MarketTrend } from '../../services/kpi/kpiService';
import { MarketTrendLineChart } from './charts/MarketTrendLineChart';

interface MarketTrendCardProps {
  trends: MarketTrend[];
  className?: string;
}

/**
 * Card displaying market trend data
 */
export const MarketTrendCard: React.FC<MarketTrendCardProps> = ({
  trends,
  className = ''
}) => {
  // Views - can be 'value' or 'volume'
  const [view, setView] = useState<'value' | 'volume'>('value');
  
  // Calculate percentage change between start and end of period
  const overallChange = useMemo(() => {
    if (trends.length < 2) return 0;
    const first = trends[0].averageValue;
    const last = trends[trends.length - 1].averageValue;
    return ((last - first) / first) * 100;
  }, [trends]);
  
  // Calculate average monthly change
  const averageMonthlyChange = useMemo(() => {
    if (trends.length <= 1) return 0;
    const totalChange = trends.reduce((sum, trend, index) => {
      if (index === 0) return sum;
      return sum + trend.percentageChange;
    }, 0);
    return totalChange / (trends.length - 1);
  }, [trends]);
  
  // Get the last month's value
  const currentValue = useMemo(() => {
    if (trends.length === 0) return 0;
    return trends[trends.length - 1].averageValue;
  }, [trends]);
  
  // Get total sales volume
  const totalSalesVolume = useMemo(() => {
    return trends.reduce((sum, trend) => sum + trend.salesVolume, 0);
  }, [trends]);
  
  return (
    <Card className={`${className}`} data-testid="market-trend-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Market Trends</CardTitle>
            <CardDescription>Average property values over time</CardDescription>
          </div>
          <div>
            <Activity className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Current Avg. Value</div>
            <div className="text-lg font-medium">
              {formatCurrency(currentValue)}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Change</div>
            <div className={`flex items-center text-lg font-medium ${overallChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {overallChange >= 0 ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              {formatPercentage(overallChange)}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Total Sales Volume</div>
            <div className="text-lg font-medium">
              {totalSalesVolume} units
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Avg. Monthly Change</div>
            <div className={`flex items-center text-lg font-medium ${averageMonthlyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {averageMonthlyChange >= 0 ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
              {formatPercentage(averageMonthlyChange)}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">
            {view === 'value' ? 'Average Value Trend' : 'Sales Volume Trend'}
          </div>
          <div className="flex space-x-1">
            <button 
              className={`px-2 py-1 text-xs rounded transition-colors ${
                view === 'value' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setView('value')}
              aria-label="Show value trend"
              title="Show value trend"
            >
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                Value
              </div>
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded transition-colors ${
                view === 'volume' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setView('volume')}
              aria-label="Show volume trend"
              title="Show volume trend"
            >
              <div className="flex items-center">
                <Layers className="h-3 w-3 mr-1" />
                Volume
              </div>
            </button>
          </div>
        </div>
        
        <div className="h-60">
          <MarketTrendLineChart 
            data={trends}
            view={view}
          />
        </div>
      </CardContent>
    </Card>
  );
};