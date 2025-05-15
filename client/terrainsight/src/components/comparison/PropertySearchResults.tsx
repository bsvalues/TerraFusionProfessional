import React from 'react';
import { Property } from '../../shared/schema';
import { formatCurrency } from '@/lib/utils';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { 
  Home,
  DollarSign,
  Calendar,
  MapPin,
  SquareDot
} from 'lucide-react';

interface PropertySearchResultsProps {
  properties: Property[];
  searchText: string;
  onSelectProperty: (property: Property) => void;
  className?: string;
}

export const PropertySearchResults: React.FC<PropertySearchResultsProps> = ({
  properties,
  searchText,
  onSelectProperty,
  className
}) => {
  return (
    <Command className={`rounded-lg border shadow-md ${className}`}>
      <CommandList className="max-h-[400px] overflow-auto">
        {searchText.trim() === '' && (
          <CommandEmpty>Start typing to search properties...</CommandEmpty>
        )}
        
        {searchText.trim() !== '' && properties.length === 0 && (
          <CommandEmpty>No properties found for "{searchText}"</CommandEmpty>
        )}
        
        <CommandGroup heading={`${properties.length} properties found`}>
          {properties.map((property) => (
            <CommandItem
              key={property.id}
              value={property.address}
              onSelect={() => onSelectProperty(property)}
              className="flex flex-col items-start py-3 cursor-pointer"
            >
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate">{property.address}</span>
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{formatCurrency(property.value || '0')}</span>
                  </div>
                  
                  {property.yearBuilt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{property.yearBuilt}</span>
                    </div>
                  )}
                  
                  {property.squareFeet && (
                    <div className="flex items-center gap-1">
                      <SquareDot className="h-3 w-3" />
                      <span>{property.squareFeet.toLocaleString()} sq.ft</span>
                    </div>
                  )}
                  
                  {property.neighborhood && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{property.neighborhood}</span>
                    </div>
                  )}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
};