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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ValuationDistributionChartProps {
  data: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Bar chart showing distribution of property values
 */
export const ValuationDistributionChart: React.FC<ValuationDistributionChartProps> = ({
  data
}) => {
  const chartData = {
    labels: data.map(item => item.range),
    datasets: [
      {
        label: 'Property Count',
        data: data.map(item => item.count),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 30
      }
    ]
  };
  
  const options: ChartOptions<'bar'> = {
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
              `Count: ${context.raw} properties`,
              `Percentage: ${formatPercentage(data[context.dataIndex].percentage)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 0,
          autoSkip: false,
          callback: function(value, index) {
            // Show abbreviated labels
            const label = data[index].range;
            const parts = label.split(' - ');
            if (parts.length === 2) {
              return parts[0].substring(0, 6) + '...';
            }
            return label;
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
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
    <div className="h-full">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-gray-500">No valuation data available</p>
        </div>
      ) : (
        <Bar 
          data={chartData} 
          options={options} 
          aria-label="Valuation distribution chart"
        />
      )}
    </div>
  );
};