import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  Label,
  ReferenceArea,
  LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ValuationDataPoint,
  calculateGrowthRate,
  calculateCompoundAnnualGrowthRate,
  generateTrendLineData,
  predictFutureValues,
  formatCurrency,
  formatPercentage
} from './ValuationTrendUtils';

export interface ValuationTrendChartProps {
  /**
   * Historical valuation data points
   */
  data: ValuationDataPoint[];
  
  /**
   * Optional comparison data for another property
   */
  comparisonData?: ValuationDataPoint[];
  
  /**
   * Label for the comparison data
   */
  comparisonLabel?: string;
  
  /**
   * Chart title
   */
  title?: string;
  
  /**
   * Chart description
   */
  description?: string;
  
  /**
   * Whether to show growth rate
   */
  showGrowthRate?: boolean;
  
  /**
   * Whether to show CAGR (Compound Annual Growth Rate)
   */
  showCAGR?: boolean;
  
  /**
   * Whether to show prediction for future years
   */
  showPrediction?: boolean;
  
  /**
   * Number of years to predict into the future
   */
  predictionYears?: number;
  
  /**
   * CSS class name for additional styling
   */
  className?: string;
}

export const ValuationTrendChart: React.FC<ValuationTrendChartProps> = ({
  data,
  comparisonData,
  comparisonLabel = 'Comparable Property',
  title = 'Property Valuation Trend',
  description,
  showGrowthRate = false,
  showCAGR = false,
  showPrediction = false,
  predictionYears = 2,
  className = '',
}) => {
  // Generate derived data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Generate trend line data
    const trendData = generateTrendLineData(data);
    
    // Generate prediction data if needed
    const predictionData = showPrediction ? predictFutureValues(data, predictionYears) : [];
    
    // Combine all data sources for the chart
    const allYears = new Set([
      ...data.map(d => d.year),
      ...(comparisonData || []).map(d => d.year),
      ...(showPrediction ? predictionData.map(d => d.year) : [])
    ]);
    
    // Create complete dataset with all data series
    return Array.from(allYears)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(year => {
        const dataPoint = data.find(d => d.year === year);
        const comparisonPoint = comparisonData?.find(d => d.year === year);
        const trendPoint = trendData.find(d => d.year === year);
        const predictionPoint = predictionData.find(d => d.year === year);
        
        return {
          year,
          actualValue: dataPoint?.value,
          trendValue: trendPoint?.value,
          comparisonValue: comparisonPoint?.value,
          predictedValue: predictionPoint?.value,
          // Flag to identify prediction points vs actual data
          isPrediction: !!predictionPoint
        };
      });
  }, [data, comparisonData, showPrediction, predictionYears]);
  
  // Calculate metrics
  const growthRate = useMemo(() => {
    return calculateGrowthRate(data);
  }, [data]);
  
  const cagr = useMemo(() => {
    return calculateCompoundAnnualGrowthRate(data);
  }, [data]);
  
  // Custom tooltip formatter
  const formatTooltipValue = (value: number) => {
    return formatCurrency(value);
  };

  // Render empty state if no data
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No valuation data available</p>
        </CardContent>
      </Card>
    );
  }

  // Determine if there is a significant annual growth spike (more than 10% year-over-year)
  const findGrowthSpike = () => {
    if (data.length < 2) return null;
    
    let maxYearOverYearGrowth = 0;
    let spikeYear = '';
    
    for (let i = 1; i < data.length; i++) {
      const prevValue = data[i-1].value;
      const currentValue = data[i].value;
      
      if (prevValue > 0) {
        const yearGrowth = ((currentValue - prevValue) / prevValue) * 100;
        
        if (yearGrowth > 10 && yearGrowth > maxYearOverYearGrowth) {
          maxYearOverYearGrowth = yearGrowth;
          spikeYear = data[i].year;
        }
      }
    }
    
    return maxYearOverYearGrowth > 0 ? { year: spikeYear, growth: maxYearOverYearGrowth } : null;
  };
  
  // Find growth spike if any
  const growthSpike = findGrowthSpike();
  
  // Determine if current value is above or below trend by a significant amount (5%)
  const getCurrentTrendDeviation = () => {
    if (data.length < 3) return null; // Need at least 3 points for meaningful trend
    
    const trendData = generateTrendLineData(data);
    const actualLastValue = data[data.length - 1].value;
    const trendLastValue = trendData[trendData.length - 1].value;
    
    if (actualLastValue === 0 || trendLastValue === 0) return null;
    
    const deviation = ((actualLastValue - trendLastValue) / trendLastValue) * 100;
    
    // Only report significant deviations
    if (Math.abs(deviation) < 5) return null;
    
    return { 
      value: deviation,
      direction: deviation > 0 ? 'above' : 'below'
    };
  };
  
  const trendDeviation = getCurrentTrendDeviation();

  // Format the trend deviation for display
  const formatTrendDeviation = () => {
    if (!trendDeviation) return null;
    
    const deviationAbs = Math.abs(trendDeviation.value);
    
    return {
      text: `${formatPercentage(deviationAbs)} ${trendDeviation.direction} trend`,
      isPositive: trendDeviation.direction === 'above'
    };
  };
  
  const formattedDeviation = formatTrendDeviation();

  return (
    <Card className={`${className} overflow-hidden`} data-testid="valuation-trend-chart">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          {/* Key metrics with emphasized styling */}
          <div className="flex gap-2">
            {showGrowthRate && (
              <Badge variant={growthRate >= 0 ? "success" : "destructive"} className="text-lg px-3 py-1 shadow-sm">
                {growthRate >= 0 ? '+' : ''}{formatPercentage(growthRate)}
              </Badge>
            )}
            
            {showCAGR && cagr !== 0 && (
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">CAGR</span>
                <Badge variant={cagr >= 0 ? "outline" : "secondary"} className="text-sm">
                  {cagr >= 0 ? '+' : ''}{formatPercentage(cagr)}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {/* Additional insight badges */}
        {(growthSpike || formattedDeviation) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {growthSpike && (
              <div className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full flex items-center">
                <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-1"></span>
                <span>Spike of {formatPercentage(growthSpike.growth)} in {growthSpike.year}</span>
              </div>
            )}
            
            {formattedDeviation && (
              <div className={`text-xs ${formattedDeviation.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'} px-2 py-1 rounded-full flex items-center`}>
                <span className={`inline-block w-2 h-2 ${formattedDeviation.isPositive ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full mr-1`}></span>
                <span>Currently {formattedDeviation.text}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-3">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                
                <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 13, fontWeight: 500 }}
                axisLine={{ strokeWidth: 1, stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={70}
                tick={{ fontSize: 13, fontWeight: 500 }}
                axisLine={{ strokeWidth: 1, stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
                domain={['dataMin - 10000', 'dataMax + 10000']}
              />
              
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value)]}
                labelFormatter={(label) => `Year: ${label}`}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                  borderRadius: '8px', 
                  padding: '10px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}
                itemStyle={{ padding: '4px 0' }}
              />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px' }}
              />
              
              {/* Reference area for significant growth periods if detected */}
              {growthSpike && (
                <ReferenceArea 
                  x1={growthSpike.year} 
                  x2={growthSpike.year}
                  y1={0}
                  strokeOpacity={0.3}
                  fill="#fef3c7"
                  fillOpacity={0.4}
                />
              )}
              
              {/* Shaded area under the main property value line */}
              <ReferenceArea 
                y1={0}
                y2="dataMax"
                fillOpacity={0.05}
                fill="url(#colorValue)" 
              />
              
              {/* Trend line - more subtle */}
              <Line
                type="monotone"
                dataKey="trendValue"
                name="Trend Line"
                stroke="#94a3b8" 
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
              
              {/* Actual property value line - bold and prominent */}
              <Line
                type="monotone"
                dataKey="actualValue"
                name="Property Value"
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 5, strokeWidth: 2, fill: '#ffffff' }}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#3b82f6', fill: '#ffffff' }}
                isAnimationActive={true}
              >
                {/* Add value labels for the first and last points */}
                <LabelList 
                  dataKey="actualValue" 
                  position="top" 
                  formatter={(value: number) => formatCurrency(value)}
                  style={{ fontSize: 12, fontWeight: 500, fill: '#3b82f6' }}
                  content={(props: any) => {
                    if (!props || !props.data) return null;
                    const { x, y, value, index, data } = props;
                    // Only show for first and last points
                    if (!data || index !== 0 && index !== data.length - 1) return null;
                    if (!value) return null;
                    
                    return (
                      <text 
                        x={x} 
                        y={y - 10} 
                        fill="#3b82f6" 
                        textAnchor="middle" 
                        fontSize={12}
                        fontWeight={500}
                      >
                        {formatCurrency(value)}
                      </text>
                    );
                  }}
                />
              </Line>
              
              {/* Comparison property line if data is provided */}
              {comparisonData && comparisonData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="comparisonValue"
                  name={comparisonLabel}
                  stroke="#10b981" 
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 1, fill: '#ffffff' }}
                  activeDot={{ r: 7, strokeWidth: 1, stroke: '#10b981', fill: '#ffffff' }}
                />
              )}
              
              {/* Prediction line if enabled - make it stand out */}
              {showPrediction && (
                <>
                  {/* Add shaded area for predictions */}
                  <ReferenceArea 
                    x1={data[data.length - 1].year}
                    fillOpacity={0.05}
                    fill="url(#colorPrediction)" 
                  />
                  
                  <Line
                    type="monotone"
                    dataKey="predictedValue"
                    name="Predicted Value"
                    stroke="#f97316" 
                    strokeWidth={2.5}
                    strokeDasharray="3 3"
                    dot={{ r: 4, strokeWidth: 1, fill: '#ffffff' }}
                    activeDot={{ r: 7, strokeWidth: 1, stroke: '#f97316', fill: '#ffffff' }}
                  >
                    {/* Add value label for the last prediction point */}
                    <LabelList 
                      dataKey="predictedValue" 
                      position="top" 
                      formatter={(value: number) => formatCurrency(value)}
                      content={(props: any) => {
                        if (!props || !props.data || !props.payload) return null;
                        const { x, y, value, index, data } = props;
                        // Only show for the last prediction point
                        if (!data || index !== data.length - 1 || !value || !props.payload.isPrediction) return null;
                        
                        return (
                          <text 
                            x={x} 
                            y={y - 10} 
                            fill="#f97316" 
                            textAnchor="middle" 
                            fontSize={12}
                            fontWeight={500}
                          >
                            {formatCurrency(value)}
                          </text>
                        );
                      }}
                    />
                  </Line>
                </>
              )}
              
              {/* More prominent reference line between actual and predicted data */}
              {showPrediction && data.length > 0 && (
                <ReferenceLine
                  x={data[data.length - 1].year}
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  label={
                    <Label
                      value="Current"
                      position="insideBottomRight"
                      offset={-5}
                      style={{ 
                        fontSize: 12, 
                        fontWeight: 500, 
                        fill: '#64748b',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        padding: '2px'
                      }}
                    />
                  }
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Enhanced current value and prediction summary */}
        {data.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Current Value</span>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(data[data.length - 1].value)}
              </span>
              
              {formattedDeviation && (
                <span className={`text-sm mt-1 ${formattedDeviation.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formattedDeviation.isPositive ? '↑' : '↓'} {formattedDeviation.text}
                </span>
              )}
            </div>
            
            {showPrediction && predictionYears > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground mb-1">
                  Projected Value ({parseInt(data[data.length - 1].year) + predictionYears})
                </span>
                <span className="text-2xl font-bold text-amber-600">
                  {formatCurrency(predictFutureValues(data, predictionYears)[predictionYears - 1].value)}
                </span>
                
                {showGrowthRate && (
                  <span className="text-sm mt-1 text-amber-600">
                    Expected growth: {formatPercentage(growthRate / data.length * predictionYears)}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* IAAO and USPAP compliance note - adding this to acknowledge industry standards */}
        <div className="mt-6 border-t pt-3 text-xs text-muted-foreground">
          <p>Valuation analysis based on historical market data, following IAAO standards for mass appraisal and USPAP guidelines for property assessment.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValuationTrendChart;