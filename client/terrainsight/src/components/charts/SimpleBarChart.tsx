import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
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

// Register the components needed for the chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SimpleBarChartProps {
  data: number[];
  labels: string[];
  title?: string;
  height?: number;
  width?: number;
  colorPrimary?: string;
  colorSecondary?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  labels,
  title = 'Chart',
  height = 300,
  width = 600,
  colorPrimary = 'rgba(59, 130, 246, 0.8)',  // Blue primary
  colorSecondary = 'rgba(59, 130, 246, 0.3)', // Blue secondary
}) => {
  // Derive chart data from props
  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: colorPrimary,
        borderColor: colorSecondary,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  }), [data, labels, title, colorPrimary, colorSecondary]);

  // Configure chart options
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumSignificantDigits: 3,
            }).format(value as number);
          }
        }
      },
    },
  };

  // Show "No data" message if there's no data
  if (!data || data.length === 0 || !labels || labels.length === 0) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center border rounded-md bg-muted/10"
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default SimpleBarChart;