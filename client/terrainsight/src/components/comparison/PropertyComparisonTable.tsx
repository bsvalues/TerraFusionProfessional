import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface PropertyComparisonTableProps {
  baseProperty: Property;
  selectedProperties: Property[];
  similarityScores: Record<string | number, number>;
}

export function PropertyComparisonTable({ 
  baseProperty, 
  selectedProperties, 
  similarityScores 
}: PropertyComparisonTableProps) {
  // Extract property value as a number
  const getPropertyValue = (property: Property): number => {
    if (!property.value) return 0;
    
    return typeof property.value === 'string'
      ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
      : property.value;
  };
  
  // Calculate price per square foot
  const getPricePerSqFt = (property: Property): number | null => {
    const value = getPropertyValue(property);
    if (!value || !property.squareFeet) return null;
    
    return value / property.squareFeet;
  };
  
  // Format price per square foot
  const formatPricePerSqFt = (ppsf: number | null): string => {
    if (ppsf === null) return 'N/A';
    return formatCurrency(ppsf);
  };
  
  // Calculate the difference (as a percentage) from the base property
  const calculateDifference = (baseValue: number, compValue: number): { value: number, isHigher: boolean } => {
    if (!baseValue || !compValue) return { value: 0, isHigher: false };
    
    const diff = compValue - baseValue;
    const percentage = Math.abs((diff / baseValue) * 100);
    
    return {
      value: Math.round(percentage * 10) / 10, // Round to 1 decimal place
      isHigher: diff > 0
    };
  };
  
  // Format the difference for display with + or - sign
  const formatDifference = (diff: { value: number, isHigher: boolean }): JSX.Element | string => {
    if (diff.value === 0) return '--';
    
    return (
      <span className={diff.isHigher ? 'text-green-600' : 'text-red-600'}>
        {diff.isHigher ? '+' : '-'}{diff.value}%
      </span>
    );
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Property</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Diff</TableHead>
            <TableHead>Square Feet</TableHead>
            <TableHead>Diff</TableHead>
            <TableHead>$/SqFt</TableHead>
            <TableHead>Year Built</TableHead>
            <TableHead>Bedrooms</TableHead>
            <TableHead>Bathrooms</TableHead>
            <TableHead>Lot Size</TableHead>
            <TableHead>Neighborhood</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {selectedProperties.map((property, index) => {
            const isBaseProperty = property.id === baseProperty.id;
            const basePropValue = getPropertyValue(baseProperty);
            const currentPropValue = getPropertyValue(property);
            const valueDiff = calculateDifference(basePropValue, currentPropValue);
            
            const baseSqFt = baseProperty.squareFeet || 0;
            const currentSqFt = property.squareFeet || 0;
            const sqFtDiff = calculateDifference(baseSqFt, currentSqFt);
            
            return (
              <TableRow key={property.id} className={isBaseProperty ? 'bg-primary/5' : ''}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{property.address}</span>
                    {!isBaseProperty && similarityScores[property.id] && (
                      <Badge variant="outline" className="w-fit mt-1 text-xs">
                        {Math.round(similarityScores[property.id] * 100)}% Similar
                      </Badge>
                    )}
                    {isBaseProperty && (
                      <Badge className="w-fit mt-1 text-xs">Base Property</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(currentPropValue)}</TableCell>
                <TableCell>
                  {isBaseProperty ? (
                    '--'
                  ) : (
                    formatDifference(valueDiff)
                  )}
                </TableCell>
                <TableCell>{property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}</TableCell>
                <TableCell>
                  {isBaseProperty ? (
                    '--'
                  ) : (
                    formatDifference(sqFtDiff)
                  )}
                </TableCell>
                <TableCell>{formatPricePerSqFt(getPricePerSqFt(property))}</TableCell>
                <TableCell>{property.yearBuilt || 'N/A'}</TableCell>
                <TableCell>{property.bedrooms || 'N/A'}</TableCell>
                <TableCell>{property.bathrooms || 'N/A'}</TableCell>
                <TableCell>{property.lotSize ? property.lotSize.toLocaleString() + ' sq ft' : 'N/A'}</TableCell>
                <TableCell>{property.neighborhood || 'N/A'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}