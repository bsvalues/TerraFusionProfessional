import React, { useState } from 'react';
import { Property } from '@shared/schema';
import {
  TimeSeriesDataPoint,
  ForecastResult,
  ForecastingModel
} from '../../services/timeseries/timeSeriesAnalysisService';
import { formatCurrency } from '../../lib/utils';
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
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  TrendingUp, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Calendar 
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface ForecastingPanelProps {
  property: Property;
  timeSeries: TimeSeriesDataPoint[];
  onGenerateForecast: (years: number, model: ForecastingModel) => void;
  forecastResult?: ForecastResult;
  className?: string;
}

export function ForecastingPanel({
  property,
  timeSeries,
  onGenerateForecast,
  forecastResult,
  className
}: ForecastingPanelProps) {
  // State for forecasting parameters
  const [forecastYears, setForecastYears] = useState<number>(3);
  const [forecastModel, setForecastModel] = useState<ForecastingModel>('linear');
  const [loading, setLoading] = useState(false);
  
  // Check if we have enough data for forecasting
  const hasEnoughData = timeSeries.length >= 3;
  
  // Models with descriptions
  const forecastModels = [
    { 
      id: 'linear', 
      name: 'Linear Regression', 
      description: 'Projects future values assuming a steady rate of change, best for stable markets.' 
    },
    { 
      id: 'exponential', 
      name: 'Exponential Growth', 
      description: 'Assumes percentage growth compounds over time, suitable for rapidly appreciating markets.' 
    },
    { 
      id: 'average', 
      name: 'Moving Average', 
      description: 'Uses recent trends to project near-term values, works well with fluctuating markets.' 
    }
  ];
  
  // Handle forecast generation
  const handleGenerateForecast = () => {
    setLoading(true);
    
    // Simulate API call latency
    setTimeout(() => {
      onGenerateForecast(forecastYears, forecastModel as ForecastingModel);
      setLoading(false);
    }, 800);
  };
  
  // Get color for confidence level
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Get display name for forecast model
  const getModelDisplayName = (modelId: string) => {
    const model = forecastModels.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
          Value Forecasting
        </CardTitle>
        <CardDescription>
          Project future property values based on historical trends
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!hasEnoughData ? (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Insufficient Data</AlertTitle>
            <AlertDescription>
              Need at least 3 years of historical data to generate reliable forecasts.
              This property has {timeSeries.length} years of data.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Forecast Period Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Forecast Period
              </label>
              <div className="flex items-center">
                <Slider
                  value={[forecastYears]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setForecastYears(value[0])}
                  className="flex-1 mr-4"
                />
                <span className="text-sm font-medium w-16 text-right">
                  {forecastYears} {forecastYears === 1 ? 'year' : 'years'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For long-term projections, consider economic cycles and market conditions
              </p>
            </div>
            
            {/* Forecast Model Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Forecasting Model
              </label>
              <Select
                value={forecastModel}
                onValueChange={(value) => setForecastModel(value as ForecastingModel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {forecastModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {forecastModels.find(m => m.id === forecastModel)?.description}
              </p>
            </div>
          </>
        )}
        
        {/* Forecast Results */}
        {forecastResult && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <LineChart className="h-5 w-5 mr-2 text-primary" />
              Forecast Results
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Confidence Level:</span>
                <span className={`font-medium ${getConfidenceColor(forecastResult.confidence)}`}>
                  {Math.round(forecastResult.confidence * 100)}%
                </span>
              </div>
              <Progress 
                value={forecastResult.confidence * 100} 
                className="h-2" 
              />
              <p className="text-xs text-gray-500 mt-1">
                Based on {getModelDisplayName(forecastResult.model)} model with {timeSeries.length} years of historical data
              </p>
            </div>
            
            {forecastResult.warnings && forecastResult.warnings.length > 0 && (
              <Alert className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Forecast Limitations</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-1 text-sm">
                    {forecastResult.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Projected Values</h4>
              {forecastResult.predictions.map((prediction, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{prediction.date.getFullYear()}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(prediction.value)}
                    </div>
                    {prediction.lowerBound && prediction.upperBound && (
                      <div className="text-xs text-gray-500">
                        Range: {formatCurrency(prediction.lowerBound)} - {formatCurrency(prediction.upperBound)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleGenerateForecast}
          disabled={!hasEnoughData || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <LineChart className="h-4 w-4 mr-2 animate-spin" />
              Generating Forecast...
            </>
          ) : forecastResult ? (
            <>
              <LineChart className="h-4 w-4 mr-2" />
              Update Forecast
            </>
          ) : (
            <>
              <LineChart className="h-4 w-4 mr-2" />
              Generate Forecast
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}