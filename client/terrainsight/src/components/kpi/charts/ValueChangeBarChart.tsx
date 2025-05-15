import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { formatCurrency, formatPercentage } from '../../../lib/utils';
import { ValueChange } from '../../../services/kpi/kpiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ValueChangeBarChartProps {
  data: ValueChange[];
  className?: string;
  sortBy?: 'absolute' | 'percentage';
}

/**
 * Bar chart showing value changes over time
 */
export const ValueChangeBarChart: React.FC<ValueChangeBarChartProps> = ({
  data,
  className = '',
  sortBy = 'percentage'
}) => {
  // Sort the data based on the sortBy parameter
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'absolute') {
      return Math.abs(b.changeAmount) - Math.abs(a.changeAmount);
    } else {
      return Math.abs(b.changePercentage) - Math.abs(a.changePercentage);
    }
  }).slice(0, 6); // Only show top 6 regions
  
  // Format the data for Chart.js
  const chartData = {
    labels: sortedData.map(item => item.propertyType),
    datasets: [
      {
        label: 'Value Change (%)',
        data: sortedData.map(item => item.changePercentage),
        backgroundColor: sortedData.map(item => 
          item.changePercentage > 0 
            ? 'rgba(34, 197, 94, 0.6)'
            : 'rgba(239, 68, 68, 0.6)'
        ),
        borderColor: sortedData.map(item => 
          item.changePercentage > 0 
            ? 'rgba(34, 197, 94, 1)'
            : 'rgba(239, 68, 68, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 20
      }
    ]
  };
  
  // Chart options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: function(context) {
            return [
              `Percentage Change: ${context.parsed.x > 0 ? '+' : ''}${formatPercentage(context.parsed.x)}`,
              `Absolute Change: ${formatCurrency(sortedData[context.dataIndex].changeAmount)}`,
              `Current Value: ${formatCurrency(sortedData[context.dataIndex].currentValue)}`,
              `Previous Value: ${formatCurrency(sortedData[context.dataIndex].previousValue)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value: any) {
            const numValue = typeof value === 'number' ? value : parseFloat(String(value));
            return `${numValue > 0 ? '+' : ''}${numValue.toFixed(1)}%`;
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };
  
  return (
    <div className={`h-full ${className}`}>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-gray-500">No value change data available</p>
        </div>
      ) : (
        <Bar 
          data={chartData} 
          options={options} 
          aria-label="Value change chart"
        />
      )}
    </div>
  );
};