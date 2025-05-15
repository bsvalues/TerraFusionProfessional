import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import {
  TimeSeriesAnalysisService,
  TimeSeriesDataPoint,
  ForecastingModel,
  ForecastResult,
  TrendAnalysisResult
} from '../../services/timeseries/timeSeriesAnalysisService';
import { TimeSeriesChart } from '../timeseries/TimeSeriesChart';
import { PropertyValueTrend } from '../timeseries/PropertyValueTrend';
import { ForecastingPanel } from '../timeseries/ForecastingPanel';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  LineChart,
  Calendar,
  BrainCircuit,
  BarChart,
  AlertCircle,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimeSeriesAnalysisPanelProps {
  properties: Property[];
  className?: string;
}

export function TimeSeriesAnalysisPanel({
  properties,
  className
}: TimeSeriesAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState('historical');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | string | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const [trendInfo, setTrendInfo] = useState<TrendAnalysisResult | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [analysisService] = useState(() => new TimeSeriesAnalysisService());
  
  // Find selected property
  const selectedProperty = selectedPropertyId 
    ? properties.find(p => p.id === selectedPropertyId) 
    : null;
  
  // Enhanced property type for testing with valueHistory
  type EnhancedProperty = Property & { valueHistory?: Record<string, string> };
  
  // Sample history data for testing - this would normally come from API
  const getSampleValueHistory = (property: Property): Record<string, string> => {
    // Generate history based on property ID to ensure consistency
    const baseValue = parseInt(property.value || '300000');
    const id = typeof property.id === 'number' ? property.id : parseInt(String(property.id));
    const growthFactor = 1 + (0.03 + (id % 5) * 0.01); // 3-7% growth based on ID
    
    const currentYear = new Date().getFullYear();
    const history: Record<string, string> = {};
    
    // Generate 5 years of history
    for (let i = 0; i < 5; i++) {
      const year = currentYear - 5 + i;
      // Value decreases as we go back in time
      const value = Math.round(baseValue / Math.pow(growthFactor, 5 - i));
      history[year.toString()] = value.toString();
    }
    
    // Add current year
    history[currentYear.toString()] = property.value || baseValue.toString();
    
    return history;
  };
  
  // When property selection changes, generate time series
  useEffect(() => {
    if (selectedProperty) {
      // Add sample history data for demonstration
      const propertyWithHistory = {
        ...selectedProperty,
        valueHistory: getSampleValueHistory(selectedProperty)
      } as EnhancedProperty;
      
      // Convert to time series
      const series = analysisService.convertToTimeSeries(propertyWithHistory);
      setTimeSeries(series);
      
      // Calculate trend if enough data
      if (series.length >= 2) {
        try {
          const trend = analysisService.analyzeTrend(series);
          setTrendInfo(trend);
        } catch (error) {
          console.error('Error analyzing trend:', error);
          setTrendInfo(null);
        }
      } else {
        setTrendInfo(null);
      }
      
      // Reset forecast when property changes
      setForecastResult(null);
    } else {
      setTimeSeries([]);
      setTrendInfo(null);
      setForecastResult(null);
    }
  }, [selectedProperty, analysisService]);
  
  // Handle property selection
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPropertyId(id ? (isNaN(Number(id)) ? id : Number(id)) : null);
  };
  
  // Handle forecast generation
  const handleGenerateForecast = (years: number, model: ForecastingModel) => {
    if (timeSeries.length < 3) {
      console.warn('Not enough data for forecasting');
      return;
    }
    
    try {
      const forecast = analysisService.forecast(timeSeries, years, model);
      setForecastResult(forecast);
    } catch (error) {
      console.error('Error generating forecast:', error);
      setForecastResult(null);
    }
  };
  
  return (
    <div className={`h-full flex flex-col bg-white overflow-visible relative z-10 ${className}`}>
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold flex items-center">
          <LineChart className="h-5 w-5 mr-2 text-primary" />
          Time Series Analysis
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Analyze historical value trends and forecast future property values
        </p>
      </div>
      
      <div className="p-4 border-b">
        <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Property for Analysis
        </label>
        <select
          id="property-select"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
          value={selectedPropertyId !== null ? String(selectedPropertyId) : ''}
          onChange={handlePropertyChange}
        >
          <option value="">Select a property...</option>
          {properties.map(property => (
            <option key={property.id} value={String(property.id)}>
              {property.address} - {property.parcelId}
            </option>
          ))}
        </select>
      </div>
      
      {properties.length === 0 && (
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties available</h3>
            <p className="text-gray-500 max-w-md">
              No properties found in the system. Add properties to enable time series analysis.
            </p>
          </div>
        </div>
      )}
      
      {properties.length > 0 && !selectedProperty && (
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="text-center">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a property</h3>
            <p className="text-gray-500 max-w-md">
              Choose a property from the dropdown above to view its historical value trends and forecasts.
            </p>
          </div>
        </div>
      )}
      
      {selectedProperty && (
        <Tabs 
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-grow flex flex-col"
        >
          <div className="border-b px-4">
            <TabsList className="mt-2">
              <TabsTrigger 
                value="historical"
                className="flex items-center"
                aria-label="Historical Trends"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Historical Trends</span>
              </TabsTrigger>
              <TabsTrigger 
                value="forecast"
                className="flex items-center"
                aria-label="Value Forecasting"
              >
                <BrainCircuit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Value Forecasting</span>
              </TabsTrigger>
              <TabsTrigger 
                value="comparison"
                className="flex items-center"
                aria-label="Market Comparison"
                disabled={true}
              >
                <BarChart className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Market Comparison</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-grow">
            <TabsContent value="historical" className="m-0 p-4 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TimeSeriesChart 
                    data={timeSeries} 
                    title="Property Value History" 
                    description={`Historical value trends for ${selectedProperty.address}`} 
                  />
                </div>
                <div>
                  <PropertyValueTrend 
                    property={selectedProperty} 
                    timeSeries={timeSeries} 
                    trendInfo={trendInfo} 
                  />
                </div>
                <div className="lg:col-span-3">
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>About Time Series Analysis</AlertTitle>
                    <AlertDescription>
                      Historical analysis shows past property value changes and identifies long-term trends.
                      This information helps identify market patterns and potential investment opportunities.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="forecast" className="m-0 p-4 h-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TimeSeriesChart 
                    data={timeSeries} 
                    forecastData={forecastResult?.predictions || []} 
                    showForecast={true}
                    title="Value Forecast" 
                    description={`Historical and projected values for ${selectedProperty.address}`} 
                  />
                </div>
                <div>
                  <ForecastingPanel 
                    property={selectedProperty}
                    timeSeries={timeSeries}
                    onGenerateForecast={handleGenerateForecast}
                    forecastResult={forecastResult || undefined}
                  />
                </div>
                <div className="lg:col-span-3">
                  <Alert className="mt-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Forecast Disclaimer</AlertTitle>
                    <AlertDescription>
                      Forecasts are based on historical trends and statistical models. Actual future values
                      may vary significantly due to market conditions, economic factors, property improvements,
                      and other variables not captured in the model.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="m-0 p-4 h-full">
              <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center p-6">
                  <BarChart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Market Comparison</h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    Compare property performance against similar properties and market benchmarks.
                    This feature is coming soon.
                  </p>
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}
    </div>
  );
}