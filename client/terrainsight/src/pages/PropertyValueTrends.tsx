import React, { useState, useEffect } from 'react';
import { PropertyValueTrendMap } from '@/components/trends/PropertyValueTrendMap';
import { ValueImpactFactors } from '@/components/trends/ValueImpactFactors';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PropertyTrendsResponse {
  properties: any[];
  years: string[];
}

export default function PropertyValueTrends() {
  // Selected year for the value impact factors
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  
  // Fetch properties data with historical values
  const { data, isLoading, isError } = useQuery<PropertyTrendsResponse>({
    queryKey: ['/api/properties/trends'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-600">Loading property trends data...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="p-6 border border-red-200 rounded-md bg-red-50">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">
            We were unable to load the property trends data. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Property Value Trends</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Explore how property values have changed over time in Benton County. Use the slider below to 
          animate through different years and observe value changes across the region.
        </p>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-4 border border-neutral-200 rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Value Insights</h3>
            <p className="text-sm text-gray-600">
              Property values in Benton County have shown steady growth since 2018, with an 
              average annual appreciation rate of approximately 5%.
            </p>
          </div>
          
          <div className="p-4 border border-neutral-200 rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Growth Factors</h3>
            <p className="text-sm text-gray-600">
              Key factors influencing value growth include economic development, infrastructure 
              improvements, and increased demand for housing in the region.
            </p>
          </div>
          
          <div className="p-4 border border-neutral-200 rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-2">2025 Projections</h3>
            <p className="text-sm text-gray-600">
              Based on current trends, property values are projected to continue rising at a 
              steady pace through 2025 barring any major economic shifts.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <PropertyValueTrendMap 
            properties={data.properties} 
            onYearChange={(year) => setSelectedYear(year)}
          />
        </div>
        <div className="lg:col-span-1">
          <ValueImpactFactors selectedYear={selectedYear} />
        </div>
      </div>
    </div>
  );
}