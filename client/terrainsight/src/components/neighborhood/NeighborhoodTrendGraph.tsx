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
  ChartOptions
} from 'chart.js';
import { NeighborhoodTimeline, NeighborhoodDataPoint } from '../../services/neighborhoodComparisonReportService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Generate a consistent color scheme for neighborhoods
const getNeighborhoodColor = (index: number) => {
  const colors = [
    'rgba(75, 192, 192, 1)',   // Teal
    'rgba(255, 99, 132, 1)',   // Pink
    'rgba(54, 162, 235, 1)',   // Blue
    'rgba(255, 159, 64, 1)',   // Orange
    'rgba(153, 102, 255, 1)',  // Purple
    'rgba(255, 205, 86, 1)',   // Yellow
    'rgba(201, 203, 207, 1)',  // Grey
    'rgba(0, 128, 0, 1)',      // Green
    'rgba(139, 69, 19, 1)',    // Brown
    'rgba(0, 0, 139, 1)',      // Dark Blue
  ];
  
  return colors[index % colors.length];
};

export enum TrendMetric {
  VALUE = 'value',
  PERCENT_CHANGE = 'percentChange',
  TRANSACTION_COUNT = 'transactionCount'
}

interface NeighborhoodTrendGraphProps {
  neighborhoods: NeighborhoodTimeline[];
  selectedNeighborhoods: string[];
  metric: TrendMetric;
  title?: string;
  height?: number;
  className?: string;
}

export const NeighborhoodTrendGraph: React.FC<NeighborhoodTrendGraphProps> = ({
  neighborhoods,
  selectedNeighborhoods,
  metric,
  title = 'Neighborhood Trends',
  height = 300,
  className = ''
}) => {
  // Filter neighborhoods based on selection
  const filteredNeighborhoods = neighborhoods.filter(n => selectedNeighborhoods.includes(n.id));
  
  // Get all years from the first neighborhood (assuming all have same years)
  const years = filteredNeighborhoods.length > 0 
    ? filteredNeighborhoods[0].data.map((d: NeighborhoodDataPoint) => d.year) 
    : [];
  
  // Prepare chart data
  const chartData = {
    labels: years,
    datasets: filteredNeighborhoods.map((neighborhood, index) => {
      const color = getNeighborhoodColor(index);
      return {
        label: neighborhood.name,
        data: neighborhood.data.map((d: NeighborhoodDataPoint) => d[metric]),
        borderColor: color,
        backgroundColor: color.replace('1)', '0.2)'),
        tension: 0.3,
        pointRadius: 4
      };
    })
  };
  
  // Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: metric !== TrendMetric.VALUE,
        title: {
          display: true,
          text: getMetricLabel(metric)
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`} style={{ height }}>
      {filteredNeighborhoods.length > 0 ? (
        <Line data={chartData} options={options} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500" data-testid="trend-placeholder">
          Select neighborhoods to view trends
        </div>
      )}
    </div>
  );
};

// Helper function to get a human-readable label for each metric
function getMetricLabel(metric: TrendMetric): string {
  switch (metric) {
    case TrendMetric.VALUE:
      return 'Average Value ($)';
    case TrendMetric.PERCENT_CHANGE:
      return 'Annual Growth Rate (%)';
    case TrendMetric.TRANSACTION_COUNT:
      return 'Number of Transactions';
    default:
      return '';
  }
}