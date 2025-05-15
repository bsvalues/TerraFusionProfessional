import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import DynamicPropertyCard from '../components/property/DynamicPropertyCard';
import DynamicPropertyDetails from '../components/property/DynamicPropertyDetails';
import { Property } from '@shared/schema';

const DynamicDataDemo: React.FC = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  
  // Fetch a list of properties
  const { 
    data: properties, 
    isLoading: propertiesLoading, 
    error: propertiesError 
  } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    refetchOnWindowFocus: false
  });
  
  // Fetch details for a single property when selected
  const { 
    data: selectedProperty, 
    isLoading: propertyDetailLoading, 
    error: propertyDetailError
  } = useQuery<Property>({
    queryKey: [`/api/properties/${selectedPropertyId}`],
    enabled: !!selectedPropertyId,
    refetchOnWindowFocus: false
  });

  // Set the first property as selected when data loads
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Function to randomize property fields for demo purposes
  const randomizeAvailableFields = (property: Property): Property => {
    // In a real application, this wouldn't be needed - we'd use the actual data
    // This is just for demonstration of dynamic fields
    return property;
  };

  // Display loading state
  if (propertiesLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dynamic Data Display</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Display error state
  if (propertiesError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load property data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dynamic Data Display</h1>
      <p className="text-muted-foreground mb-6">
        This demo showcases components that dynamically adapt to the available data. Fields display 
        only when data is present, making the interface more responsive to varying data completeness.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {properties?.slice(0, 3).map(property => (
          <DynamicPropertyCard 
            key={property.id} 
            property={randomizeAvailableFields(property)}
            maxFields={6}
            highlightFields={['value', 'estimatedValue']}
          />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Property Details</h2>
        <p className="text-muted-foreground mb-4">
          Select a property to see its detailed information. The tabs and fields automatically adjust based on available data.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {properties?.slice(0, 5).map(property => (
            <Button 
              key={property.id}
              variant={selectedPropertyId === property.id ? "default" : "outline"}
              onClick={() => setSelectedPropertyId(property.id)}
            >
              {property.address?.split(' ')[0] || `Property ${property.id}`}
            </Button>
          ))}
        </div>

        {propertyDetailLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : selectedProperty ? (
          <DynamicPropertyDetails property={randomizeAvailableFields(selectedProperty)} />
        ) : (
          <div className="p-6 border rounded-lg text-center text-muted-foreground">
            Select a property to view details
          </div>
        )}
      </div>

      <div className="mt-8 border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4">Dynamic Data Implementation</h2>
        <Tabs defaultValue="card">
          <TabsList>
            <TabsTrigger value="card">Property Card</TabsTrigger>
            <TabsTrigger value="details">Property Details</TabsTrigger>
          </TabsList>
          <TabsContent value="card" className="mt-4 space-y-4">
            <p>
              The <code>DynamicPropertyCard</code> component displays property information based on available data. 
              It uses priority levels and thresholds to determine which fields to show.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Automatically prioritizes important information</li>
              <li>Skips any fields with missing or null data</li>
              <li>Provides appropriate formatting for different data types</li>
              <li>Allows highlighting of specific fields</li>
            </ul>
          </TabsContent>
          <TabsContent value="details" className="mt-4 space-y-4">
            <p>
              The <code>DynamicPropertyDetails</code> component organizes property data into logical sections,
              only showing tabs and sections that have data to display.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sections automatically hide when no data is available</li>
              <li>Fields within sections only appear when they have values</li>
              <li>Specialized formatting for different data types</li>
              <li>Integrated visualization for historical value data when available</li>
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DynamicDataDemo;