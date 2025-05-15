import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  AreaChart, TrendingUp, TrendingDown, Filter, Download, FileSpreadsheet, 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Loader2, AlertCircle, Search
} from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Define types for our valuation data
interface ValuationHistoryEntry {
  year: number;
  assessed: number;
  market: number;
  landValue: number;
  improvementValue: number;
}

interface SalesHistoryEntry {
  date: string;
  price: number;
}

interface PropertyValuation {
  id: string;
  parcelId: string;
  address: string;
  neighborhood: string;
  yearBuilt: number;
  squareFeet: number;
  valuationHistory: ValuationHistoryEntry[];
  salesHistory: SalesHistoryEntry[];
}

// Type for aggregated metrics
interface AggregatedMetrics {
  totalPropertyValue: number;
  propertyCount: number;
  averageValue: number;
  medianValue: number;
  valuePerSqFt: number;
  valueChange: {
    oneYear: number;
    fiveYear: number;
  };
  neighborhoodBreakdown: {
    neighborhood: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }[];
}

// Color palette for charts
const COLORS = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#2c3e50'];

/**
 * ValuationDashboard component
 * A dynamic dashboard for visualizing property valuation data with interactive filtering
 * and drill-through capabilities.
 */
const ValuationDashboard: React.FC = () => {
  const { toast } = useToast();
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [minYearBuilt, setMinYearBuilt] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedMetric, setSelectedMetric] = useState<string>('market');
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<string>('csv');

  // Fetch valuation data with filters
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/valuations', neighborhood, minYearBuilt], 
    queryFn: getQueryFn<PropertyValuation[]>({ on401: "throw" }),
    staleTime: 60000
  });

  // Extract unique neighborhoods for filter dropdown
  useEffect(() => {
    if (data) {
      const uniqueNeighborhoods = Array.from(
        new Set(data.map(property => property.neighborhood))
      );
      setNeighborhoods(uniqueNeighborhoods);
    }
  }, [data]);

  // Calculate aggregated metrics from the data
  const calculateAggregatedMetrics = (): AggregatedMetrics | null => {
    if (!data || data.length === 0) return null;

    // Group properties by neighborhood
    const neighborhoodGroups = data.reduce((groups, property) => {
      const neighborhood = property.neighborhood;
      if (!groups[neighborhood]) {
        groups[neighborhood] = {
          neighborhood,
          properties: [],
          totalValue: 0,
        };
      }
      
      const latestValuation = property.valuationHistory[property.valuationHistory.length - 1];
      groups[neighborhood].properties.push(property);
      groups[neighborhood].totalValue += latestValuation.market;
      
      return groups;
    }, {} as Record<string, { neighborhood: string; properties: PropertyValuation[]; totalValue: number }>);

    // Calculate neighborhood breakdown
    const neighborhoodBreakdown = Object.values(neighborhoodGroups).map(group => ({
      neighborhood: group.neighborhood,
      count: group.properties.length,
      totalValue: group.totalValue,
      avgValue: group.totalValue / group.properties.length
    }));

    // Sort values for median calculation
    const currentValues = data.map(p => {
      const latest = p.valuationHistory[p.valuationHistory.length - 1];
      return latest.market;
    }).sort((a, b) => a - b);

    // Calculate median value
    const mid = Math.floor(currentValues.length / 2);
    const medianValue = currentValues.length % 2 === 0 
      ? (currentValues[mid - 1] + currentValues[mid]) / 2 
      : currentValues[mid];

    // Calculate total square footage for price per sq ft
    const totalSqFt = data.reduce((sum, property) => sum + property.squareFeet, 0);
    const totalValue = currentValues.reduce((sum, value) => sum + value, 0);

    // Calculate year-over-year changes
    const oneYearChange = data.reduce((sum, property) => {
      const history = property.valuationHistory;
      if (history.length < 2) return sum;
      
      const currentYearIndex = history.length - 1;
      const prevYearIndex = history.length - 2;
      
      const currentValue = history[currentYearIndex].market;
      const prevValue = history[prevYearIndex].market;
      
      const percentChange = ((currentValue - prevValue) / prevValue) * 100;
      return sum + percentChange;
    }, 0) / data.length;

    // Calculate 5-year change if history is available
    const fiveYearChange = data.reduce((sum, property) => {
      const history = property.valuationHistory;
      if (history.length < 5) return sum;
      
      const currentYearIndex = history.length - 1;
      const fiveYearsAgoIndex = 0; // Assuming the first entry is 5 years ago
      
      const currentValue = history[currentYearIndex].market;
      const pastValue = history[fiveYearsAgoIndex].market;
      
      const percentChange = ((currentValue - pastValue) / pastValue) * 100;
      return sum + percentChange;
    }, 0) / data.length;

    return {
      totalPropertyValue: totalValue,
      propertyCount: data.length,
      averageValue: totalValue / data.length,
      medianValue,
      valuePerSqFt: totalValue / totalSqFt,
      valueChange: {
        oneYear: oneYearChange,
        fiveYear: fiveYearChange
      },
      neighborhoodBreakdown
    };
  };

  const metrics = calculateAggregatedMetrics();

  // Handle filter application
  const handleApplyFilters = () => {
    refetch();
    toast({
      title: "Filters Applied",
      description: "The dashboard has been updated with your filter criteria.",
    });
  };

  // Handle data export
  const handleExport = () => {
    toast({
      title: "Export Initiated",
      description: `Exporting valuation data to ${exportFormat.toUpperCase()} format.`,
    });

    // In a real app, we would trigger an API call to download the file
    // For demo purposes, we're just showing a toast notification
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Valuation data has been successfully exported.",
      });
    }, 1500);
  };

  // Prepare data for time series chart
  const prepareTimeSeriesData = () => {
    if (!data) return [];
    
    // Group data by year and calculate average values
    const yearData = data.reduce((acc, property) => {
      property.valuationHistory.forEach(history => {
        if (!acc[history.year]) {
          acc[history.year] = {
            year: history.year,
            assessed: 0,
            market: 0,
            landValue: 0,
            improvementValue: 0,
            count: 0
          };
        }
        
        acc[history.year].assessed += history.assessed;
        acc[history.year].market += history.market;
        acc[history.year].landValue += history.landValue;
        acc[history.year].improvementValue += history.improvementValue;
        acc[history.year].count += 1;
      });
      
      return acc;
    }, {} as Record<number, any>);
    
    // Convert to array and calculate averages
    return Object.values(yearData)
      .map(yearGroup => ({
        year: yearGroup.year,
        assessed: yearGroup.assessed / yearGroup.count,
        market: yearGroup.market / yearGroup.count,
        landValue: yearGroup.landValue / yearGroup.count,
        improvementValue: yearGroup.improvementValue / yearGroup.count
      }))
      .sort((a, b) => a.year - b.year);
  };

  // Prepare data for neighborhood comparison chart
  const prepareNeighborhoodData = () => {
    if (!metrics) return [];
    
    return metrics.neighborhoodBreakdown.map(item => ({
      neighborhood: item.neighborhood,
      avgValue: item.avgValue,
      count: item.count
    }));
  };

  // Find the currently selected property
  const selectedProperty = selectedPropertyId 
    ? data?.find(p => p.id === selectedPropertyId) 
    : null;

  // Chart data
  const timeSeriesData = prepareTimeSeriesData();
  const neighborhoodData = prepareNeighborhoodData();

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Loading valuation data...</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="h-80">
            <Skeleton className="h-full w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Valuation Data</h3>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "An unknown error occurred."}
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Dashboard Header with Filters */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <AreaChart className="mr-2 h-6 w-6 text-primary" />
            Property Valuation Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Interactive analytics and visualizations for property valuations in Benton County
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Neighborhoods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighborhoods</SelectItem>
                {neighborhoods.map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Input
              type="number"
              placeholder="Min Year Built"
              className="w-36"
              value={minYearBuilt}
              onChange={(e) => setMinYearBuilt(e.target.value)}
            />
          </div>
          
          <Button 
            variant="default" 
            size="default" 
            onClick={handleApplyFilters}
            className="flex items-center"
          >
            <Filter className="mr-1 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Property Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalPropertyValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.propertyCount} properties analyzed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Property Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.averageValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Median: {formatCurrency(metrics.medianValue)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Value Per Square Foot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.valuePerSqFt, undefined, undefined, 2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Average price per square foot
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Year-Over-Year Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                {metrics.valueChange.oneYear > 0 ? (
                  <>
                    <TrendingUp className="mr-1 h-5 w-5 text-green-500" />
                    <span className="text-green-500">+{metrics.valueChange.oneYear.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="mr-1 h-5 w-5 text-red-500" />
                    <span className="text-red-500">{metrics.valueChange.oneYear.toFixed(1)}%</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                5-Year: {metrics.valueChange.fiveYear > 0 ? '+' : ''}{metrics.valueChange.fiveYear.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Chart and Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Valuation Trends Over Time</CardTitle>
              <div className="flex">
                <TabsList className="mr-2">
                  <TabsTrigger 
                    value="bar" 
                    onClick={() => setChartType('bar')}
                    className={chartType === 'bar' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="line" 
                    onClick={() => setChartType('line')}
                    className={chartType === 'line' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <LineChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pie" 
                    onClick={() => setChartType('pie')}
                    className={chartType === 'pie' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    <PieChartIcon className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
                
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Market Value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market Value</SelectItem>
                    <SelectItem value="assessed">Assessed Value</SelectItem>
                    <SelectItem value="landValue">Land Value</SelectItem>
                    <SelectItem value="improvementValue">Improvement Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <CardDescription>
              Average property {selectedMetric === 'market' 
                ? 'market' 
                : selectedMetric === 'assessed' 
                  ? 'assessed' 
                  : selectedMetric === 'landValue' 
                    ? 'land' 
                    : 'improvement'} values by year
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar 
                      dataKey={selectedMetric} 
                      fill="#3498db" 
                      name={
                        selectedMetric === 'market' 
                          ? 'Market Value' 
                          : selectedMetric === 'assessed' 
                            ? 'Assessed Value' 
                            : selectedMetric === 'landValue' 
                              ? 'Land Value' 
                              : 'Improvement Value'
                      } 
                    />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke="#3498db" 
                      activeDot={{ r: 8 }}
                      name={
                        selectedMetric === 'market' 
                          ? 'Market Value' 
                          : selectedMetric === 'assessed' 
                            ? 'Assessed Value' 
                            : selectedMetric === 'landValue' 
                              ? 'Land Value' 
                              : 'Improvement Value'
                      } 
                    />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={neighborhoodData}
                      dataKey="avgValue"
                      nameKey="neighborhood"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      fill="#8884d8"
                      label={(entry) => entry.neighborhood}
                    >
                      {neighborhoodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No data available for visualization</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Neighborhood Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Neighborhood Comparison</CardTitle>
            <CardDescription>
              Average property values by neighborhood
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Neighborhood</TableHead>
                  <TableHead className="text-right">Avg. Value</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics?.neighborhoodBreakdown.map((item) => (
                  <TableRow key={item.neighborhood}>
                    <TableCell className="font-medium">{item.neighborhood}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.avgValue)}</TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Property Listing Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                Detailed property records with historical valuations
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue placeholder="CSV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel ID</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Neighborhood</TableHead>
                  <TableHead className="text-right">Year Built</TableHead>
                  <TableHead className="text-right">Sq. Feet</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">YoY Change</TableHead>
                  <TableHead className="text-center">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((property) => {
                  const latestValuation = property.valuationHistory[property.valuationHistory.length - 1];
                  const previousValuation = property.valuationHistory[property.valuationHistory.length - 2];
                  const yoyChange = previousValuation 
                    ? ((latestValuation.market - previousValuation.market) / previousValuation.market) * 100 
                    : 0;

                  return (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">{property.parcelId}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {property.neighborhood}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{property.yearBuilt}</TableCell>
                      <TableCell className="text-right">{property.squareFeet.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(latestValuation.market)}
                      </TableCell>
                      <TableCell className="text-right">
                        {yoyChange > 0 ? (
                          <span className="text-green-500">+{yoyChange.toFixed(1)}%</span>
                        ) : (
                          <span className="text-red-500">{yoyChange.toFixed(1)}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedPropertyId(
                            selectedPropertyId === property.id ? null : property.id
                          )}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Showing {data?.length} properties out of {metrics?.propertyCount} total properties
        </CardFooter>
      </Card>
      
      {/* Property Detail View (when a property is selected) */}
      {selectedProperty && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Property Detail: {selectedProperty.address}</CardTitle>
                <CardDescription>
                  Parcel ID: {selectedProperty.parcelId} | Neighborhood: {selectedProperty.neighborhood}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedPropertyId(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Valuation History */}
              <div>
                <h3 className="text-lg font-medium mb-3">Valuation History</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedProperty.valuationHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="market" stroke="#3498db" name="Market Value" />
                      <Line type="monotone" dataKey="assessed" stroke="#2ecc71" name="Assessed Value" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Market Value</TableHead>
                        <TableHead className="text-right">Assessed Value</TableHead>
                        <TableHead className="text-right">Land Value</TableHead>
                        <TableHead className="text-right">Improvement Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProperty.valuationHistory.map((history) => (
                        <TableRow key={history.year}>
                          <TableCell>{history.year}</TableCell>
                          <TableCell className="text-right">{formatCurrency(history.market)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(history.assessed)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(history.landValue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(history.improvementValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Property Sales History & Components */}
              <div>
                <h3 className="text-lg font-medium mb-3">Sales History</h3>
                {selectedProperty.salesHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Sale Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProperty.salesHistory.map((sale, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{formatCurrency(sale.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No sales history available</p>
                )}
                
                <h3 className="text-lg font-medium mt-6 mb-3">Property Components</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Land Value</p>
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].landValue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].landValue / 
                            selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].market) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Improvement Value</p>
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].improvementValue)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].improvementValue / 
                            selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].market) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Value Per Square Foot</p>
                        <div className="text-2xl font-bold">
                          {formatCurrency(selectedProperty.valuationHistory[selectedProperty.valuationHistory.length - 1].market / selectedProperty.squareFeet, undefined, undefined, 2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on {selectedProperty.squareFeet.toLocaleString()} sq. ft.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValuationDashboard;