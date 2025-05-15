import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface PropertyAttributesTableProps {
  property: Property;
}

export function PropertyAttributesTable({ property }: PropertyAttributesTableProps) {
  // Helper to get attribute value in a formatted way
  const formatAttributeValue = (key: keyof Property, fallback: string = 'N/A'): string => {
    const value = property[key];
    
    if (value === null || value === undefined) {
      return fallback;
    }
    
    // Handle specific property types
    if (key === 'value' || key === 'landValue' || key === 'salePrice' || key === 'taxAssessment') {
      // Format currency values
      return typeof value === 'string'
        ? formatCurrency(parseFloat(value.replace(/[^0-9.-]+/g, '')))
        : formatCurrency(value as number);
    }
    
    if (key === 'squareFeet' || key === 'lotSize') {
      // Format area values
      return typeof value === 'number'
        ? `${value.toLocaleString()} sq ft`
        : value.toString();
    }
    
    return value.toString();
  };
  
  // Use property attributes if available or create basic attributes
  const attributes = property.attributes 
    ? Object.entries(property.attributes as Record<string, any>)
    : [];
  
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableBody>
          {/* Basic property information */}
          <TableRow>
            <TableCell className="font-medium w-1/3">Address</TableCell>
            <TableCell>{property.address}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Parcel ID</TableCell>
            <TableCell>{property.parcelId}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Owner</TableCell>
            <TableCell>{formatAttributeValue('owner')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Property Type</TableCell>
            <TableCell>{formatAttributeValue('propertyType')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Neighborhood</TableCell>
            <TableCell>{formatAttributeValue('neighborhood')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Zoning</TableCell>
            <TableCell>{formatAttributeValue('zoning')}</TableCell>
          </TableRow>
          
          {/* Value information */}
          <TableRow>
            <TableCell className="font-medium">Current Value</TableCell>
            <TableCell>{formatAttributeValue('value')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Land Value</TableCell>
            <TableCell>{formatAttributeValue('landValue')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Tax Assessment</TableCell>
            <TableCell>{formatAttributeValue('taxAssessment')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Last Sale Price</TableCell>
            <TableCell>{formatAttributeValue('salePrice')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Last Sale Date</TableCell>
            <TableCell>{formatAttributeValue('lastSaleDate')}</TableCell>
          </TableRow>
          
          {/* Physical characteristics */}
          <TableRow>
            <TableCell className="font-medium">Square Feet</TableCell>
            <TableCell>{formatAttributeValue('squareFeet')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Lot Size</TableCell>
            <TableCell>{formatAttributeValue('lotSize')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Year Built</TableCell>
            <TableCell>{formatAttributeValue('yearBuilt')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Bedrooms</TableCell>
            <TableCell>{formatAttributeValue('bedrooms')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Bathrooms</TableCell>
            <TableCell>{formatAttributeValue('bathrooms')}</TableCell>
          </TableRow>
          
          {/* Custom attributes from the property object */}
          {attributes.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </TableCell>
              <TableCell>
                {typeof value === 'object' ? JSON.stringify(value) : 
                 typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                 value?.toString() || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}