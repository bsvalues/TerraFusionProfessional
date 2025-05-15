import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Property } from '@shared/schema';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ChevronsUp,
  ChevronsDown,
  Minus
} from 'lucide-react';

// Types for value analysis result
export interface ValueAnalysisResult {
  property: Property;
  estimatedValue: number;
  confidenceScore: number;
  valueRange: [number, number];
  marketPosition: {
    percentile: number;
    comparison: 'low' | 'average' | 'high';
  };
  metrics: {
    pricePerSqFt: number;
    propertyAge: number;
    valueToLandRatio: number;
  };
  comparableProperties: {
    property: Property;
    similarityScore: number;
    adjustedValue: number;
  }[];
  factors: {
    name: string;
    impact: 'high' | 'medium' | 'low';
    weight: number;
  }[];
}

interface PropertyValueAnalysisCardProps {
  analysis: ValueAnalysisResult;
}

export function PropertyValueAnalysisCard({ analysis }: PropertyValueAnalysisCardProps) {
  // Calculate the confidence level badge variant
  const getConfidenceLevelVariant = (score: number) => {
    if (score >= 90) return { variant: 'default', label: 'Very High' };
    if (score >= 80) return { variant: 'default', label: 'High' };
    if (score >= 70) return { variant: 'secondary', label: 'Good' };
    if (score >= 60) return { variant: 'outline', label: 'Moderate' };
    return { variant: 'destructive', label: 'Low' };
  };

  // Get estimated value position relative to the property value
  const getValuePosition = () => {
    const propertyValue = typeof analysis.property.value === 'string' 
      ? parseFloat(analysis.property.value.replace(/[^0-9.-]+/g, ''))
      : (analysis.property.value || 0);
    
    if (Math.abs(propertyValue - analysis.estimatedValue) < 0.01 * propertyValue) {
      return { icon: <ArrowRight className="h-4 w-4 text-gray-500" />, text: 'On target', color: 'text-gray-500' };
    }
    
    if (analysis.estimatedValue > propertyValue) {
      return { 
        icon: <ArrowUpRight className="h-4 w-4 text-green-500" />, 
        text: `${formatPercentage((analysis.estimatedValue - propertyValue) / propertyValue * 100)} above current value`, 
        color: 'text-green-500' 
      };
    }
    
    return { 
      icon: <ArrowDownRight className="h-4 w-4 text-red-500" />, 
      text: `${formatPercentage((propertyValue - analysis.estimatedValue) / propertyValue * 100)} below current value`, 
      color: 'text-red-500' 
    };
  };

  // Get market position icon
  const getMarketPositionIcon = (percentile: number) => {
    if (percentile >= 90) return <ChevronsUp className="h-5 w-5 text-green-500" />;
    if (percentile >= 70) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (percentile >= 30) return <Minus className="h-5 w-5 text-gray-500" />;
    if (percentile >= 10) return <TrendingDown className="h-5 w-5 text-amber-500" />;
    return <ChevronsDown className="h-5 w-5 text-red-500" />;
  };

  const valuePosition = getValuePosition();
  const confidenceLevel = getConfidenceLevelVariant(analysis.confidenceScore);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Value Analysis</CardTitle>
        <CardDescription>
          Based on {analysis.comparableProperties.length} comparable properties
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estimated Value */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">Estimated Value</div>
              <Badge variant="outline">
                {confidenceLevel.label} Confidence
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(analysis.estimatedValue)}</div>
            <div className="flex items-center text-sm">
              {valuePosition.icon}
              <span className={`ml-1 ${valuePosition.color}`}>
                {valuePosition.text}
              </span>
            </div>
          </div>
          
          <Separator />
          
          {/* Value Range */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Value Range</div>
            <div className="flex justify-between items-center">
              <div className="font-medium">{formatCurrency(analysis.valueRange[0])}</div>
              <div className="font-medium">{formatCurrency(analysis.valueRange[1])}</div>
            </div>
            <Progress value={analysis.confidenceScore} className="mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <div>Min</div>
              <div>Max</div>
            </div>
          </div>
          
          <Separator />
          
          {/* Market Position */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Market Position</div>
            <div className="flex items-center">
              {getMarketPositionIcon(analysis.marketPosition.percentile)}
              <div className="ml-2">
                <div className="font-medium">{analysis.marketPosition.percentile}th Percentile</div>
                <div className="text-sm text-muted-foreground">
                  {analysis.marketPosition.percentile < 30 
                    ? 'Below average market value' 
                    : analysis.marketPosition.percentile > 70 
                      ? 'Above average market value'
                      : 'Average market value'}
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Key Metrics */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">Key Metrics</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Price/SqFt</div>
                <div className="font-medium">{formatCurrency(analysis.metrics.pricePerSqFt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Age</div>
                <div className="font-medium">{analysis.metrics.propertyAge} years</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Value/Land</div>
                <div className="font-medium">{analysis.metrics.valueToLandRatio.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}