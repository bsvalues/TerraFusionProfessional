import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Property } from '@shared/schema';

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

interface PropertyCardField {
  key: keyof Property; // The property key
  label: string;      // Display label
  type?: 'currency' | 'area' | 'text' | 'date'; // Type for formatting
  priority: number;   // Display priority (lower = higher priority)
}

// Configurable fields that can be displayed
const PROPERTY_FIELDS: PropertyCardField[] = [
  { key: 'parcelId', label: 'Parcel ID', priority: 1 },
  { key: 'address', label: 'Address', priority: 1 },
  { key: 'value', label: 'Value', type: 'currency', priority: 1 },
  { key: 'estimatedValue', label: 'Estimated Value', type: 'currency', priority: 2 },
  { key: 'squareFeet', label: 'Square Feet', type: 'area', priority: 2 },
  { key: 'yearBuilt', label: 'Year Built', priority: 3 },
  { key: 'propertyType', label: 'Property Type', priority: 2 },
  { key: 'owner', label: 'Owner', priority: 3 },
  { key: 'landValue', label: 'Land Value', type: 'currency', priority: 4 },
  { key: 'salePrice', label: 'Sale Price', type: 'currency', priority: 3 },
  { key: 'lastSaleDate', label: 'Last Sale Date', type: 'date', priority: 4 },
  { key: 'bedrooms', label: 'Bedrooms', priority: 3 },
  { key: 'bathrooms', label: 'Bathrooms', priority: 3 },
  { key: 'lotSize', label: 'Lot Size', type: 'area', priority: 4 },
  { key: 'neighborhood', label: 'Neighborhood', priority: 3 },
  { key: 'zoning', label: 'Zoning', priority: 5 },
  { key: 'taxAssessment', label: 'Tax Assessment', type: 'currency', priority: 4 },
  { key: 'pricePerSqFt', label: 'Price per Sq Ft', type: 'currency', priority: 4 },
];

interface DynamicPropertyCardProps {
  property: Partial<Property>;
  maxFields?: number; // Maximum number of fields to display
  priorityThreshold?: number; // Only show fields with priority <= this value
  highlightFields?: Array<keyof Property>; // Fields to highlight
}

const DynamicPropertyCard: React.FC<DynamicPropertyCardProps> = ({
  property,
  maxFields = 10,
  priorityThreshold = 5,
  highlightFields = [],
}) => {
  // Filter fields that have data available and match priority requirements
  const availableFields = PROPERTY_FIELDS
    .filter(field => 
      property[field.key] !== undefined && 
      property[field.key] !== null &&
      field.priority <= priorityThreshold
    )
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxFields);

  // Find the property type for badge display
  const propertyType = property.propertyType || 'Unknown';

  return (
    <Card className="overflow-hidden shadow-md transition-all hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-primary">
            {property.address || 'Property Details'}
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10">
            {propertyType}
          </Badge>
        </div>
        <CardDescription>
          {property.parcelId && `Parcel ID: ${property.parcelId}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="grid gap-2">
          {availableFields.map((field) => (
            // Skip address and parcelId as they're shown in the header
            field.key !== 'address' && field.key !== 'parcelId' && field.key !== 'propertyType' ? (
              <div 
                key={String(field.key)} 
                className={`flex justify-between ${
                  highlightFields.includes(field.key) ? 'bg-primary/5 p-1 rounded' : ''
                }`}
              >
                <span className="text-sm font-medium text-muted-foreground">{field.label}:</span>
                <span className="text-sm font-medium">
                  {formatValue(property[field.key], field.type)}
                </span>
              </div>
            ) : null
          ))}
        </div>
        
        {/* Show "more data available" message if we have more fields */}
        {PROPERTY_FIELDS.filter(field => 
          property[field.key] !== undefined && 
          property[field.key] !== null
        ).length > maxFields && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Additional property data available
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </span>
        {property.id && (
          <span className="text-xs text-muted-foreground">
            ID: {property.id}
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default DynamicPropertyCard;