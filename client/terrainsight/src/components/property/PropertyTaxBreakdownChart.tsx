import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TaxEstimateBreakdown } from './PropertyTaxEstimator';
import { formatCurrency } from '@/lib/utils';

interface PropertyTaxBreakdownChartProps {
  breakdown: TaxEstimateBreakdown;
}

const COLORS = [
  '#0088FE', // County - Blue
  '#00C49F', // City - Teal
  '#FFBB28', // School District - Yellow
  '#FF8042', // Fire District - Orange
  '#8884D8', // Library District - Purple
  '#82CA9D', // Hospital District - Green
  '#A4DE6C', // Port District - Light Green
  '#D0ED57', // State School - Lime
];

const PropertyTaxBreakdownChart: React.FC<PropertyTaxBreakdownChartProps> = ({ breakdown }) => {
  // Prepare chart data from the breakdown
  const data = [
    { name: 'County', value: breakdown.county },
    { name: 'City', value: breakdown.city },
    { name: 'School District', value: breakdown.schoolDistrict },
    { name: 'Fire District', value: breakdown.fireDistrict },
    { name: 'Library District', value: breakdown.libraryDistrict },
    { name: 'Hospital District', value: breakdown.hospitalDistrict },
    { name: 'Port District', value: breakdown.portDistrict },
    { name: 'State School', value: breakdown.stateSchool },
  ].filter(item => item.value > 0); // Only include taxes with values > 0

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border p-2 rounded-md shadow-sm">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-muted-foreground">
            {((data.value / breakdown.total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Format for the legend
  const renderLegendText = (value: string, entry: any) => {
    const { payload } = entry;
    return (
      <span className="text-xs">
        {value}: {formatCurrency(payload.value)} 
        ({((payload.value / breakdown.total) * 100).toFixed(1)}%)
      </span>
    );
  };

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium mb-2 text-center">Tax Breakdown</h4>
      
      {data.length > 0 ? (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                label={(entry) => `${((entry.value / breakdown.total) * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                formatter={renderLegendText}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center p-4 text-sm text-muted-foreground">
          No tax data available to display.
        </div>
      )}
      
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>Exemptions Applied: {formatCurrency(breakdown.exemptions.total)}</p>
        <p>Total Annual Tax: {formatCurrency(breakdown.total)}</p>
      </div>
    </div>
  );
};

export default PropertyTaxBreakdownChart;