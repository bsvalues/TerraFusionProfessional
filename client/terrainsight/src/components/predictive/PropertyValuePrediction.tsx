import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  BarChart4, 
  Brain, 
  BarChart,
  Home,
  Calendar,
  Square,
  Hash,
  DollarSign,
  Info
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PropertyValueModel, PredictionResult, FeatureImportance } from '../../services/predictive/propertyValueModel';
import { Property } from '@shared/schema';
import { Tooltip } from '@/components/ui/custom-tooltip';

interface PropertyValuePredictionProps {
  selectedProperty?: Property;
  onPredictionComplete?: (prediction: PredictionResult) => void;
  className?: string;
}

export function PropertyValuePrediction({ 
  selectedProperty, 
  onPredictionComplete,
  className 
}: PropertyValuePredictionProps) {
  // State for model and training
  const [model] = useState(() => new PropertyValueModel());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize'
  ]);
  const [isTraining, setIsTraining] = useState(false);
  const [isTrained, setIsTrained] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [modelStats, setModelStats] = useState<{r2: number; rmse: number} | null>(null);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  
  // Feature options
  const featureOptions = [
    { id: 'squareFeet', label: 'Square Feet', icon: <Square className="h-4 w-4 mr-2" /> },
    { id: 'bedrooms', label: 'Bedrooms', icon: <Home className="h-4 w-4 mr-2" /> },
    { id: 'bathrooms', label: 'Bathrooms', icon: <Home className="h-4 w-4 mr-2" /> },
    { id: 'yearBuilt', label: 'Year Built', icon: <Calendar className="h-4 w-4 mr-2" /> },
    { id: 'lotSize', label: 'Lot Size', icon: <Square className="h-4 w-4 mr-2" /> }
  ];
  
  // Fetch properties data for training
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Update prediction when property changes
  useEffect(() => {
    if (isTrained && selectedProperty) {
      handlePredict();
    }
  }, [selectedProperty, isTrained]);
  
  // Train model with selected features
  const handleTrain = async () => {
    if (properties.length === 0 || selectedFeatures.length === 0) {
      setTrainingError('No properties or features selected for training');
      return;
    }
    
    setIsTraining(true);
    setTrainingError(null);
    
    try {
      const result = await model.train(selectedFeatures, properties);
      
      if (result.trained) {
        setIsTrained(true);
        setModelStats(result.metrics || null);
        setFeatureImportance(model.getFeatureImportance());
        
        // If a property is selected, predict its value
        if (selectedProperty) {
          handlePredict();
        }
      } else {
        setTrainingError(result.error || 'Training failed');
        setIsTrained(false);
      }
    } catch (err) {
      setTrainingError(err instanceof Error ? err.message : 'Unknown error during training');
      setIsTrained(false);
    } finally {
      setIsTraining(false);
    }
  };
  
  // Predict value for selected property
  const handlePredict = async () => {
    if (!isTrained || !selectedProperty) {
      return;
    }
    
    try {
      const result = await model.predict(selectedProperty);
      setPrediction(result);
      
      if (onPredictionComplete) {
        onPredictionComplete(result);
      }
    } catch (err) {
      console.error('Prediction error:', err);
    }
  };
  
  // Reset model
  const handleReset = () => {
    model.reset();
    setIsTrained(false);
    setPrediction(null);
    setModelStats(null);
    setTrainingError(null);
    setFeatureImportance([]);
  };
  
  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(f => f !== featureId);
      } else {
        return [...prev, featureId];
      }
    });
  };
  
  // Calculate confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Get R² color
  const getR2Color = (r2: number) => {
    if (r2 >= 0.7) return 'text-green-600';
    if (r2 >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-primary" />
          Property Value Prediction
        </CardTitle>
        <CardDescription>
          Train a machine learning model to predict property values based on selected features
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Feature Selection */}
        <div className="mb-6">
          <Label className="text-base font-medium mb-2 block">Model Features</Label>
          <div className="space-y-2">
            {featureOptions.map(feature => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`feature-${feature.id}`}
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={() => toggleFeature(feature.id)}
                  disabled={isTraining}
                />
                <Label 
                  htmlFor={`feature-${feature.id}`}
                  className="flex items-center cursor-pointer"
                >
                  {feature.icon}
                  {feature.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Training Status */}
        {isTrained && (
          <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-md">
            <div className="flex items-center mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium">Model Trained Successfully</span>
            </div>
            
            {modelStats && (
              <div className="flex flex-col gap-1 mt-1 text-sm">
                <div className="flex items-center">
                  <span className="mr-1">Accuracy (R²):</span>
                  <span className={getR2Color(modelStats.r2)}>
                    {(modelStats.r2 * 100).toFixed(1)}%
                  </span>
                  <Tooltip 
                    content="R² indicates how well the model fits the data. Higher values are better."
                  >
                    <Info className="h-4 w-4 ml-1 text-gray-400" />
                  </Tooltip>
                </div>
                <div className="flex items-center">
                  <span className="mr-1">Error (RMSE):</span>
                  <span>{(modelStats.rmse).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                  <Tooltip 
                    content="Root Mean Square Error shows the average prediction error amount."
                  >
                    <Info className="h-4 w-4 ml-1 text-gray-400" />
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        )}
        
        {isTraining && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-center mb-2">
              <BarChart4 className="h-5 w-5 text-blue-600 mr-2 animate-pulse" />
              <span className="font-medium">Training Model...</span>
            </div>
            <Progress value={45} className="h-2" />
            <p className="text-sm text-gray-600 mt-2">
              Training with {properties.length} properties and {selectedFeatures.length} features
            </p>
          </div>
        )}
        
        {trainingError && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-md">
            <div className="flex items-center mb-1">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="font-medium">Training Error</span>
            </div>
            <p className="text-sm text-red-600">{trainingError}</p>
          </div>
        )}
        
        {/* Feature Importance */}
        {featureImportance.length > 0 && (
          <div className="mb-6">
            <Label className="text-base font-medium mb-2 block">Feature Importance</Label>
            <div className="space-y-2">
              {featureImportance.map(feature => (
                <div key={feature.feature} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{featureOptions.find(f => f.id === feature.feature)?.label || feature.feature}</span>
                    <span>{(feature.importance * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={feature.importance * 100} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Prediction Results */}
        {prediction && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-medium text-lg flex items-center mb-3">
              <DollarSign className="h-5 w-5 mr-1 text-green-600" />
              Predicted Value
            </h3>
            
            <div className="text-2xl font-bold mb-4 text-center">
              {prediction.formattedValue}
            </div>
            
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Confidence:</span>
              <span className={getConfidenceColor(prediction.confidence)}>
                {(prediction.confidence * 100).toFixed(0)}%
              </span>
            </div>
            
            <Progress 
              value={prediction.confidence * 100} 
              className={`h-2 ${prediction.confidence >= 0.8 ? 'bg-green-100' : prediction.confidence >= 0.6 ? 'bg-yellow-100' : 'bg-red-100'}`}
            />
            
            {prediction.warning && (
              <div className="flex items-center mt-3 text-sm text-yellow-700">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>{prediction.warning}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={isTraining || !isTrained}
        >
          Reset Model
        </Button>
        
        <Button 
          onClick={handleTrain} 
          disabled={isTraining || selectedFeatures.length === 0}
        >
          {isTrained ? 'Retrain Model' : 'Train Model'}
        </Button>
      </CardFooter>
    </Card>
  );
}