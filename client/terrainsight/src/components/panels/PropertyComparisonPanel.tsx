import React from 'react';
import { PropertyComparisonProvider } from '../comparison/PropertyComparisonContext';
import { PropertyComparison } from '../comparison/PropertyComparison';
import { Property } from '@shared/schema';

interface PropertyComparisonPanelProps {
  properties: Property[];
}

/**
 * Panel that wraps the property comparison functionality
 */
export function PropertyComparisonPanel({ properties }: PropertyComparisonPanelProps) {
  return (
    <div className="h-full p-6 overflow-visible">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Property Comparison</h2>
        <p className="text-gray-600">
          Compare multiple properties side by side to evaluate similarities and differences.
          Select up to 5 properties to include in your comparison.
        </p>
      </div>
      
      <PropertyComparisonProvider>
        <div className="overflow-visible relative z-10">
          <PropertyComparison properties={properties} />
        </div>
      </PropertyComparisonProvider>
    </div>
  );
}