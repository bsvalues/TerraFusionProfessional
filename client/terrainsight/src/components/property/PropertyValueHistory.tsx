/**
 * PropertyValueHistory Component
 * 
 * Displays a property's value history over time with visualizations
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PropertyValueHistory as PropertyValueHistoryType } from '../../../shared/interfaces/PropertyHistory';
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

interface PropertyValueHistoryProps {
  propertyId: string | number;
}

/**
 * PropertyValueHistory Component - Displays historical property values
 * 
 * @param propertyId The property ID to fetch history for
 */
const PropertyValueHistory: React.FC<PropertyValueHistoryProps> = ({ propertyId }) => {
  const [activeTab, setActiveTab] = useState('chart');
  
  // Fetch property value history data
  const { data, isLoading, isError, error } = useQuery<{ 
    success: boolean; 
    history: PropertyValueHistoryType 
  }>({
    queryKey: ['property-history', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}/history/formatted`);
      if (!response.ok) {
        throw new Error('Failed to fetch property history data');
      }
      return response.json();
    },
    staleTime: 60000, // 1 minute
    enabled: !!propertyId
  });
  
  // Prepare data for the chart
  const chartData = React.useMemo(() => {
    if (!data?.history?.values) return [];
    
    return data.history.values
      .map(point => ({
        year: point.year,
        value: point.value
      }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-[250px] w-full" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Property History</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.success || !data.history) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Historical Data</CardTitle>
          <CardDescription>
            There is no historical valuation data available for this property.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { history } = data;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Value History</CardTitle>
        <CardDescription>
          Historical valuation data for property #{propertyId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart" className="space-y-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value, 0)}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Year: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Property Value"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {history.metadata?.primarySource && (
                <p>Source: {history.metadata.primarySource}</p>
              )}
              {history.metadata?.interpolatedCount && history.metadata.interpolatedCount > 0 && (
                <p>Note: {history.metadata.interpolatedCount} values are interpolated estimates</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="table">
            <Table>
              <TableCaption>Historical property values by year</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Year-over-Year Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((point, index) => {
                  // Calculate year-over-year change
                  const previousValue = index > 0 ? chartData[index - 1].value : null;
                  const yoyChange = previousValue 
                    ? ((point.value - previousValue) / previousValue) 
                    : null;
                  
                  return (
                    <TableRow key={point.year}>
                      <TableCell>{point.year}</TableCell>
                      <TableCell>{formatCurrency(point.value)}</TableCell>
                      <TableCell>
                        {yoyChange !== null ? (
                          <span className={yoyChange > 0 ? 'text-green-600' : yoyChange < 0 ? 'text-red-600' : ''}>
                            {formatPercentage(yoyChange)}
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="summary">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <dt className="text-sm font-medium text-muted-foreground">Valuation as of {new Date().getFullYear()}</dt>
                <dd className="mt-1 text-2xl font-semibold">{formatCurrency(history.currentValue)}</dd>
              </div>
              
              <div className="rounded-lg border p-3">
                <dt className="text-sm font-medium text-muted-foreground">Years of Data</dt>
                <dd className="mt-1 text-2xl font-semibold">{history.yearsAvailable.length}</dd>
              </div>
              
              {history.totalPercentageChange !== undefined && (
                <div className="rounded-lg border p-3">
                  <dt className="text-sm font-medium text-muted-foreground">Total Change</dt>
                  <dd className={`mt-1 text-2xl font-semibold ${history.totalPercentageChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(history.totalPercentageChange)}
                  </dd>
                </div>
              )}
              
              {history.annualGrowthRate !== undefined && (
                <div className="rounded-lg border p-3">
                  <dt className="text-sm font-medium text-muted-foreground">Annual Growth Rate</dt>
                  <dd className={`mt-1 text-2xl font-semibold ${history.annualGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(history.annualGrowthRate)}
                  </dd>
                </div>
              )}
            </dl>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Valuation History</h4>
              <p className="text-sm text-muted-foreground">
                This property has valuation data from {history.yearsAvailable[0]} to {history.yearsAvailable[history.yearsAvailable.length - 1]}.
              </p>
              
              {history.metadata?.lastUpdated && (
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(history.metadata.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PropertyValueHistory;