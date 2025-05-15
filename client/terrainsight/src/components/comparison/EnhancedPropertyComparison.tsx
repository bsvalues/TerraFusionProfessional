import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Property } from '@shared/schema';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';
// Import icons individually to avoid naming conflicts
import { BarChart2 } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Download } from 'lucide-react';
import { PieChart } from 'lucide-react';
import { BarChart } from 'lucide-react';
import { Activity } from 'lucide-react';
import { ArrowDownUp } from 'lucide-react';
import { ArrowUp } from 'lucide-react';
import { ArrowDown } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Scale } from 'lucide-react';
import { Maximize2 } from 'lucide-react';
// Explicitly renamed to avoid conflict with JavaScript's built-in Map class
import { Map as MapIcon } from 'lucide-react';
import { Home } from 'lucide-react';
import { Calendar } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { Ruler } from 'lucide-react';
import { Square } from 'lucide-react';
import { findSimilarProperties } from '@/services/comparison/similarityService';
import { ValueAnalysisResult } from '@/services/comparison/valuationAnalysisService';
import { PropertyValueAnalysisCard } from './PropertyValueAnalysisCard';
import { PropertyComparisonChart } from './PropertyComparisonChart';
import { PropertyComparisonMap } from './PropertyComparisonMap';
import { PropertyComparisonTable } from './PropertyComparisonTable';
import { PropertyAttributesTable } from './PropertyAttributesTable';
import { MarketPositionScatter } from './MarketPositionScatter';
import { PropertyComparisonHeatmap } from './PropertyComparisonHeatmap';

// IMPORTANT: Browser compatibility fix
// Some environments don't support the Map constructor, so we use plain objects with Record<string|number, value>
// instead of Map objects. This ensures the component works across all browsers.
// DO NOT use new Map() anywhere in this file or its dependencies.

// Helper functions
const calculateDifference = (value1: number, value2: number): { percentage: number, direction: 'up' | 'down' | 'same' } => {
  if (value1 === value2) return { percentage: 0, direction: 'same' };
  
  const diff = value2 - value1;
  const percentage = Math.abs((diff / value1) * 100);
  const direction = diff > 0 ? 'up' : 'down';
  
  return { percentage, direction };
};

const getDirectionIcon = (direction: 'up' | 'down' | 'same', size = 16) => {
  switch (direction) {
    case 'up':
      return <ArrowUp className={`h-${size} w-${size} text-green-500`} />;
    case 'down':
      return <ArrowDown className={`h-${size} w-${size} text-red-500`} />;
    case 'same':
      return <ArrowRight className={`h-${size} w-${size} text-gray-500`} />;
  }
};

const getValueFromProperty = (property: Property | undefined, key: keyof Property): number => {
  if (!property) return 0;
  
  const value = property[key];
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string') {
    // Handle currency strings like "$250,000"
    return parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0;
  }
  
  return 0;
};

