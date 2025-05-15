import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, DollarSign, SortAsc, GitCompare } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { ValueChange } from '../../services/kpi/kpiService';
import { ValueChangeBarChart } from './charts/ValueChangeBarChart';

interface ValueChangeCardProps {
  changes: ValueChange[];
  className?: string;
}

/**
 * Card displaying property value changes
 */
export const ValueChangeCard: React.FC<ValueChangeCardProps> = ({
  changes,
  className = ''
}) => {
  // Sort options
  const [sortBy, setSortBy] = useState<'absolute' | 'percentage'>('percentage');
  
  // Get total change
  const getTotalChange = () => {
    const sum = changes.reduce((total, change) => total + change.changeAmount, 0);
    return sum;
  };
  
  // Get average percentage change
  const getAveragePercentChange = () => {
    if (changes.length === 0) return 0;
    const sum = changes.reduce((total, change) => total + change.changePercentage, 0);
    return sum / changes.length;
  };
  
  // Find largest increase
  const getLargestIncrease = () => {
    if (changes.length === 0) return null;
    
    return changes.reduce((max, change) => {
      return (change.changePercentage > max.changePercentage) ? change : max;
    });
  };
  
  // Find largest decrease
  const getLargestDecrease = () => {
    if (changes.length === 0) return null;
    
    return changes.reduce((min, change) => {
      return (change.changePercentage < min.changePercentage) ? change : min;
    });
  };
  
  // Toggle sort option
  const toggleSort = (option: 'absolute' | 'percentage') => {
    setSortBy(option);
  };
  
  return (
    <Card className={`${className}`} data-testid="value-change-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Value Changes</CardTitle>
            <CardDescription>Property value changes by type</CardDescription>
          </div>
          <div>
            <GitCompare className="h-4 w-4 text-gray-500" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-sm text-gray-500 mb-1">Total Change</div>
            <div className={`font-bold text-lg ${getTotalChange() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(getTotalChange())}
            </div>
          </div>
          
          <div className="bg-primary/5 rounded-lg p-3">
            <div className="text-sm text-gray-500 mb-1">Avg. % Change</div>
            <div className={`font-bold text-lg ${getAveragePercentChange() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(getAveragePercentChange())}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
          <div className="text-sm font-medium">Change by Property Type</div>
          <div className="flex space-x-1">
            <button 
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === 'percentage' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => toggleSort('percentage')}
              aria-label="Sort by percentage"
              title="Sort by percentage"
            >
              <div className="flex items-center">
                <Calculator className="h-3 w-3 mr-1" />
                Percentage
              </div>
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded transition-colors ${
                sortBy === 'absolute' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => toggleSort('absolute')}
              aria-label="Sort by absolute value"
              title="Sort by absolute value"
            >
              <div className="flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                Absolute
              </div>
            </button>
          </div>
        </div>
        
        <div className="h-60 mb-6">
          <ValueChangeBarChart 
            data={changes}
            sortBy={sortBy}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {getLargestIncrease() && (
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <div className="text-sm font-medium text-green-700 mb-1">Largest Increase</div>
              <div className="text-xs text-green-600">{getLargestIncrease()?.propertyType}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-green-700">
                  {formatPercentage(getLargestIncrease()?.changePercentage || 0)}
                </span>
                <span className="text-xs">
                  {formatCurrency(getLargestIncrease()?.changeAmount || 0)}
                </span>
              </div>
            </div>
          )}
          
          {getLargestDecrease() && getLargestDecrease()?.changePercentage < 0 && (
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <div className="text-sm font-medium text-red-700 mb-1">Largest Decrease</div>
              <div className="text-xs text-red-600">{getLargestDecrease()?.propertyType}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-red-700">
                  {formatPercentage(getLargestDecrease()?.changePercentage || 0)}
                </span>
                <span className="text-xs">
                  {formatCurrency(getLargestDecrease()?.changeAmount || 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};