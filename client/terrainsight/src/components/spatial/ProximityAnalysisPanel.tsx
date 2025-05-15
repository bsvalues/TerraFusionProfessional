import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { 
  POI, 
  POIType, 
  proximityAnalysisService,
  PropertyValueImpact
} from '@/services/spatial/proximityAnalysisService';
import { ProximityMap } from './ProximityMap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Trees,
  School,
  Hospital,
  ShoppingCart,
  Train,
  Coffee,
  Film,
  Book,
  Church
} from 'lucide-react';

interface ProximityAnalysisPanelProps {
  selectedProperty?: Property;
  allProperties: Property[];
  className?: string;
}

export function ProximityAnalysisPanel({
  selectedProperty,
  allProperties,
  className = ""
}: ProximityAnalysisPanelProps) {
  // State for analysis parameters
  const [radius, setRadius] = useState<number>(1000); // 1km default
  const [selectedPOITypes, setSelectedPOITypes] = useState<POIType[]>([]);
  const [activeTab, setActiveTab] = useState('analysis');
  
  // State for analysis results
  const [nearbyPOIs, setNearbyPOIs] = useState<(POI & { distance: number })[]>([]);
  const [valueImpact, setValueImpact] = useState<PropertyValueImpact | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get available POI categories
  const poiCategories = proximityAnalysisService.getPOICategories();
  
  // Update analysis when parameters change
  useEffect(() => {
    if (!selectedProperty) return;
    
    setLoading(true);
    
    // Find nearby POIs
    const filteredPOITypes = selectedPOITypes.length > 0 ? selectedPOITypes : undefined;
    const pois = proximityAnalysisService.findNearbyPOIs(
      selectedProperty,
      radius,
      filteredPOITypes
    );
    setNearbyPOIs(pois);
    
    // Calculate value impact
    const impact = proximityAnalysisService.calculatePropertyValueImpact(
      selectedProperty,
      filteredPOITypes,
      radius
    );
    setValueImpact(impact);
    
    setLoading(false);
  }, [selectedProperty, radius, selectedPOITypes]);
  
  // Toggle POI type selection
  const togglePOIType = (poiType: POIType) => {
    setSelectedPOITypes(prev => {
      if (prev.includes(poiType)) {
        return prev.filter(t => t !== poiType);
      } else {
        return [...prev, poiType];
      }
    });
  };
  
  // Get icon component for POI type
  const getPOIIcon = (poiType: POIType): React.ReactNode => {
    switch (poiType) {
      case POIType.Park:
        return <Trees className="h-4 w-4" />;
      case POIType.School:
        return <School className="h-4 w-4" />;
      case POIType.Hospital:
        return <Hospital className="h-4 w-4" />;
      case POIType.ShoppingCenter:
        return <ShoppingCart className="h-4 w-4" />;
      case POIType.PublicTransit:
        return <Train className="h-4 w-4" />;
      case POIType.Highway:
        return <MapPin className="h-4 w-4" />;
      case POIType.Restaurant:
        return <Coffee className="h-4 w-4" />;
      case POIType.Entertainment:
        return <Film className="h-4 w-4" />;
      case POIType.Library:
        return <Book className="h-4 w-4" />;
      case POIType.Church:
        return <Church className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };
  
  // Format POI type display name
  const formatPOITypeName = (poiType: POIType): string => {
    return poiType.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Render the empty state when no property is selected
  if (!selectedProperty) {
    return (
      <div className={`${className} w-full h-full flex items-center justify-center min-h-[400px]`}>
        <div className="text-center w-full max-w-md p-8">
          <div className="flex items-center justify-center rounded-full bg-muted p-6 mb-4 mx-auto">
            <Navigation className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="w-full max-w-lg mx-auto">
            <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
            <p className="text-muted-foreground">
              Select a property from the map to analyze how nearby points of interest
              affect its value.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className} relative z-10`}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column - Map and Controls */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                Proximity Value Analysis
              </CardTitle>
              <CardDescription>
                Analyzing value impact of {nearbyPOIs.length} points of interest near {selectedProperty.address}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Analysis Radius Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radius-slider" className="text-sm">Analysis Radius</Label>
                  <span className="text-sm font-medium">{(radius / 1000).toFixed(1)} km</span>
                </div>
                
                <Slider
                  id="radius-slider"
                  min={200}
                  max={3000}
                  step={100}
                  value={[radius]}
                  onValueChange={(value) => setRadius(value[0])}
                  aria-label="Analysis radius"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>200m</span>
                  <span>1km</span>
                  <span>2km</span>
                  <span>3km</span>
                </div>
              </div>
              
              {/* Map Visualization */}
              <ProximityMap
                property={selectedProperty}
                pois={nearbyPOIs}
                radius={radius}
                className="mt-3"
              />
              
              {/* POI Type Filters */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm">Filter Points of Interest</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1">
                  {poiCategories.map((poiType) => (
                    <div 
                      key={poiType} 
                      className="flex items-center space-x-2"
                    >
                      <Checkbox 
                        id={`poi-${poiType}`}
                        checked={selectedPOITypes.includes(poiType)}
                        onCheckedChange={() => togglePOIType(poiType)}
                      />
                      <Label 
                        htmlFor={`poi-${poiType}`}
                        className="text-sm flex items-center cursor-pointer"
                      >
                        <span className="mr-1.5">{getPOIIcon(poiType)}</span>
                        {formatPOITypeName(poiType)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Analysis Results */}
        <div className="md:col-span-5 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis" className="flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Value Impact
              </TabsTrigger>
              <TabsTrigger value="poiList" className="flex items-center">
                <Navigation className="h-4 w-4 mr-2" />
                Nearby POIs
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="mt-4 space-y-6">
              {/* Value Impact Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Value Impact Summary</CardTitle>
                  <CardDescription>
                    How nearby points of interest affect this property's value
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {valueImpact && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Total Value Impact</span>
                          <div>
                            <Badge 
                              variant={valueImpact.totalImpactPercentage >= 0 ? "default" : "destructive"}
                              className="ml-2"
                            >
                              {valueImpact.totalImpactPercentage >= 0 ? (
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                              )}
                              {Math.abs(valueImpact.totalImpactPercentage).toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-3xl font-bold mb-1">
                          {formatCurrency(valueImpact.totalImpactValue)}
                        </div>
                        
                        <Progress 
                          value={valueImpact.totalImpactPercentage >= 0 ? 
                            Math.min(valueImpact.totalImpactPercentage, 20) * 5 : 0
                          } 
                          className="h-2" 
                        />
                      </div>
                      
                      <Separator />
                      
                      {/* Breakdown of impact by top POI types */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Impact Breakdown</h4>
                        
                        {valueImpact.impactBreakdown.length > 0 ? (
                          <div className="space-y-4">
                            {valueImpact.impactBreakdown
                              .sort((a, b) => Math.abs(b.impactPercentage) - Math.abs(a.impactPercentage))
                              .slice(0, 5) // Show top 5
                              .map((impact, index) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className="mr-2">
                                        {getPOIIcon(impact.poiType)}
                                      </span>
                                      <span className="text-sm font-medium">
                                        {impact.poiName}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-xs text-muted-foreground mr-2">
                                        {impact.distance.toFixed(0)}m
                                      </span>
                                      <Badge 
                                        variant={impact.impactPercentage >= 0 ? "outline" : "destructive"} 
                                        className="text-xs"
                                      >
                                        {impact.impactPercentage >= 0 ? '+' : ''}
                                        {impact.impactPercentage.toFixed(1)}%
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <Progress 
                                    value={impact.impactPercentage >= 0 ? 
                                      Math.min(impact.impactPercentage, 10) * 10 : 0
                                    } 
                                    className="h-1.5" 
                                  />
                                  
                                  <div className="text-xs text-muted-foreground">
                                    {formatCurrency(impact.impactValue)} value {impact.impactPercentage >= 0 ? 'boost' : 'reduction'}
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground py-2">
                            No significant impacts found within current radius.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Analysis Explanation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Analysis Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {valueImpact ? 
                      proximityAnalysisService.formatInfluenceDescription(valueImpact) : 
                      "Analyzing nearby points of interest and their impact on property value..."
                    }
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="poiList" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Points of Interest</CardTitle>
                  <CardDescription>
                    {nearbyPOIs.length} POIs within {(radius / 1000).toFixed(1)}km
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nearbyPOIs.length > 0 ? (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                      {nearbyPOIs.map((poi) => (
                        <div key={poi.id} className="flex p-2 border rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-100 rounded-md mr-3">
                            {getPOIIcon(poi.type)}
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{poi.name}</h4>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {poi.distance.toFixed(0)}m
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {poi.type.replace(/_/g, ' ')}
                            </p>
                            
                            {/* Display key attributes if any */}
                            {poi.attributes && Object.keys(poi.attributes).length > 0 && (
                              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                {Object.entries(poi.attributes)
                                  .filter(([_, value]) => typeof value !== 'object')
                                  .slice(0, 4)
                                  .map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="text-muted-foreground capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                      </span>{' '}
                                      <span>{value}</span>
                                    </div>
                                  ))
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Navigation className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No points of interest found within the current radius.</p>
                      <p className="text-sm mt-1">Try increasing the search radius.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}