import React from 'react';
import { Property } from '@shared/schema';
import { 
  TimeSeriesDataPoint, 
  TrendAnalysisResult 
} from '../../services/timeseries/timeSeriesAnalysisService';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  MinusCircle,
  ArrowUp, 
  ArrowDown, 
  Minus,
  AlertCircle,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PropertyValueTrendProps {
  property: Property;
  timeSeries: TimeSeriesDataPoint[];
  trendInfo: TrendAnalysisResult | null;
  className?: string;
}

export function PropertyValueTrend({ 
  property, 
  timeSeries, 
  trendInfo, 
  className 
}: PropertyValueTrendProps) {
  // Helper to format large numbers
  const formatLargeNumber = (num: number) => {
    if (Math.abs(num) >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (Math.abs(num) >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toFixed(0);
  };
  
  // Get trend icon and color
  const getTrendIcon = () => {
    if (!trendInfo) return <MinusCircle className="h-6 w-6 text-gray-400" />;
    
    if (trendInfo.direction === 'up') {
      return <TrendingUp className="h-6 w-6 text-green-500" />;
    } else if (trendInfo.direction === 'down') {
      return <TrendingDown className="h-6 w-6 text-red-500" />;
    } else {
      return <MinusCircle className="h-6 w-6 text-amber-500" />;
    }
  };
  
  // Get trend description
  const getTrendDescription = () => {
    if (!trendInfo) return "Insufficient historical data";
    
    if (trendInfo.direction === 'up') {
      return "Upward trend in property value";
    } else if (trendInfo.direction === 'down') {
      return "Downward trend in property value";
    } else {
      return "Stable property value";
    }
  };
  
  // Convert growth rate to text
  const getGrowthRateText = () => {
    if (!trendInfo) return "N/A";
    
    const rate = trendInfo.growthRate * 100;
    if (rate > 10) return "Very strong growth";
    if (rate > 5) return "Strong growth";
    if (rate > 2) return "Moderate growth";
    if (rate > 0) return "Slight growth";
    if (rate > -2) return "Stable value";
    if (rate > -5) return "Slight decline";
    if (rate > -10) return "Moderate decline";
    return "Significant decline";
  };
  
  // Get color for growth rate
  const getGrowthRateColor = () => {
    if (!trendInfo) return "text-gray-500";
    
    const rate = trendInfo.growthRate * 100;
    if (rate > 5) return "text-green-600";
    if (rate > 0) return "text-green-500";
    if (rate > -3) return "text-amber-500";
    return "text-red-500";
  };
  
  // Calculate progress percentage for bar
  const getProgressPercentage = () => {
    if (!trendInfo) return 0;
    
    // Map growth rate to a percentage between 0-100
    // Scale: -10% to +15% annual growth
    const rate = trendInfo.growthRate * 100;
    return Math.max(0, Math.min(100, ((rate + 10) / 25) * 100));
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between">
          <div className="flex items-center">
            {getTrendIcon()}
            <span className="ml-2">Value Trend</span>
          </div>
          <div className="text-sm font-normal text-gray-500">
            {timeSeries.length > 1 ? (
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {timeSeries[0].date.getFullYear()} - {timeSeries[timeSeries.length - 1].date.getFullYear()}
              </span>
            ) : (
              <span>Current Year</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">{property.address}</p>
          <p className="text-xs text-gray-500">{property.parcelId}</p>
        </div>
        
        {trendInfo ? (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium">{getTrendDescription()}</p>
                <p className={`text-sm font-semibold ${getGrowthRateColor()}`}>
                  {formatPercentage(trendInfo.growthRate * 100)}
                </p>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1 italic">
                {getGrowthRateText()} (annual rate)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Start Value</p>
                <p className="flex items-center text-sm font-medium">
                  <DollarSign className="h-3.5 w-3.5 text-gray-400 mr-1" />
                  {formatCurrency(trendInfo.startValue)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Current Value</p>
                <p className="flex items-center text-sm font-medium">
                  <DollarSign className="h-3.5 w-3.5 text-gray-400 mr-1" />
                  {formatCurrency(trendInfo.endValue)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Total Change</p>
                <p className={`flex items-center text-sm font-medium ${trendInfo.totalChange > 0 ? 'text-green-600' : trendInfo.totalChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {trendInfo.totalChange > 0 ? (
                    <ArrowUp className="h-3.5 w-3.5 mr-1" />
                  ) : trendInfo.totalChange < 0 ? (
                    <ArrowDown className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 mr-1" />
                  )}
                  {formatCurrency(Math.abs(trendInfo.totalChange))}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500 mb-1">Annual Change</p>
                <p className={`flex items-center text-sm font-medium ${trendInfo.averageAnnualChange > 0 ? 'text-green-600' : trendInfo.averageAnnualChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {trendInfo.averageAnnualChange > 0 ? (
                    <ArrowUp className="h-3.5 w-3.5 mr-1" />
                  ) : trendInfo.averageAnnualChange < 0 ? (
                    <ArrowDown className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 mr-1" />
                  )}
                  {formatCurrency(Math.abs(trendInfo.averageAnnualChange))}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <p className="text-gray-600 mb-1">Insufficient historical data</p>
            <p className="text-sm text-gray-500 max-w-xs">
              At least two years of valuation data are needed to calculate trends
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}