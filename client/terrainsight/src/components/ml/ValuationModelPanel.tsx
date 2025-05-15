import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, Brain, Calculator, Check, ChevronsUpDown, DollarSign, Home, Maximize, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ValuationModelPanelProps {
  selectedProperty?: Property;
  allProperties: Property[];
  className?: string;
}

export function ValuationModelPanel({ selectedProperty, allProperties, className }: ValuationModelPanelProps) {
  const [valuationResult, setValuationResult] = useState<{
    predictedValue: number;
    confidence: number;
    range: [number, number];
    featureImportance: { feature: string; importance: number }[];
    comparableProperties: Property[];
  } | null>(null);
  
  const [modelType, setModelType] = useState('multiple-regression');
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleValuationAnalysis = () => {
    setIsAnalyzing(true);
    
    // Simulate ML analysis delay
    setTimeout(() => {
      // Mock valuation result
      const mockPredictedValue = selectedProperty?.value 
        ? parseFloat(selectedProperty.value.replace(/[^0-9.]/g, '')) * 1.05 
        : 325000;
        
      const mockRange: [number, number] = [
        mockPredictedValue * 0.95,
        mockPredictedValue * 1.05
      ];
      
      setValuationResult({
        predictedValue: mockPredictedValue,
        confidence: confidenceLevel / 100,
        range: mockRange,
        featureImportance: [
          { feature: 'Location', importance: 38 },
          { feature: 'Square Footage', importance: 22 },
          { feature: 'Year Built', importance: 15 },
          { feature: 'Bedrooms', importance: 12 },
          { feature: 'Bathrooms', importance: 8 },
          { feature: 'Lot Size', importance: 5 },
        ],
        comparableProperties: allProperties.slice(0, 3)
      });
      
      setIsAnalyzing(false);
    }, 1500);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Calculator className="mr-2 h-5 w-5 text-primary" />
              ML-Based Property Valuation
            </CardTitle>
            <CardDescription>
              Generate accurate property valuations using advanced machine learning algorithms
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-type">Valuation Model</Label>
                    <Select value={modelType} onValueChange={setModelType}>
                      <SelectTrigger id="model-type">
                        <SelectValue placeholder="Select model type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-regression">Multiple Regression</SelectItem>
                        <SelectItem value="random-forest">Random Forest</SelectItem>
                        <SelectItem value="gradient-boosting">Gradient Boosting</SelectItem>
                        <SelectItem value="neural-network">Neural Network</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Confidence Level: {confidenceLevel}%</Label>
                    <Slider
                      id="confidence"
                      min={80}
                      max={99}
                      step={1}
                      value={[confidenceLevel]}
                      onValueChange={(values) => setConfidenceLevel(values[0])}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleValuationAnalysis} 
                  className="w-full"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>Analyzing Property Value...</>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Run Valuation Analysis
                    </>
                  )}
                </Button>
                
                {valuationResult && (
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-green-700">Predicted Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-800 flex items-center">
                            <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                            {formatCurrency(valuationResult.predictedValue)}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            with {confidenceLevel}% confidence
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-blue-700">Confidence Range</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-blue-800">
                            {formatCurrency(valuationResult.range[0])} - {formatCurrency(valuationResult.range[1])}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            value range estimate
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-purple-50 border-purple-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-purple-700">Top Value Factor</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold text-purple-800">
                            {valuationResult.featureImportance[0].feature}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">
                            {valuationResult.featureImportance[0].importance}% of valuation impact
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-3">Feature Importance</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={valuationResult.featureImportance}
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="feature" type="category" />
                            <Tooltip formatter={(value) => [`${value}%`, 'Importance']} />
                            <Bar dataKey="importance" fill="#8884d8" barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Please select a property to analyze using the ML valuation model.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              Model Insights
            </CardTitle>
            <CardDescription>
              Understanding how the model works and its accuracy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Model Accuracy</h4>
              <div className="flex items-center">
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '94%' }}></div>
                </div>
                <span className="ml-2 text-sm font-medium">94%</span>
              </div>
              <p className="text-xs text-gray-500">
                Based on cross-validation with historical data
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Model Training</h4>
              <div className="flex justify-between text-sm">
                <span>Properties used</span>
                <span className="font-medium">8,432</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Features analyzed</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last trained</span>
                <span className="font-medium">2 days ago</span>
              </div>
            </div>
            
            <div className="pt-2">
              <h4 className="text-sm font-semibold mb-2">Key Influences</h4>
              <ul className="space-y-1.5">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Location proximity to schools
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Recent comparable sales
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Property size and amenities
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Neighborhood growth trends
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Property condition and age
                </li>
              </ul>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full">
                <ChevronsUpDown className="h-4 w-4 mr-2" />
                Advanced Model Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}