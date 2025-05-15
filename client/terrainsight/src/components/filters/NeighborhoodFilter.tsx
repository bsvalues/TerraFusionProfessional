import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

interface NeighborhoodFilterProps {
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
  disabled?: boolean;
}

interface NeighborhoodData {
  id: string;
  name: string;
  count: number;
}

export const NeighborhoodFilter: React.FC<NeighborhoodFilterProps> = ({
  selectedNeighborhoods,
  onChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch neighborhoods from API
  const { data: neighborhoods, isLoading, error } = useQuery({
    queryKey: ['/api/neighborhoods'],
    queryFn: () => apiRequest<NeighborhoodData[]>('/api/neighborhoods'),
    staleTime: Infinity, // Neighborhoods don't change often
    enabled: !disabled && isOpen, // Only fetch when dropdown is open and not disabled
    retry: false
  });
  
  // Simulate neighborhoods data until API is implemented
  const mockNeighborhoods: NeighborhoodData[] = [
    { id: 'downtown', name: 'Downtown', count: 34 },
    { id: 'east_side', name: 'East Side', count: 28 },
    { id: 'west_hills', name: 'West Hills', count: 42 },
    { id: 'riverside', name: 'Riverside', count: 19 },
    { id: 'north_area', name: 'North Area', count: 31 },
    { id: 'south_valley', name: 'South Valley', count: 25 }
  ];
  
  // Get neighborhood data (from API or mock)
  const neighborhoodData = neighborhoods || mockNeighborhoods;
  
  // Remove a neighborhood from selection
  const removeNeighborhood = (id: string) => {
    onChange(selectedNeighborhoods.filter(n => n !== id));
  };
  
  // Add a neighborhood to selection
  const addNeighborhood = (id: string) => {
    if (!selectedNeighborhoods.includes(id)) {
      onChange([...selectedNeighborhoods, id]);
    }
  };
  
  // Get name for a neighborhood ID
  const getNeighborhoodName = (id: string): string => {
    const neighborhood = neighborhoodData.find(n => n.id === id);
    return neighborhood ? neighborhood.name : id;
  };
  
  return (
    <div className="space-y-3" data-testid="neighborhood-filter">
      <div className="font-medium text-sm">Neighborhoods</div>
      
      {/* Selected neighborhoods */}
      <div className="flex flex-wrap gap-2 min-h-9">
        {selectedNeighborhoods.length === 0 ? (
          <div className="text-sm text-gray-500 py-1">No neighborhoods selected</div>
        ) : (
          selectedNeighborhoods.map(id => (
            <Badge key={id} variant="secondary" className="flex items-center gap-1">
              {getNeighborhoodName(id)}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => removeNeighborhood(id)}
                disabled={disabled}
                aria-label={`Remove ${getNeighborhoodName(id)}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        )}
      </div>
      
      {/* Neighborhood selector */}
      <Select
        disabled={disabled}
        onValueChange={addNeighborhood}
        value=""
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full" aria-label="Select a neighborhood">
          <SelectValue placeholder="Add neighborhood..." />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
              <span className="ml-2 text-sm text-gray-500">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 p-2">
              Error loading neighborhoods
            </div>
          ) : (
            <SelectGroup>
              <SelectLabel>Neighborhoods</SelectLabel>
              {neighborhoodData.map(({ id, name, count }) => (
                <SelectItem
                  key={id}
                  value={id}
                  disabled={selectedNeighborhoods.includes(id)}
                  className="flex justify-between"
                >
                  <span>{name}</span>
                  <span className="text-gray-500 text-xs">({count})</span>
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default NeighborhoodFilter;