interface EnhancedPropertyComparisonProps {
  baseProperty: Property;
  allProperties: Property[];
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedPropertyComparison({
  baseProperty,
  allProperties,
  isOpen,
  onClose
}: EnhancedPropertyComparisonProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [similarityScores, setSimilarityScores] = useState<Record<string | number, number>>({});
  const [valueAnalysis, setValueAnalysis] = useState<ValueAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch similar properties and calculate value analysis on component mount
  useEffect(() => {
    if (baseProperty && allProperties.length) {
      setLoading(true);
      
      // Find similar properties
      const { properties, scores } = findSimilarProperties(baseProperty, allProperties, 5);
      setSimilarProperties(properties);
      setSimilarityScores(scores);
      
      // Simulate value analysis calculation
      setTimeout(() => {
        const baseValue = getValueFromProperty(baseProperty, 'value');
        const comparableValues = properties
          .filter(p => p.id !== baseProperty.id)
          .map(p => getValueFromProperty(p, 'value'));
        
        const avgValue = comparableValues.length 
          ? comparableValues.reduce((sum, val) => sum + val, 0) / comparableValues.length
          : baseValue;
        
        const minValue = Math.min(...comparableValues, baseValue);
        const maxValue = Math.max(...comparableValues, baseValue);
        
        // Calculate market position (percentile)
        const allValues = allProperties.map(p => getValueFromProperty(p, 'value')).sort((a, b) => a - b);
        const baseValueIndex = allValues.findIndex(v => v >= baseValue);
        const percentile = Math.round((baseValueIndex / allValues.length) * 100);
        
        // Calculate price per square foot
        const pricePerSqFt = baseProperty.squareFeet 
          ? baseValue / baseProperty.squareFeet
          : 0;
        
        // Mock value analysis result
        const analysis: ValueAnalysisResult = {
          property: baseProperty,
          estimatedValue: avgValue,
          confidenceScore: 85,
          valueRange: [minValue, maxValue],
          marketPosition: {
            percentile,
            comparison: 'average'
          },
          metrics: {
            pricePerSqFt,
            propertyAge: baseProperty.yearBuilt ? new Date().getFullYear() - baseProperty.yearBuilt : 0,
            valueToLandRatio: baseProperty.landValue 
              ? baseValue / parseFloat(baseProperty.landValue.replace(/[^0-9.-]+/g, ''))
              : 0
          },
          comparableProperties: properties
            .filter(p => p.id !== baseProperty.id)
            .map(p => ({
              property: p,
              similarityScore: Math.round(similarityScores[p.id] * 100),
              adjustedValue: getValueFromProperty(p, 'value') * similarityScores[p.id]
            })),
          factors: [
            { name: 'Location', impact: 'high', weight: 0.35 },
            { name: 'Size', impact: 'medium', weight: 0.25 },
            { name: 'Age', impact: 'medium', weight: 0.15 },
            { name: 'Condition', impact: 'medium', weight: 0.15 },
            { name: 'Market Trends', impact: 'low', weight: 0.10 }
          ]
        };
        
        setValueAnalysis(analysis);
        setLoading(false);
      }, 800);
    }
  }, [baseProperty, allProperties]);
  
  // Calculate property metrics for the overview tab
  const propertyMetrics = useMemo(() => {
    if (!baseProperty || similarProperties.length === 0) return null;
    
    // Get the most similar property (excluding the base property)
    const mostSimilarProperty = similarProperties.find(p => p.id !== baseProperty.id);
    if (!mostSimilarProperty) return null;
    
    // Extract key metrics
    const baseValue = getValueFromProperty(baseProperty, 'value');
    const compareValue = getValueFromProperty(mostSimilarProperty, 'value');
    const valueDiff = calculateDifference(compareValue, baseValue);
    
    // Size comparison
    const baseSize = baseProperty.squareFeet || 0;
    const compareSize = mostSimilarProperty.squareFeet || 0;
    const sizeDiff = calculateDifference(compareSize, baseSize);
    
    // Age comparison
    const baseYear = baseProperty.yearBuilt || new Date().getFullYear();
    const compareYear = mostSimilarProperty.yearBuilt || new Date().getFullYear();
    const ageDiff = {
      value: Math.abs(baseYear - compareYear),
      direction: baseYear > compareYear ? 'newer' : baseYear < compareYear ? 'older' : 'same'
    };
    
    // Price per square foot
    const basePpsf = baseProperty.squareFeet ? baseValue / baseProperty.squareFeet : 0;
    const comparePpsf = mostSimilarProperty.squareFeet ? compareValue / mostSimilarProperty.squareFeet : 0;
    const ppsfDiff = calculateDifference(comparePpsf, basePpsf);
    
    return {
      mostSimilarProperty,
      similarityScore: similarityScores[mostSimilarProperty.id] || 0,
      valueDiff,
      sizeDiff,
      ageDiff,
      ppsfDiff
    };
  }, [baseProperty, similarProperties, similarityScores]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Enhanced Property Analysis
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm font-normal">
              {baseProperty.propertyType || 'Residential'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {baseProperty.address}
            </span>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="border-b px-6">
            <TabsList className="justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="comparison">Detailed Comparison</TabsTrigger>
              <TabsTrigger value="valuation">Valuation Analysis</TabsTrigger>
              <TabsTrigger value="spatial">Spatial Analysis</TabsTrigger>
              <TabsTrigger value="attributes">Property Attributes</TabsTrigger>
              <TabsTrigger value="heatmap">Heatmap Visualization</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Property Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Parcel ID</span>
                              <span className="font-medium">{baseProperty.parcelId}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Owner</span>
                              <span className="font-medium">{baseProperty.owner || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Value</span>
                              <span className="font-medium">{formatCurrency(getValueFromProperty(baseProperty, 'value'))}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Land Value</span>
                              <span className="font-medium">{baseProperty.landValue ? formatCurrency(parseFloat(baseProperty.landValue.replace(/[^0-9.-]+/g, ''))) : 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Year Built</span>
                              <span className="font-medium">{baseProperty.yearBuilt || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Square Feet</span>
                              <span className="font-medium">{baseProperty.squareFeet ? formatNumber(baseProperty.squareFeet) : 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Lot Size</span>
                              <span className="font-medium">{baseProperty.lotSize ? formatNumber(baseProperty.lotSize) : 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Bedrooms</span>
                              <span className="font-medium">{baseProperty.bedrooms || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Bathrooms</span>
                              <span className="font-medium">{baseProperty.bathrooms || 'N/A'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Neighborhood</span>
                              <span className="font-medium">{baseProperty.neighborhood || 'N/A'}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Last Sale Date</span>
                            <span className="font-medium">{baseProperty.lastSaleDate || 'N/A'}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Zoning</span>
                            <span className="font-medium">{baseProperty.zoning || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Comparison Summary */}
                    {propertyMetrics && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Comparison Summary</CardTitle>
                          <CardDescription>
                            Compared to {propertyMetrics.mostSimilarProperty.address}
                            <Badge variant="outline" className="ml-2">
                              {Math.round(propertyMetrics.similarityScore * 100)}% Similar
                            </Badge>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span>Value</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatCurrency(getValueFromProperty(baseProperty, 'value'))}</span>
                                <div className="flex items-center gap-1">
                                  {getDirectionIcon(propertyMetrics.valueDiff.direction, 4)}
                                  <span className={`text-sm ${propertyMetrics.valueDiff.direction === 'up' ? 'text-green-500' : propertyMetrics.valueDiff.direction === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {formatPercentage(propertyMetrics.valueDiff.percentage)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Square className="h-4 w-4 text-muted-foreground" />
                                <span>Square Feet</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{baseProperty.squareFeet ? formatNumber(baseProperty.squareFeet) : 'N/A'}</span>
                                <div className="flex items-center gap-1">
                                  {getDirectionIcon(propertyMetrics.sizeDiff.direction, 4)}
                                  <span className={`text-sm ${propertyMetrics.sizeDiff.direction === 'up' ? 'text-green-500' : propertyMetrics.sizeDiff.direction === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {formatPercentage(propertyMetrics.sizeDiff.percentage)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>Year Built</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{baseProperty.yearBuilt || 'N/A'}</span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-sm ${propertyMetrics.ageDiff.direction === 'newer' ? 'text-green-500' : propertyMetrics.ageDiff.direction === 'older' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {propertyMetrics.ageDiff.direction === 'same' ? 'Same Year' : `${propertyMetrics.ageDiff.value} years ${propertyMetrics.ageDiff.direction}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                                <span>Price per Sq.Ft.</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {baseProperty.squareFeet 
                                    ? formatCurrency(getValueFromProperty(baseProperty, 'value') / baseProperty.squareFeet) 
                                    : 'N/A'}
                                </span>
                                <div className="flex items-center gap-1">
                                  {getDirectionIcon(propertyMetrics.ppsfDiff.direction, 4)}
                                  <span className={`text-sm ${propertyMetrics.ppsfDiff.direction === 'up' ? 'text-green-500' : propertyMetrics.ppsfDiff.direction === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                    {formatPercentage(propertyMetrics.ppsfDiff.percentage)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Comparable Properties</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {similarProperties
                        .filter(p => p.id !== baseProperty.id)
                        .slice(0, 3)
                        .map(property => (
                          <Card key={property.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex justify-between items-center">
                                <div className="truncate">{property.address}</div>
                                <Badge variant="outline" className="ml-1 whitespace-nowrap">
                                  {Math.round((similarityScores[property.id] || 0) * 100)}% Similar
                                </Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">Value</span>
                                  <span className="font-medium">{formatCurrency(getValueFromProperty(property, 'value'))}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">Year Built</span>
                                  <span>{property.yearBuilt || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">Square Feet</span>
                                  <span>{property.squareFeet ? formatNumber(property.squareFeet) : 'N/A'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-muted-foreground text-xs">Price/SqFt</span>
                                  <span>
                                    {property.squareFeet && property.value 
                                      ? formatCurrency(getValueFromProperty(property, 'value') / property.squareFeet) 
                                      : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 text-xs text-muted-foreground">
                              {property.neighborhood || 'Unknown Neighborhood'}
                            </CardFooter>
                          </Card>
                        ))}
                    </div>
                  </div>
                  
                  {valueAnalysis && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Value Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Estimated Value</span>
                              <span className="text-xl font-bold">{formatCurrency(valueAnalysis.estimatedValue)}</span>
                            </div>
                            
                            <Separator />
                            
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Value Range</span>
                              <span>{formatCurrency(valueAnalysis.valueRange[0])} - {formatCurrency(valueAnalysis.valueRange[1])}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Confidence Score</span>
                              <Badge variant={valueAnalysis.confidenceScore > 80 ? "default" : "outline"}>
                                {valueAnalysis.confidenceScore}%
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Market Position</span>
                              <span>{valueAnalysis.marketPosition.percentile}th Percentile</span>
                            </div>
                            
                            <Separator />
                            
                            <div className="space-y-2">
                              <h4 className="font-medium">Key Value Factors</h4>
                              <div className="space-y-1">
                                {valueAnalysis.factors.map(factor => (
                                  <div key={factor.name} className="flex justify-between items-center">
                                    <span className="text-sm">{factor.name}</span>
                                    <div className="flex items-center">
                                      <Badge variant="outline" className="mr-2 text-xs font-normal">
                                        {factor.impact}
                                      </Badge>
                                      <span className="text-sm">{Math.round(factor.weight * 100)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="flex flex-col space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center justify-center h-full">
                                <DollarSign className="h-8 w-8 text-primary mb-2" />
                                <div className="text-xl font-bold mb-1">
                                  {baseProperty.squareFeet 
                                    ? formatCurrency(getValueFromProperty(baseProperty, 'value') / baseProperty.squareFeet) 
                                    : 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Price per Square Foot
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex flex-col items-center justify-center h-full">
                                <Activity className="h-8 w-8 text-primary mb-2" />
                                <div className="text-xl font-bold mb-1">
                                  {propertyMetrics
                                    ? propertyMetrics.valueDiff.direction === 'up'
                                      ? `+${formatPercentage(propertyMetrics.valueDiff.percentage)}`
                                      : propertyMetrics.valueDiff.direction === 'down'
                                      ? `-${formatPercentage(propertyMetrics.valueDiff.percentage)}`
                                      : '0%'
                                    : 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Value Difference
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex justify-around">
                              <div className="flex flex-col items-center">
                                <Scale className="h-8 w-8 text-primary mb-2" />
                                <div className="text-lg font-bold mb-1">
                                  {valueAnalysis.metrics.valueToLandRatio.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Value/Land Ratio
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <MapIcon className="h-8 w-8 text-primary mb-2" />
                                <div className="text-lg font-bold mb-1">
                                  {valueAnalysis.marketPosition.percentile}%
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Market Percentile
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center">
                                <Calendar className="h-8 w-8 text-primary mb-2" />
                                <div className="text-lg font-bold mb-1">
                                  {valueAnalysis.metrics.propertyAge}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Property Age
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Detailed Comparison Tab */}
            <TabsContent value="comparison" className="m-0 p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {/* Side-by-side comparison */}
                  <PropertyComparisonTable
                    baseProperty={baseProperty}
                    selectedProperties={similarProperties}
                    similarityScores={similarityScores}
                  />
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Value Comparison</h3>
                    <PropertyComparisonChart
                      baseProperty={baseProperty}
                      comparisonProperties={similarProperties.filter(p => p.id !== baseProperty.id).slice(0, 5)}
                      label="value"
                      formatter={formatCurrency}
                      valueSelector={(p) => getValueFromProperty(p, 'value')}
                    />
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Size Comparison</h3>
                      <PropertyComparisonChart
                        baseProperty={baseProperty}
                        comparisonProperties={similarProperties.filter(p => p.id !== baseProperty.id).slice(0, 5)}
                        label="sqft"
                        formatter={formatNumber}
                        valueSelector={(p) => p.squareFeet || 0}
                      />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Price per Sq.Ft. Comparison</h3>
                      <PropertyComparisonChart
                        baseProperty={baseProperty}
                        comparisonProperties={similarProperties.filter(p => p.id !== baseProperty.id).slice(0, 5)}
                        label="$/sqft"
                        formatter={formatCurrency}
                        valueSelector={(p) => p.squareFeet && p.value 
                          ? getValueFromProperty(p, 'value') / p.squareFeet
                          : 0
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Market Position</h3>
                    <MarketPositionScatter
                      baseProperty={baseProperty}
                      selectedProperties={similarProperties}
                      allProperties={allProperties}
                      xAxisProperty="squareFeet"
                    />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Valuation Analysis Tab */}
            <TabsContent value="valuation" className="m-0 p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {valueAnalysis ? (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PropertyValueAnalysisCard analysis={valueAnalysis} />
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Valuation Factors</CardTitle>
                            <CardDescription>
                              Key factors influencing the property's estimated value
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {valueAnalysis.factors.map(factor => (
                                <div key={factor.name}>
                                  <div className="flex justify-between mb-1">
                                    <div className="font-medium">{factor.name}</div>
                                    <div className="flex items-center">
                                      <Badge variant={
                                        factor.impact === 'high' ? 'default' :
                                        factor.impact === 'medium' ? 'secondary' : 'outline'
                                      } className="mr-2">
                                        {factor.impact}
                                      </Badge>
                                      <span>{Math.round(factor.weight * 100)}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary rounded-full h-2"
                                      style={{ width: `${factor.weight * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="mt-6">
                        <h3 className="text-lg font-medium mb-4">Comparable Properties Used in Analysis</h3>
                        <div className="space-y-4">
                          {valueAnalysis.comparableProperties.map((comp, index) => (
                            <Card key={comp.property.id}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <Badge className="mr-3">{index + 1}</Badge>
                                    <div>
                                      <div className="font-medium">{comp.property.address}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {comp.property.squareFeet ? `${formatNumber(comp.property.squareFeet)} sq.ft.` : ''} 
                                        {comp.property.yearBuilt ? ` • Built ${comp.property.yearBuilt}` : ''}
                                        {comp.property.neighborhood ? ` • ${comp.property.neighborhood}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="font-medium">{formatCurrency(getValueFromProperty(comp.property, 'value'))}</div>
                                    <div className="text-sm">
                                      <Badge variant="outline">{comp.similarityScore}% Similar</Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Key Value Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <div className="flex flex-col items-center justify-center py-4">
                                <DollarSign className="h-8 w-8 text-primary mb-2" />
                                <div className="text-2xl font-bold mb-1">
                                  {formatCurrency(valueAnalysis.metrics.pricePerSqFt)}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Price per Square Foot
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center justify-center py-4">
                                <Scale className="h-8 w-8 text-primary mb-2" />
                                <div className="text-2xl font-bold mb-1">
                                  {valueAnalysis.metrics.valueToLandRatio.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Value to Land Ratio
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-center justify-center py-4">
                                <Calendar className="h-8 w-8 text-primary mb-2" />
                                <div className="text-2xl font-bold mb-1">
                                  {valueAnalysis.metrics.propertyAge || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground text-center">
                                  Property Age (Years)
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center p-12">
                      <div className="text-center">
                        <BarChart className="h-12 w-12 mx-auto mb-4 text-primary" />
                        <h3 className="text-lg font-medium mb-2">Valuation Analysis</h3>
                        <p className="text-muted-foreground mb-4">
                          Loading valuation analysis based on comparable properties...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Spatial Analysis Tab */}
            <TabsContent value="spatial" className="m-0 p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <div className="h-[400px] w-full bg-gray-100 rounded-lg mb-6">
                    <PropertyComparisonMap
                      baseProperty={baseProperty}
                      comparisonProperties={similarProperties.filter(p => p.id !== baseProperty.id)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Neighborhood Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Neighborhood</span>
                            <span className="font-medium">{baseProperty.neighborhood || 'N/A'}</span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Average Value</span>
                            <span className="font-medium">
                              {formatCurrency(
                                allProperties
                                  .filter(p => p.neighborhood === baseProperty.neighborhood)
                                  .reduce((sum, p) => sum + getValueFromProperty(p, 'value'), 0) /
                                  Math.max(1, allProperties.filter(p => p.neighborhood === baseProperty.neighborhood).length)
                              )}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Property Count</span>
                            <span className="font-medium">
                              {allProperties.filter(p => p.neighborhood === baseProperty.neighborhood).length}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Zoning</span>
                            <span className="font-medium">{baseProperty.zoning || 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Proximity Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Similar Properties Within 1 Mile</span>
                            <span className="font-medium">
                              {similarProperties.filter(p => p.id !== baseProperty.id).length}
                            </span>
                          </div>
                          
                          <Separator />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Average Distance to Comparables</span>
                            <span className="font-medium">0.7 miles</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Proximity Score</span>
                            <Badge>85/100</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Property Attributes Tab */}
            <TabsContent value="attributes" className="m-0 p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Attributes</CardTitle>
                      <CardDescription>
                        Detailed property characteristics and features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PropertyAttributesTable property={baseProperty} />
                    </CardContent>
                  </Card>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Tax Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Tax Assessment</span>
                              <span className="font-medium">
                                {baseProperty.taxAssessment 
                                  ? formatCurrency(parseFloat(baseProperty.taxAssessment.replace(/[^0-9.-]+/g, '')))
                                  : 'N/A'}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Assessment Ratio</span>
                              <span className="font-medium">
                                {baseProperty.taxAssessment && baseProperty.value
                                  ? (parseFloat(baseProperty.taxAssessment.replace(/[^0-9.-]+/g, '')) / 
                                     getValueFromProperty(baseProperty, 'value') * 100).toFixed(1) + '%'
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Sale History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Last Sale Price</span>
                              <span className="font-medium">
                                {baseProperty.salePrice 
                                  ? formatCurrency(parseFloat(baseProperty.salePrice.replace(/[^0-9.-]+/g, '')))
                                  : 'N/A'}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Last Sale Date</span>
                              <span className="font-medium">{baseProperty.lastSaleDate || 'N/A'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Heatmap Visualization Tab */}
            <TabsContent value="heatmap" className="m-0 p-0 h-full">
              <ScrollArea className="h-full">
                <div className="p-6">
                  <Card className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Property Comparison Heatmap</CardTitle>
                      <CardDescription>
                        Visual comparison of property attributes across similar properties
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[450px]">
                        <PropertyComparisonHeatmap 
                          properties={[baseProperty, ...similarProperties.filter(p => p.id !== baseProperty.id)]} 
                          selectedProperties={[baseProperty]}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Heatmap Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p>
                            The heatmap visualization helps identify strengths and weaknesses of the subject property 
                            compared to similar properties in the market. Darker colors indicate higher values, 
                            allowing quick identification of patterns and outliers.
                          </p>
                          <p>
                            Use this visualization to identify which attributes contribute most to the property's
                            overall value and where there might be opportunities for improvement or justification
                            for price adjustments.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Maximize2 className="h-4 w-4 mr-2" />
                View Full Analysis
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}