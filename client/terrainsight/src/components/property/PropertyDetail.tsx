import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import PropertyValueHistory from './PropertyValueHistory';

// Define the property type to match our schema
type Property = {
  id: number;
  parcelId: string;
  address: string;
  owner: string | null;
  value: string | null;
  estimatedValue: string | null;
  salePrice: string | null;
  squareFeet: number;
  yearBuilt: number | null;
  landValue: string | null;
  coordinates: number[] | null;
  latitude: string | null;
  longitude: string | null;
  neighborhood: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  lotSize: number | null;
  zoning: string | null;
  lastSaleDate: string | null;
  taxAssessment: string | null;
  pricePerSqFt: string | null;
  attributes: Record<string, any>;
  historicalValues: Record<string, any>;
  sourceId: string | null;
  zillowId: string | null;
};

interface PropertyDetailProps {
  property: Property;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property }) => {
  // Calculate value indicators
  const currentValue = parseCurrency(property.value);
  const estimatedValue = parseCurrency(property.estimatedValue);
  const salePrice = parseCurrency(property.salePrice);
  
  // Value comparison (if both values exist)
  const valueComparison = estimatedValue !== null && currentValue !== null
    ? {
        difference: estimatedValue - currentValue,
        percentage: ((estimatedValue - currentValue) / currentValue) * 100
      }
    : null;

  return (
    <div className="space-y-8">
      {/* Property Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>{property.address}</CardTitle>
          <CardDescription>
            {property.parcelId} • {property.propertyType || 'Property'}
            {property.neighborhood && ` • ${property.neighborhood}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Current Assessment</h3>
              <p className="text-2xl font-bold">{property.value || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Estimated Value</h3>
              <p className="text-2xl font-bold">
                {property.estimatedValue || 'N/A'}
                {valueComparison && (
                  <span className={`ml-2 text-sm ${valueComparison.difference > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {valueComparison.difference > 0 ? '↑' : '↓'}{' '}
                    {Math.abs(valueComparison.percentage).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Land Value</h3>
              <p className="text-2xl font-bold">{property.landValue || 'N/A'}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Property Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
              <p>{property.owner || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Year Built</h3>
              <p>{property.yearBuilt || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Square Feet</h3>
              <p>{property.squareFeet.toLocaleString() || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Lot Size</h3>
              <p>{property.lotSize ? `${property.lotSize.toLocaleString()} sq ft` : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Price per Sq Ft</h3>
              <p>{property.pricePerSqFt || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Bedrooms</h3>
              <p>{property.bedrooms || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Bathrooms</h3>
              <p>{property.bathrooms || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Sale Date</h3>
              <p>{property.lastSaleDate || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Sale Price</h3>
              <p>{property.salePrice || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tax Assessment</h3>
              <p>{property.taxAssessment || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Zoning</h3>
              <p>{property.zoning || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Value History */}
      <PropertyValueHistory 
        historicalValues={property.historicalValues}
        currentValue={property.value}
        estimatedValue={property.estimatedValue}
      />
      
      {/* Display additional attributes if available */}
      {property.attributes && Object.keys(property.attributes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Attributes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(property.attributes)
                .filter(([key]) => key !== 'originalGisData') // Exclude raw GIS data which is too verbose
                .map(([key, value]) => (
                  <div key={key}>
                    <h3 className="text-sm font-medium text-muted-foreground">{key}</h3>
                    <p>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyDetail;