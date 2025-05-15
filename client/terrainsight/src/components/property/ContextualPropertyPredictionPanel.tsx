import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, TrendingUp, Building, DollarSign } from 'lucide-react';
import { Property } from '@shared/schema';
import { contextualPredictionService, type ContextualPredictionResponse } from '@/services/ml/contextualPredictionService';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ContextualPropertyPredictionPanelProps {
  property: Property;
  comparableProperties?: Property[];
}

const ContextualPropertyPredictionPanel: React.FC<ContextualPropertyPredictionPanelProps> = ({ 
  property, 
  comparableProperties = [] 
}) => {
  const [context, setContext] = useState<string>('');
  const [prediction, setPrediction] = useState<ContextualPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContext(e.target.value);
  };

  const generatePrediction = async () => {
    if (!context.trim()) {
      toast({
        title: "Context Required",
        description: "Please provide some context about the property for more accurate predictions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await contextualPredictionService.predictPropertyValue({
        property,
        context,
        comparableProperties,
        includeExplanation: true,
        confidenceLevel: 95
      });
      
      setPrediction(result);
      toast({
        title: "Prediction Generated",
        description: "AI-enhanced contextual property valuation complete.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error generating prediction:', err);
      setError('Failed to generate contextual prediction. Please try again later.');
      toast({
        title: "Prediction Failed",
        description: "Could not generate property valuation prediction.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getImpactColor = (impact: number): string => {
    if (impact > 0) return 'text-green-600';
    if (impact < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getImpactIcon = (impact: number) => {
    if (impact > 0) return '↑';
    if (impact < 0) return '↓';
    return '–';
  };

  return (
    <Card className="w-full shadow-lg bg-white/90 backdrop-blur-sm border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b border-gray-200">
        <CardTitle className="flex items-center text-xl font-semibold text-gray-800 gap-2">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          Contextual Property Valuation
        </CardTitle>
        <CardDescription className="text-gray-600">
          Get AI-enhanced property value predictions with contextual insights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-5 pb-2">
        {!prediction ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">
                {property.address}
              </span>
            </div>
            
            <div className="mb-6">
              <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
                Contextual Information
              </label>
              <Textarea
                id="context"
                placeholder="Provide additional context about the property, recent renovations, market trends, neighborhood changes, or special features that might affect its value..."
                value={context}
                onChange={handleContextChange}
                className="min-h-[120px] text-gray-700"
              />
              <p className="mt-2 text-sm text-gray-500">
                More detailed context will result in more accurate and nuanced valuations.
              </p>
            </div>
          </>
        ) : (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="factors">Adjustment Factors</TabsTrigger>
              <TabsTrigger value="comparable">Comparable Properties</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="pt-2">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Final Predicted Value:</span>
                    <span className="text-2xl font-bold text-indigo-700">
                      {formatCurrency(prediction.predictedValue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">ML Model Prediction:</span>
                    <span className="text-gray-700">
                      {formatCurrency(prediction.mlPredictedValue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">AI Contextual Prediction:</span>
                    <span className="text-gray-700">
                      {formatCurrency(prediction.aiPredictedValue)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-600">Confidence Interval (95%):</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-gray-700">
                      {formatCurrency(prediction.confidenceInterval.min)}
                    </span>
                    <Progress 
                      value={50} 
                      className="h-2 mx-2 w-full bg-gray-200" 
                    />
                    <span className="text-gray-700">
                      {formatCurrency(prediction.confidenceInterval.max)}
                    </span>
                  </div>
                </div>
                
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <AlertTitle className="text-blue-700 font-medium">Analysis Explanation</AlertTitle>
                  <AlertDescription className="text-gray-700 mt-2">
                    {prediction.explanation}
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
            
            <TabsContent value="factors">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Factor</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prediction.adjustmentFactors.map((factor, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{factor.factor}</TableCell>
                        <TableCell className={getImpactColor(factor.impact)}>
                          {getImpactIcon(factor.impact)} {Math.abs(factor.impact)}%
                        </TableCell>
                        <TableCell>{factor.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="comparable">
              {prediction.comparableProperties && prediction.comparableProperties.length > 0 ? (
                <div className="grid gap-4">
                  {prediction.comparableProperties.map((comparable, index) => (
                    <Card key={index} className="border border-gray-200">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-sm font-medium text-gray-700">
                            {comparable.property.address}
                          </CardTitle>
                          <Badge variant="outline" className="bg-blue-50">
                            {(comparable.similarity * 100).toFixed(0)}% Similar
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Original Value:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(Number(comparable.property.value) || 0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Adjusted Value:</span>{' '}
                            <span className="font-medium">
                              {formatCurrency(comparable.adjustedValue)}
                            </span>
                          </div>
                        </div>
                        
                        {comparable.keyDifferences && comparable.keyDifferences.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Key Differences:</p>
                            <ul className="text-xs space-y-1">
                              {comparable.keyDifferences.map((diff, idx) => (
                                <li key={idx} className="flex justify-between">
                                  <span>{diff.factor}:</span>
                                  <span className={getImpactColor(diff.impact)}>
                                    {diff.propertyValue} vs {diff.comparableValue} 
                                    ({diff.impact > 0 ? '+' : ''}{diff.impact}%)
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No comparable properties included in the analysis
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end py-4 bg-gray-50 rounded-b-lg">
        {!prediction ? (
          <Button
            onClick={generatePrediction}
            disabled={isLoading || !context.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Prediction...
              </>
            ) : (
              <>
                Generate Prediction
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => setPrediction(null)}
            variant="outline"
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            Generate New Prediction
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ContextualPropertyPredictionPanel;