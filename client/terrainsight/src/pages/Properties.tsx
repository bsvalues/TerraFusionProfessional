import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  MapPin, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Home, 
  Store, 
  Factory, 
  Hotel, 
  Grid, 
  List, 
  LayoutList,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Type definition from the database schema
interface Property {
  id: number;
  parcelId: string;
  address: string;
  owner?: string;
  value?: string;
  squareFeet: number;
  yearBuilt?: number;
  landValue?: string;
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
  neighborhood?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  lotSize?: number;
  zoning?: string;
  lastSaleDate?: string;
  taxAssessment?: string;
  pricePerSqFt?: string;
  attributes?: any;
}

const PropertyTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "Residential":
      return <Home className="h-4 w-4 text-blue-500" />;
    case "Commercial":
      return <Store className="h-4 w-4 text-green-500" />;
    case "Industrial":
      return <Factory className="h-4 w-4 text-yellow-500" />;
    case "Hotel/Motel":
      return <Hotel className="h-4 w-4 text-purple-500" />;
    default:
      return <Building className="h-4 w-4 text-gray-500" />;
  }
};

const PropertiesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();
  
  // Fetch the actual properties from the database
  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      try {
        console.log('Fetching properties...');
        
        const response = await fetch('/api/properties');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          console.error('Error fetching properties:', response.status, response.statusText);
          throw new Error('Failed to fetch properties');
        }
        
        const data = await response.json();
        console.log('Properties data:', data);
        
        // Add a check to see if data is an array
        if (!Array.isArray(data)) {
          console.error('API did not return an array:', typeof data, data);
          return [] as Property[];
        }
        
        console.log('Properties count:', data.length);
        return data as Property[];
      } catch (error) {
        console.error('Error in fetch:', error);
        throw error;
      }
    },
  });
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Filter properties by search query
  const filteredProperties = properties ? properties.filter(property => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return property.address?.toLowerCase().includes(query) || 
           property.parcelId?.toLowerCase().includes(query) ||
           property.owner?.toLowerCase().includes(query) ||
           property.propertyType?.toLowerCase().includes(query);
  }) : [];
  
  // If there's an error, show an alert
  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Error loading properties",
        description: "Failed to fetch property data. Please try again later."
      });
    }
  }, [isError, toast]);
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage and view property information</p>
        </div>
      </div>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <CardTitle>Property Search</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search properties..." 
                  className="pl-8 h-9 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 mb-4">
            <div className="flex flex-wrap gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="hotel">Hotel/Motel</SelectItem>
                  <SelectItem value="agricultural">Agricultural</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Year Built" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2020-present">2020-Present</SelectItem>
                  <SelectItem value="2010-2019">2010-2019</SelectItem>
                  <SelectItem value="2000-2009">2000-2009</SelectItem>
                  <SelectItem value="1990-1999">1990-1999</SelectItem>
                  <SelectItem value="before-1990">Before 1990</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                className="h-9 w-9 p-0" 
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                className="h-9 w-9 p-0"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[600px] rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading properties...</span>
              </div>
            ) : properties && properties.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-slate-100 relative">
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <PropertyTypeIcon type={property.propertyType || 'Unknown'} />
                            <span>{property.propertyType || 'Unknown'}</span>
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{property.address}</CardTitle>
                        <CardDescription>
                          {property.neighborhood || 'Benton County'}, WA
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Value</p>
                            <p className="font-medium">{property.value || 'Not available'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">
                              {property.squareFeet ? `${property.squareFeet} sqft` : (property.lotSize ? `${property.lotSize} sqft lot` : 'Not available')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Year Built</p>
                            <p className="font-medium">{property.yearBuilt || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Parcel ID</p>
                            <p className="font-medium">{property.parcelId}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button size="sm" variant="outline" className="w-full">View Details</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-48 h-32 bg-slate-100 relative flex-shrink-0">
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <PropertyTypeIcon type={property.propertyType || 'Unknown'} />
                              <span>{property.propertyType || 'Unknown'}</span>
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4 flex-grow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="font-medium">{property.address}</h3>
                              <p className="text-sm text-muted-foreground">
                                {property.neighborhood || 'Benton County'}, WA
                              </p>
                            </div>
                            <div className="mt-2 sm:mt-0">
                              <p className="text-lg font-bold">{property.value || 'Value not available'}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p className="font-medium">
                                {property.squareFeet ? `${property.squareFeet} sqft` : (property.lotSize ? `${property.lotSize} sqft lot` : 'Not available')}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Year Built</p>
                              <p className="font-medium">{property.yearBuilt || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Parcel ID</p>
                              <p className="font-medium">{property.parcelId}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Owner</p>
                              <p className="font-medium">{property.owner || 'Not available'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button size="sm" variant="outline">View Details</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <Building className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No properties found</h3>
                <p className="text-muted-foreground text-center mt-2">
                  {isError 
                    ? "There was an error loading the properties. Please try again later."
                    : searchQuery 
                      ? "No properties match your search criteria. Try adjusting your filters."
                      : "No properties are available in the database. Try importing properties from ArcGIS."}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            {filteredProperties.length > 0 
              ? `Showing ${filteredProperties.length} of ${properties ? properties.length : 0} properties`
              : 'No properties to display'}
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" disabled>Previous</Button>
            <Button size="sm" variant="outline" disabled={!filteredProperties.length}>Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PropertiesPage;