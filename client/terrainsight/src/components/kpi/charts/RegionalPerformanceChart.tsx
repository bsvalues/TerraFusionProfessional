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
import { formatCurrency } from '../../../lib/utils';
import { RegionalPerformance } from '../../../services/kpi/kpiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RegionalPerformanceChartProps {
  data: RegionalPerformance[];
  className?: string;
  sortBy?: 'value' | 'growth' | 'count';
}

/**
 * Horizontal bar chart showing regional performance
 */
export const RegionalPerformanceChart: React.FC<RegionalPerformanceChartProps> = ({
  data,
  className = '',
  sortBy = 'value'
}) => {
  // Sort the data based on the sortBy parameter
  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.averageValue - a.averageValue;
      case 'growth':
        return b.growth - a.growth;
      case 'count':
        return b.propertyCount - a.propertyCount;
      default:
        return b.averageValue - a.averageValue;
    }
  }).slice(0, 8); // Only show top 8 regions
  
  // Format the data for Chart.js
  const chartData = {
    labels: sortedData.map(item => item.region),
    datasets: [
      {
        axis: 'y',
        label: 'Average Value',
        data: sortedData.map(item => item.averageValue),
        backgroundColor: sortedData.map(item => 
          item.trend === 'up' 
            ? 'rgba(34, 197, 94, 0.6)'
            : item.trend === 'down'
              ? 'rgba(239, 68, 68, 0.6)'
              : 'rgba(234, 179, 8, 0.6)'
        ),
        borderColor: sortedData.map(item => 
          item.trend === 'up' 
            ? 'rgba(34, 197, 94, 1)'
            : item.trend === 'down'
              ? 'rgba(239, 68, 68, 1)'
              : 'rgba(234, 179, 8, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 20
      }
    ]
  };
  
  // Chart options
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
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
              `Average Value: ${formatCurrency(context.parsed.x)}`,
              `Properties: ${sortedData[context.dataIndex].propertyCount}`,
              `Growth: ${sortedData[context.dataIndex].growth > 0 ? '+' : ''}${sortedData[context.dataIndex].growth}%`
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
            return formatCurrency(numValue);
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
          <p className="text-gray-500">No regional data available</p>
        </div>
      ) : (
        <Bar 
          data={chartData} 
          options={options} 
          aria-label="Regional performance chart"
        />
      )}
    </div>
  );
};