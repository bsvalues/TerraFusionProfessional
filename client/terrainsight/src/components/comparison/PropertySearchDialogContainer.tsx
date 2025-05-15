import React, { useState } from 'react';
import { Property } from '../../shared/schema';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PropertySearchResults } from './PropertySearchResults';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PropertySearchDialogContainerProps {
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
  onSelectProperty: (property: Property) => void;
  className?: string;
}

export const PropertySearchDialogContainer: React.FC<PropertySearchDialogContainerProps> = ({
  buttonText = 'Search Properties',
  buttonVariant = 'default',
  onSelectProperty,
  className
}) => {
  // Dialog state
  const [open, setOpen] = useState(false);
  
  // Search state
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  
  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchText]);
  
  // Fetch properties
  const { data: allProperties = [] } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/properties') as Response;
      return response.json();
    }
  });
  
  // Filter properties based on search text
  const filteredProperties = React.useMemo(() => {
    if (!debouncedSearchText.trim()) return allProperties;
    
    const searchLower = debouncedSearchText.toLowerCase();
    return allProperties.filter((property: Property) => {
      return (
        property.address?.toLowerCase().includes(searchLower) ||
        property.parcelId?.toLowerCase().includes(searchLower) ||
        property.propertyType?.toLowerCase().includes(searchLower) ||
        property.neighborhood?.toLowerCase().includes(searchLower)
      );
    });
  }, [allProperties, debouncedSearchText]);
  
  // Handle property selection
  const handleSelectProperty = (property: Property) => {
    onSelectProperty(property);
    setOpen(false);
    setSearchText('');
  };
  
  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Search className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search Properties</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Search by address, parcel ID, or neighborhood..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full"
            />
            
            <PropertySearchResults
              properties={filteredProperties}
              onSelectProperty={handleSelectProperty}
              searchText={debouncedSearchText}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};