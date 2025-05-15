import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { Property } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PropertyComparisonChartProps {
  baseProperty: Property;
  comparisonProperties: Property[];
  label: string;
  formatter: (value: number) => string;
  valueSelector: (property: Property) => number;
  onClick?: (property: Property) => void;
}

export function PropertyComparisonChart({
  baseProperty,
  comparisonProperties,
  label,
  formatter,
  valueSelector,
  onClick
}: PropertyComparisonChartProps) {
  const chartRef = useRef<ChartJS>(null);
  
  // Prepare data for the chart
  const allProperties = [baseProperty, ...comparisonProperties];
  const labels = allProperties.map(p => p.address.split(' ').slice(-1)[0]); // Use last part of address as label
  
  // Extract values using the provided selector
  const values = allProperties.map(valueSelector);
  
  // Determine colors - highlight the base property
  const backgroundColor = allProperties.map((p, i) => 
    p.id === baseProperty.id ? 'rgba(99, 102, 241, 0.8)' : 'rgba(156, 163, 175, 0.6)'
  );
  
  const borderColor = allProperties.map((p, i) => 
    p.id === baseProperty.id ? 'rgb(79, 70, 229)' : 'rgb(107, 114, 128)'
  );
  
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  };
  
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatter(context.parsed.y);
          },
          title: function(tooltipItems) {
            const index = tooltipItems[0].dataIndex;
            return allProperties[index].address;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return formatter(value as number);
          }
        }
      }
    }
  };
  
  // Handle click on chart elements
  const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartRef.current || !onClick) return;
    
    const elements = getElementAtEvent(chartRef.current, event);
    if (elements.length === 0) return;
    
    const { datasetIndex, index } = elements[0];
    onClick(allProperties[index]);
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div style={{ height: '250px', position: 'relative' }}>
          <Bar
            ref={chartRef}
            data={chartData}
            options={options}
            onClick={onClick ? handleClick : undefined}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}