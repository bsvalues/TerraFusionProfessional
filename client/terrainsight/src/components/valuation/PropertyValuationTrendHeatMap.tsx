/**
 * Property Valuation Trend Heat Map Component
 * 
 * An interactive heat map visualization that displays color-coded property valuation trends
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HelpCircle, ArrowUpRight, ArrowDownRight, ArrowRight, Layers, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useMap } from 'react-leaflet';
import { PropertyTrendData } from '@shared/interfaces/PropertyHistory';
import { HeatMapLayer, HeatMapSettings, MarketTrendMetric } from '../map/HeatMapLayer';
import { HeatMapControls } from '../map/HeatMapControls';
import { HeatMapLegend } from '../map/HeatMapLegend';
import { type Property } from '@shared/schema';
import { 
  getPropertyValueTrends, 
  calculateValueChangeRange, 
  calculateGrowthRateRange 
} from '../../services/property-trend-service';
import { formatCurrency, formatPercent } from '@/lib/utils';

// Default years for comparison
const DEFAULT_ANALYSIS_YEAR = '2023';
const DEFAULT_REFERENCE_YEAR = '2022';

// Available metrics for visualization
const VALUATION_METRICS = [
  { value: 'valueChangePercent', label: 'Value Change (%)' },
  { value: 'annualGrowthRate', label: 'Annual Growth Rate (%)' },
  { value: 'currentValue', label: 'Current Value ($)' }
];

// Default color gradients
const VALUE_CHANGE_GRADIENT = {
  0.0: '#d60000',  // Large negative: red
  0.25: '#ff5e00', // Moderate negative: orange
  0.40: '#ffd000', // Slight negative: yellow
  0.5: '#ffffff',  // Neutral: white
  0.60: '#b0ff00', // Slight positive: light green
  0.75: '#00ff00', // Moderate positive: green
  1.0: '#00c800'   // Large positive: dark green
};

// Year options
const AVAILABLE_YEARS: string[] = [];
for (let year = 2010; year <= 2025; year++) {
  AVAILABLE_YEARS.push(year.toString());
}

interface PropertyValuationTrendHeatMapProps {
  className?: string;
}

/**
 * Property Valuation Trend Heat Map Component
 */
