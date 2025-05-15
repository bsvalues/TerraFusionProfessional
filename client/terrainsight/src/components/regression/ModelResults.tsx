import React from 'react';
import { RegressionModel } from '@/services/regressionService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface ModelResultsProps {
  model: RegressionModel;
  className?: string;
}

export function ModelResults({ model, className }: ModelResultsProps) {
  const topVariables = [...model.usedVariables]
    .filter(variable => variable !== '(Intercept)')
    .sort((a, b) => {
      // Sort by p-value first (more significant variables first)
      const pValueDiff = model.pValues[a] - model.pValues[b];
      if (Math.abs(pValueDiff) > 0.001) return pValueDiff;
      
      // If p-values are similar, sort by absolute coefficient value (larger effect first)
      return Math.abs(model.coefficients[b]) - Math.abs(model.coefficients[a]);
    })
    .slice(0, 5); // Only show top 5 variables
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{model.modelName || 'Regression Model'}</CardTitle>
            <CardDescription>
              {model.regressionType} regression • Target: {model.targetVariable}
            </CardDescription>
          </div>
          <Badge variant={model.rSquared > 0.7 ? 'default' : model.rSquared > 0.5 ? 'secondary' : 'outline'}>
            R² = {model.rSquared.toFixed(3)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Key Variables</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable</TableHead>
                  <TableHead>Coefficient</TableHead>
                  <TableHead className="text-right">p-value</TableHead>
                  <TableHead className="text-right">Significance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">(Intercept)</TableCell>
                  <TableCell>{model.coefficients['(Intercept)'].toFixed(4)}</TableCell>
                  <TableCell className="text-right">{formatPValue(model.pValues['(Intercept)'])}</TableCell>
                  <TableCell className="text-right">{getSignificanceStars(model.pValues['(Intercept)'])}</TableCell>
                </TableRow>
                
                {topVariables.map(variable => (
                  <TableRow key={variable}>
                    <TableCell className="font-medium">{variable}</TableCell>
                    <TableCell>{model.coefficients[variable].toFixed(4)}</TableCell>
                    <TableCell className="text-right">{formatPValue(model.pValues[variable])}</TableCell>
                    <TableCell className="text-right">{getSignificanceStars(model.pValues[variable])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Model Information</h3>
              <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                <dt className="text-muted-foreground">Model Type:</dt>
                <dd>{model.regressionType}</dd>
                
                <dt className="text-muted-foreground">Target:</dt>
                <dd>{model.targetVariable}</dd>
                
                <dt className="text-muted-foreground">Sample Size:</dt>
                <dd>{model.actualValues.length} properties</dd>
                
                <dt className="text-muted-foreground">Variables:</dt>
                <dd>{model.usedVariables.length - 1} predictors</dd>
              </dl>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Fit Statistics</h3>
              <dl className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
                <dt className="text-muted-foreground">R²:</dt>
                <dd>{model.rSquared.toFixed(4)}</dd>
                
                <dt className="text-muted-foreground">Adjusted R²:</dt>
                <dd>{model.adjustedRSquared.toFixed(4)}</dd>
                
                <dt className="text-muted-foreground">RMSE:</dt>
                <dd>{formatCurrency(model.rootMeanSquareError)}</dd>
                
                <dt className="text-muted-foreground">MAPE:</dt>
                <dd>{model.meanAbsolutePercentageError.toFixed(2)}%</dd>
              </dl>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Interpretation</h3>
            <p className="text-sm text-muted-foreground">
              {generateInterpretation(model)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format p-values
function formatPValue(pValue: number): string {
  if (pValue < 0.001) return '<0.001';
  return pValue.toFixed(3);
}

// Helper function to get significance stars
function getSignificanceStars(pValue: number): string {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  if (pValue < 0.1) return '.';
  return '';
}

// Helper function to generate model interpretation
function generateInterpretation(model: RegressionModel): string {
  const mostSignificantVariable = [...model.usedVariables]
    .filter(v => v !== '(Intercept)')
    .sort((a, b) => model.pValues[a] - model.pValues[b])[0];
  
  const coefficientSign = model.coefficients[mostSignificantVariable] > 0 ? 'positive' : 'negative';
  const rSquaredQuality = model.rSquared > 0.7 ? 'strong' : model.rSquared > 0.5 ? 'moderate' : 'weak';
  
  return `This ${model.regressionType} model explains ${(model.rSquared * 100).toFixed(1)}% of variation in ${model.targetVariable} (${rSquaredQuality} fit). ${mostSignificantVariable} has the most significant effect with a ${coefficientSign} relationship (p=${formatPValue(model.pValues[mostSignificantVariable])}). For every one unit increase in ${mostSignificantVariable}, ${model.targetVariable} changes by ${Math.abs(model.coefficients[mostSignificantVariable]).toFixed(4)} units, holding other factors constant.`;
}