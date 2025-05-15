import React, { useState, useEffect } from 'react';
import { Grid, Layers, Calculator, Table as TableIcon, BarChart2, GitMerge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { RegressionModel, KernelType, TransformType, calculateOLSRegression, calculateGWRRegression, calculateModelQuality, calculateVariableImportance } from '@/services/regressionService';
import { ModelResults } from '@/components/regression/ModelResults';
import { PredictionScatterPlot } from '@/components/regression/PredictionScatterPlot';
import { ResidualHistogram } from '@/components/regression/ResidualHistogram';
import { CoefficientImpactChart } from '@/components/regression/CoefficientImpactChart';
import { Property } from '@/shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

/**
 * Interface for RegressionPanel properties
 */
interface RegressionPanelProps {
  properties: Property[];
}

/**
 * The Regression Panel provides tools for property valuation through regression modeling.
 * It offers ordinary least squares, weighted, and geographically weighted regression methods.
 */
export function RegressionPanel({ properties }: RegressionPanelProps) {
  const [activeModel, setActiveModel] = useState<RegressionModel | null>(null);
  const [savedModels, setSavedModels] = useState<RegressionModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // We're now getting properties from props, so we don't need to fetch them separately
  useEffect(() => {
    // Log properties count
    console.log(`Regression panel received ${properties.length} properties`);
  }, [properties]);
  
  // Generate a sample regression model for demonstration purposes
  const generateDemoModel = () => {
    setIsLoading(true);
    
    try {
      // For demo, use fixed variable selections
      const targetVariable = 'value';
      const independentVariables = [
        'squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize'
      ];
      
      // Only proceed if we have property data
      if (properties.length === 0) {
        toast({
          title: 'No property data available',
          description: 'Please ensure property data is loaded before running a regression model.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Generate a model using OLS regression
      const model = calculateOLSRegression(
        properties,
        targetVariable,
        independentVariables,
        {
          modelName: 'Demo Housing Price Model',
          dataTransforms: {
            // Apply log transform to the target variable (property values)
            value: TransformType.Log,
            // No transforms for other variables in this demo
          }
        }
      );
      
      setActiveModel(model);
      
      // Add to saved models if it doesn't exist
      if (!savedModels.find(m => m.modelName === model.modelName)) {
        setSavedModels(prev => [...prev, model]);
      }
      
      toast({
        title: 'Regression model generated',
        description: `Model "${model.modelName}" created with R² of ${model.rSquared.toFixed(3)}`,
      });
    } catch (error) {
      console.error('Error generating regression model:', error);
      toast({
        title: 'Model generation failed',
        description: 'An error occurred while creating the regression model.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate a sample GWR model for demonstration
  const generateGWRModel = () => {
    setIsLoading(true);
    
    try {
      // For demo, use fixed variable selections
      const targetVariable = 'value';
      const independentVariables = [
        'squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt'
      ];
      
      // Only proceed if we have property data
      if (properties.length === 0) {
        toast({
          title: 'No property data available',
          description: 'Please ensure property data is loaded before running a regression model.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Generate a model using GWR regression
      const model = calculateGWRRegression(
        properties,
        targetVariable,
        independentVariables,
        {
          modelName: 'Geographically Weighted Housing Model',
          kernelType: KernelType.Gaussian,
          bandwidth: 0.15,
          adaptiveBandwidth: true,
          dataTransforms: {
            // Apply log transform to the target variable
            value: TransformType.Log,
          }
        }
      );
      
      setActiveModel(model);
      
      // Add to saved models if it doesn't exist
      if (!savedModels.find(m => m.modelName === model.modelName)) {
        setSavedModels(prev => [...prev, model]);
      }
      
      toast({
        title: 'GWR model generated',
        description: `Model "${model.modelName}" created with R² of ${model.rSquared.toFixed(3)}`,
      });
    } catch (error) {
      console.error('Error generating GWR model:', error);
      toast({
        title: 'Model generation failed',
        description: 'An error occurred while creating the GWR model.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 space-y-4 w-full h-full overflow-auto relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Regression Analysis</h2>
          <p className="text-muted-foreground">
            Build, compare, and validate property valuation models.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {savedModels.length > 0 && (
            <Select 
              value={activeModel?.modelName} 
              onValueChange={(value) => {
                const selected = savedModels.find(m => m.modelName === value);
                if (selected) setActiveModel(selected);
              }}
            >
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {savedModels.map((model) => (
                  <SelectItem key={model.modelName} value={model.modelName || ''}>
                    {model.modelName} (R² = {model.rSquared.toFixed(3)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="flex space-x-2">
            <Button 
              variant="default" 
              onClick={generateDemoModel}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Run OLS Regression
            </Button>
            
            <Button 
              variant="outline" 
              onClick={generateGWRModel}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <GitMerge className="mr-2 h-4 w-4" />
              Run GWR Regression
            </Button>
          </div>
        </div>
      </div>
      
      {activeModel ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Grid className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="residuals">
              <BarChart2 className="h-4 w-4 mr-2" />
              Residuals
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <Calculator className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="coefficients">
              <Layers className="h-4 w-4 mr-2" />
              Coefficients
            </TabsTrigger>
            <TabsTrigger value="data">
              <TableIcon className="h-4 w-4 mr-2" />
              Model Data
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModelResults model={activeModel} className="h-full" />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Model Quality Assessment</CardTitle>
                  <CardDescription>
                    Evaluation metrics and diagnostics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModelQualitySummary model={activeModel} />
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CoefficientImpactChart model={activeModel} />
              <PredictionScatterPlot model={activeModel} />
            </div>
          </TabsContent>
          
          <TabsContent value="residuals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResidualHistogram model={activeModel} />
              <ResidualMapView model={activeModel} properties={properties} />
            </div>
          </TabsContent>
          
          <TabsContent value="predictions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PredictionScatterPlot model={activeModel} />
              <PredictionTable model={activeModel} properties={properties.slice(0, 5)} />
            </div>
          </TabsContent>
          
          <TabsContent value="coefficients">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CoefficientImpactChart model={activeModel} />
              <VariableImportanceView model={activeModel} />
            </div>
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Model Dataset</CardTitle>
                <CardDescription>
                  Property data used for model training
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md overflow-auto max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Actual Value</TableHead>
                        <TableHead>Predicted Value</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead>Error %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeModel.actualValues.map((actual, index) => {
                        const property = properties[index];
                        const predicted = activeModel.predictedValues[index];
                        const error = activeModel.residuals[index];
                        const errorPercent = (error / actual) * 100;
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{property?.id || index}</TableCell>
                            <TableCell>{property?.address || 'Unknown'}</TableCell>
                            <TableCell>{formatCurrency(actual)}</TableCell>
                            <TableCell>{formatCurrency(predicted)}</TableCell>
                            <TableCell className={error < 0 ? 'text-red-500' : 'text-green-500'}>
                              {formatCurrency(error)}
                            </TableCell>
                            <TableCell className={errorPercent < 0 ? 'text-red-500' : 'text-green-500'}>
                              {Math.abs(errorPercent).toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-dashed w-full">
          <CardHeader>
            <CardTitle>No Regression Model Selected</CardTitle>
            <CardDescription>
              Run a regression model to see results and analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
            <div className="flex items-center justify-center rounded-full bg-muted p-6">
              <Calculator className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="w-full max-w-lg">
              <p className="text-center text-muted-foreground">
                Create a model by clicking "Run OLS Regression" or "Run GWR Regression" to analyze property data.
                <br />
                OLS provides a basic linear model, while GWR accounts for spatial relationships.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component to show model quality
function ModelQualitySummary({ model }: { model: RegressionModel }) {
  const modelQuality = calculateModelQuality(model);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className={`text-2xl font-bold rounded-md py-1 px-3 ${
          modelQuality.quality === 'excellent' ? 'bg-green-100 text-green-800' :
          modelQuality.quality === 'good' ? 'bg-emerald-100 text-emerald-800' :
          modelQuality.quality === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
          modelQuality.quality === 'poor' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {modelQuality.quality.charAt(0).toUpperCase() + modelQuality.quality.slice(1)}
        </div>
        <span className="text-sm text-muted-foreground">Model Quality Assessment</span>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Model Strengths</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {modelQuality.strengths.map((strength, i) => (
            <li key={i} className="text-green-700">{strength}</li>
          ))}
          {modelQuality.strengths.length === 0 && (
            <li className="text-muted-foreground italic">No significant strengths identified</li>
          )}
        </ul>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Areas for Improvement</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {modelQuality.weaknesses.map((weakness, i) => (
            <li key={i} className="text-red-700">{weakness}</li>
          ))}
          {modelQuality.weaknesses.length === 0 && (
            <li className="text-muted-foreground italic">No significant weaknesses identified</li>
          )}
        </ul>
      </div>
      
      <div className="space-y-2">
        <h4 className="font-medium">Model Statistics</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">R-squared:</span>{' '}
            <span className="font-medium">{(model.rSquared * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Adj. R-squared:</span>{' '}
            <span className="font-medium">{(model.adjustedRSquared * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">RMSE:</span>{' '}
            <span className="font-medium">{formatCurrency(model.rootMeanSquareError)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">MAE:</span>{' '}
            <span className="font-medium">{formatCurrency(model.meanAbsoluteError)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">MAPE:</span>{' '}
            <span className="font-medium">{model.meanAbsolutePercentageError.toFixed(2)}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">AIC:</span>{' '}
            <span className="font-medium">{model.akaikeInformationCriterion.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component to show residuals on a map
function ResidualMapView({ model, properties }: { model: RegressionModel; properties: Property[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Residual Map</CardTitle>
        <CardDescription>
          Spatial distribution of model errors
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground italic">
          <p>Residual map visualization would appear here.</p>
          <p>This component would display property locations on a map, colored by residual magnitude.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component to show predictions in a table
function PredictionTable({ model, properties }: { model: RegressionModel; properties: Property[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Property Value Predictions</CardTitle>
        <CardDescription>
          Sample predictions from the model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Actual Value</TableHead>
                <TableHead>Predicted</TableHead>
                <TableHead>Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property, index) => {
                const actualValue = model.actualValues[index] || 0;
                const predictedValue = model.predictedValues[index] || 0;
                const difference = actualValue - predictedValue;
                const percentDiff = (difference / actualValue) * 100;
                
                return (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.address}</TableCell>
                    <TableCell>{formatCurrency(actualValue)}</TableCell>
                    <TableCell>{formatCurrency(predictedValue)}</TableCell>
                    <TableCell className={difference < 0 ? 'text-red-500' : 'text-green-500'}>
                      {formatCurrency(difference)} ({Math.abs(percentDiff).toFixed(1)}%)
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component to show variable importance
function VariableImportanceView({ model }: { model: RegressionModel }) {
  const variableImportance = calculateVariableImportance(model);
  
  // Format into an array for display
  const importanceData = Object.entries(variableImportance)
    .filter(([variable]) => variable !== '(Intercept)')
    .map(([variable, importance]) => ({
      variable,
      importance,
      coefficient: model.coefficients[variable],
      pValue: model.pValues[variable]
    }))
    .sort((a, b) => b.importance - a.importance);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Variable Importance</CardTitle>
        <CardDescription>
          Relative influence of each predictor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {importanceData.map(item => (
            <div key={item.variable} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.variable}</span>
                <span className={item.pValue < 0.05 ? 'text-green-600' : 'text-muted-foreground'}>
                  {(item.importance * 100).toFixed(1)}%
                  {item.pValue < 0.05 ? ' (significant)' : ''}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    item.coefficient > 0 ? 'bg-green-500' : 'bg-red-500'
                  } ${
                    item.pValue < 0.05 ? '' : 'opacity-40'
                  }`}
                  style={{ width: `${item.importance * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