export const PropertyValuationTrendHeatMap: React.FC<PropertyValuationTrendHeatMapProps> = ({ 
  className = '' 
}) => {
  // Get map instance from React Leaflet
  const map = useMap();
  
  // State for the selected years
  const [analysisYear, setAnalysisYear] = useState<string>(DEFAULT_ANALYSIS_YEAR);
  const [referenceYear, setReferenceYear] = useState<string>(DEFAULT_REFERENCE_YEAR);
  
  // State for the heat map settings
  const [heatMapSettings, setHeatMapSettings] = useState<HeatMapSettings>({
    metric: 'valueChange',
    radius: 30,
    blur: 15,
    gradient: VALUE_CHANGE_GRADIENT,
    maxIntensity: null,
    intensityProperty: 'valueChangePercent',
    showLegend: true
  });
  
  // State for whether the heat map is enabled
  const [heatMapEnabled, setHeatMapEnabled] = useState<boolean>(true);
  
  // Fetch property trends data
  const { data: propertyTrends = [], isLoading, error } = useQuery<PropertyTrendData[]>({
    queryKey: ['/api/property-trends', analysisYear, referenceYear],
    queryFn: () => getPropertyValueTrends(analysisYear, referenceYear),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Calculate statistics for the data distribution
  const statistics = useMemo(() => {
    if (propertyTrends.length === 0) return null;
    
    // Get values for the selected metric
    const metric = heatMapSettings.metric as keyof PropertyTrendData;
    const values = propertyTrends.map(p => Number(p[metric]));
    
    // Calculate quartiles
    values.sort((a, b) => a - b);
    const min = values[0];
    const max = values[values.length - 1];
    const median = values[Math.floor(values.length / 2)];
    const q1 = values[Math.floor(values.length / 4)];
    const q3 = values[Math.floor((3 * values.length) / 4)];
    
    // Calculate average
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    
    // Value distribution for histogram
    const range = max - min;
    const binSize = range / 10;
    const distribution: { name: string; value: number }[] = [];
    
    for (let i = 0; i < 10; i++) {
      const binMin = min + (i * binSize);
      const binMax = binMin + binSize;
      const count = values.filter(v => v >= binMin && v < binMax).length;
      distribution.push({
        name: `${formatMetricValue(binMin, metric as string)} - ${formatMetricValue(binMax, metric as string)}`,
        value: count
      });
    }
    
    return {
      count: values.length,
      min,
      max,
      avg,
      median,
      q1,
      q3,
      distribution
    };
  }, [propertyTrends, heatMapSettings.metric]);
  
  // Helper function to format values based on metric
  const formatMetricValue = (value: number, metric: string): string => {
    if (metric === 'currentValue') {
      return formatCurrency(value);
    } else if (metric === 'valueChangePercent' || metric === 'annualGrowthRate') {
      return formatPercent(value);
    }
    return value.toString();
  };
  
  // Update the gradient when metric changes
  useEffect(() => {
    if (propertyTrends.length === 0) return;
    
    let newGradient = {...VALUE_CHANGE_GRADIENT};
    let maxIntensity: number | null = null;
    let metricProperty = heatMapSettings.intensityProperty;
    
    if (heatMapSettings.intensityProperty === 'currentValue') {
      // For current value, we need a different color scale
      // Use only the gradient keys that exist in the expected type
      newGradient = {
        0.0: '#f7fbff',   // Lightest blue
        0.25: '#deebf7',
        0.4: '#c6dbef',
        0.5: '#9ecae1',
        0.6: '#6baed6',
        0.75: '#4292c6',
        1.0: '#2171b5'    // Darkest blue
      };
      
      // Find max value for scaling
      const values = propertyTrends.map(p => p.currentValue);
      maxIntensity = Math.max(...values);
      metricProperty = 'currentValue';
    } else if (heatMapSettings.intensityProperty === 'valueChangePercent' || heatMapSettings.intensityProperty === 'annualGrowthRate') {
      // For percentage metrics, use diverging color scale
      const { min, max } = heatMapSettings.intensityProperty === 'valueChangePercent' 
        ? calculateValueChangeRange(propertyTrends)
        : calculateGrowthRateRange(propertyTrends);
        
      // Use absolute max for scaling
      const absMax = Math.max(Math.abs(min), Math.abs(max));
      maxIntensity = absMax;
      
      // Create gradient that represents both positive and negative values
      newGradient = {
        0.0: '#d60000',  // Large negative: red
        0.25: '#ff5e00', // Moderate negative: orange
        0.40: '#ffd000', // Slight negative: yellow
        0.5: '#ffffff',  // Neutral: white
        0.60: '#b0ff00', // Slight positive: light green
        0.75: '#00ff00', // Moderate positive: green
        1.0: '#00c800'   // Large positive: dark green
      };
    }
    
    setHeatMapSettings(prev => ({
      ...prev,
      gradient: newGradient,
      maxIntensity,
      intensityProperty: metricProperty
    }));
  }, [heatMapSettings.intensityProperty, propertyTrends]);
  
  // Convert PropertyTrendData to the format expected by HeatMapLayer
  const propertyDataForHeatMap = useMemo(() => {
    // Create properties array with only the essential fields needed for the heatmap
    return propertyTrends.map(trend => {
      // Base property object with required fields
      const baseProperty = {
        id: typeof trend.propertyId === 'string' ? parseInt(trend.propertyId, 10) : trend.propertyId as number,
        parcelId: trend.parcelId,
        address: trend.address,
        value: trend.currentValue.toString(),
        latitude: trend.latitude.toString(),
        longitude: trend.longitude.toString(),
        
        // Required fields with null values
        pricePerSqFt: null,
        owner: null,
        estimatedValue: null,
        salePrice: null,
        squareFeet: 0,
        yearBuilt: null,
        bedrooms: null,
        bathrooms: null,
        lotSize: null,
        propertyType: null,
        zoning: null,
        lastSaleDate: null,
        taxAssessment: null,
        landValue: null,
        coordinates: null,
        neighborhood: null,
        historicalValues: null,
        sourceId: null,
        stories: null,
        garageType: null,
        garageSpaces: null,
        pool: null,
        condition: null,
        zillowId: null,
        attributes: {
          valueChange: trend.valueChangePercent, // This is what HeatMapLayer expects for the 'valueChange' metric
          valueChangePercent: trend.valueChangePercent,
          annualGrowthRate: trend.annualGrowthRate,
          valueChangeAbsolute: trend.valueChangeAbsolute
        }
      };
      
      // We create a new object to match Property type
      return baseProperty as unknown as Property;
    });
  }, [propertyTrends]);
  
  // Handle changes to heat map settings
  const handleSettingsChange = (newSettings: Partial<HeatMapSettings>) => {
    setHeatMapSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };
  
  return (
    <div className={`${className} space-y-4`}>
      <Card className="shadow-md bg-white bg-opacity-95 z-[1000]">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Property Valuation Trend Heat Map</CardTitle>
              <CardDescription>
                Visualize property valuation trends in Benton County, Washington
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-heatmap" className="text-sm cursor-pointer">Show Heat Map</Label>
              <Switch 
                id="show-heatmap" 
                checked={heatMapEnabled} 
                onCheckedChange={setHeatMapEnabled} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error loading trend data</AlertTitle>
              <AlertDescription>
                Unable to load property valuation trend data. Please try again later.
              </AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="h-10 flex items-center justify-center">
              <div className="animate-pulse">Loading property trend data...</div>
            </div>
          ) : propertyTrends.length === 0 ? (
            <Alert className="mb-4">
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>No trend data available</AlertTitle>
              <AlertDescription>
                No property valuation trend data is available for the selected years.
                Try selecting different years for comparison.
              </AlertDescription>
            </Alert>
          ) : (
            <Tabs defaultValue="settings">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="settings" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>Statistics</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="m-0 p-0">
                <div className="space-y-6">
                  {/* Year selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="analysis-year">Analysis Year</Label>
                      <Select
                        value={analysisYear}
                        onValueChange={setAnalysisYear}
                      >
                        <SelectTrigger id="analysis-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_YEARS.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reference-year">Reference Year</Label>
                      <Select
                        value={referenceYear}
                        onValueChange={setReferenceYear}
                      >
                        <SelectTrigger id="reference-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_YEARS.map(year => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Visualization settings */}
                  <HeatMapControls
                    settings={heatMapSettings}
                    onSettingsChange={handleSettingsChange}
                    isEnabled={heatMapEnabled}
                    onToggle={setHeatMapEnabled}
                  />
                  
                  {/* Property count and data quality */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Badge variant="outline" className="text-xs font-normal">
                      {propertyTrends.length} properties
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-normal">
                      {analysisYear} vs {referenceYear}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="statistics" className="m-0 p-0">
                {statistics && (
                  <div className="space-y-4">
                    {/* Key statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-muted/50 rounded-md">
                        <div className="text-sm text-muted-foreground">Min</div>
                        <div className="font-semibold">
                          {formatMetricValue(statistics.min, heatMapSettings.metric as string)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-md">
                        <div className="text-sm text-muted-foreground">Average</div>
                        <div className="font-semibold">
                          {formatMetricValue(statistics.avg, heatMapSettings.metric as string)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-md">
                        <div className="text-sm text-muted-foreground">Median</div>
                        <div className="font-semibold">
                          {formatMetricValue(statistics.median, heatMapSettings.metric as string)}
                        </div>
                      </div>
                      <div className="p-2 bg-muted/50 rounded-md">
                        <div className="text-sm text-muted-foreground">Max</div>
                        <div className="font-semibold">
                          {formatMetricValue(statistics.max, heatMapSettings.metric as string)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Distribution chart */}
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statistics.distribution}>
                          <XAxis 
                            dataKey="name" 
                            tick={false}
                            axisLine={false}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number, name) => [
                              `${value} properties`, 
                              'Count'
                            ]}
                          />
                          <Bar dataKey="value" fill="#6366f1">
                            {statistics.distribution.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index < 5 ? '#ef4444' : '#22c55e'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Trend analysis */}
                    <Alert className="mt-2">
                      <div className="flex items-center gap-1 mb-1">
                        {statistics.avg > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : statistics.avg < 0 ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-yellow-500" />
                        )}
                        <AlertTitle>
                          {statistics.avg > 0 
                            ? 'Positive trend detected' 
                            : statistics.avg < 0 
                              ? 'Negative trend detected' 
                              : 'Neutral market'}
                        </AlertTitle>
                      </div>
                      <AlertDescription>
                        On average, properties in this area have 
                        {statistics.avg > 0 
                          ? ` increased by ${formatPercent(statistics.avg)}` 
                          : statistics.avg < 0 
                            ? ` decreased by ${formatPercent(Math.abs(statistics.avg))}` 
                            : ' maintained stable values'} 
                        from {referenceYear} to {analysisYear}.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
      
      {/* Heat map layer */}
      <HeatMapLayer
        map={map}
        properties={propertyDataForHeatMap}
        settings={heatMapSettings}
        visible={heatMapEnabled}
      />
      
      {/* Heat map legend */}
      {/* Only show the legend if the heat map is enabled and showLegend is true */}
      {heatMapEnabled && heatMapSettings.showLegend && (
        <div className="absolute bottom-20 right-4 z-[1000]">
          <HeatMapLegend
            settings={heatMapSettings}
            visible={true}
            onClose={() => setHeatMapSettings(prev => ({ ...prev, showLegend: false }))}
          />
        </div>
      )}
    </div>
  );
};

export default PropertyValuationTrendHeatMap;