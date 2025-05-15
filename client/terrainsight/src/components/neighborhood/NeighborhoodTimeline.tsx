import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
  LabelList,
  BarChart,
  Bar
} from 'recharts';

import { 
  NeighborhoodTimeline as NeighborhoodTimelineType,
  NeighborhoodTimelineDataPoint,
  getNeighborhoodTimelines,
  getNeighborhoodTimeline,
  calculateAverageGrowthRate
} from '@/services/neighborhoodTimelineService';

// Helper for formatting currency values
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper for formatting percentages
const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

interface NeighborhoodTimelineProps {
  className?: string;
  initialNeighborhoodId?: string;
  years?: number;
}

export const NeighborhoodTimeline: React.FC<NeighborhoodTimelineProps> = ({
  className = '',
  initialNeighborhoodId = 'downtown',
  years = 10
}) => {
  // State for selected neighborhood and time range
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>(initialNeighborhoodId);
  const [timeRange, setTimeRange] = useState<number>(years);
  const [activeTab, setActiveTab] = useState('value');
  const [showNeighborhoodComparison, setShowNeighborhoodComparison] = useState(false);
  const [highlightedYear, setHighlightedYear] = useState<string | null>(null);
  
  // State for data
  const [allNeighborhoods, setAllNeighborhoods] = useState<NeighborhoodTimelineType[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodTimelineType | null>(null);
  const [comparisonNeighborhoods, setComparisonNeighborhoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Chart colors for different neighborhoods
  const neighborhoodColors: Record<string, string> = {
    downtown: '#3b82f6',
    south_ridge: '#10b981',
    west_park: '#f59e0b',
    north_hills: '#8b5cf6',
    east_valley: '#ec4899',
    riverview: '#06b6d4',
    central: '#f97316'
  };
  
  // Load all neighborhood data
  useEffect(() => {
    const loadNeighborhoods = async () => {
      try {
        setIsLoading(true);
        const neighborhoods = await getNeighborhoodTimelines(timeRange);
        setAllNeighborhoods(neighborhoods);
        
        // Set the selected neighborhood
        const selected = neighborhoods.find(n => n.id === selectedNeighborhoodId);
        if (selected) {
          setSelectedNeighborhood(selected);
        } else if (neighborhoods.length > 0) {
          setSelectedNeighborhood(neighborhoods[0]);
          setSelectedNeighborhoodId(neighborhoods[0].id);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load neighborhood data');
        console.error('Error loading neighborhoods:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNeighborhoods();
  }, [timeRange]);
  
  // Update selected neighborhood when ID changes
  useEffect(() => {
    const neighborhood = allNeighborhoods.find(n => n.id === selectedNeighborhoodId);
    if (neighborhood) {
      setSelectedNeighborhood(neighborhood);
    }
  }, [selectedNeighborhoodId, allNeighborhoods]);
  
  // Handle neighborhood selection
  const handleNeighborhoodChange = (neighborhoodId: string) => {
    setSelectedNeighborhoodId(neighborhoodId);
  };
  
  // Handle time range change
  const handleTimeRangeChange = (value: number[]) => {
    setTimeRange(value[0]);
  };
  
  // Toggle neighborhood for comparison
  const toggleNeighborhoodComparison = (neighborhoodId: string) => {
    setComparisonNeighborhoods(prev => {
      if (prev.includes(neighborhoodId)) {
        return prev.filter(id => id !== neighborhoodId);
      } else {
        // Limit to 3 comparison neighborhoods
        const newComparisons = [...prev, neighborhoodId].slice(-3);
        return newComparisons;
      }
    });
  };
  
  // Get data for chart based on active tab
  const getChartData = () => {
    if (!selectedNeighborhood) return [];
    
    return selectedNeighborhood.data.map(point => {
      const basePoint = {
        year: point.year,
        [selectedNeighborhood.id]: point.value,
        percentChange: point.percentChange,
        transactions: point.transactionCount
      };
      
      // Add comparison neighborhood data if enabled
      if (showNeighborhoodComparison) {
        comparisonNeighborhoods.forEach(neighborhoodId => {
          const neighborhood = allNeighborhoods.find(n => n.id === neighborhoodId);
          if (neighborhood) {
            const yearData = neighborhood.data.find(d => d.year === point.year);
            if (yearData) {
              basePoint[neighborhoodId] = yearData.value;
            }
          }
        });
      }
      
      return basePoint;
    });
  };
  
  // Generate comparative data for all neighborhoods in a given year
  const getYearComparisonData = () => {
    if (!highlightedYear) return [];
    
    return allNeighborhoods.map(neighborhood => {
      const yearData = neighborhood.data.find(d => d.year === highlightedYear);
      return {
        id: neighborhood.id,
        name: neighborhood.name,
        value: yearData?.value || 0,
        percentChange: yearData?.percentChange || 0,
        transactions: yearData?.transactionCount || 0,
        color: neighborhoodColors[neighborhood.id] || '#64748b'
      };
    }).sort((a, b) => b.value - a.value);
  };
  
  // Get summary stats for the selected neighborhood
  const getNeighborhoodStats = () => {
    if (!selectedNeighborhood || selectedNeighborhood.data.length === 0) {
      return { currentValue: 0, growthRate: 0, totalGrowth: 0 };
    }
    
    const data = selectedNeighborhood.data;
    const currentValue = data[data.length - 1].value;
    const growthRate = selectedNeighborhood.growthRate || calculateAverageGrowthRate(data);
    const firstValue = data[0].value;
    const totalGrowth = (currentValue / firstValue) - 1;
    
    return { currentValue, growthRate, totalGrowth };
  };
  
  // Determine if a trend is positive, negative, or neutral
  const getTrendClass = (value: number) => {
    if (value > 0.01) return 'text-emerald-600';
    if (value < -0.01) return 'text-rose-600';
    return 'text-amber-600';
  };
  
  const stats = getNeighborhoodStats();
  const chartData = getChartData();
  const yearComparisonData = getYearComparisonData();
  
  if (isLoading) {
    return (
      <Card className={`${className} min-h-[400px] flex items-center justify-center`}>
        <CardContent>
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading neighborhood data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={`${className} min-h-[400px] flex items-center justify-center`}>
        <CardContent>
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle>Neighborhood Valuation Timeline</CardTitle>
            <CardDescription>Historical property value trends by neighborhood</CardDescription>
          </div>
          
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Select value={selectedNeighborhoodId} onValueChange={handleNeighborhoodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select neighborhood" />
              </SelectTrigger>
              <SelectContent>
                {allNeighborhoods.map(neighborhood => (
                  <SelectItem key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Tab selection */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="value">Value Trends</TabsTrigger>
            <TabsTrigger value="growth">Growth Rate</TabsTrigger>
            <TabsTrigger value="transactions">Transaction Volume</TabsTrigger>
          </TabsList>
          
          <div className="my-4">
            {/* Year slider */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-medium">Years:</span>
              <Slider
                defaultValue={[timeRange]}
                min={5}
                max={20}
                step={1}
                onValueChange={handleTimeRangeChange}
                className="flex-1"
              />
              <span className="w-8 text-center text-sm font-medium">{timeRange}</span>
            </div>
            
            {/* Button to toggle neighborhood comparison */}
            <div className="flex justify-between items-center mb-4">
              <Button
                variant={showNeighborhoodComparison ? "default" : "outline"}
                size="sm"
                onClick={() => setShowNeighborhoodComparison(!showNeighborhoodComparison)}
              >
                {showNeighborhoodComparison ? "Hide Comparison" : "Compare Neighborhoods"}
              </Button>
              
              {showNeighborhoodComparison && (
                <div className="flex gap-1">
                  {allNeighborhoods.filter(n => n.id !== selectedNeighborhoodId).map(neighborhood => (
                    <Button
                      key={neighborhood.id}
                      variant={comparisonNeighborhoods.includes(neighborhood.id) ? "default" : "outline"}
                      size="sm"
                      className="px-2 py-1 h-8 text-xs"
                      style={{
                        borderColor: neighborhoodColors[neighborhood.id],
                        color: comparisonNeighborhoods.includes(neighborhood.id) ? 'white' : neighborhoodColors[neighborhood.id],
                        backgroundColor: comparisonNeighborhoods.includes(neighborhood.id) ? neighborhoodColors[neighborhood.id] : 'transparent'
                      }}
                      onClick={() => toggleNeighborhoodComparison(neighborhood.id)}
                    >
                      {neighborhood.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Main visualization content based on active tab */}
            <TabsContent value="value" className="mt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    onMouseMove={(e) => {
                      if (e.activeLabel) {
                        setHighlightedYear(e.activeLabel.toString());
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }} 
                      tickLine={{ stroke: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value/1000}k`}
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8' }}
                      width={60}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Average Value']}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        border: 'none',
                        padding: '6px 10px'
                      }}
                    />
                    <Legend />
                    
                    {/* Main neighborhood line */}
                    <Line
                      type="monotone"
                      dataKey={selectedNeighborhoodId}
                      name={selectedNeighborhood?.name || 'Neighborhood'}
                      stroke={neighborhoodColors[selectedNeighborhoodId] || '#3b82f6'}
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'white', strokeWidth: 2 }}
                      activeDot={{ r: 8, strokeWidth: 2, stroke: neighborhoodColors[selectedNeighborhoodId] || '#3b82f6', fill: 'white' }}
                      isAnimationActive={true}
                    />
                    
                    {/* Comparison neighborhood lines */}
                    {showNeighborhoodComparison && comparisonNeighborhoods.map((neighborhoodId) => {
                      const neighborhood = allNeighborhoods.find(n => n.id === neighborhoodId);
                      return (
                        <Line
                          key={neighborhoodId}
                          type="monotone"
                          dataKey={neighborhoodId}
                          name={neighborhood?.name || neighborhoodId}
                          stroke={neighborhoodColors[neighborhoodId] || '#64748b'}
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'white', strokeWidth: 1.5 }}
                          activeDot={{ r: 6, strokeWidth: 1.5, stroke: neighborhoodColors[neighborhoodId] || '#64748b', fill: 'white' }}
                          isAnimationActive={true}
                        />
                      );
                    })}
                    
                    {/* Reference line for 2020 (COVID impact) */}
                    <ReferenceLine
                      x="2020"
                      stroke="#64748b"
                      strokeDasharray="3 3"
                      label={
                        <Label
                          value="COVID-19"
                          position="insideBottomRight"
                          offset={5}
                          style={{ 
                            fontSize: 10, 
                            fill: '#64748b',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          }}
                        />
                      }
                    />
                    
                    {/* Reference line for 2008 (Housing crisis) */}
                    <ReferenceLine
                      x="2008"
                      stroke="#64748b"
                      strokeDasharray="3 3"
                      label={
                        <Label
                          value="Housing Crisis"
                          position="insideTopRight"
                          offset={5}
                          style={{ 
                            fontSize: 10, 
                            fill: '#64748b',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                          }}
                        />
                      }
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Highlighted year comparison */}
              {highlightedYear && yearComparisonData.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Neighborhood Comparison for {highlightedYear}</h4>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearComparisonData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => `$${value/1000}k`}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name"
                          tick={{ fontSize: 11 }} 
                          width={100}
                        />
                        <Tooltip
                          formatter={(value: number) => [formatCurrency(value), 'Average Value']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            border: 'none',
                            padding: '6px 10px'
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#3b82f6"
                          background={{ fill: '#f1f5f9' }}
                          radius={[0, 4, 4, 0]}
                        >
                          {yearComparisonData.map((entry, index) => (
                            <g key={`cell-${index}`}>
                              <rect 
                                x={0} 
                                y={0} 
                                width="100%" 
                                height="100%" 
                                fill={entry.color}
                              />
                            </g>
                          ))}
                          <LabelList 
                            dataKey="value" 
                            position="right" 
                            formatter={(value: number) => formatCurrency(value)}
                            style={{ 
                              fontSize: 11, 
                              fontWeight: 500, 
                              fill: '#334155' 
                            }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {/* Value stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Current Avg. Value</div>
                  <div className="text-2xl font-bold mt-1">{formatCurrency(stats.currentValue)}</div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Annual Growth Rate</div>
                  <div className={`text-2xl font-bold mt-1 ${getTrendClass(stats.growthRate)}`}>
                    {formatPercentage(stats.growthRate)}
                  </div>
                </div>
                <div className="p-4 border rounded-md">
                  <div className="text-sm text-muted-foreground">Total Growth ({timeRange} Years)</div>
                  <div className={`text-2xl font-bold mt-1 ${getTrendClass(stats.totalGrowth)}`}>
                    {formatPercentage(stats.totalGrowth)}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="growth" className="mt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    onMouseMove={(e) => {
                      if (e.activeLabel) {
                        setHighlightedYear(e.activeLabel.toString());
                      }
                    }}
                  >
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }} 
                      tickLine={{ stroke: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8' }}
                    />
                    <YAxis
                      tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8' }}
                      width={50}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, 'Growth Rate']}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        border: 'none',
                        padding: '6px 10px'
                      }}
                    />
                    <Legend />
                    
                    {/* Reference line for 0% growth */}
                    <ReferenceLine 
                      y={0} 
                      stroke="#94a3b8" 
                      strokeWidth={1}
                    />
                    
                    <Area
                      type="monotone"
                      dataKey="percentChange"
                      name="Annual Growth"
                      stroke="#3b82f6"
                      fill="url(#colorGrowth)"
                      dot={{ r: 3, fill: 'white', strokeWidth: 1.5 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#3b82f6', fill: 'white' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-0">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    onMouseMove={(e) => {
                      if (e.activeLabel) {
                        setHighlightedYear(e.activeLabel.toString());
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 12 }} 
                      tickLine={{ stroke: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8' }}
                      width={40}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, 'Transactions']}
                      labelFormatter={(label) => `Year: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                        border: 'none',
                        padding: '6px 10px'
                      }}
                    />
                    <Legend />
                    
                    <Bar
                      dataKey="transactions"
                      name="Transaction Volume"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    
                    {/* Line to show the relationship between transaction volume and value */}
                    <Line
                      type="monotone"
                      dataKey={selectedNeighborhoodId}
                      yAxisId={1}
                      name={`${selectedNeighborhood?.name || 'Neighborhood'} Value`}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        
        {/* IAAO and USPAP compliance note */}
        <div className="mt-6 border-t pt-3 text-xs text-muted-foreground">
          <p>Neighborhood analysis following IAAO standards for mass appraisal and USPAP guidelines for property assessment. All data represents tax assessment year averages.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeighborhoodTimeline;