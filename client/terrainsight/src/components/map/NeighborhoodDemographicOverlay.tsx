import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  getDemographicGeoJSON, 
  getDemographicData,
  demographicMetrics, 
  colorSchemes, 
  DemographicOverlayOptions,
  DemographicData
} from '@/services/neighborhoodDemographicService';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Info, BarChart3, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import DemographicLegend from './DemographicLegend';

interface NeighborhoodDemographicOverlayProps {
  visible: boolean;
  className?: string;
  onClose?: () => void;
}

export const NeighborhoodDemographicOverlay: React.FC<NeighborhoodDemographicOverlayProps> = ({
  visible,
  className,
  onClose
}) => {
  const map = useMap();
  const [overlayOptions, setOverlayOptions] = useState<DemographicOverlayOptions>({
    metric: 'medianIncome',
    opacity: 0.7,
    colorScheme: 'blues'
  });
  const [geoJSONLayer, setGeoJSONLayer] = useState<L.GeoJSON | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [metricRanges, setMetricRanges] = useState<Record<string, [number, number]>>({});
  const [activeTab, setActiveTab] = useState("display");
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<string[]>([]);
  const allNeighborhoods = useRef<DemographicData[]>([]);
  const [minMaxValues, setMinMaxValues] = useState<{min: number, max: number}>({ min: 0, max: 100 });

  // Load neighborhood data when component initializes
  useEffect(() => {
    const neighborhoods = getDemographicData();
    allNeighborhoods.current = neighborhoods;
    
    // Initialize with all neighborhoods selected
    setFilteredNeighborhoods(neighborhoods.map(n => n.id));
    
    // Calculate min/max values for all metrics
    const ranges: Record<string, [number, number]> = {};
    demographicMetrics.forEach(metric => {
      const values = neighborhoods.map(n => n[metric.id as keyof DemographicData] as number);
      ranges[metric.id] = [Math.min(...values), Math.max(...values)];
    });
    
    setMetricRanges(ranges);
    
    // Set initial min/max for the selected metric
    if (ranges[overlayOptions.metric]) {
      setMinMaxValues({
        min: ranges[overlayOptions.metric][0],
        max: ranges[overlayOptions.metric][1]
      });
    }
  }, []);

  // Add GeoJSON layer to map when overlay becomes visible
  useEffect(() => {
    if (visible) {
      updateOverlay();
    } else {
      // Remove layer when not visible
      if (geoJSONLayer) {
        geoJSONLayer.removeFrom(map);
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (geoJSONLayer) {
        geoJSONLayer.removeFrom(map);
      }
    };
  }, [visible, map, overlayOptions, filteredNeighborhoods]);

  // Update min/max values when metric changes
  useEffect(() => {
    if (metricRanges[overlayOptions.metric]) {
      setMinMaxValues({
        min: metricRanges[overlayOptions.metric][0],
        max: metricRanges[overlayOptions.metric][1]
      });
    }
  }, [overlayOptions.metric, metricRanges]);

  const updateOverlay = () => {
    // Remove existing layer if any
    if (geoJSONLayer) {
      geoJSONLayer.removeFrom(map);
    }
    
    // Generate new GeoJSON with current options and filtered neighborhoods
    const geoJSON = getDemographicGeoJSON(
      overlayOptions.metric, 
      overlayOptions.colorScheme
    );
    
    // Filter features to only include selected neighborhoods
    const filteredGeoJSON = {
      ...geoJSON,
      features: geoJSON.features.filter(feature => 
        filteredNeighborhoods.includes(feature.properties.id)
      )
    };
    
    // Create new layer with styling and interaction
    const layer = L.geoJSON(filteredGeoJSON as any, {
      style: (feature) => ({
        fillColor: feature?.properties?.color || '#cccccc',
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: overlayOptions.opacity
      }),
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: (e) => highlightFeature(e),
          mouseout: (e) => resetHighlight(e),
          click: (e) => {
            setSelectedNeighborhood(feature.properties.id);
            
            // Center the map on the clicked neighborhood
            if (e.target && e.target.getBounds) {
              map.fitBounds(e.target.getBounds());
            }
          }
        });
      }
    }).addTo(map);
    
    setGeoJSONLayer(layer);
  };

  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target;
    
    if (layer) {
      layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9
      });
      
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
      
      // Update info control with neighborhood data
      if (layer.feature && layer.feature.properties) {
        const { name, value } = layer.feature.properties;
        const metricInfo = demographicMetrics.find(m => m.id === overlayOptions.metric);
        
        // Create info div if not exists
        let infoDiv = document.getElementById('demographic-info');
        if (!infoDiv) {
          infoDiv = document.createElement('div');
          infoDiv.id = 'demographic-info';
          infoDiv.className = 'bg-white shadow-md rounded p-3 absolute bottom-10 right-10 z-[1000] text-sm';
          document.body.appendChild(infoDiv);
        }
        
        // Format value based on metric type
        let formattedValue = value;
        if (metricInfo) {
          if (metricInfo.format === 'currency') {
            formattedValue = new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD',
              maximumFractionDigits: 0 
            }).format(value);
          } else if (metricInfo.format === 'percent') {
            formattedValue = `${value}%`;
          }
        }
        
        infoDiv.innerHTML = `
          <h3 class="font-bold">${name}</h3>
          <p>${metricInfo?.label}: ${formattedValue}</p>
        `;
        infoDiv.style.display = 'block';
      }
    }
  };

  const resetHighlight = (e: L.LeafletEvent) => {
    if (geoJSONLayer) {
      geoJSONLayer.resetStyle(e.target);
    }
    
    // Hide info div
    const infoDiv = document.getElementById('demographic-info');
    if (infoDiv) {
      infoDiv.style.display = 'none';
    }
  };

  const handleMetricChange = (value: string) => {
    setOverlayOptions(prev => ({ ...prev, metric: value }));
  };

  const handleColorSchemeChange = (value: string) => {
    setOverlayOptions(prev => ({ ...prev, colorScheme: value }));
  };

  const handleOpacityChange = (value: number[]) => {
    setOverlayOptions(prev => ({ ...prev, opacity: value[0] }));
  };

  const toggleNeighborhood = (id: string, checked: boolean) => {
    setFilteredNeighborhoods(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(n => n !== id);
      }
    });
  };

  const selectAllNeighborhoods = () => {
    setFilteredNeighborhoods(allNeighborhoods.current.map(n => n.id));
  };

  const clearAllNeighborhoods = () => {
    setFilteredNeighborhoods([]);
  };

  if (!visible) return null;

  const metricInfo = demographicMetrics.find(m => m.id === overlayOptions.metric);
  const metricRange = metricRanges[overlayOptions.metric] || [0, 100];

  return (
    <Card className={cn("w-80 absolute z-10 top-20 right-4 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Demographic Overlay
        </CardTitle>
        <CardDescription>
          View and filter neighborhood demographics
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mx-4 mb-2">
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="filter">Filter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="display" className="mt-0">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metric">Demographic Metric</Label>
              <Select 
                value={overlayOptions.metric} 
                onValueChange={handleMetricChange}
              >
                <SelectTrigger id="metric">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {demographicMetrics.map(metric => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorScheme">Color Scheme</Label>
              <Select 
                value={overlayOptions.colorScheme} 
                onValueChange={handleColorSchemeChange}
              >
                <SelectTrigger id="colorScheme">
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  {colorSchemes.map(scheme => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="opacity">Opacity</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(overlayOptions.opacity * 100)}%
                </span>
              </div>
              <Slider
                id="opacity"
                min={0.1}
                max={1}
                step={0.1}
                value={[overlayOptions.opacity]}
                onValueChange={handleOpacityChange}
                aria-label="Adjust overlay opacity"
              />
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="filter" className="mt-0">
          <CardContent className="space-y-4 max-h-72 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <Label className="text-sm font-medium">Neighborhoods</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllNeighborhoods}
                  className="text-xs h-7"
                >
                  All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllNeighborhoods}
                  className="text-xs h-7"
                >
                  None
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              {allNeighborhoods.current.map((neighborhood) => (
                <div key={neighborhood.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`neighborhood-${neighborhood.id}`}
                    checked={filteredNeighborhoods.includes(neighborhood.id)}
                    onCheckedChange={(checked) => 
                      toggleNeighborhood(neighborhood.id, checked === true)
                    }
                  />
                  <Label 
                    htmlFor={`neighborhood-${neighborhood.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {neighborhood.name}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <Label className="text-sm font-medium mb-2 block">
                Value Range: {metricInfo && metricInfo.format === 'currency' 
                  ? `$${minMaxValues.min.toLocaleString()} - $${minMaxValues.max.toLocaleString()}`
                  : `${minMaxValues.min} - ${minMaxValues.max}`
                }
              </Label>
              <Slider
                min={metricRange[0]}
                max={metricRange[1]}
                step={(metricRange[1] - metricRange[0]) / 100}
                value={[minMaxValues.min, minMaxValues.max]}
                onValueChange={(values) => {
                  setMinMaxValues({ min: values[0], max: values[1] });
                }}
                className="mt-2"
                aria-label="Filter by value range"
              />
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between pt-2 pb-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowLegend(true)}
            >
              <Info className="h-4 w-4" />
              <span>Legend</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 sm:w-96">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {metricInfo?.label} Legend
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLegend(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <DemographicLegend
                metric={overlayOptions.metric}
                colorScheme={overlayOptions.colorScheme}
                minValue={metricRange[0]}
                maxValue={metricRange[1]}
                className="w-full"
              />
              
              <div className="mt-8">
                <h4 className="text-md font-medium mb-2">About This Metric</h4>
                <p className="text-sm text-muted-foreground">
                  {metricInfo?.id === 'medianIncome' && "Median household income represents the middle value of income distribution in a neighborhood."}
                  {metricInfo?.id === 'medianHomeValue' && "Median home value shows the middle value of all home prices in the neighborhood."}
                  {metricInfo?.id === 'percentOwnerOccupied' && "This shows the percentage of homes that are occupied by their owners rather than renters."}
                  {metricInfo?.id === 'percentRenterOccupied' && "This represents the percentage of homes that are occupied by renters."}
                  {metricInfo?.id === 'medianAge' && "The median age of residents living in this neighborhood."}
                  {metricInfo?.id === 'percentBachelor' && "Percentage of residents who have attained at least a bachelor's degree."}
                  {metricInfo?.id === 'unemploymentRate' && "The percentage of the labor force that is unemployed."}
                  {metricInfo?.id === 'povertyRate' && "The percentage of residents living below the poverty line."}
                  {metricInfo?.id === 'crimeIndex' && "A relative measure of crime incidents per 1,000 residents."}
                  {metricInfo?.id === 'schoolRating' && "Average rating of schools in the area on a scale of 1-10."}
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <div>
          <Button 
            variant="default" 
            size="sm"
            onClick={updateOverlay}
            className="mr-2"
          >
            Update
          </Button>
          
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default NeighborhoodDemographicOverlay;