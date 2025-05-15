import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Property } from '@shared/schema';
import SimpleBarChart from '../charts/SimpleBarChart';

// Helper function to format property values
const formatValue = (value: any, type?: string): string => {
  if (value === undefined || value === null) return 'N/A';
  
  if (type === 'currency') {
    // Parse the value to make sure it's a number
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(numValue) 
      ? `$${numValue.toLocaleString()}` 
      : `$${value}`;
  }
  
  if (type === 'area') {
    return `${value.toLocaleString()} sq ft`;
  }
  
  // Return the value as string
  return String(value);
};

// Interface defining each section of property details
interface PropertyDetailSection {
  id: string;
  title: string;
  fields: Array<{
    key: keyof Property;
    label: string;
    type?: 'currency' | 'area' | 'text' | 'date';
  }>;
}

// Predefined sections for organizing property data
const PROPERTY_DETAIL_SECTIONS: PropertyDetailSection[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    fields: [
      { key: 'parcelId', label: 'Parcel ID' },
      { key: 'address', label: 'Address' },
      { key: 'propertyType', label: 'Property Type' },
      { key: 'yearBuilt', label: 'Year Built' },
      { key: 'squareFeet', label: 'Square Feet', type: 'area' },
      { key: 'owner', label: 'Owner' },
    ]
  },
  {
    id: 'financial',
    title: 'Financial',
    fields: [
      { key: 'value', label: 'Value', type: 'currency' },
      { key: 'estimatedValue', label: 'Estimated Value', type: 'currency' },
      { key: 'salePrice', label: 'Sale Price', type: 'currency' },
      { key: 'lastSaleDate', label: 'Last Sale Date', type: 'date' },
      { key: 'landValue', label: 'Land Value', type: 'currency' },
      { key: 'taxAssessment', label: 'Tax Assessment', type: 'currency' },
      { key: 'pricePerSqFt', label: 'Price per Sq Ft', type: 'currency' },
    ]
  },
  {
    id: 'physical',
    title: 'Physical',
    fields: [
      { key: 'bedrooms', label: 'Bedrooms' },
      { key: 'bathrooms', label: 'Bathrooms' },
      { key: 'lotSize', label: 'Lot Size', type: 'area' },
      { key: 'zoning', label: 'Zoning' },
    ]
  },
  {
    id: 'location',
    title: 'Location',
    fields: [
      { key: 'neighborhood', label: 'Neighborhood' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
    ]
  }
];

interface DynamicPropertyDetailsProps {
  property: Partial<Property>;
}

const DynamicPropertyDetails: React.FC<DynamicPropertyDetailsProps> = ({ property }) => {
  // Calculate which sections have data to display
  const availableSections = useMemo(() => {
    return PROPERTY_DETAIL_SECTIONS
      .map(section => ({
        ...section,
        hasData: section.fields.some(field => 
          property[field.key] !== undefined && 
          property[field.key] !== null
        ),
        availableFields: section.fields.filter(field => 
          property[field.key] !== undefined && 
          property[field.key] !== null
        )
      }))
      .filter(section => section.hasData);
  }, [property]);

  // Extract historical values if available
  const historicalData = useMemo(() => {
    if (!property.historicalValues) return null;
    
    // Parse the JSON data if it's a string
    const historicalValues = typeof property.historicalValues === 'string' 
      ? JSON.parse(property.historicalValues as string) 
      : property.historicalValues;
    
    if (!historicalValues || typeof historicalValues !== 'object') return null;
    
    const years = Object.keys(historicalValues).sort();
    const values = years.map(year => {
      // Handle different formats - some might have value property or just be numbers
      const yearData = historicalValues[year];
      if (typeof yearData === 'object' && yearData.value !== undefined) {
        return parseFloat(yearData.value);
      }
      return typeof yearData === 'number' ? yearData : parseFloat(yearData);
    });
    
    return { years, values };
  }, [property.historicalValues]);
  
  const defaultTab = availableSections.length > 0 ? availableSections[0].id : '';

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
          {property.address || 'Property Details'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {availableSections.length > 0 ? (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 lg:flex">
              {availableSections.map(section => (
                <TabsTrigger key={section.id} value={section.id} className="text-sm">
                  {section.title}
                </TabsTrigger>
              ))}
              {historicalData && (
                <TabsTrigger value="history" className="text-sm">
                  Value History
                </TabsTrigger>
              )}
            </TabsList>
            
            {availableSections.map(section => (
              <TabsContent key={section.id} value={section.id} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.availableFields.map(field => (
                    <div key={String(field.key)} className="flex justify-between p-2 border-b">
                      <span className="font-medium">{field.label}:</span>
                      <span className="font-semibold">
                        {formatValue(property[field.key], field.type)}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
            
            {historicalData && (
              <TabsContent value="history" className="mt-4">
                <SimpleBarChart 
                  title="Property Value History"
                  data={historicalData.values}
                  labels={historicalData.years}
                />
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No property details available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DynamicPropertyDetails;