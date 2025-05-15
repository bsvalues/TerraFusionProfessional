import React from 'react';
import { Property } from '@shared/schema';
import { ComparablePropertyResult } from '../../services/comparison/comparablesService';
import { SimilarityScoreIndicator } from './SimilarityScoreIndicator';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  MapPin, 
  Ruler, 
  DollarSign, 
  Calendar, 
  ArrowUp, 
  ArrowDown, 
  Minus,
  Bed,
  Bath
} from 'lucide-react';

interface ComparablePropertyCardProps {
  baseProperty: Property;
  comparable: ComparablePropertyResult;
  isSelected: boolean;
  onToggleSelect: (property: Property) => void;
  disabled?: boolean;
}

/**
 * Card displaying a comparable property with similarity score and selection controls
 */
export const ComparablePropertyCard: React.FC<ComparablePropertyCardProps> = ({
  baseProperty,
  comparable,
  isSelected,
  onToggleSelect,
  disabled = false
}) => {
  const { property, similarityScore, distanceKm, priceDifference } = comparable;
  
  // Calculate difference indicators
  const getValue = (value: string | undefined) => value ? parseFloat(value) : 0;
  const baseValue = getValue(baseProperty.value);
  const compValue = getValue(property.value);
  const valueDifference = compValue - baseValue;
  const valuePercentDiff = baseValue !== 0 ? (valueDifference / baseValue) * 100 : 0;
  
  const handleCheckboxChange = (checked: boolean) => {
    onToggleSelect(property);
  };
  
  // Function to render property differences with up/down indicators
  const renderDifference = (label: string, value?: number, suffix: string = '') => {
    if (value === undefined || isNaN(value) || value === 0) return null;
    
    const isPositive = value > 0;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-500';
    const Icon = isPositive ? ArrowUp : ArrowDown;
    
    return (
      <div className="flex items-center gap-1 text-sm">
        <span className="text-gray-500">{label}:</span>
        <span className={`flex items-center ${colorClass}`}>
          <Icon className="h-3 w-3 mr-1" />
          {value > 0 ? '+' : ''}{Math.abs(value).toFixed(1)}{suffix}
        </span>
      </div>
    );
  };
  
  return (
    <Card className={`relative transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-gray-300'}`}>
      <div className="absolute top-2 right-2 z-10">
        <Checkbox 
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          disabled={disabled}
          id={`select-property-${property.id}`}
        />
      </div>
      
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col h-full">
          {/* Property Info */}
          <div className="mb-3">
            <h3 className="font-medium text-sm mb-1 pr-6 truncate">{property.address}</h3>
            <p className="text-xs text-gray-500 mb-2">{property.parcelId}</p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {property.propertyType && (
                <Badge variant="outline" className="text-xs">
                  {property.propertyType}
                </Badge>
              )}
              {property.neighborhood && (
                <Badge variant="outline" className="text-xs">
                  {property.neighborhood}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Similarity Score */}
          <div className="mb-3">
            <SimilarityScoreIndicator 
              score={similarityScore} 
              size="sm"
            />
          </div>
          
          {/* Property Details */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm mb-3">
            <div className="flex items-center">
              <DollarSign className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
              <span>{property.value ? formatCurrency(parseFloat(property.value)) : 'N/A'}</span>
            </div>
            
            <div className="flex items-center">
              <Ruler className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
              <span>{property.squareFeet ? `${property.squareFeet} sq.ft.` : 'N/A'}</span>
            </div>
            
            {property.bedrooms && (
              <div className="flex items-center">
                <Bed className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {property.bathrooms && (
              <div className="flex items-center">
                <Bath className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
              </div>
            )}
            
            {property.yearBuilt && (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                <span>Built {property.yearBuilt}</span>
              </div>
            )}
            
            {distanceKm !== undefined && (
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                <span>{distanceKm.toFixed(1)} km away</span>
              </div>
            )}
          </div>
          
          {/* Comparison with base property */}
          <div className="mt-auto pt-2 border-t border-gray-100">
            {renderDifference('Price', valueDifference ? formatCurrency(valueDifference, false) : undefined, '')}
            {renderDifference('Size', property.squareFeet && baseProperty.squareFeet ? 
              property.squareFeet - baseProperty.squareFeet : undefined, ' sq.ft.')}
            {renderDifference('Age', property.yearBuilt && baseProperty.yearBuilt ? 
              property.yearBuilt - baseProperty.yearBuilt : undefined, ' years')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};