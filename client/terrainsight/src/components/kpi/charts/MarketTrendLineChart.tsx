import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { formatCurrency, formatPercentage, formatDate } from '../../../lib/utils';
import { MarketTrend } from '../../../services/kpi/kpiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MarketTrendLineChartProps {
  data: MarketTrend[];
  view: 'value' | 'volume';
}

/**
 * Line chart showing market trends over time
 */
export const MarketTrendLineChart: React.FC<MarketTrendLineChartProps> = ({
  data,
  view
}) => {
  // Choose data based on view
  const chartValues = view === 'value' 
    ? data.map(d => d.averageValue)
    : data.map(d => d.salesVolume);
  
  // Format the chart data
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: view === 'value' ? 'Average Value' : 'Sales Volume',
        data: chartValues,
        borderColor: view === 'value' ? 'rgba(99, 102, 241, 1)' : 'rgba(52, 211, 153, 1)',
        backgroundColor: view === 'value' 
          ? 'rgba(99, 102, 241, 0.2)' 
          : 'rgba(52, 211, 153, 0.2)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: view === 'value' ? 'rgba(99, 102, 241, 1)' : 'rgba(52, 211, 153, 1)',
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  };
  
  // Chart options
  const options: ChartOptions<'line'> = {
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
          title: function(context) {
            // Format the date in the tooltip
            const dateStr = context[0].label;
            const date = new Date(dateStr);
            return formatDate(date, { year: 'numeric', month: 'long' });
          },
          label: function(context) {
            if (view === 'value') {
              const trend = data[context.dataIndex];
              return [
                `Value: ${formatCurrency(trend.averageValue)}`,
                `Change: ${trend.percentageChange > 0 ? '+' : ''}${formatPercentage(trend.percentageChange)}`,
                `Volume: ${trend.salesVolume} sales`
              ];
            } else {
              const trend = data[context.dataIndex];
              return [
                `Volume: ${trend.salesVolume} sales`,
                `Avg. Value: ${formatCurrency(trend.averageValue)}`
              ];
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month',
          displayFormats: {
            month: 'MMM'
          }
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: function(value) {
            if (view === 'value') {
              return formatCurrency(Number(value), { notation: 'compact' });
            } else {
              return value;
            }
          }
        }
      }
    }
  };
  
  return (
    <div className="h-full">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-gray-500">No trend data available</p>
        </div>
      ) : (
        <Line 
          data={chartData} 
          options={options} 
          aria-label="Market trend chart"
        />
      )}
    </div>
  );
};