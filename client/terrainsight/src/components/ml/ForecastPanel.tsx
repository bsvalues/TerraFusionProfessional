import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CalendarDays, ChevronRight, ExternalLink, Home, LineChart, TrendingUp, Zap } from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  Brush
} from 'recharts';
import { Badge } from '@/components/ui/badge';

interface PropertyWithHistory extends Property {
  valueHistory?: Record<string, number>;
}

interface ForecastPanelProps {
  selectedProperty?: Property;
  allProperties: Property[];
  className?: string;
}

interface ForecastResult {
  forecastValues: Array<{year: string, value: number}>;
  confidenceInterval: Array<{year: string, lower: number, upper: number}>;
  growthRate: number;
  seasonalityPattern: 'increasing' | 'decreasing' | 'stable' | 'cyclical';
  methodology: string;
  neighborhoodTrend?: Array<{year: string, value: number}>;
}

export function ForecastPanel({ selectedProperty, allProperties, className }: ForecastPanelProps) {
  const [forecastPeriod, setForecastPeriod] = useState(5);
  const [forecastModel, setForecastModel] = useState('arima');
  const [confidenceLevel, setConfidenceLevel] = useState(90);
  const [isGenerating, setIsGenerating] = useState(false);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  
  const addMockHistoryToProperty = (property: Property): PropertyWithHistory => {
    if (!property) return property as PropertyWithHistory;
    
    const baseValue = property.value ? parseFloat(property.value.replace(/[^0-9.]/g, '')) : 300000;
    const currentYear = new Date().getFullYear();
    
    // Create mock history for the past 10 years
    const valueHistory: Record<string, number> = {};
    for (let i = 10; i >= 0; i--) {
      // Add some random variation to create a realistic history with general upward trend
      const yearValue = baseValue * (0.85 + (0.15 * (10-i)/10) + (Math.random() * 0.05));
      valueHistory[(currentYear - i).toString()] = Math.round(yearValue);
    }
    
    return {
      ...property,
      valueHistory
    };
  };
  
  const generateForecast = () => {
    setIsGenerating(true);
    
    // Simulate forecast generation delay
    setTimeout(() => {
      if (!selectedProperty) return;
      
      const propertyWithHistory = addMockHistoryToProperty(selectedProperty);
      const valueHistory = propertyWithHistory.valueHistory;
      const currentYear = new Date().getFullYear();
      
      if (!valueHistory) {
        setIsGenerating(false);
        return;
      }
      
      // Create forecast data
      const forecastValues: Array<{year: string, value: number}> = [];
      const confidenceInterval: Array<{year: string, lower: number, upper: number}> = [];
      
      // Get the latest historical value
      const latestValue = valueHistory[currentYear.toString()] || 
        valueHistory[Object.keys(valueHistory).sort().pop() || ""] || 
        300000;
      
      // Generate future forecast
      let growthFactor = 1.03; // 3% annual growth
      if (forecastModel === 'prophet') growthFactor = 1.035;
      if (forecastModel === 'lstm') growthFactor = 1.042;
      
      // Add historical values to chart data
      const historyData: Array<{year: string, value: number}> = [];
      Object.keys(valueHistory).sort().forEach(year => {
        historyData.push({
          year,
          value: valueHistory[year]
        });
      });
      
      // Add forecast values
      for (let i = 1; i <= forecastPeriod; i++) {
        const year = (currentYear + i).toString();
        // Add some random variation to the growth
        const randomVariation = 1 + ((Math.random() - 0.5) * 0.01);
        const forecastValue = Math.round(latestValue * Math.pow(growthFactor * randomVariation, i));
        
        forecastValues.push({
          year,
          value: forecastValue
        });
        
        // Calculate confidence interval
        const confidenceWidth = (confidenceLevel / 100) * 0.3 * i; // Wider interval for further forecasts
        confidenceInterval.push({
          year,
          lower: Math.round(forecastValue * (1 - confidenceWidth)),
          upper: Math.round(forecastValue * (1 + confidenceWidth))
        });
      }
      
      // Generate mock neighborhood trend
      const neighborhoodTrend = [...historyData];
      for (let i = 1; i <= forecastPeriod; i++) {
        const year = (currentYear + i).toString();
        // Neighborhood might grow slightly slower or faster
        const neighborhoodFactor = growthFactor * (1 + ((Math.random() - 0.5) * 0.005));
        const lastValue = neighborhoodTrend[neighborhoodTrend.length - 1].value;
        neighborhoodTrend.push({
          year,
          value: Math.round(lastValue * neighborhoodFactor)
        });
      }
      
      setForecastResult({
        forecastValues: [...historyData, ...forecastValues],
        confidenceInterval: [
          ...historyData.map(h => ({ year: h.year, lower: h.value, upper: h.value })),
          ...confidenceInterval
        ],
        growthRate: Math.round((growthFactor - 1) * 1000) / 10, // Convert to percentage with 1 decimal place
        seasonalityPattern: 'increasing',
        methodology: forecastModel.toUpperCase(),
        neighborhoodTrend
      });
      
      setIsGenerating(false);
    }, 1500);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const getChartData = () => {
    if (!forecastResult) return [];
    
    return forecastResult.forecastValues.map((item, index) => {
      const confidence = forecastResult.confidenceInterval[index];
      const neighborhood = forecastResult.neighborhoodTrend?.[index];
      
      return {
        year: item.year,
        value: item.value,
        lower: confidence?.lower,
        upper: confidence?.upper,
        neighborhood: neighborhood?.value
      };
    });
  };
  
  const getCurrentYear = () => new Date().getFullYear().toString();
  
  const getDataPointStatus = (year: string) => {
    const currentYear = getCurrentYear();
    if (parseInt(year) < parseInt(currentYear)) return "historical";
    if (year === currentYear) return "current";
    return "forecast";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <LineChart className="mr-2 h-5 w-5 text-primary" />
              Time Series Forecast
            </CardTitle>
            <CardDescription>
              Generate property value predictions for future years using advanced time series algorithms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedProperty ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-md border p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {selectedProperty.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProperty.parcelId} • {selectedProperty.propertyType || 'Residential'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">Current Value</span>
                    <span className="text-lg font-bold text-primary">
                      {selectedProperty.value || 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="forecast-model">Forecast Model</Label>
                    <Select value={forecastModel} onValueChange={setForecastModel}>
                      <SelectTrigger id="forecast-model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="arima">ARIMA</SelectItem>
                        <SelectItem value="prophet">Prophet</SelectItem>
                        <SelectItem value="lstm">LSTM Neural Network</SelectItem>
                        <SelectItem value="exponential">Exponential Smoothing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="forecast-period">Forecast Period: {forecastPeriod} years</Label>
                    <Slider
                      id="forecast-period"
                      min={1}
                      max={10}
                      step={1}
                      value={[forecastPeriod]}
                      onValueChange={(values) => setForecastPeriod(values[0])}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confidence-level">Confidence Level: {confidenceLevel}%</Label>
                    <Slider
                      id="confidence-level"
                      min={70}
                      max={95}
                      step={5}
                      value={[confidenceLevel]}
                      onValueChange={(values) => setConfidenceLevel(values[0])}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={generateForecast} 
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>Generating Forecast...</>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Time Series Forecast
                    </>
                  )}
                </Button>
                
                {forecastResult && (
                  <div className="pt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="default" className="rounded-md px-2.5 py-1">
                        <LineChart className="h-3.5 w-3.5 mr-1" />
                        {forecastResult.methodology}
                      </Badge>
                      <Badge variant="secondary" className="rounded-md px-2.5 py-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1" />
                        {forecastPeriod} Year Forecast
                      </Badge>
                      <Badge variant="secondary" className="rounded-md px-2.5 py-1">
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        {forecastResult.growthRate}% Annual Growth
                      </Badge>
                      <Badge variant="outline" className="rounded-md px-2.5 py-1 bg-green-100 text-green-800 hover:bg-green-200">
                        {confidenceLevel}% Confidence
                      </Badge>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h3 className="text-lg font-medium mb-3">Property Value Forecast</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={getChartData()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis 
                              tickFormatter={(value) => 
                                `$${Math.round(value/1000)}k`
                              } 
                            />
                            <Tooltip 
                              formatter={(value) => [formatCurrency(value as number), 'Value']}
                              labelFormatter={(year) => `Year: ${year} (${getDataPointStatus(year as string)})`}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="upper"
                              fill="#8884d820" 
                              stroke="none"
                              name="Upper Bound"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="lower"
                              fill="#8884d820" 
                              stroke="none"
                              name="Lower Bound"
                              fillOpacity={0.3}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#8884d8" 
                              strokeWidth={2}
                              name="Property Value" 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="neighborhood" 
                              stroke="#82ca9d" 
                              strokeWidth={1.5} 
                              strokeDasharray="5 5"
                              name="Neighborhood Trend"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Card className="border-blue-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Forecast Highlights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Current Value</span>
                            <span className="font-medium">{formatCurrency(forecastResult.forecastValues.find(d => d.year === getCurrentYear())?.value || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">5-Year Forecast</span>
                            <span className="font-medium">{formatCurrency(forecastResult.forecastValues.find(d => d.year === (parseInt(getCurrentYear()) + 5).toString())?.value || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">{forecastPeriod}-Year Forecast</span>
                            <span className="font-medium">{formatCurrency(forecastResult.forecastValues[forecastResult.forecastValues.length - 1]?.value || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trend Pattern</span>
                            <span className="font-medium capitalize">{forecastResult.seasonalityPattern}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-green-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Value Growth Projection</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="h-24">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={forecastResult.forecastValues.filter(d => parseInt(d.year) >= parseInt(getCurrentYear()))}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                              >
                                <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  stroke="#4ade80" 
                                  fill="#4ade8030"
                                />
                                <Tooltip 
                                  formatter={(value) => [formatCurrency(value as number), 'Value']}
                                  labelFormatter={(year) => `Year: ${year}`}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total Growth</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                              +{Math.round(forecastResult.growthRate * forecastPeriod)}% in {forecastPeriod} years
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Please select a property to generate a time series forecast.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Forecast Insights
            </CardTitle>
            <CardDescription>
              Understanding factors that influence future property values
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Influential Factors</h4>
              <ul className="space-y-2.5">
                <li className="flex items-start">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 mt-0.5 mr-2">
                    1
                  </div>
                  <div>
                    <span className="text-sm font-medium">Economic Growth</span>
                    <p className="text-xs text-gray-500">Regional economic indicators show 3.2% annual growth projection</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mt-0.5 mr-2">
                    2
                  </div>
                  <div>
                    <span className="text-sm font-medium">Population Growth</span>
                    <p className="text-xs text-gray-500">Benton County population expected to grow by 5.4% over next 5 years</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 mt-0.5 mr-2">
                    3
                  </div>
                  <div>
                    <span className="text-sm font-medium">Infrastructure Development</span>
                    <p className="text-xs text-gray-500">Planned transportation and utility improvements in the area</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 mt-0.5 mr-2">
                    4
                  </div>
                  <div>
                    <span className="text-sm font-medium">Housing Supply</span>
                    <p className="text-xs text-gray-500">Limited new construction expected to maintain demand</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Market Report
              </Button>
            </div>
            
            <div className="pt-3">
              <Card className="bg-blue-50">
                <CardHeader className="p-3">
                  <CardTitle className="text-sm text-blue-700">Growth Hotspots</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex justify-between">
                      <span>West Richland</span>
                      <Badge variant="default" className="bg-blue-200 hover:bg-blue-300 text-blue-800">+6.4%</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span>South Kennewick</span>
                      <Badge variant="default" className="bg-blue-200 hover:bg-blue-300 text-blue-800">+5.8%</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span>North Richland</span>
                      <Badge variant="default" className="bg-blue-200 hover:bg-blue-300 text-blue-800">+5.2%</Badge>
                    </li>
                    <li className="flex justify-between text-primary font-medium">
                      <span>View all zones</span>
                      <ChevronRight className="h-4 w-4" />
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}