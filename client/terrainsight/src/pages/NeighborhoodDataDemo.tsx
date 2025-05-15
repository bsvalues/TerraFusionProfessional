import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { 
  NeighborhoodTimeline, 
  NeighborhoodTimelineDataPoint 
} from '@/services/neighborhoodTimelineService';
import { 
  getNeighborhoods, 
  getNeighborhoodTimeline, 
  getNeighborhoodTimelines 
} from '@/services/neighborhoodService';
import { 
  ArrowDownUp, 
  BarChart3, 
  Calendar, 
  Home, 
  TrendingUp, 
  Layers, 
  PieChart as PieChartIcon, 
  Map 
} from 'lucide-react';
import { calculateAverageGrowthRate } from '@/services/neighborhoodTimelineService';
import { Separator } from '@/components/ui/separator';

export const NeighborhoodDataDemo: React.FC = () => {
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<string>('');
  const [yearsToShow, setYearsToShow] = useState<number>(10);
  const [activeTab, setActiveTab] = useState('trends');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie' | 'scatter'>('line');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Fetch all neighborhoods
  const { 
    data: neighborhoods, 
    isLoading: isLoadingNeighborhoods 
  } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/neighborhoods'],
    queryFn: () => getNeighborhoods()
  });
  
  // Fetch all neighborhood timelines for comparison
  const {
    data: allNeighborhoodTimelines,
    isLoading: isLoadingAllTimelines
  } = useQuery<NeighborhoodTimeline[]>({
    queryKey: ['/api/neighborhood-timelines', yearsToShow],
    queryFn: () => getNeighborhoodTimelines(yearsToShow)
  });
  
  // Fetch specific neighborhood timeline when selected
  const { 
    data: selectedNeighborhoodTimeline,
    isLoading: isLoadingSelectedTimeline
  } = useQuery<NeighborhoodTimeline>({
    queryKey: ['/api/neighborhood-timeline', selectedNeighborhoodId, yearsToShow],
    queryFn: () => getNeighborhoodTimeline(selectedNeighborhoodId, yearsToShow),
    enabled: !!selectedNeighborhoodId
  });
  
  // Set initial neighborhood if none selected
  useEffect(() => {
    if (!selectedNeighborhoodId && neighborhoods && neighborhoods.length > 0) {
      setSelectedNeighborhoodId(neighborhoods[0].id);
    }
  }, [neighborhoods, selectedNeighborhoodId]);
  
  // Format currency for display
  const formatCurrency = (value?: number): string => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).getFullYear().toString();
  };
  
  // Format percentage for display
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Get comparable neighborhoods for scatter plot
  const getComparableNeighborhoods = () => {
    if (!allNeighborhoodTimelines || !selectedNeighborhoodTimeline) return [];
    
    return allNeighborhoodTimelines.map(timeline => {
      const avgValue = timeline.data.reduce((sum, point) => 
        sum + point.value, 0
      ) / timeline.data.length;
      
      const growthRate = calculateAverageGrowthRate(timeline.data);
      
      return {
        id: timeline.id,
        name: timeline.name,
        avgValue,
        growthRate,
        isSelected: timeline.id === selectedNeighborhoodId
      };
    });
  };
  
  // Generate neighborhood comparison chart data
  const getNeighborhoodComparisonData = () => {
    if (!allNeighborhoodTimelines) return [];
    
    // Get the most recent year's data for each neighborhood
    const comparisonData = allNeighborhoodTimelines.map(timeline => {
      const mostRecentData = timeline.data.slice(-1)[0];
      const growthRate = calculateAverageGrowthRate(timeline.data);
      
      return {
        id: timeline.id,
        name: timeline.name,
        value: mostRecentData?.value || 0,
        growthRate: growthRate,
        transactions: mostRecentData?.transactionCount || 0
      };
    });
    
    // Sort by average value
    return comparisonData.sort((a, b) => 
      sortOrder === 'asc' ? a.value - b.value : b.value - a.value
    );
  };
  
  // Get data for the pie chart distribution
  const getDistributionData = () => {
    if (!allNeighborhoodTimelines) return [];
    
    // Group neighborhoods by value ranges
    const valueRanges = {
      'Under $200k': 0,
      '$200k-$300k': 0,
      '$300k-$400k': 0,
      '$400k-$500k': 0,
      '$500k-$750k': 0,
      'Over $750k': 0
    };
    
    allNeighborhoodTimelines.forEach(timeline => {
      const mostRecentData = timeline.data.slice(-1)[0];
      const value = mostRecentData?.value || 0;
      
      if (value < 200000) valueRanges['Under $200k']++;
      else if (value < 300000) valueRanges['$200k-$300k']++;
      else if (value < 400000) valueRanges['$300k-$400k']++;
      else if (value < 500000) valueRanges['$400k-$500k']++;
      else if (value < 750000) valueRanges['$500k-$750k']++;
      else valueRanges['Over $750k']++;
    });
    
    return Object.entries(valueRanges).map(([name, count]) => ({
      name,
      value: count
    }));
  };
  
  // Define colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF0000'];
  
  if (isLoadingNeighborhoods || isLoadingAllTimelines) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <Card className="w-full max-w-4xl mx-auto shadow-md animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="h-80 bg-gray-100 rounded"></CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 flex items-center">
          <Home className="mr-2 h-8 w-8 text-primary" />
          Neighborhood Data Explorer
        </h1>
        <p className="text-muted-foreground">
          Analyze trends, compare neighborhoods, and visualize property value distributions across Benton County.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Card */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Data Controls</CardTitle>
            <CardDescription>
              Select neighborhoods and timeframes to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Neighborhood</label>
              <Select 
                value={selectedNeighborhoodId} 
                onValueChange={setSelectedNeighborhoodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map(neighborhood => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Years to Show: {yearsToShow}
              </label>
              <Slider
                value={[yearsToShow]}
                min={3}
                max={20}
                step={1}
                onValueChange={(value) => setYearsToShow(value[0])}
                className="mt-2"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={chartType === 'line' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setChartType('line')}
                  className="flex items-center justify-center"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Line
                </Button>
                <Button 
                  variant={chartType === 'bar' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setChartType('bar')}
                  className="flex items-center justify-center"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Bar
                </Button>
                <Button 
                  variant={chartType === 'pie' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setChartType('pie')}
                  className="flex items-center justify-center"
                >
                  <PieChartIcon className="h-4 w-4 mr-1" />
                  Pie
                </Button>
                <Button 
                  variant={chartType === 'scatter' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => setChartType('scatter')}
                  className="flex items-center justify-center"
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Scatter
                </Button>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full flex items-center justify-center"
              >
                <ArrowDownUp className="h-4 w-4 mr-1" />
                Sort: {sortOrder === 'asc' ? 'Low to High' : 'High to Low'}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4 border-t pt-4">
            <div className="w-full">
              <h3 className="text-sm font-medium mb-2">Legend & Key Metrics</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span>Average Value</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span>Transaction Count</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                  <span>Growth Rate</span>
                </div>
              </div>
            </div>
            
            {selectedNeighborhoodTimeline && (
              <div className="w-full bg-muted p-3 rounded-md text-sm">
                <h3 className="font-medium mb-1">{selectedNeighborhoodTimeline.name} Summary</h3>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div>Current Avg Value:</div>
                  <div className="font-medium text-right">
                    {formatCurrency(selectedNeighborhoodTimeline.data.slice(-1)[0]?.value)}
                  </div>
                  <div>Annual Growth:</div>
                  <div className="font-medium text-right">
                    {formatPercentage(calculateAverageGrowthRate(selectedNeighborhoodTimeline.data))}
                  </div>
                  <div>Latest Transactions:</div>
                  <div className="font-medium text-right">
                    {selectedNeighborhoodTimeline.data.slice(-1)[0]?.transactionCount || 0}
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
        
        {/* Main Content Card */}
        <Card className="lg:col-span-3 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>
                {activeTab === 'trends' ? 'Historical Trends' : 
                 activeTab === 'comparison' ? 'Neighborhood Comparison' : 
                 'Value Distribution'}
              </CardTitle>
              <div className="w-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="trends" className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Trends
                    </TabsTrigger>
                    <TabsTrigger value="comparison" className="flex items-center">
                      <Map className="h-4 w-4 mr-1" />
                      Comparison
                    </TabsTrigger>
                    <TabsTrigger value="distribution" className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Distribution
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            <CardDescription>
              {activeTab === 'trends' ? 'View historical property values over time' : 
               activeTab === 'comparison' ? 'Compare values across different neighborhoods' : 
               'See the distribution of neighborhood values'}
            </CardDescription>
            <Separator className="mt-2" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[500px] w-full">
              <Tabs value={activeTab} className="w-full h-full">
                <TabsContent value="trends" className="h-full mt-0">
                {selectedNeighborhoodTimeline && (
                  <>
                    {chartType === 'line' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={selectedNeighborhoodTimeline.data}
                          margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            yAxisId="left"
                            tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            domain={[0, 'dataMax + 5']}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string) => {
                              if (name === 'averageValue') return [formatCurrency(value), 'Average Value'];
                              if (name === 'transactionCount') return [value, 'Transactions'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Legend />
                          <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="averageValue" 
                            name="Average Value" 
                            stroke="#2563eb" 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                          <Line 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="transactionCount" 
                            name="Transactions" 
                            stroke="#10b981" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    
                    {chartType === 'bar' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={selectedNeighborhoodTimeline.data}
                          margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            yAxisId="left"
                            tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            domain={[0, 'dataMax + 5']}
                          />
                          <Tooltip 
                            formatter={(value: any, name: string) => {
                              if (name === 'Average Value') return [formatCurrency(value), name];
                              return [value, name];
                            }}
                            labelFormatter={(label) => formatDate(label)}
                          />
                          <Legend />
                          <Bar 
                            yAxisId="left" 
                            dataKey="averageValue" 
                            name="Average Value" 
                            fill="#2563eb" 
                          />
                          <Bar 
                            yAxisId="right" 
                            dataKey="transactionCount" 
                            name="Transactions" 
                            fill="#10b981" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    
                    {chartType === 'pie' && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <h3 className="text-lg font-medium mb-6">
                          Value Distribution for {selectedNeighborhoodTimeline.name}
                        </h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <PieChart>
                            <Pie
                              data={selectedNeighborhoodTimeline.data}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              nameKey="date"
                              label={(entry) => formatDate(entry.date)}
                            >
                              {selectedNeighborhoodTimeline.data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [formatCurrency(value), 'Average Value']}
                              labelFormatter={(label) => formatDate(label)}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {chartType === 'scatter' && (
                      <div className="flex flex-col items-center justify-center h-full">
                        <h3 className="text-lg font-medium mb-6">
                          Value Over Time Scatter Analysis
                        </h3>
                        <ResponsiveContainer width="100%" height="80%">
                          <ScatterChart
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                          >
                            <CartesianGrid />
                            <XAxis 
                              type="category" 
                              dataKey="date" 
                              name="Year" 
                              tickFormatter={formatDate}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis 
                              type="number" 
                              dataKey="value" 
                              name="Average Value" 
                              tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                            />
                            <ZAxis 
                              type="number" 
                              dataKey="transactionCount" 
                              range={[50, 400]} 
                              name="Transactions"
                            />
                            <Tooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              formatter={(value: any, name: string) => {
                                if (name === 'Average Value') return [formatCurrency(value), name];
                                if (name === 'Year') return [formatDate(value), name];
                                return [value, name];
                              }}
                            />
                            <Scatter 
                              name={selectedNeighborhoodTimeline.name} 
                              data={selectedNeighborhoodTimeline.data} 
                              fill="#2563eb"
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="comparison" className="h-full mt-0">
                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getNeighborhoodComparisonData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'Average Value') return [formatCurrency(value), name];
                          if (name === 'Growth Rate') return [formatPercentage(value), name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Average Value" 
                        fill="#2563eb" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                
                {chartType === 'line' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        allowDuplicatedCategory={false}
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                      />
                      <Tooltip 
                        formatter={(value: any) => [formatCurrency(value), 'Average Value']}
                      />
                      <Legend />
                      
                      {allNeighborhoodTimelines?.slice(0, 10).map((neighborhood, index) => (
                        <Line
                          key={neighborhood.id}
                          data={neighborhood.data}
                          dataKey="value"
                          name={neighborhood.name}
                          stroke={COLORS[index % COLORS.length]}
                          dot={false}
                          strokeWidth={neighborhood.id === selectedNeighborhoodId ? 3 : 1}
                          activeDot={{ r: neighborhood.id === selectedNeighborhoodId ? 8 : 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
                
                {chartType === 'pie' && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <h3 className="text-lg font-medium mb-6">
                      Market Share by Neighborhood
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={getNeighborhoodComparisonData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({name, percent}) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        >
                          {getNeighborhoodComparisonData().map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.id === selectedNeighborhoodId ? '#ff0000' : COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(value), 'Average Value']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {chartType === 'scatter' && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <h3 className="text-lg font-medium mb-6">
                      Value vs Growth Rate Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid />
                        <XAxis 
                          type="number" 
                          dataKey="avgValue" 
                          name="Average Value" 
                          tickFormatter={(value) => formatCurrency(value).replace('$', '')}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="growthRate" 
                          name="Growth Rate"
                          tickFormatter={(value) => formatPercentage(value)}
                        />
                        <ZAxis 
                          type="number" 
                          range={[60, 400]} 
                          name="Size"
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: any, name: string) => {
                            if (name === 'Average Value') return [formatCurrency(value), name];
                            if (name === 'Growth Rate') return [formatPercentage(value), name];
                            return [value, name];
                          }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border border-gray-200 shadow-sm rounded">
                                  <p className="font-medium">{data.name}</p>
                                  <p>Average Value: {formatCurrency(data.avgValue)}</p>
                                  <p>Growth Rate: {formatPercentage(data.growthRate)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter 
                          name="Neighborhoods" 
                          data={getComparableNeighborhoods()} 
                          fill="#8884d8"
                          shape={(props: any) => {
                            const { cx, cy, fill, payload } = props;
                            
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={payload.isSelected ? 10 : 6}
                                stroke={payload.isSelected ? '#ff0000' : 'none'}
                                strokeWidth={2}
                                fill={payload.isSelected ? '#ff6666' : fill}
                              />
                            );
                          }}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="distribution" className="h-full mt-0">
                {chartType === 'pie' && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <h3 className="text-lg font-medium mb-6">
                      Neighborhood Value Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={getDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, value, percent}) => 
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {getDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                {chartType === 'bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getDistributionData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Number of Neighborhoods" 
                        fill="#2563eb" 
                      >
                        {getDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                
                {chartType === 'line' && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <h3 className="text-lg font-medium mb-6">
                      Please use Bar or Pie chart for distribution data
                    </h3>
                    <Button
                      onClick={() => setChartType('bar')}
                      className="mr-2"
                    >
                      Switch to Bar Chart
                    </Button>
                    <Button
                      onClick={() => setChartType('pie')}
                      variant="outline"
                    >
                      Switch to Pie Chart
                    </Button>
                  </div>
                )}
                
                {chartType === 'scatter' && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <h3 className="text-lg font-medium mb-6">
                      Please use Bar or Pie chart for distribution data
                    </h3>
                    <Button
                      onClick={() => setChartType('bar')}
                      className="mr-2"
                    >
                      Switch to Bar Chart
                    </Button>
                    <Button
                      onClick={() => setChartType('pie')}
                      variant="outline"
                    >
                      Switch to Pie Chart
                    </Button>
                  </div>
                )}
              </TabsContent>
              </Tabs>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <div className="text-sm text-muted-foreground">
              Data is based on {allNeighborhoodTimelines?.length || 0} neighborhoods over {yearsToShow} years
            </div>
            
            <div className="text-sm">
              <span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default NeighborhoodDataDemo;