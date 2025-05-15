import React from 'react';
import { RegressionModel, calculateVariableImportance } from '@/services/regressionService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/custom-tooltip';

export interface CoefficientImpactChartProps {
  model: RegressionModel;
  className?: string;
}

export function CoefficientImpactChart({ model, className }: CoefficientImpactChartProps) {
  // Calculate variable importance scores
  const variableImportance = calculateVariableImportance(model);
  
  // Format data for the chart (excluding intercept)
  const chartData = Object.keys(model.coefficients)
    .filter(variable => variable !== '(Intercept)')
    .map(variable => {
      const coefficient = model.coefficients[variable];
      const importance = variableImportance[variable] || 0;
      const isSignificant = model.pValues[variable] < 0.05;
      
      return {
        variable,
        coefficient,
        absCoefficient: Math.abs(coefficient),
        importance,
        isSignificant,
        pValue: model.pValues[variable],
      };
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8); // Only show top 8 variables by importance
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Variable Impact</CardTitle>
          <Tooltip
            content={
              <p className="max-w-[250px]">
                This chart shows the relative importance of each variable in the model.
                Larger bars indicate variables with greater impact on the predicted value.
                The color indicates the direction of the relationship.
              </p>
            }
            placement="left"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </Tooltip>
        </div>
        <CardDescription>
          Relative importance of predictors in the model
        </CardDescription>
      </CardHeader>
      
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              label={{
                value: 'Relative Importance',
                position: 'insideBottom',
                offset: -5
              }}
            />
            <YAxis
              dataKey="variable"
              type="category"
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Legend />
            <Bar
              dataKey="importance"
              name="Importance Score"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.coefficient > 0 ? '#22c55e' : '#ef4444'}
                  fillOpacity={entry.isSignificant ? 1 : 0.6}
                  stroke={entry.isSignificant ? '#000' : 'none'}
                  strokeWidth={entry.isSignificant ? 1 : 0}
                />
              ))}
            </Bar>
            <Tooltip
              wrapperStyle={{ zIndex: 1000 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                      <p className="font-semibold">{data.variable}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-sm">
                        <span className="text-muted-foreground">Coefficient:</span>
                        <span className={data.coefficient > 0 ? 'text-green-600' : 'text-red-600'}>
                          {data.coefficient.toFixed(4)}
                        </span>
                        
                        <span className="text-muted-foreground">p-value:</span>
                        <span>
                          {data.pValue < 0.001 ? '< 0.001' : data.pValue.toFixed(3)}
                          {data.isSignificant && ' (significant)'}
                        </span>
                        
                        <span className="text-muted-foreground">Importance:</span>
                        <span>{(data.importance * 100).toFixed(1)}%</span>
                        
                        <span className="text-muted-foreground">Effect:</span>
                        <span>{data.coefficient > 0 ? 'Positive' : 'Negative'}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}