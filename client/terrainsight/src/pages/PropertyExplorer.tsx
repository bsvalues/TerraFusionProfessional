import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  Building, 
  Map, 
  Search, 
  Info, 
  ArrowLeftRight, 
  FileText, 
  Loader2,
  MapPin, 
  BarChart3, 
  Download,
  Share
} from 'lucide-react';
import { PropertySearchBox } from '@/components/map/PropertySearchBox';
import PropertyInfoPanel from '@/components/map/PropertyInfoPanel';
import { Property } from '@shared/schema';
import 'leaflet/dist/leaflet.css';
import { propertyDataAdapter } from '@/services/propertyDataAdapter';
import MapComponent from '@/components/map/MapComponent';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { PageHeader } from '@/components/layout/PageHeader';

// Define PropertyWithOptionalFields type for properties with optional fields
// This matches the definition in MapComponent to ensure type consistency
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

export default function PropertyExplorer() {
  const [taxYear, setTaxYear] = useState('2025');
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithOptionalFields | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [relatedProperties, setRelatedProperties] = useState<PropertyWithOptionalFields[]>([]);
  const [activeTab, setActiveTab] = useState('map');
  
  // Get workflow context
  const { activeWorkflow, completeWorkflowStep, updateWorkflowStep } = useWorkflow();

  // Use React Query to fetch real property data
  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyDataAdapter.getAllPropertiesWithOptionalFields(),
    staleTime: 300000, // 5 minutes
  });
  
  // Update workflow step when a property is selected
  useEffect(() => {
    if (selectedProperty && activeWorkflow === 'property-assessment') {
      // Mark the search step as completed and move to view details
      completeWorkflowStep('property-assessment', 'search');
    }
  }, [selectedProperty, activeWorkflow, completeWorkflowStep]);
  
  // Update workflow step when tab changes
  useEffect(() => {
    if (activeWorkflow === 'property-assessment' && selectedProperty) {
      if (activeTab === 'map') {
        updateWorkflowStep('property-assessment', 'map-visualization');
      } else if (activeTab === 'details') {
        updateWorkflowStep('property-assessment', 'view-details');
      } else if (activeTab === 'comparables') {
        updateWorkflowStep('property-assessment', 'comparable-analysis');
      }
    }
  }, [activeTab, activeWorkflow, selectedProperty, updateWorkflowStep]);
  
  // Fetch similar properties when a property is selected
  const fetchSimilarProperties = async (property: PropertyWithOptionalFields) => {
    try {
      // The findSimilarProperties method now returns PropertyWithOptionalFields[]
      const similarProperties = await propertyDataAdapter.findSimilarProperties(property.id, 5);
      setRelatedProperties(similarProperties);
    } catch (error) {
      console.error('Error fetching similar properties:', error);
      setRelatedProperties([]);
    }
  };
  
  // Handle property selection
  const handleSelectProperty = (property: PropertyWithOptionalFields) => {
    // Store the selected property without unnecessary type casting
    setSelectedProperty(property as any); // Using 'any' here is a temporary solution
    setShowInfoPanel(true);
    fetchSimilarProperties(property);
  };
  
  // Handle property comparison - updated to use PropertyWithOptionalFields
  const handleCompareProperty = (property: PropertyWithOptionalFields) => {
    // In a real app, this would navigate to a comparison view
    setActiveTab('comparables');
  };
  
  // Get page actions based on selected property
  const getPageActions = () => {
    const actions = [
      { 
        label: 'New Search', 
        icon: <Search className="h-4 w-4" />, 
        onClick: () => {
          setSelectedProperty(null);
          setShowInfoPanel(false);
          setRelatedProperties([]);
          if (activeWorkflow === 'property-assessment') {
            updateWorkflowStep('property-assessment', 'search');
          }
        }
      }
    ];
    
    // Add additional actions when a property is selected
    if (selectedProperty) {
      actions.push(
        { 
          label: 'Generate Report', 
          icon: <FileText className="h-4 w-4" />, 
          onClick: () => {
            // In a real app, this would generate a PDF report
            alert(`Generating report for ${selectedProperty.address}`);
          }
        },
        { 
          label: 'Export Data', 
          icon: <Download className="h-4 w-4" />, 
          onClick: () => {}
        },
        { 
          label: 'Share', 
          icon: <Share className="h-4 w-4" />, 
          onClick: () => {}
        }
      );
    }
    
    return actions;
  };
  
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-grow">
        <Container className="py-6">
          <PageHeader
            title={selectedProperty ? `Property: ${selectedProperty.address}` : "Property Explorer"}
            description={selectedProperty 
              ? `Parcel ID: ${selectedProperty.parcelId} • Tax Year: ${taxYear}`
              : "Search, view, and analyze property data in Benton County"
            }
            icon={<MapPin className="h-5 w-5" />}
            actions={getPageActions()}
            breadcrumbs={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Properties', href: '/properties' },
              ...(selectedProperty ? [{ label: selectedProperty.address }] : [])
            ]}
          />
          
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Map View</span>
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedProperty}>
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Property Details</span>
                </TabsTrigger>
                <TabsTrigger value="comparables" className="flex items-center gap-2" disabled={!selectedProperty}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Comparable Analysis</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="map" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Map className="h-5 w-5" />
                          Property Map
                        </CardTitle>
                        <CardDescription>
                          Interactive map of properties in Benton County
                        </CardDescription>
                      </CardHeader>
                      <Separator />
                      <CardContent className="p-0">
                        <div className="p-4 border-b">
                          <PropertySearchBox 
                            properties={properties || []} 
                            onSelect={handleSelectProperty}
                            className="w-full"
                            onFocus={() => setShowInfoPanel(false)}
                          />
                        </div>
                        <div className="h-[600px] relative">
                          {/* Using our MapComponent instead of just MapContainer */}
                          {isLoading ? (
                            <div className="h-full w-full flex items-center justify-center bg-slate-100">
                              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                              <span className="ml-2 text-muted-foreground">Loading property data...</span>
                            </div>
                          ) : (
                            <MapComponent
                              properties={properties || []}
                              center={[46.2805, -119.2813]} // Benton County, WA
                              zoom={10}
                              onPropertySelect={handleSelectProperty}
                              selectedProperty={selectedProperty}
                            />
                          )}
                          
                          {/* Floating search box for mobile */}
                          <div className="absolute top-4 left-4 right-4 md:hidden z-[1000]">
                            <PropertySearchBox 
                              properties={properties || []} 
                              onSelect={handleSelectProperty}
                              className="w-full bg-white shadow-lg rounded-lg"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Info className="h-5 w-5" />
                          Property Information
                        </CardTitle>
                        <CardDescription>
                          Detailed property data and analysis
                        </CardDescription>
                      </CardHeader>
                      <Separator />
                      <CardContent className="p-0">
                        <div className="h-[600px] overflow-auto">
                          <PropertyInfoPanel 
                            property={selectedProperty}
                            onClose={() => setShowInfoPanel(false)}
                            onCompare={handleCompareProperty}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-3">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Info className="h-5 w-5" />
                          Detailed Property Information
                        </CardTitle>
                        <CardDescription>
                          Comprehensive data for the selected property
                        </CardDescription>
                      </CardHeader>
                      <Separator />
                      <CardContent className="p-6">
                        {selectedProperty ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                              <dl className="grid grid-cols-3 gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground col-span-1">Address</dt>
                                <dd className="col-span-2">{selectedProperty.address}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Parcel ID</dt>
                                <dd className="col-span-2">{selectedProperty.parcelId}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Owner</dt>
                                <dd className="col-span-2">{selectedProperty.owner || 'N/A'}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Zoning</dt>
                                <dd className="col-span-2">{selectedProperty.zoning || 'N/A'}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Property Type</dt>
                                <dd className="col-span-2">{selectedProperty.propertyType || 'N/A'}</dd>
                              </dl>
                            </div>
                            
                            <div>
                              <h3 className="text-lg font-medium mb-4">Valuation Information</h3>
                              <dl className="grid grid-cols-3 gap-2 text-sm">
                                <dt className="font-medium text-muted-foreground col-span-1">Current Value</dt>
                                <dd className="col-span-2">{selectedProperty.value || 'N/A'}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Last Sale Price</dt>
                                <dd className="col-span-2">{selectedProperty.salePrice || 'N/A'}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Square Feet</dt>
                                <dd className="col-span-2">{selectedProperty.squareFeet?.toLocaleString() || 'N/A'}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Year Built</dt>
                                <dd className="col-span-2">{selectedProperty.yearBuilt || 'N/A'}</dd>
                                
                                <dt className="font-medium text-muted-foreground col-span-1">Price Per Sq Ft</dt>
                                <dd className="col-span-2">{typeof selectedProperty.pricePerSqFt === 'number' ? `$${selectedProperty.pricePerSqFt.toFixed(2)}` : 'N/A'}</dd>
                              </dl>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-6">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                              Please select a property from the map view to see detailed information.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="comparables" className="mt-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Building className="h-5 w-5" />
                      Comparable Properties
                    </CardTitle>
                    <CardDescription>
                      Properties with similar characteristics for valuation analysis
                    </CardDescription>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-6">
                    {selectedProperty ? (
                      <>
                        {isLoading || relatedProperties.length === 0 ? (
                          <div className="flex items-center justify-center p-6">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="ml-2 text-muted-foreground">Finding similar properties...</p>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-6">
                              <h3 className="text-lg font-medium mb-2">Comparable Analysis</h3>
                              <p className="text-sm text-muted-foreground">
                                These properties have been selected based on similar location, size, and characteristics.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {relatedProperties.map((property) => (
                                <Card key={property.id} className="overflow-hidden">
                                  <div className="relative h-40 bg-slate-100">
                                    {property.propertyType === 'Commercial' ? (
                                      <Building className="h-full w-full p-8 text-slate-300" />
                                    ) : (
                                      <Home className="h-full w-full p-8 text-slate-300" />
                                    )}
                                  </div>
                                  <CardContent className="p-4">
                                    <h3 className="font-medium line-clamp-1 mb-1" title={property.address}>
                                      {property.address}
                                    </h3>
                                    <div className="text-sm text-muted-foreground mb-3 space-y-1">
                                      <div>
                                        <span className="font-medium">Value:</span>{' '}
                                        {property.value || 'Not available'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Sq Ft:</span>{' '}
                                        {property.squareFeet?.toLocaleString() || 'N/A'}
                                      </div>
                                      <div>
                                        <span className="font-medium">Year Built:</span>{' '}
                                        {property.yearBuilt || 'N/A'}
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="w-full" 
                                      onClick={() => handleSelectProperty(property)}
                                    >
                                      View Details
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Please select a property from the map view to see comparable properties.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </Container>
      </div>
    </div>
  );
}