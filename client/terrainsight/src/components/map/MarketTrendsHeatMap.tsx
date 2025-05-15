import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Layers, Map as MapIcon, Settings } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HeatMapLayer, HeatMapSettings, MarketTrendMetric } from './HeatMapLayer';
import { HeatMapControls } from './HeatMapControls';
import { HeatMapLegend } from './HeatMapLegend';
import { Property } from '@shared/schema';

interface MarketTrendsHeatMapProps {
  map: L.Map | null;
  className?: string;
}

export const MarketTrendsHeatMap: React.FC<MarketTrendsHeatMapProps> = ({ 
  map,
  className
}) => {
  // Query properties data
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Heat map state
  const [heatMapEnabled, setHeatMapEnabled] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  
  // Default heat map settings
  const [heatMapSettings, setHeatMapSettings] = useState<HeatMapSettings>({
    metric: 'value',
    radius: 25,
    blur: 15,
    gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' },
    maxIntensity: null,
    intensityProperty: 'value',
    showLegend: true
  });
  
  // Update settings handler
  const handleSettingsChange = (settings: Partial<HeatMapSettings>) => {
    setHeatMapSettings(prev => ({ ...prev, ...settings }));
  };
  
  // Handle legend visibility when settings change
  useEffect(() => {
    setShowLegend(heatMapSettings.showLegend && heatMapEnabled);
  }, [heatMapSettings.showLegend, heatMapEnabled]);
  
  // Toggle heat map
  const toggleHeatMap = (enabled: boolean) => {
    setHeatMapEnabled(enabled);
    if (!enabled) {
      setShowLegend(false);
    } else if (heatMapSettings.showLegend) {
      setShowLegend(true);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-xl">
          <BarChart className="mr-2 h-5 w-5" />
          Market Trends Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="heatmap" className="space-y-4">
          <TabsList>
            <TabsTrigger value="heatmap" className="flex items-center">
              <Layers className="mr-2 h-4 w-4" />
              Heat Map
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="heatmap" className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load property data. Please try again later.
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading property data...</p>
              </div>
            ) : !properties || properties.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No property data available to display on the heat map.
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Visualize property trends across different neighborhoods. Enable the heat map to see the distribution of {heatMapSettings.metric === 'value' ? 'property values' : 
                      heatMapSettings.metric === 'pricePerSqFt' ? 'price per square foot' : 
                      heatMapSettings.metric === 'salesVolume' ? 'sales activity' : 
                      heatMapSettings.metric === 'valueChange' ? 'value changes' : 
                      'days on market'} in the area.
                  </p>
                </div>
                
                {map && (
                  <HeatMapLayer
                    map={map}
                    properties={properties}
                    settings={heatMapSettings}
                    visible={heatMapEnabled}
                  />
                )}
                
                {map && showLegend && (
                  <HeatMapLegend
                    settings={heatMapSettings}
                    visible={showLegend}
                    onClose={() => setShowLegend(false)}
                  />
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <HeatMapControls
              settings={heatMapSettings}
              onSettingsChange={handleSettingsChange}
              isEnabled={heatMapEnabled}
              onToggle={toggleHeatMap}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketTrendsHeatMap;