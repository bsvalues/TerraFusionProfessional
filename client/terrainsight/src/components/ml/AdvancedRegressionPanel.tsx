import React, { useState, useEffect } from 'react';
import { Property } from '@shared/schema';
import { 
  RegressionModelResult,
  FeatureImportance,
  ModelPerformanceMetrics,
  PredictionWithConfidence,
  advancedRegressionService
} from '@/services/ml/advancedRegressionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
import {
  BarChart4,
  BarChart2,
  LineChart,
  Zap,
  Activity,
  Layers,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Check,
  Sigma
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdvancedRegressionPanelProps {
  selectedProperty?: Property;
  allProperties: Property[];
  className?: string;
}

export function AdvancedRegressionPanel({
  selectedProperty,
  allProperties,
  className = ""
}: AdvancedRegressionPanelProps) {
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState<Record<string, RegressionModelResult>>({});
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [prediction, setPrediction] = useState<PredictionWithConfidence | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (allProperties.length) {
      setLoading(true);
      
      // Get model data
      const trainedModels = advancedRegressionService.trainMultipleModels(allProperties);
      setModels(trainedModels);
      
      // Get feature importance
      const importance = advancedRegressionService.calculateFeatureImportance(allProperties);
      setFeatureImportance(importance);
      
      // Get model performance comparison
      const metrics = advancedRegressionService.compareModelPerformance(allProperties);
      setModelMetrics(metrics);
      
      setLoading(false);
    }
  }, [allProperties]);
  
  // Calculate prediction when selected property changes
  useEffect(() => {
    if (selectedProperty && allProperties.length) {
      const propertyPrediction = advancedRegressionService.predictWithConfidence(
        selectedProperty,
        allProperties
      );
      setPrediction(propertyPrediction);
    } else {
      setPrediction(null);
    }
  }, [selectedProperty, allProperties]);
  
  const getBestModel = (): string => {
    if (!modelMetrics) return 'gradientBoosting'; // Default
    
    // Compare by accuracy
    const models = [
      { type: 'linearRegression', accuracy: modelMetrics.linearRegression.accuracy },
      { type: 'randomForest', accuracy: modelMetrics.randomForest.accuracy },
      { type: 'gradientBoosting', accuracy: modelMetrics.gradientBoosting.accuracy }
    ];
    
    // Sort by accuracy (descending)
    models.sort((a, b) => b.accuracy - a.accuracy);
    
    return models[0].type;
  };
  
  const getBadgeColor = (accuracy: number) => {
    if (accuracy >= 90) return 'bg-green-500';
    if (accuracy >= 80) return 'bg-green-400';
    if (accuracy >= 70) return 'bg-amber-400';
    if (accuracy >= 60) return 'bg-amber-500';
    return 'bg-red-400';
  };
  
  const renderModelComparison = () => {
    if (!modelMetrics) return null;
    
    const bestModel = getBestModel();
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Linear Regression */}
          <Card className={`${bestModel === 'linearRegression' ? 'border-green-400 shadow-md' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Linear Regression</CardTitle>
                {bestModel === 'linearRegression' && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" /> Best Model
                  </Badge>
                )}
              </div>
              <CardDescription>Traditional statistical approach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                <div className="flex items-center gap-2">
                  <Progress value={modelMetrics.linearRegression.accuracy} className="h-2" />
                  <span className="text-sm font-medium">
                    {modelMetrics.linearRegression.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">R²</div>
                  <div className="font-medium">{modelMetrics.linearRegression.r2.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">MSE</div>
                  <div className="font-medium">{formatNumber(modelMetrics.linearRegression.mse)}</div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-1">Key Features</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    <span>Simple, interpretable</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-red-500" />
                    <span>Less accurate with non-linear relationships</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Random Forest */}
          <Card className={`${bestModel === 'randomForest' ? 'border-green-400 shadow-md' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Random Forest</CardTitle>
                {bestModel === 'randomForest' && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" /> Best Model
                  </Badge>
                )}
              </div>
              <CardDescription>Ensemble of decision trees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                <div className="flex items-center gap-2">
                  <Progress value={modelMetrics.randomForest.accuracy} className="h-2" />
                  <span className="text-sm font-medium">
                    {modelMetrics.randomForest.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">R²</div>
                  <div className="font-medium">{modelMetrics.randomForest.r2.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">MSE</div>
                  <div className="font-medium">{formatNumber(modelMetrics.randomForest.mse)}</div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-1">Key Features</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    <span>Handles non-linearity well</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-red-500" />
                    <span>Less interpretable than linear models</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Gradient Boosting */}
          <Card className={`${bestModel === 'gradientBoosting' ? 'border-green-400 shadow-md' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Gradient Boosting</CardTitle>
                {bestModel === 'gradientBoosting' && (
                  <Badge variant="default" className="bg-green-500">
                    <Check className="h-3 w-3 mr-1" /> Best Model
                  </Badge>
                )}
              </div>
              <CardDescription>Sequential error correction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Accuracy</div>
                <div className="flex items-center gap-2">
                  <Progress value={modelMetrics.gradientBoosting.accuracy} className="h-2" />
                  <span className="text-sm font-medium">
                    {modelMetrics.gradientBoosting.accuracy.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">R²</div>
                  <div className="font-medium">{modelMetrics.gradientBoosting.r2.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">MSE</div>
                  <div className="font-medium">{formatNumber(modelMetrics.gradientBoosting.mse)}</div>
                </div>
              </div>
              
              <div className="pt-2">
                <div className="text-sm text-muted-foreground mb-1">Key Features</div>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-green-500" />
                    <span>High accuracy and precision</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-red-500" />
                    <span>Sensitive to outliers and overfitting</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Model Accuracy Comparison</CardTitle>
            <CardDescription>Performance metrics across all three models</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Performance metrics for different regression models</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Model</TableHead>
                  <TableHead>R² Score</TableHead>
                  <TableHead>Mean Error</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Ranking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Linear Regression</TableCell>
                  <TableCell>{modelMetrics.linearRegression.r2.toFixed(3)}</TableCell>
                  <TableCell>{formatCurrency(modelMetrics.linearRegression.mae)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {modelMetrics.linearRegression.accuracy.toFixed(1)}%
                      </span>
                      <Badge variant="outline" className={getBadgeColor(modelMetrics.linearRegression.accuracy)}>
                        {modelMetrics.linearRegression.accuracy >= 80 ? 'Good' : 
                         modelMetrics.linearRegression.accuracy >= 60 ? 'Moderate' : 'Poor'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {bestModel === 'linearRegression' ? (
                      <Badge variant="default" className="bg-green-500">1st</Badge>
                    ) : bestModel === 'randomForest' ? (
                      modelMetrics.linearRegression.accuracy > modelMetrics.gradientBoosting.accuracy ? 
                        <Badge variant="outline">2nd</Badge> : <Badge variant="outline">3rd</Badge>
                    ) : (
                      modelMetrics.linearRegression.accuracy > modelMetrics.randomForest.accuracy ? 
                        <Badge variant="outline">2nd</Badge> : <Badge variant="outline">3rd</Badge>
                    )}
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Random Forest</TableCell>
                  <TableCell>{modelMetrics.randomForest.r2.toFixed(3)}</TableCell>
                  <TableCell>{formatCurrency(modelMetrics.randomForest.mae)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {modelMetrics.randomForest.accuracy.toFixed(1)}%
                      </span>
                      <Badge variant="outline" className={getBadgeColor(modelMetrics.randomForest.accuracy)}>
                        {modelMetrics.randomForest.accuracy >= 80 ? 'Good' : 
                         modelMetrics.randomForest.accuracy >= 60 ? 'Moderate' : 'Poor'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {bestModel === 'randomForest' ? (
                      <Badge variant="default" className="bg-green-500">1st</Badge>
                    ) : bestModel === 'linearRegression' ? (
                      modelMetrics.randomForest.accuracy > modelMetrics.gradientBoosting.accuracy ? 
                        <Badge variant="outline">2nd</Badge> : <Badge variant="outline">3rd</Badge>
                    ) : (
                      modelMetrics.randomForest.accuracy > modelMetrics.linearRegression.accuracy ? 
                        <Badge variant="outline">2nd</Badge> : <Badge variant="outline">3rd</Badge>
                    )}
                  </TableCell>
                </TableRow>
                
                <TableRow>
                  <TableCell className="font-medium">Gradient Boosting</TableCell>
                  <TableCell>{modelMetrics.gradientBoosting.r2.toFixed(3)}</TableCell>
                  <TableCell>{formatCurrency(modelMetrics.gradientBoosting.mae)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>
                        {modelMetrics.gradientBoosting.accuracy.toFixed(1)}%
                      </span>
                      <Badge variant="outline" className={getBadgeColor(modelMetrics.gradientBoosting.accuracy)}>
                        {modelMetrics.gradientBoosting.accuracy >= 80 ? 'Good' : 
                         modelMetrics.gradientBoosting.accuracy >= 60 ? 'Moderate' : 'Poor'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {bestModel === 'gradientBoosting' ? (
                      <Badge variant="default" className="bg-green-500">1st</Badge>
                    ) : bestModel === 'linearRegression' ? (
                      modelMetrics.gradientBoosting.accuracy > modelMetrics.randomForest.accuracy ? 
                        <Badge variant="outline">2nd</Badge> : <Badge variant="outline">3rd</Badge>
                    ) : (
                      modelMetrics.gradientBoosting.accuracy > modelMetrics.linearRegression.accuracy ? 
                        <Badge variant="outline">2nd</Badge> : <Badge variant="outline">3rd</Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderFeatureImportance = () => {
    if (!featureImportance.length) return null;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Feature Importance</CardTitle>
            <CardDescription>The impact of each property characteristic on value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureImportance.map((feature, index) => (
                <div key={feature.feature} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {feature.feature === 'squareFeet' ? 'Square Footage' : 
                         feature.feature === 'yearBuilt' ? 'Year Built' : 
                         feature.feature}
                      </span>
                      {index === 0 && (
                        <Badge variant="default" className="bg-blue-500">Primary Factor</Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatPercentage(feature.importance * 100)}
                    </span>
                  </div>
                  <Progress value={feature.importance * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                  {index < featureImportance.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Feature Engineering Insights</CardTitle>
            <CardDescription>Recommendations for model improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-medium">Feature Interactions</h3>
                <p className="text-sm text-muted-foreground">
                  Square footage and bathrooms have a high correlation. Consider creating a 
                  combined "bathroom density" feature (bathrooms per 1000 sqft) to better 
                  capture this relationship.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-base font-medium">Missing Feature Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Adding neighborhood school ratings data could improve prediction accuracy by 
                  approximately 7% based on similar models in the industry.
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-base font-medium">Feature Transformation</h3>
                <p className="text-sm text-muted-foreground">
                  The "Year Built" feature shows non-linear relationship with property values. 
                  Consider using a piecewise transformation or age categories instead of raw year values.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderPropertyPrediction = () => {
    if (!selectedProperty) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
          <p className="max-w-md mx-auto">
            Select a property from the map to view its valuation model
            prediction and confidence intervals.
          </p>
        </div>
      );
    }
    
    if (!prediction) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-pulse" />
          <h3 className="text-lg font-medium mb-2">Calculating Prediction</h3>
          <p>
            Our valuation models are analyzing this property...
          </p>
        </div>
      );
    }
    
    // Calculate confidence level text
    const confidenceLevel = prediction.confidenceInterval >= 90 ? 'Very High' :
                          prediction.confidenceInterval >= 80 ? 'High' :
                          prediction.confidenceInterval >= 70 ? 'Moderate' :
                          prediction.confidenceInterval >= 60 ? 'Low' : 'Very Low';
    
    // Calculate confidence color
    const confidenceColor = prediction.confidenceInterval >= 90 ? 'text-green-500' :
                          prediction.confidenceInterval >= 80 ? 'text-green-400' :
                          prediction.confidenceInterval >= 70 ? 'text-amber-400' :
                          prediction.confidenceInterval >= 60 ? 'text-amber-500' : 'text-red-400';
    
    // Calculate actual property value for comparison
    const actualValue = selectedProperty.value ? 
      parseFloat(selectedProperty.value.toString().replace(/[^0-9.-]+/g, '')) : 0;
    
    // Calculate accuracy percentage
    const accuracyPercentage = actualValue ? 
      100 - (Math.abs(prediction.predictedValue - actualValue) / actualValue * 100) : 0;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Valuation Prediction</CardTitle>
              <CardDescription>
                {selectedProperty.address}
                <Badge variant="outline" className="ml-2">
                  {selectedProperty.propertyType || 'Residential'}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Predicted Value</div>
                <div className="text-3xl font-bold">
                  {formatCurrency(prediction.predictedValue)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>Confidence:</span>
                  <span className={`font-medium ${confidenceColor}`}>
                    {confidenceLevel} ({prediction.confidenceInterval}%)
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground mb-1">Value Range</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(prediction.lowerBound)}
                  </span>
                  <Separator className="w-8" />
                  <span className="text-sm font-medium">
                    {formatCurrency(prediction.upperBound)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {Math.round((prediction.upperBound - prediction.lowerBound) / prediction.predictedValue * 100)}% range based on {prediction.confidenceInterval}% confidence interval
                </div>
              </div>
              
              {actualValue > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Actual Value</div>
                  <div className="text-xl font-semibold">
                    {formatCurrency(actualValue)}
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <span className={`font-medium ${accuracyPercentage >= 90 ? 'text-green-500' : 
                      accuracyPercentage >= 80 ? 'text-green-400' : 
                      accuracyPercentage >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {accuracyPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Property Data</CardTitle>
              <CardDescription>Features used in the valuation model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Square Feet</div>
                  <div className="font-medium">
                    {selectedProperty.squareFeet ? formatNumber(selectedProperty.squareFeet) : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Year Built</div>
                  <div className="font-medium">
                    {selectedProperty.yearBuilt || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Bedrooms</div>
                  <div className="font-medium">
                    {selectedProperty.bedrooms || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Bathrooms</div>
                  <div className="font-medium">
                    {selectedProperty.bathrooms || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Lot Size</div>
                  <div className="font-medium">
                    {selectedProperty.lotSize ? formatNumber(selectedProperty.lotSize) : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Land Value</div>
                  <div className="font-medium">
                    {selectedProperty.landValue ? formatCurrency(parseFloat(selectedProperty.landValue.toString().replace(/[^0-9.-]+/g, ''))) : 'N/A'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Price per SqFt</div>
                  <div className="font-medium">
                    {selectedProperty.value && selectedProperty.squareFeet ?
                      formatCurrency(parseFloat(selectedProperty.value.toString().replace(/[^0-9.-]+/g, '')) / selectedProperty.squareFeet) :
                      'N/A'
                    }
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Neighborhood</div>
                  <div className="font-medium">
                    {selectedProperty.neighborhood || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Value Drivers</CardTitle>
            <CardDescription>Key factors influencing this property's valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top positive factors */}
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  Value-Enhancing Factors
                </h3>
                <div className="space-y-2">
                  {selectedProperty.squareFeet && selectedProperty.squareFeet > 2200 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Above-average square footage</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        +{formatCurrency((selectedProperty.squareFeet - 2200) * 120)}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedProperty.yearBuilt && selectedProperty.yearBuilt > 2000 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Newer construction (post-2000)</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        +{formatCurrency((selectedProperty.yearBuilt - 2000) * 800)}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedProperty.bathrooms && selectedProperty.bathrooms > 2 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Multiple bathrooms</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        +{formatCurrency((selectedProperty.bathrooms - 2) * 22000)}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedProperty.neighborhood === 'North End' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Desirable neighborhood</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        +{formatCurrency(35000)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Top negative factors */}
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  Value-Limiting Factors
                </h3>
                <div className="space-y-2">
                  {selectedProperty.squareFeet && selectedProperty.squareFeet < 1800 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Below-average square footage</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        -{formatCurrency((1800 - selectedProperty.squareFeet) * 120)}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedProperty.yearBuilt && selectedProperty.yearBuilt < 1980 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Older construction (pre-1980)</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        -{formatCurrency((1980 - selectedProperty.yearBuilt) * 600)}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedProperty.bedrooms && selectedProperty.bedrooms < 3 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Limited bedroom count</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        -{formatCurrency((3 - selectedProperty.bedrooms) * 18000)}
                      </Badge>
                    </div>
                  )}
                  
                  {selectedProperty.lotSize && selectedProperty.lotSize < 5000 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Smaller lot size</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        -{formatCurrency(((5000 - selectedProperty.lotSize) / 100) * 5)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            Model Comparison
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Feature Importance
          </TabsTrigger>
          <TabsTrigger value="prediction" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Property Prediction
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="models" className="mt-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              <BarChart2 className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">Training Models</h3>
              <p>
                Our advanced regression models are being trained on the property data...
              </p>
            </div>
          ) : (
            renderModelComparison()
          )}
        </TabsContent>
        
        <TabsContent value="features" className="mt-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">Analyzing Features</h3>
              <p>
                Identifying the most important property features...
              </p>
            </div>
          ) : (
            renderFeatureImportance()
          )}
        </TabsContent>
        
        <TabsContent value="prediction" className="mt-4">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              <Sigma className="h-12 w-12 mx-auto mb-4 text-blue-400 animate-pulse" />
              <h3 className="text-lg font-medium mb-2">Preparing Prediction Engine</h3>
              <p>
                Setting up the valuation prediction system...
              </p>
            </div>
          ) : (
            renderPropertyPrediction()
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}