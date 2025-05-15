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
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ZAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { Tooltip } from '@/components/ui/custom-tooltip';
import { Info } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface PredictionScatterPlotProps {
  model: RegressionModel;
  className?: string;
}

export function PredictionScatterPlot({ model, className }: PredictionScatterPlotProps) {
  // Prepare data for the scatter plot
  const data = model.actualValues.map((actual, i) => ({
    actual,
    predicted: model.predictedValues[i],
    residual: model.residuals[i],
    percentError: (model.residuals[i] / actual) * 100,
  }));
  
  // Calculate axis bounds
  const values = [...model.actualValues, ...model.predictedValues];
  const minValue = Math.min(...values) * 0.9;
  const maxValue = Math.max(...values) * 1.1;
  
  // Calculate error statistics
  const under10Pct = data.filter(d => Math.abs(d.percentError) < 10).length;
  const under20Pct = data.filter(d => Math.abs(d.percentError) < 20).length;
  const totalPoints = data.length;
  const accuracyPercent10 = ((under10Pct / totalPoints) * 100).toFixed(1);
  const accuracyPercent20 = ((under20Pct / totalPoints) * 100).toFixed(1);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Prediction Accuracy</CardTitle>
          <Tooltip
            content={
              <p className="max-w-[250px]">
                This scatter plot shows actual vs. predicted values. 
                Perfect predictions would fall on the diagonal line.
                Points are colored by error percentage.
              </p>
            }
            placement="left"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </Tooltip>
        </div>
        <CardDescription>
          Actual vs. predicted property values
        </CardDescription>
      </CardHeader>
      
      <CardContent className="h-[350px]">
        <div className="flex flex-col h-full">
          <ResponsiveContainer width="100%" height="85%">
            <ScatterChart
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                type="number"
                dataKey="actual" 
                name="Actual Value" 
                domain={[minValue, maxValue]}
                tickFormatter={(value) => formatCurrency(value)}
                label={{
                  value: 'Actual Value',
                  position: 'insideBottom',
                  offset: -10
                }}
                scale="log"
              />
              <YAxis 
                type="number"
                dataKey="predicted" 
                name="Predicted Value" 
                domain={[minValue, maxValue]}
                tickFormatter={(value) => formatCurrency(value)}
                label={{
                  value: 'Predicted Value',
                  angle: -90,
                  position: 'insideLeft',
                  offset: 0
                }}
                scale="log"
              />
              <ZAxis 
                type="number"
                dataKey="percentError"
                name="Error %"
                range={[20, 200]}
              />
              <ReferenceLine 
                segment={[
                  { x: minValue, y: minValue },
                  { x: maxValue, y: maxValue }
                ]}
                stroke="#888"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              <ReferenceLine 
                segment={[
                  { x: minValue, y: minValue * 1.1 },
                  { x: maxValue, y: maxValue * 1.1 }
                ]}
                stroke="#888"
                strokeWidth={0.5}
                strokeDasharray="3 3"
              />
              <ReferenceLine 
                segment={[
                  { x: minValue, y: minValue * 0.9 },
                  { x: maxValue, y: maxValue * 0.9 }
                ]}
                stroke="#888"
                strokeWidth={0.5}
                strokeDasharray="3 3"
              />
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
                        <p className="font-medium">Comparison</p>
                        <p>Actual: {formatCurrency(data.actual)}</p>
                        <p>Predicted: {formatCurrency(data.predicted)}</p>
                        <p>Difference: {formatCurrency(data.residual)}</p>
                        <p>Error: {data.percentError.toFixed(1)}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend />
              <Scatter 
                name="Properties"
                data={data} 
                fill="#8884d8"
                shape="circle"
                fillOpacity={0.7}
              />
            </ScatterChart>
          </ResponsiveContainer>
          
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>R²: {model.rSquared.toFixed(3)}</span>
            <span>Within ±10%: {accuracyPercent10}%</span>
            <span>Within ±20%: {accuracyPercent20}%</span>
            <span>MAPE: {model.meanAbsolutePercentageError.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}