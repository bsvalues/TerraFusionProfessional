import React, { useState } from 'react';
import { useAppMode } from '@/contexts/AppModeContext';
import { Property } from '@shared/schema';
import DesktopReviewPanel from '@/components/review/DesktopReviewPanel';
import { useQuery } from '@tanstack/react-query';
import { sampleProperties } from '@/lib/sample-data';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Desktop Review Page
 * 
 * A dedicated page for the property review dashboard that allows assessors to review, 
 * verify, and validate property data, sketches, and related information. Supports
 * both standalone and integrated application modes.
 */
const DesktopReviewPage: React.FC = () => {
  const { mode, isStandalone } = useAppMode();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // In a real application, we would fetch properties that need review from the API
  // For this demo, we'll use the sample properties
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties-for-review'],
    queryFn: async () => {
      // In a real app, this would be a call to an API endpoint
      // For demo purposes, let's simulate a delay and return sample data
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleProperties;
    }
  });
  
  // Handle property selection
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };
  
  // Handle property updates (from inspection form, etc.)
  const handlePropertyUpdate = (propertyId: number, updates: Partial<Property>) => {
    // In a real app, this would call an API to update the property
    console.log('Updating property:', propertyId, updates);
    
    // For demo, update the selected property in state
    if (selectedProperty && selectedProperty.id === propertyId) {
      setSelectedProperty({
        ...selectedProperty,
        ...updates
      });
    }
  };
  
  // Page content based on loading state
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading property review data...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Error loading data</h2>
          <p className="mt-2">
            Could not load property review data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      "w-full max-w-full h-[calc(100vh-56px)] flex flex-col",
      isStandalone ? "bg-white" : "bg-gray-900 text-white"
    )}>
      <div className="flex-grow overflow-hidden">
        <DesktopReviewPanel 
          properties={properties || []}
          selectedProperty={selectedProperty}
          onPropertySelect={handlePropertySelect}
          onUpdateProperty={handlePropertyUpdate}
        />
      </div>
    </div>
  );
};

export default DesktopReviewPage;