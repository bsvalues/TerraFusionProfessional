import React from 'react';
import { RegressionModel } from '@/services/regressionService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tooltip } from '@/components/ui/custom-tooltip';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
  Text
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Info } from 'lucide-react';

export interface ResidualHistogramProps {
  model: RegressionModel;
  className?: string;
}

export function ResidualHistogram({ model, className }: ResidualHistogramProps) {
  // Calculate histogram data from residuals
  const residuals = model.residuals;
  
  // Calculate min and max residuals for bin range
  const minResidual = Math.min(...residuals);
  const maxResidual = Math.max(...residuals);
  
  // Calculate bin width using Freedman-Diaconis rule
  // This is a common rule for choosing bin width that takes into account
  // both the spread and sample size
  const n = residuals.length;
  const iqr = calculateIQR(residuals);
  // Default bin width if IQR is too small or dataset is small
  let binWidth = Math.max(2 * iqr / Math.pow(n, 1/3), (maxResidual - minResidual) / 15);
  
  // Ensure we have a reasonable number of bins
  const numBins = Math.min(20, Math.max(5, Math.ceil((maxResidual - minResidual) / binWidth)));
  binWidth = (maxResidual - minResidual) / numBins;
  
  // Calculate histogram data
  const bins: { start: number; end: number; count: number; residuals: number[] }[] = [];
  for (let i = 0; i < numBins; i++) {
    const start = minResidual + i * binWidth;
    const end = minResidual + (i + 1) * binWidth;
    bins.push({
      start,
      end,
      count: 0,
      residuals: []
    });
  }
  
  // Count residuals in each bin
  residuals.forEach(residual => {
    const binIndex = Math.min(
      numBins - 1,
      Math.max(0, Math.floor((residual - minResidual) / binWidth))
    );
    bins[binIndex].count++;
    bins[binIndex].residuals.push(residual);
  });
  
  // Format data for the chart
  const histogramData = bins.map((bin, index) => ({
    bin: index,
    start: bin.start,
    end: bin.end,
    count: bin.count,
    residuals: bin.residuals,
    label: `${formatCurrency(bin.start)} to ${formatCurrency(bin.end)}`,
    mid: (bin.start + bin.end) / 2
  }));
  
  // Calculate histogram statistics
  const totalResiduals = residuals.length;
  const zeroResiduals = residuals.filter(r => Math.abs(r) < 0.001).length;
  const negativeResiduals = residuals.filter(r => r < 0).length;
  const positiveResiduals = residuals.filter(r => r > 0).length;
  
  // Is distribution approximately normal?
  // We'll use a simple check based on percentage of data within 1, 2, and 3 std dev
  const mean = residuals.reduce((sum, val) => sum + val, 0) / totalResiduals;
  const stdDev = Math.sqrt(residuals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totalResiduals);
  
  const within1StdDev = residuals.filter(r => Math.abs(r - mean) <= stdDev).length / totalResiduals;
  const within2StdDev = residuals.filter(r => Math.abs(r - mean) <= 2 * stdDev).length / totalResiduals;
  const within3StdDev = residuals.filter(r => Math.abs(r - mean) <= 3 * stdDev).length / totalResiduals;
  
  // Normal distribution would have ~68% within 1 SD, ~95% within 2 SD, ~99.7% within 3 SD
  const isRoughlyNormal = (
    within1StdDev > 0.58 && within1StdDev < 0.78 &&
    within2StdDev > 0.85 && within2StdDev < 0.98 &&
    within3StdDev > 0.95
  );
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Residual Distribution</CardTitle>
          <Tooltip
            content={
              <p className="max-w-[250px]">
                This histogram shows the distribution of model errors (residuals).
                For a good model, residuals should be normally distributed around zero,
                with minimal outliers.
              </p>
            }
            placement="left"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </Tooltip>
        </div>
        <CardDescription>
          Mean: {formatCurrency(mean)} • StdDev: {formatCurrency(stdDev)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="h-[350px]">
        <div className="flex flex-col h-full">
          <ResponsiveContainer width="100%" height="85%">
            <BarChart
              data={histogramData}
              margin={{ top: 10, right: 10, bottom: 40, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="mid" 
                tickFormatter={(value) => formatCurrency(value)}
                label={{ 
                  value: 'Residual Value',
                  position: 'insideBottom',
                  offset: -10
                }}
              />
              <YAxis
                label={{
                  value: 'Frequency',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' },
                  offset: 0
                }}
              />
              
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const bin = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm text-xs">
                        <p className="font-medium">Range: {formatCurrency(bin.start)} to {formatCurrency(bin.end)}</p>
                        <p>Count: {bin.count} properties</p>
                        <p>Percentage: {((bin.count / totalResiduals) * 100).toFixed(1)}%</p>
                        <p className="text-muted-foreground mt-1">
                          {bin.start <= 0 && bin.end >= 0 ? 'Contains zero point' : ''}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
              />
              
              <ReferenceLine x={0} stroke="#888" strokeWidth={2} />
              <Bar dataKey="count">
                {histogramData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBinColor(entry.start, entry.end)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Negative errors: {negativeResiduals} ({((negativeResiduals / totalResiduals) * 100).toFixed(1)}%)</span>
              <span>Zero errors: {zeroResiduals}</span>
              <span>Positive errors: {positiveResiduals} ({((positiveResiduals / totalResiduals) * 100).toFixed(1)}%)</span>
            </div>
            <div className="mt-1 text-center">
              Distribution is {isRoughlyNormal ? 'approximately normal' : 'not normally distributed'} (68-95-99.7 rule)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Helper function to determine bin color based on its position
  function getBinColor(start: number, end: number) {
    // If bin contains zero, use a neutral color
    if (start <= 0 && end >= 0) {
      return '#94a3b8'; // slate-400
    }
    
    // Negative errors (model overestimates value)
    if (end < 0) {
      // Darker red for greater magnitude
      return start < -stdDev * 2 ? '#ef4444' : '#f87171'; // red-500 : red-400
    }
    
    // Positive errors (model underestimates value)
    if (start > 0) {
      // Darker green for greater magnitude
      return end > stdDev * 2 ? '#22c55e' : '#4ade80'; // green-500 : green-400
    }
    
    // Fallback
    return '#94a3b8'; // slate-400
  }
  
  // Helper function to calculate interquartile range
  function calculateIQR(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    return sorted[q3Index] - sorted[q1Index];
  }
}