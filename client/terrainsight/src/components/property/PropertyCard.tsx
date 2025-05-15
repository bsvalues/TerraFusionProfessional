import React from 'react';
import { Property } from '@shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { PropertyWithOptionalFields } from '../map/PropertySelectionContext';

interface PropertyCardProps {
  property: Property | PropertyWithOptionalFields | null;
  isLoading?: boolean;
}

const formatCurrency = (value: string | null | undefined) => {
  if (!value) return 'N/A';
  // Remove any existing formatting and convert to number
  const numericValue = parseFloat(value.replace(/[$,]/g, ''));
  if (isNaN(numericValue)) return value;
  
  // Format as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(numericValue);
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto animate-pulse">
        <CardHeader className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          <div className="h-3 bg-gray-200 rounded w-3/6"></div>
        </CardContent>
      </Card>
    );
  }

  if (!property) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>No Property Selected</CardTitle>
          <CardDescription>
            Click on a parcel on the map to view its details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Property information will appear here when you select a parcel
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto border border-blue-100 shadow-sm">
      <CardHeader className="bg-blue-50/50 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>{property.address}</span>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {property.propertyType || 'Property'}
          </span>
        </CardTitle>
        <CardDescription>
          Parcel ID: {property.parcelId} • {property.neighborhood || 'Unknown Area'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Estimated Value</p>
            <p className="font-medium">{formatCurrency(property.value || '')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Last Sale Price</p>
            <p className="font-medium">{formatCurrency(property.salePrice || '')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Square Feet</p>
            <p className="font-medium">{property.squareFeet?.toLocaleString() || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Year Built</p>
            <p className="font-medium">{property.yearBuilt || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bedrooms</p>
            <p className="font-medium">{property.bedrooms || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Bathrooms</p>
            <p className="font-medium">{property.bathrooms || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Land Value</p>
            <p className="font-medium">{formatCurrency(property.landValue || '')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Price/Sq.Ft</p>
            <p className="font-medium">{property.pricePerSqFt || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Lot Size</p>
            <p className="font-medium">{property.lotSize?.toLocaleString() || 'N/A'} sq ft</p>
          </div>
          <div>
            <p className="text-muted-foreground">Zoning</p>
            <p className="font-medium">{property.zoning || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50/80 text-xs text-muted-foreground flex justify-between">
        <p>Last Sale: {property.lastSaleDate || 'Unknown'}</p>
        <p>Owner: {property.owner || 'Unknown'}</p>
      </CardFooter>
    </Card>
  );
};

export default PropertyCard;