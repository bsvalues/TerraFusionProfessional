import React, { useState } from 'react';
import { usePropertyComparison } from './PropertyComparisonContext';
import { Property } from '@/shared/schema';
import { Search, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface PropertySearchDialogProps {
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
}

/**
 * Dialog for searching and selecting properties for comparison
 */
export function PropertySearchDialog({ onClose, onSelectProperty }: PropertySearchDialogProps) {
  const { properties, isLoading } = usePropertyComparison();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter properties based on search term
  const filteredProperties = properties.filter(property => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (property.address && property.address.toLowerCase().includes(searchLower)) ||
      (property.parcelId && property.parcelId.toLowerCase().includes(searchLower)) ||
      (property.owner && property.owner.toLowerCase().includes(searchLower)) ||
      (property.neighborhood && property.neighborhood.toLowerCase().includes(searchLower))
    );
  });
  
  // Display search results
  const renderSearchResults = () => {
    if (isLoading) {
      return (
        <div className="text-center p-4">
          <p>Loading properties...</p>
        </div>
      );
    }
    
    if (filteredProperties.length === 0) {
      return (
        <div className="text-center p-4">
          <p className="text-gray-500">No properties found matching your search.</p>
        </div>
      );
    }
    
    return (
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-3">
          {filteredProperties.map(property => (
            <Card 
              key={property.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onSelectProperty(property)}
            >
              <CardContent className="p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-sm">{property.address}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {property.parcelId}
                      </Badge>
                      {property.propertyType && (
                        <Badge variant="secondary" className="text-xs">
                          {property.propertyType}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {property.squareFeet && (
                        <span>{property.squareFeet.toLocaleString()} sq ft</span>
                      )}
                      {property.bedrooms && (
                        <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
                      )}
                      {property.bathrooms && (
                        <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{property.value ? formatCurrency(property.value) : 'N/A'}</p>
                    {property.neighborhood && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-end">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.neighborhood}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <div>
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by address, parcel ID, owner, or neighborhood"
            className="pl-9 pr-4"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {renderSearchResults()}
    </div>
  );
}