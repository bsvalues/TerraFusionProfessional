import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// This matches the PropertyType interface in Properties.tsx
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

const PropertyDebug = () => {
  const [apiResponse, setApiResponse] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [manualRenderTest, setManualRenderTest] = React.useState<boolean>(false);

  // Direct fetch for debugging
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/properties');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Data received:', data);
      setApiResponse(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Using React Query for comparison
  const { data: reactQueryData, isLoading: rqLoading, isError: rqError, error: rqErrorData } = useQuery({
    queryKey: ['/api/properties-reactquery'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return response.json() as Promise<Property[]>;
    },
  });

  // Test manual rendering of properties
  const toggleManualRender = () => {
    setManualRenderTest(!manualRenderTest);
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="direct-fetch">
        <TabsList className="mb-4">
          <TabsTrigger value="direct-fetch">Direct Fetch Debug</TabsTrigger>
          <TabsTrigger value="react-query">React Query Debug</TabsTrigger>
          <TabsTrigger value="manual-render">Manual Render Test</TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct-fetch">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Direct Fetch Debug</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={fetchProperties} 
                disabled={loading}
                className="mb-4"
              >
                {loading ? 'Loading...' : 'Fetch Properties Data'}
              </Button>
              
              {error && (
                <div className="p-4 mb-4 bg-red-100 border border-red-300 rounded-md text-red-800">
                  <h3 className="font-bold mb-2">Error:</h3>
                  <p>{error}</p>
                </div>
              )}
              
              {apiResponse && (
                <div>
                  <h3 className="font-bold mb-2">API Response:</h3>
                  <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
                    <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                  </div>
                  
                  {Array.isArray(apiResponse) && (
                    <div className="mt-4">
                      <p className="font-bold">Properties count: {apiResponse.length}</p>
                      {apiResponse.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">First property:</p>
                          <div className="bg-gray-100 p-4 rounded-md overflow-auto">
                            <pre>{JSON.stringify(apiResponse[0], null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="react-query">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>React Query Debug</CardTitle>
            </CardHeader>
            <CardContent>
              {rqLoading ? (
                <div className="p-4 bg-blue-50 rounded-md">Loading properties via React Query...</div>
              ) : rqError ? (
                <div className="p-4 bg-red-100 rounded-md">
                  <h3 className="font-bold mb-2">Error:</h3>
                  <p>{rqErrorData instanceof Error ? rqErrorData.message : 'Unknown error'}</p>
                </div>
              ) : reactQueryData ? (
                <div>
                  <div className="mb-4 p-4 bg-green-50 rounded-md">
                    <p className="font-bold">Successfully loaded {reactQueryData.length} properties via React Query</p>
                  </div>
                  
                  <div className="mt-4">
                    <p className="font-semibold">First few properties:</p>
                    <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px]">
                      <pre>{JSON.stringify(reactQueryData.slice(0, 3), null, 2)}</pre>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="font-semibold">Property Types:</p>
                    <div className="bg-gray-100 p-4 rounded-md">
                      {reactQueryData
                        .map(p => p.propertyType)
                        .filter((value, index, self) => value && self.indexOf(value) === index)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 rounded-md">No data received from React Query</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual-render">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Manual Render Test</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={toggleManualRender} 
                className="mb-4"
              >
                {manualRenderTest ? 'Hide Properties' : 'Show Properties'}
              </Button>
              
              {manualRenderTest && reactQueryData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reactQueryData.slice(0, 6).map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="h-40 bg-slate-100 relative"></div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{property.address}</CardTitle>
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
                              {property.squareFeet ? `${property.squareFeet} sqft` : 'Not available'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Parcel ID</p>
                            <p className="font-medium">{property.parcelId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <p className="font-medium">{property.propertyType || 'Unknown'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyDebug;