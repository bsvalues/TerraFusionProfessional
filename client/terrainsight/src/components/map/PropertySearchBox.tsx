import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Home, User, FileText } from 'lucide-react';
import { Property } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Define PropertyWithOptionalFields type for consistency with other components
type PropertyWithOptionalFields = Omit<Property, 'propertyType'> & {
  propertyType?: string | null;
  lastVisitDate?: Date | null;
  qualityScore?: number | null;
  schoolDistrict?: string | null;
  floodZone?: string | null;
  coordinates?: [number, number];
  pricePerSqFt?: number;
  attributes?: Record<string, any>;
  historicalValues?: any;
  sourceId?: string | number | null;
};

interface PropertySearchBoxProps {
  properties: PropertyWithOptionalFields[];
  onSelect: (property: PropertyWithOptionalFields) => void;
  className?: string;
  onFocus?: () => void;
}

export const PropertySearchBox: React.FC<PropertySearchBoxProps> = ({
  properties,
  onSelect,
  className = '',
  onFocus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<PropertyWithOptionalFields[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<PropertyWithOptionalFields[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentPropertySearches');
    if (savedSearches) {
      try {
        const parsed = JSON.parse(savedSearches);
        // Ensure we only use valid property objects
        const validSearches = parsed.filter((item: any) => 
          item && item.id && item.parcelId && item.address
        );
        setRecentSearches(validSearches.slice(0, 5)); // Limit to 5 recent searches
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  // Save a property to recent searches
  const saveToRecentSearches = (property: PropertyWithOptionalFields) => {
    const updatedSearches = [
      property,
      ...recentSearches.filter(p => p.id !== property.id)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentPropertySearches', JSON.stringify(updatedSearches));
  };

  // Handle clicks outside the search component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter properties based on search term and selected category
  const filterProperties = () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    let matches = properties.filter(property => {
      const addressMatch = property.address?.toLowerCase().includes(term);
      const parcelIdMatch = property.parcelId?.toLowerCase().includes(term);
      const ownerMatch = property.owner?.toLowerCase().includes(term);
      const neighborhoodMatch = property.neighborhood?.toLowerCase().includes(term);
      
      if (selectedCategory === 'address') return addressMatch;
      if (selectedCategory === 'parcel') return parcelIdMatch;
      if (selectedCategory === 'owner') return ownerMatch;
      if (selectedCategory === 'neighborhood') return neighborhoodMatch;
      
      // If no category is selected, search all fields
      return addressMatch || parcelIdMatch || ownerMatch || neighborhoodMatch;
    });
    
    // Sort results by relevance
    matches = matches.sort((a, b) => {
      // Address exact match gets highest priority
      if (a.address?.toLowerCase() === term) return -1;
      if (b.address?.toLowerCase() === term) return 1;
      
      // Parcel ID exact match gets second priority
      if (a.parcelId?.toLowerCase() === term) return -1;
      if (b.parcelId?.toLowerCase() === term) return 1;
      
      // Then sort by whether the term is at the start of the address
      const aStartsWithTerm = a.address?.toLowerCase().startsWith(term) || false;
      const bStartsWithTerm = b.address?.toLowerCase().startsWith(term) || false;
      
      if (aStartsWithTerm && !bStartsWithTerm) return -1;
      if (!aStartsWithTerm && bStartsWithTerm) return 1;
      
      return 0;
    }).slice(0, 10); // Limit to 10 results
    
    setResults(matches);
    setShowResults(true);
  };

  // Debounced search as user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm) filterProperties();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    filterProperties();
  };

  const handleSelect = (property: PropertyWithOptionalFields) => {
    onSelect(property);
    saveToRecentSearches(property);
    setShowResults(false);
    setSearchTerm('');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setShowResults(false);
  };

  // Format property value for display
  const formatValue = (value: string | undefined | null): string => {
    if (!value) return 'N/A';
    // Try to parse the value as a number and format it as currency
    const numericValue = parseFloat(value.replace(/[\$,]/g, ''));
    if (isNaN(numericValue)) return value;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numericValue);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="flex">
        <div className="relative flex-grow">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search className="h-3.5 w-3.5" />
          </div>
          <Input
            type="text"
            placeholder="Search by address, parcel ID, owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-8 pr-8 text-sm rounded-lg"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => {
              setShowResults(true);
              if (onFocus) onFocus();
            }}
          />
          {searchTerm && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={handleClearSearch}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleSearch}
          className="ml-2 h-10 px-3"
        >
          <span className="text-xs">Search</span>
        </Button>
      </div>

      {/* Filter categories */}
      <div className="flex space-x-1 mt-2">
        <Badge 
          variant={selectedCategory === null ? "secondary" : "outline"}
          className="text-xs cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        <Badge 
          variant={selectedCategory === 'address' ? "secondary" : "outline"}
          className="text-xs cursor-pointer"
          onClick={() => setSelectedCategory('address')}
        >
          <Home className="h-3 w-3 mr-1" />
          Address
        </Badge>
        <Badge 
          variant={selectedCategory === 'parcel' ? "secondary" : "outline"}
          className="text-xs cursor-pointer"
          onClick={() => setSelectedCategory('parcel')}
        >
          <FileText className="h-3 w-3 mr-1" />
          Parcel ID
        </Badge>
        <Badge 
          variant={selectedCategory === 'owner' ? "secondary" : "outline"}
          className="text-xs cursor-pointer"
          onClick={() => setSelectedCategory('owner')}
        >
          <User className="h-3 w-3 mr-1" />
          Owner
        </Badge>
        <Badge 
          variant={selectedCategory === 'neighborhood' ? "secondary" : "outline"}
          className="text-xs cursor-pointer"
          onClick={() => setSelectedCategory('neighborhood')}
        >
          <MapPin className="h-3 w-3 mr-1" />
          Neighborhood
        </Badge>
      </div>

      {/* Search results and recent searches */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto divide-y divide-gray-100">
          {results.length > 0 ? (
            <div>
              <div className="p-2 bg-gray-50 text-xs font-medium text-gray-500">Search Results</div>
              <ul className="divide-y divide-gray-100">
                {results.map((property) => (
                  <li
                    key={property.id}
                    className="p-3 hover:bg-blue-50 cursor-pointer"
                    onClick={() => handleSelect(property)}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5 bg-blue-100 rounded-full p-1.5">
                        <Home className="h-3.5 w-3.5 text-blue-700" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium text-sm">{property.address}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 mt-1">
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1 text-gray-400" />
                            {property.parcelId}
                          </span>
                          {property.propertyType && (
                            <span className="flex items-center">
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {property.propertyType}
                              </Badge>
                            </span>
                          )}
                          {property.neighborhood && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                              {property.neighborhood}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-700">
                          {formatValue(property.value)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {property.squareFeet.toLocaleString()} sq ft
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            searchTerm ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No properties found matching "{searchTerm}"</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms or filters</p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div>
                <div className="p-2 bg-gray-50 text-xs font-medium text-gray-500">Recent Searches</div>
                <ul className="divide-y divide-gray-100">
                  {recentSearches.map((property) => (
                    <li
                      key={property.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelect(property)}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-0.5 bg-gray-100 rounded-full p-1.5">
                          <Home className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-sm">{property.address}</div>
                          <div className="text-xs text-gray-500">{property.parcelId}</div>
                        </div>
                        {property.value && (
                          <div className="text-sm text-gray-600 font-medium">
                            {formatValue(property.value)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">Type to search for properties</p>
                <p className="text-xs text-gray-400 mt-1">Search by address, parcel ID, owner, or neighborhood</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};