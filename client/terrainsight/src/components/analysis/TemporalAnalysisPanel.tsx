import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Chart,
  LinearScale,
  CategoryScale,
  LineElement,
  PointElement,
  LineController,
  BarController,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { PropertyWithHistory, TimeSeriesAnalysis } from '../../services/timeSeriesAnalysisService';
import { Property } from '@shared/schema';
import { formatCurrency, formatPercent } from '@/lib/utils';

// Register Chart.js components
Chart.register(
  LinearScale,
  CategoryScale,
  LineElement,
  PointElement,
  LineController,
  BarController,
  BarElement,
  Tooltip,
  Legend
);

// Interface for component props
interface TemporalAnalysisPanelProps {
  properties: Property[];
  className?: string;
}

/**
 * Component for analyzing and visualizing property values over time
 */
export const TemporalAnalysisPanel: React.FC<TemporalAnalysisPanelProps> = ({ 
  properties, 
  className = '' 
}) => {
  // Cast properties to PropertyWithHistory for analysis
  const propertiesWithHistory = useMemo(() => {
    // In a real implementation, we would fetch actual historical data
    // For this implementation, we'll simulate history based on current values
    return properties.map(property => {
      const baseValue = property.value 
        ? parseFloat(property.value.replace(/[^0-9.-]+/g, '')) 
        : 200000;
      
      // Simulate 4 years of history with modest growth pattern
      const yearCount = 4;
      const growthRates = [0.97, 0.94, 0.92, 0.90]; // Percentage of current value (in reverse)
      
      const valueHistory: Record<string, string> = {};
      const currentYear = new Date().getFullYear();
      
      for (let i = 0; i < yearCount; i++) {
        const year = (currentYear - yearCount + i + 1).toString();
        const historicalValue = Math.round(baseValue * growthRates[i]);
        valueHistory[year] = historicalValue.toString();
      }
      
      return {
        ...property,
        valueHistory
      } as PropertyWithHistory;
    });
  }, [properties]);
  
  // Get time periods from data
  const timePeriods = useMemo(() => {
    if (propertiesWithHistory.length === 0) return [];
    
    const analysis = new TimeSeriesAnalysis(propertiesWithHistory);
    const timeSeriesData = analysis.prepareTimeSeriesData();
    return timeSeriesData.periods;
  }, [propertiesWithHistory]);
  
  // State for selected time periods and neighborhoods
  const [startPeriod, setStartPeriod] = useState<string>(timePeriods[0] || '');
  const [endPeriod, setEndPeriod] = useState<string>(
    timePeriods.length > 0 ? timePeriods[timePeriods.length - 1] : ''
  );
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeIndex, setTimeIndex] = useState<number>(timePeriods.length - 1);
  
  // Get unique neighborhoods
  const neighborhoods = useMemo(() => {
    const uniqueNeighborhoods = new Set<string>();
    
    propertiesWithHistory.forEach(property => {
      if (property.neighborhood) {
        uniqueNeighborhoods.add(property.neighborhood);
      }
    });
    
    return Array.from(uniqueNeighborhoods).sort();
  }, [propertiesWithHistory]);
  
  // Initialize neighborhood selection with first 2 neighborhoods
  useMemo(() => {
    if (neighborhoods.length > 0 && selectedNeighborhoods.length === 0) {
      setSelectedNeighborhoods(neighborhoods.slice(0, Math.min(2, neighborhoods.length)));
    }
  }, [neighborhoods, selectedNeighborhoods]);
  
  // Calculate value changes
  const valueChanges = useMemo(() => {
    if (propertiesWithHistory.length === 0 || !startPeriod || !endPeriod) return [];
    
    const analysis = new TimeSeriesAnalysis(propertiesWithHistory);
    return analysis.calculateValueChanges(startPeriod, endPeriod);
  }, [propertiesWithHistory, startPeriod, endPeriod]);
  
  // Calculate neighborhood data
  const neighborhoodData = useMemo(() => {
    if (propertiesWithHistory.length === 0) return {};
    
    const analysis = new TimeSeriesAnalysis(propertiesWithHistory);
    return analysis.aggregateByNeighborhood();
  }, [propertiesWithHistory]);
  
  // Growth rates
  const growthRates = useMemo(() => {
    if (propertiesWithHistory.length === 0) return new globalThis.Map();
    
    const analysis = new TimeSeriesAnalysis(propertiesWithHistory);
    return analysis.calculateAnnualGrowthRates();
  }, [propertiesWithHistory]);
  
  // Top growth properties
  const topGrowthProperties = useMemo(() => {
    if (propertiesWithHistory.length === 0) return [];
    
    const analysis = new TimeSeriesAnalysis(propertiesWithHistory);
    const topGrowth = analysis.findHighestGrowthProperties(5);
    
    return topGrowth.map(item => {
      const property = propertiesWithHistory.find(p => p.id === item.id);
      return {
        ...item,
        address: property?.address || '',
        neighborhood: property?.neighborhood || ''
      };
    });
  }, [propertiesWithHistory]);
  
  // Overall statistics
  const overallStats = useMemo(() => {
    if (valueChanges.length === 0) return null;
    
    const totalAbsoluteChange = valueChanges.reduce(
      (sum, change) => sum + change.absoluteChange, 0
    );
    
    const averageAbsoluteChange = totalAbsoluteChange / valueChanges.length;
    
    const averagePercentageChange = valueChanges.reduce(
      (sum, change) => sum + change.percentageChange, 0
    ) / valueChanges.length;
    
    const increasingCount = valueChanges.filter(
      change => change.percentageChange > 0
    ).length;
    
    const decreasingCount = valueChanges.filter(
      change => change.percentageChange < 0
    ).length;
    
    const stableCount = valueChanges.filter(
      change => change.percentageChange === 0
    ).length;
    
    return {
      averageAbsoluteChange,
      averagePercentageChange,
      increasingCount,
      decreasingCount,
      stableCount,
      totalProperties: valueChanges.length
    };
  }, [valueChanges]);
  
  // Time slider handler
  const handleTimeSliderChange = useCallback((value: number[]) => {
    setTimeIndex(value[0]);
  }, []);
  
  // Prepare chart data for neighborhood comparison
  const neighborhoodChartData = useMemo(() => {
    if (Object.keys(neighborhoodData).length === 0 || timePeriods.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Color palette for different neighborhoods
    const colors = [
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)'
    ];
    
    return {
      labels: timePeriods,
      datasets: selectedNeighborhoods.map((neighborhood, index) => {
        const color = colors[index % colors.length];
        return {
          label: neighborhood,
          data: neighborhoodData[neighborhood]?.averageValues || [],
          borderColor: color,
          backgroundColor: color.replace('1)', '0.2)'),
          tension: 0.3
        };
      })
    };
  }, [neighborhoodData, timePeriods, selectedNeighborhoods]);
  
  // Prepare chart data for property value changes
  const valueChangeChartData = useMemo(() => {
    if (valueChanges.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    // Group by neighborhood
    const neighborhoodChanges: Record<string, number[]> = {};
    
    selectedNeighborhoods.forEach(neighborhood => {
      neighborhoodChanges[neighborhood] = [];
    });
    
    valueChanges.forEach(change => {
      const property = propertiesWithHistory.find(p => p.id === change.propertyId);
      if (property?.neighborhood && selectedNeighborhoods.includes(property.neighborhood)) {
        neighborhoodChanges[property.neighborhood].push(change.percentageChange);
      }
    });
    
    // Calculate averages
    const averageChanges = Object.keys(neighborhoodChanges).map(neighborhood => {
      const changes = neighborhoodChanges[neighborhood];
      if (changes.length === 0) return 0;
      return changes.reduce((sum, val) => sum + val, 0) / changes.length;
    });
    
    return {
      labels: selectedNeighborhoods,
      datasets: [
        {
          label: `Average % Change (${startPeriod}-${endPeriod})`,
          data: averageChanges,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [valueChanges, propertiesWithHistory, selectedNeighborhoods, startPeriod, endPeriod]);
  
  // Handle neighborhood selection
  const toggleNeighborhood = (neighborhood: string) => {
    setSelectedNeighborhoods(prev => 
      prev.includes(neighborhood)
        ? prev.filter(n => n !== neighborhood)
        : [...prev, neighborhood]
    );
  };
  
  // Calculate current time period values based on slider
  const currentPeriodData = useMemo(() => {
    if (timePeriods.length === 0 || timeIndex >= timePeriods.length) return null;
    
    const currentPeriod = timePeriods[timeIndex];
    
    return {
      period: currentPeriod,
      neighborhoodValues: Object.entries(neighborhoodData).map(([name, data]) => ({
        name,
        averageValue: data.averageValues[timeIndex],
        count: data.propertyCount
      })).sort((a, b) => b.averageValue - a.averageValue)
    };
  }, [timePeriods, timeIndex, neighborhoodData]);
  
  // Render
  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader>
        <CardTitle>Temporal Value Analysis</CardTitle>
        <CardDescription>
          Analyze property value changes over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {propertiesWithHistory.length === 0 ? (
          <div>No property data available for temporal analysis.</div>
        ) : timePeriods.length < 2 ? (
          <div>Insufficient time series data for analysis.</div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="compare">Compare</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-period">Start Period</Label>
                      <Select
                        value={startPeriod}
                        onValueChange={setStartPeriod}
                      >
                        <SelectTrigger id="start-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {timePeriods.map(period => (
                            <SelectItem key={period} value={period}>
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-period">End Period</Label>
                      <Select
                        value={endPeriod}
                        onValueChange={setEndPeriod}
                      >
                        <SelectTrigger id="end-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {timePeriods.map(period => (
                            <SelectItem key={period} value={period}>
                              {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {overallStats && (
                    <div className="bg-slate-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2">Value Change Summary ({startPeriod} to {endPeriod})</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500">Average Change</div>
                          <div className="font-medium">{formatCurrency(overallStats.averageAbsoluteChange)}</div>
                          <div className="text-sm">{formatPercent(overallStats.averagePercentageChange)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Properties</div>
                          <div className="font-medium">{overallStats.totalProperties}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Trend</div>
                          <div className="flex space-x-1 mt-1">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              {overallStats.increasingCount} ↑
                            </Badge>
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              {overallStats.decreasingCount} ↓
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Top Growth Properties</h4>
                    <div className="space-y-2">
                      {topGrowthProperties.map(property => (
                        <div key={property.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex-1">
                            <div className="font-medium truncate">{property.address}</div>
                            <div className="text-sm text-gray-500">{property.neighborhood}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant={property.growthRate > 0 ? 'default' : 'destructive'} className="ml-2">
                              {formatPercent(property.growthRate)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Average Value Changes by Neighborhood</h4>
                    <div className="h-64">
                      <Bar 
                        data={valueChangeChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.dataset.label}: ${context.raw}%`
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Percent Change'
                              },
                              ticks: {
                                callback: (value) => `${value}%`
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compare" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Select Neighborhoods to Compare</Label>
                    <div className="flex flex-wrap gap-2">
                      {neighborhoods.map(neighborhood => (
                        <Badge 
                          key={neighborhood}
                          variant={selectedNeighborhoods.includes(neighborhood) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleNeighborhood(neighborhood)}
                        >
                          {neighborhood}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Neighborhood Value Trends</h4>
                    <div className="h-64">
                      <Line 
                        data={neighborhoodChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom'
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const value = context.raw as number;
                                  return `${context.dataset.label}: ${formatCurrency(value)}`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              title: {
                                display: true,
                                text: 'Average Property Value'
                              },
                              ticks: {
                                callback: (value) => formatCurrency(value as number)
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {selectedNeighborhoods.map(neighborhood => {
                      const data = neighborhoodData[neighborhood];
                      if (!data) return null;
                      
                      // Calculate growth rate
                      const firstValue = data.averageValues[0];
                      const lastValue = data.averageValues[data.averageValues.length - 1];
                      const growthRate = firstValue > 0 
                        ? ((lastValue - firstValue) / firstValue) * 100 
                        : 0;
                      
                      return (
                        <div key={neighborhood} className="bg-white p-3 rounded-md border">
                          <div className="font-medium">{neighborhood}</div>
                          <div className="text-sm text-gray-500">
                            {data.propertyCount} properties
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm">
                              <span>Growth Rate:</span>
                              <span className={growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPercent(growthRate)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Current Avg Value:</span>
                              <span>
                                {formatCurrency(lastValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="time-slider">Time Period: {timePeriods[timeIndex]}</Label>
                    </div>
                    <Slider
                      id="time-slider"
                      min={0}
                      max={timePeriods.length - 1}
                      step={1}
                      value={[timeIndex]}
                      onValueChange={handleTimeSliderChange}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs">
                      <span>{timePeriods[0]}</span>
                      <span>{timePeriods[timePeriods.length - 1]}</span>
                    </div>
                  </div>
                  
                  {currentPeriodData && (
                    <div>
                      <h4 className="font-medium mb-2">Property Values in {currentPeriodData.period}</h4>
                      <div className="space-y-3">
                        {currentPeriodData.neighborhoodValues.map(neighborhood => (
                          <div key={neighborhood.name} className="space-y-1">
                            <div className="flex justify-between">
                              <span>{neighborhood.name} ({neighborhood.count} properties)</span>
                              <span>{formatCurrency(neighborhood.averageValue)}</span>
                            </div>
                            <Progress value={neighborhood.averageValue / 1000000 * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Timeline Insights</h4>
                    <div className="space-y-2 text-sm">
                      {timePeriods.map((period, index) => {
                        if (index === 0) return null;
                        
                        // Calculate year-over-year changes
                        const prevPeriod = timePeriods[index - 1];
                        const yearOverYearChanges = Object.entries(neighborhoodData).map(([name, data]) => {
                          const currentValue = data.averageValues[index];
                          const prevValue = data.averageValues[index - 1];
                          const percentChange = prevValue > 0 
                            ? ((currentValue - prevValue) / prevValue) * 100 
                            : 0;
                          
                          return {
                            name,
                            percentChange,
                            prevValue,
                            currentValue
                          };
                        }).sort((a, b) => b.percentChange - a.percentChange);
                        
                        // Get top gainer and top loser
                        const topGainer = yearOverYearChanges[0];
                        const topLoser = yearOverYearChanges[yearOverYearChanges.length - 1];
                        
                        // Calculate average change
                        const avgChange = yearOverYearChanges.reduce(
                          (sum, n) => sum + n.percentChange, 0
                        ) / yearOverYearChanges.length;
                        
                        return (
                          <div key={period} className="bg-white p-3 rounded-md border">
                            <div className="font-medium">{prevPeriod} to {period}</div>
                            <div className="mt-1">
                              <div className="flex justify-between">
                                <span>Average Change:</span>
                                <span className={avgChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatPercent(avgChange)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Top Gainer:</span>
                                <span className="text-green-600">
                                  {topGainer.name} ({formatPercent(topGainer.percentChange)}%)
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Top Decliner:</span>
                                <span className="text-red-600">
                                  {topLoser.name} ({formatPercent(topLoser.percentChange)}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};