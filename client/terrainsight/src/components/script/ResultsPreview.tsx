import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TableIcon, CircleHelp, Download, 
  PieChart as PieChartIcon, BarChart as BarChartIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@/shared/types';

interface ResultsPreviewProps {
  title?: string;
  results: Property[];
  calculatedValues?: Record<string, number>;
  isLoading?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

const ResultsPreview: React.FC<ResultsPreviewProps> = ({ 
  title = 'Valuation Results', 
  results = [], 
  calculatedValues = {},
  isLoading = false
}) => {
  // Using TabsContent to handle view switching instead of state
  
  const generateBarChartData = () => {
    // Generate data for showing property values by square footage
    return results.map(property => ({
      name: property.address.split(',')[0],
      value: calculatedValues[property.id] || 0,
      squareFeet: property.squareFeet
    })).sort((a, b) => a.value - b.value);
  };
  
  const generatePieChartData = () => {
    // Group properties by size range
    const sizeRanges = {
      'Under 1500 sq ft': 0,
      '1500-2000 sq ft': 0,
      '2000-2500 sq ft': 0,
      '2500-3000 sq ft': 0,
      'Over 3000 sq ft': 0
    };
    
    results.forEach(property => {
      const sqft = property.squareFeet;
      
      if (sqft < 1500) {
        sizeRanges['Under 1500 sq ft'] += calculatedValues[property.id] || 0;
      } else if (sqft < 2000) {
        sizeRanges['1500-2000 sq ft'] += calculatedValues[property.id] || 0;
      } else if (sqft < 2500) {
        sizeRanges['2000-2500 sq ft'] += calculatedValues[property.id] || 0;
      } else if (sqft < 3000) {
        sizeRanges['2500-3000 sq ft'] += calculatedValues[property.id] || 0;
      } else {
        sizeRanges['Over 3000 sq ft'] += calculatedValues[property.id] || 0;
      }
    });
    
    return Object.entries(sizeRanges)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const calculateTotalValue = () => {
    return Object.values(calculatedValues).reduce((sum, val) => sum + val, 0);
  };
  
  const calculateAverageValue = () => {
    const values = Object.values(calculatedValues);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-sm">Processing data...</span>
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400">
        <CircleHelp size={40} className="mb-2 opacity-50" />
        <h3 className="text-sm font-medium mb-1">No Results Available</h3>
        <p className="text-xs text-center max-w-xs">
          Run your script to see valuation results for the properties in your dataset.
        </p>
      </div>
    );
  }
  
  const barChartData = generateBarChartData();
  const pieChartData = generatePieChartData();
  
  return (
    <div className="h-full flex flex-col border border-gray-700 rounded-md overflow-hidden">
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="flex text-xs text-gray-400 mt-1 space-x-4">
            <span>{results.length} properties</span>
            <span>Total: {formatCurrency(calculateTotalValue())}</span>
            <span>Average: {formatCurrency(calculateAverageValue())}</span>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 px-2"
            onClick={() => {}} // This would export data in a real application
          >
            <Download size={14} className="mr-1" /> Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="table" className="flex-1 flex flex-col">
        <div className="border-b border-gray-700 px-4">
          <TabsList className="h-9">
            <TabsTrigger value="table" className="text-xs h-8 data-[state=active]:bg-gray-700">
              <TableIcon size={14} className="mr-1" /> Table View
            </TabsTrigger>
            <TabsTrigger value="barChart" className="text-xs h-8 data-[state=active]:bg-gray-700">
              <BarChartIcon size={14} className="mr-1" /> Bar Chart
            </TabsTrigger>
            <TabsTrigger value="pieChart" className="text-xs h-8 data-[state=active]:bg-gray-700">
              <PieChartIcon size={14} className="mr-1" /> Distribution
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="table" className="flex-1 overflow-auto p-0 m-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Parcel ID</TableHead>
                <TableHead>Square Feet</TableHead>
                <TableHead className="text-right">Calculated Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">{property.address}</TableCell>
                  <TableCell>{property.parcelId}</TableCell>
                  <TableCell>{property.squareFeet.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(calculatedValues[property.id] || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="barChart" className="flex-1 p-4 m-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barChartData}
              margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
                stroke="#6b7280" 
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value).replace('$', '')} 
                stroke="#6b7280"
              />
              <RechartsTooltip 
                formatter={(value: number) => formatCurrency(value)} 
                labelFormatter={(label) => `Property: ${label}`}
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
              />
              <Bar dataKey="value" fill="#3b82f6" name="Calculated Value" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="pieChart" className="flex-1 p-4 m-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number) => formatCurrency(value)} 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsPreview;