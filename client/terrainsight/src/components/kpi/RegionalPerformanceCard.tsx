import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, BarChart4 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { RegionalPerformance } from '../../services/kpi/kpiService';

interface RegionalPerformanceCardProps {
  performance: RegionalPerformance[];
  className?: string;
}

/**
 * Card displaying regional performance data
 */
export const RegionalPerformanceCard: React.FC<RegionalPerformanceCardProps> = ({
  performance,
  className = ''
}) => {
  // Sort options
  const [sortBy, setSortBy] = useState<'value' | 'change'>('change');
  
  // Function to get sorted and limited performance data
  const getSortedPerformance = () => {
    return [...performance]
      .sort((a, b) => {
        if (sortBy === 'value') {
          return b.averageValue - a.averageValue;
        } else {
          return Math.abs(b.percentageChange) - Math.abs(a.percentageChange);
        }
      })
      .slice(0, 5); // Show only top 5
  };
  
  return (
    <Card className={`${className}`} data-testid="regional-performance-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Regional Performance</CardTitle>
            <CardDescription>Property values by neighborhood</CardDescription>
          </div>
          <div>
            <Map className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">Top Performing Regions</span>
          <div className="flex space-x-1">
            <button 
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === 'change' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSortBy('change')}
              aria-label="Sort by change"
              title="Sort by change"
            >
              Change %
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === 'value' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSortBy('value')}
              aria-label="Sort by value"
              title="Sort by value"
            >
              Value
            </button>
          </div>
        </div>
        
        {performance.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center">
            <BarChart4 className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500">No regional data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getSortedPerformance().map((region, index) => (
              <div 
                key={index}
                className="bg-gray-50 p-3 rounded-md"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm">
                    {region.region}
                  </span>
                  <span className={`text-sm ${
                    region.percentageChange > 0 
                      ? 'text-green-600' 
                      : region.percentageChange < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {formatPercentage(region.percentageChange)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Avg. Value: {formatCurrency(region.averageValue)}</span>
                  <span>{region.propertyCount} properties</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      region.percentageChange > 10 
                        ? 'bg-green-500' 
                        : region.percentageChange > 0 
                        ? 'bg-green-400' 
                        : region.percentageChange > -10 
                        ? 'bg-red-400' 
                        : 'bg-red-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, Math.max(5, Math.abs(region.percentageChange) * 3))}%` 
                    }}
                  />
                </div>
              </div>
            ))}
            
            <div className="text-xs text-gray-500 italic text-center mt-2">
              Based on {performance.length} neighborhoods
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};