import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertTriangleIcon, MapPinIcon, SearchIcon, MapIcon, LocateIcon } from "lucide-react";
import { googleMapsDataConnector } from '../../services/etl/GoogleMapsDataConnector';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const GoogleMapsConnectorPanel = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [nearbyPOIs, setNearbyPOIs] = useState<any[]>([]);
  const [poiType, setPoiType] = useState<string>('restaurant');
  const { toast } = useToast();

  // Check API availability on component mount
  useEffect(() => {
    checkApiAvailability();
  }, []);

  const checkApiAvailability = async () => {
    try {
      const available = await googleMapsDataConnector.isGoogleMapsApiAvailable();
      setIsApiAvailable(available);
    } catch (error) {
      console.error('Error checking API availability:', error);
      setIsApiAvailable(false);
    }
  };

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query is required",
        description: "Please enter a location to search for.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const results = await googleMapsDataConnector.queryLocations({
        query: searchQuery,
        country: 'us',
        language: 'en'
      });
      
      setLocations(results);
      
      if (results.length === 0) {
        toast({
          title: "No results found",
          description: "Try a different search query or location.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      toast({
        title: "Error searching locations",
        description: "An error occurred while searching for locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location);
    setNearbyPOIs([]);
  };

  const handleFindNearbyPOIs = async () => {
    if (!selectedLocation) return;

    setIsLoading(true);
    try {
      const pois = await googleMapsDataConnector.findNearbyPOIs(
        selectedLocation.latitude,
        selectedLocation.longitude,
        poiType,
        2000 // 2km radius
      );
      
      setNearbyPOIs(pois);
      
      if (pois.length === 0) {
        toast({
          title: "No nearby points of interest found",
          description: `No ${poiType}s found near this location.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error finding nearby POIs:', error);
      toast({
        title: "Error finding nearby points of interest",
        description: "An error occurred while searching for nearby points of interest. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center text-xl sm:text-2xl">
          <MapIcon className="mr-2 h-5 w-5" />
          Google Maps Data Connector
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-1">
          Search for locations and retrieve points of interest data from Google Maps
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6">
        {isApiAvailable === false && (
          <Alert variant="destructive" className="mb-4 text-xs sm:text-sm">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle className="text-sm sm:text-base">API Key Not Configured</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
              The Google Maps Extractor API key is not configured. Please set the RAPIDAPI_KEY environment variable.
            </AlertDescription>
          </Alert>
        )}
        
        {isApiAvailable && (
          <Alert variant="default" className="mb-4 bg-green-50 text-xs sm:text-sm">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle className="text-sm sm:text-base">API Connected</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
              Google Maps Extractor API is properly configured and ready to use.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="search">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Location Search</TabsTrigger>
            <TabsTrigger value="poi" disabled={!selectedLocation}>POI Enrichment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="search-query">Location Search</Label>
                <Input
                  id="search-query"
                  placeholder="Enter address, city, or place name"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                  disabled={isLoading || !isApiAvailable}
                />
              </div>
              <div className="sm:mt-auto">
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !isApiAvailable}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                  <SearchIcon className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Search Results ({locations.length})</h3>
              <ScrollArea className="h-[300px] sm:h-[400px] rounded-md border">
                {locations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {isLoading ? 'Searching...' : 'No results to display. Try searching for a location.'}
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {locations.map((location, index) => (
                      <Card 
                        key={location.id || index} 
                        className={`cursor-pointer hover:bg-slate-50 ${selectedLocation?.id === location.id ? 'border-primary' : ''}`}
                        onClick={() => handleLocationSelect(location)}
                      >
                        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                          <CardTitle className="text-sm sm:text-base">{location.name}</CardTitle>
                          <CardDescription className="text-xs">{location.address}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between text-xs gap-1 sm:gap-0">
                            <span>
                              <MapPinIcon className="h-3 w-3 inline mr-1" />
                              <span className="hidden sm:inline">
                                {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                              </span>
                              <span className="inline sm:hidden">
                                {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
                              </span>
                            </span>
                            {location.rating > 0 && (
                              <span className="text-yellow-600">
                                ★ {location.rating.toFixed(1)} ({location.reviewCount})
                              </span>
                            )}
                          </div>
                          {location.placeTypes && location.placeTypes.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {location.placeTypes.slice(0, 2).map((type: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {type.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                              {location.placeTypes.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{location.placeTypes.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
          
          <TabsContent value="poi">
            {selectedLocation && (
              <>
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-medium">{selectedLocation.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedLocation.address}</p>
                  
                  <div className="flex items-center mt-2 overflow-hidden">
                    <MapPinIcon className="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">
                      {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <div className="grid flex-1 gap-2">
                      <Label htmlFor="poi-type">Point of Interest Type</Label>
                      <select
                        id="poi-type"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={poiType}
                        onChange={(e) => setPoiType(e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="restaurant">Restaurants</option>
                        <option value="school">Schools</option>
                        <option value="park">Parks</option>
                        <option value="hospital">Hospitals</option>
                        <option value="shopping">Shopping Centers</option>
                        <option value="supermarket">Supermarkets</option>
                        <option value="bank">Banks</option>
                        <option value="gym">Gyms</option>
                        <option value="gas_station">Gas Stations</option>
                        <option value="pharmacy">Pharmacies</option>
                      </select>
                    </div>
                    <div className="sm:mt-auto">
                      <Button 
                        onClick={handleFindNearbyPOIs} 
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                      >
                        {isLoading ? 'Searching...' : 'Find Nearby'}
                        <LocateIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Nearby Points of Interest ({nearbyPOIs.length})</h3>
                    <ScrollArea className="h-[250px] sm:h-[300px] rounded-md border">
                      {nearbyPOIs.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          {isLoading ? 'Searching...' : 'No nearby points of interest found. Try searching for different POI types.'}
                        </div>
                      ) : (
                        <div className="p-4 space-y-4">
                          {nearbyPOIs.map((poi, index) => (
                            <Card key={poi.id || index} className="hover:bg-slate-50">
                              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                                <CardTitle className="text-sm sm:text-base">{poi.name}</CardTitle>
                                <CardDescription className="text-xs">{poi.address}</CardDescription>
                              </CardHeader>
                              <CardContent className="p-3 sm:p-4 pt-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between text-xs gap-1 sm:gap-0">
                                  <span>
                                    <MapPinIcon className="h-3 w-3 inline mr-1" />
                                    <span className="hidden sm:inline">
                                      {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                                    </span>
                                    <span className="inline sm:hidden">
                                      {poi.latitude.toFixed(3)}, {poi.longitude.toFixed(3)}
                                    </span>
                                  </span>
                                  {poi.rating > 0 && (
                                    <span className="text-yellow-600">
                                      ★ {poi.rating.toFixed(1)} ({poi.reviewCount})
                                    </span>
                                  )}
                                </div>
                                {poi.placeTypes && poi.placeTypes.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {poi.placeTypes.slice(0, 2).map((type: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {type.replace(/_/g, ' ')}
                                      </Badge>
                                    ))}
                                    {poi.placeTypes.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{poi.placeTypes.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t p-4 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
        <div>
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Data source: Google Maps Extractor API via RapidAPI
          </p>
        </div>
        {selectedLocation && (
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              // Create an ETL job for this location
              const jobId = googleMapsDataConnector.createLocationImportJob(
                selectedLocation.name,
                'target-1',
                `Import POIs near ${selectedLocation.name}`
              );
              
              toast({
                title: "ETL Job Created",
                description: "A new ETL job has been created to import points of interest data.",
                variant: "default"
              });
            }}
          >
            Create ETL Job
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GoogleMapsConnectorPanel;