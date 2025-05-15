import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { 
  NeighborhoodTimeline, 
  getNeighborhoodTimelines 
} from '@/services/neighborhoodTimelineService';
import { HeatMapLayer, HeatMapSettings, MarketTrendMetric } from '../map/HeatMapLayer';
import { HeatMapControls } from '../map/HeatMapControls';
import { HeatMapLegend } from '../map/HeatMapLegend';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';

interface NeighborhoodComparisonHeatmapProps {
  className?: string;
  initialMetric?: MarketTrendMetric;
  properties?: Property[];
}

// Predefined color gradients
const colorGradients = {
  default: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' },
  valueChange: { 0: 'blue', 0.4: 'cyan', 0.5: 'lime', 0.7: 'yellow', 1.0: 'red' },
  heatOnly: { 0.4: 'yellow', 0.6: 'orange', 0.8: 'orangered', 1.0: 'red' },
  cool: { 0.4: 'cyan', 0.6: 'blue', 0.8: 'darkblue', 1.0: 'purple' }
};

// Define map center and zoom for Benton County, WA
const defaultMapCenter: [number, number] = [46.2835, -119.2803];
const defaultZoom = 10;

// Main component for the neighborhood comparison heatmap
export const NeighborhoodComparisonHeatmap: React.FC<NeighborhoodComparisonHeatmapProps> = ({
  className = '',
  initialMetric = 'value',
  properties = []
}) => {
  // State for heat map settings
  const [heatMapSettings, setHeatMapSettings] = useState<HeatMapSettings>({
    metric: initialMetric,
    radius: 25,
    blur: 15,
    gradient: colorGradients.default,
    maxIntensity: null,
    intensityProperty: 'value',
    showLegend: true
  });
  
  // State for UI controls
  const [isHeatMapEnabled, setIsHeatMapEnabled] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [activeMeasure, setActiveMeasure] = useState<'current' | 'growth' | 'comparison'>('current');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  
  // State for data
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodTimeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch neighborhood data
  useEffect(() => {
    const loadNeighborhoods = async () => {
      try {
        setIsLoading(true);
        const data = await getNeighborhoodTimelines(10); // Get 10 years of data
        setNeighborhoods(data);
        
        // Initialize with first 3 neighborhoods
        if (data.length > 0) {
          setSelectedNeighborhoods(data.slice(0, 3).map(n => n.id));
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load neighborhood data');
        console.error('Error loading neighborhoods:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNeighborhoods();
  }, []);

  // Handle heat map settings changes
  const handleSettingsChange = (newSettings: Partial<HeatMapSettings>) => {
    setHeatMapSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Toggle neighborhood selection
  const toggleNeighborhood = (neighborhoodId: string) => {
    setSelectedNeighborhoods(prev => {
      if (prev.includes(neighborhoodId)) {
        return prev.filter(id => id !== neighborhoodId);
      } else {
        return [...prev, neighborhoodId];
      }
    });
  };

  // Merge properties with neighborhood data for heat map
  const enhancedPropertiesForHeatmap = useMemo(() => {
    if (!properties || properties.length === 0) return [];
    
    return properties.map(property => {
      // Create a copy of the property
      const enhancedProperty = { ...property };
      
      // Add attributes based on the neighborhood if we have one
      if (property.neighborhood) {
        const neighborhood = neighborhoods.find(n => 
          n.id === property.neighborhood || 
          n.name.toLowerCase() === property.neighborhood?.toLowerCase()
        );
        
        if (neighborhood) {
          // Find the data point for the selected year
          const yearData = neighborhood.data.find(d => d.year === selectedYear);
          
          if (yearData) {
            // Add to property attributes
            if (!enhancedProperty.attributes) {
              enhancedProperty.attributes = {};
            }
            
            const attributes = enhancedProperty.attributes as Record<string, unknown>;
            
            // Add neighborhood metrics
            attributes.neighborhoodValue = yearData.value;
            attributes.neighborhoodGrowth = yearData.percentChange || 0;
            attributes.valueChange = yearData.percentChange || 0;
          }
        }
      }
      
      return enhancedProperty;
    });
  }, [properties, neighborhoods, selectedYear]);

  if (isLoading) {
    return (
      <Card className={`${className} min-h-[400px] flex items-center justify-center`}>
        <CardContent>
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading neighborhood data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} min-h-[400px] flex items-center justify-center`}>
        <CardContent>
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle>Neighborhood Comparison Heatmap</CardTitle>
            <CardDescription>Compare neighborhoods with interactive heatmap visualization</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col space-y-4">
          {/* Visualization Controls */}
          <div className="flex flex-wrap gap-2">
            <Tabs value={activeMeasure} onValueChange={(v) => setActiveMeasure(v as 'current' | 'growth' | 'comparison')}>
              <TabsList>
                <TabsTrigger value="current">Current Values</TabsTrigger>
                <TabsTrigger value="growth">Growth Rates</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowControls(!showControls)}
              >
                {showControls ? 'Hide Controls' : 'Show Controls'}
              </Button>
            </div>
          </div>
          
          {/* Year Selection */}
          <div className="flex items-center gap-3">
            <Label htmlFor="year-select" className="w-20">Year:</Label>
            <Select 
              value={selectedYear} 
              onValueChange={setSelectedYear}
            >
              <SelectTrigger id="year-select">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoods.length > 0 && neighborhoods[0].data.map(point => (
                  <SelectItem key={point.year} value={point.year}>
                    {point.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Neighborhood Selection */}
          <div>
            <Label className="mb-2 block">Selected Neighborhoods:</Label>
            <div className="flex flex-wrap gap-2">
              {neighborhoods.map(neighborhood => (
                <Button
                  key={neighborhood.id}
                  variant={selectedNeighborhoods.includes(neighborhood.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleNeighborhood(neighborhood.id)}
                >
                  {neighborhood.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Map Container */}
          <div className="relative h-[500px] w-full border rounded-md overflow-hidden">
            <MapContainer 
              center={defaultMapCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Heatmap Handler */}
              <HeatmapController 
                properties={enhancedPropertiesForHeatmap}
                settings={heatMapSettings}
                visible={isHeatMapEnabled}
                activeMeasure={activeMeasure}
                selectedNeighborhoods={selectedNeighborhoods}
                neighborhoods={neighborhoods}
                selectedYear={selectedYear}
              />
            </MapContainer>
            
            {/* Legend */}
            {showLegend && (
              <div className="absolute bottom-4 left-4 z-[1000]">
                <HeatMapLegend 
                  settings={heatMapSettings}
                  visible={isHeatMapEnabled && heatMapSettings.showLegend}
                  onClose={() => setHeatMapSettings(prev => ({ ...prev, showLegend: false }))}
                />
              </div>
            )}
            
            {/* Controls */}
            {showControls && (
              <div className="absolute top-4 right-4 z-[1000] w-80">
                <HeatMapControls 
                  settings={heatMapSettings}
                  onSettingsChange={handleSettingsChange}
                  isEnabled={isHeatMapEnabled}
                  onToggle={setIsHeatMapEnabled}
                />
              </div>
            )}
          </div>
          
          {/* Metrics Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {selectedNeighborhoods.map(neighborhoodId => {
              const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
              if (!neighborhood) return null;
              
              const yearData = neighborhood.data.find(d => d.year === selectedYear);
              if (!yearData) return null;
              
              return (
                <Card key={neighborhoodId} className="bg-muted/30">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base">{neighborhood.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Avg. Value ({selectedYear}):</span>
                        <span className="font-medium">{formatCurrency(yearData.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Growth Rate:</span>
                        <span className={`font-medium ${yearData.percentChange && yearData.percentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {yearData.percentChange ? `${(yearData.percentChange * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Transactions:</span>
                        <span className="font-medium">{yearData.transactionCount || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Controller component to manage heat map inside map container
interface HeatmapControllerProps {
  properties: Property[];
  settings: HeatMapSettings;
  visible: boolean;
  activeMeasure: 'current' | 'growth' | 'comparison';
  selectedNeighborhoods: string[];
  neighborhoods: NeighborhoodTimeline[];
  selectedYear: string;
}

const HeatmapController: React.FC<HeatmapControllerProps> = ({
  properties,
  settings,
  visible,
  activeMeasure,
  selectedNeighborhoods,
  neighborhoods,
  selectedYear
}) => {
  const map = useMap();
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  
  // Filter properties to only include those in selected neighborhoods
  useEffect(() => {
    // Adjust properties based on selected measure
    const adjustedProperties = properties.filter(property => {
      // Only include properties from selected neighborhoods
      if (property.neighborhood) {
        const neighborhoodId = neighborhoods.find(n => 
          n.name.toLowerCase() === property.neighborhood?.toLowerCase()
        )?.id;
        
        return neighborhoodId ? selectedNeighborhoods.includes(neighborhoodId) : false;
      }
      return false;
    });
    
    setFilteredProperties(adjustedProperties);
  }, [properties, selectedNeighborhoods, activeMeasure, neighborhoods, selectedYear]);
  
  // Update settings based on active measure
  useEffect(() => {
    let updatedSettings: Partial<HeatMapSettings> = {};
    
    switch (activeMeasure) {
      case 'growth':
        updatedSettings = {
          metric: 'valueChange',
          gradient: colorGradients.valueChange,
          intensityProperty: 'valueChange'
        };
        break;
      case 'current':
        updatedSettings = {
          metric: 'value',
          gradient: colorGradients.default,
          intensityProperty: 'value'
        };
        break;
      case 'comparison':
        updatedSettings = {
          metric: 'valueChange',
          gradient: colorGradients.cool,
          intensityProperty: 'valueChange'
        };
        break;
    }
    
    // Only update if there's a change
    if (JSON.stringify(updatedSettings) !== JSON.stringify({
      metric: settings.metric,
      gradient: settings.gradient,
      intensityProperty: settings.intensityProperty
    })) {
      // We can't directly call the parent component's function, so we implement
      // the same logic locally
      setSettings(prev => ({ ...prev, ...updatedSettings }));
    }
  }, [activeMeasure]);
  
  // Local state for settings to avoid circular dependencies
  const [localSettings, setSettings] = useState(settings);
  
  // Update local settings when parent settings change
  useEffect(() => {
    setSettings(settings);
  }, [settings]);
  
  return (
    <HeatMapLayer
      map={map}
      properties={filteredProperties}
      settings={localSettings}
      visible={visible && filteredProperties.length > 0}
    />
  );
};

export default NeighborhoodComparisonHeatmap;