import React from 'react';
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
  TimeScale,
  ChartData,
  ChartOptions,
  Point,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { TimeSeriesDataPoint, ForecastDataPoint } from '../../services/timeseries/timeSeriesAnalysisService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  forecastData?: ForecastDataPoint[];
  showForecast?: boolean;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

export function TimeSeriesChart({
  data,
  forecastData = [],
  showForecast = false,
  title = 'Property Value Trend',
  description,
  height = 300,
  className
}: TimeSeriesChartProps) {
  // Convert time series data to chart.js format
  const chartData: ChartData<'line'> = {
    datasets: []
  };
  
  // Add historical data
  chartData.datasets.push({
    label: 'Historical Value',
    data: data.map(point => ({
      x: point.date.getTime(), // Convert Date to number (timestamp)
      y: point.value
    })),
    borderColor: 'rgb(59, 130, 246)', // Blue
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    pointRadius: 4,
    pointBackgroundColor: 'rgb(59, 130, 246)',
    pointBorderColor: 'white',
    pointHoverRadius: 6,
    tension: 0.3, // Smooth curve
    fill: false
  });
  
  // Add forecast data if available and requested
  if (showForecast && forecastData && forecastData.length > 0) {
    // Main forecast line
    chartData.datasets.push({
      label: 'Forecast',
      data: forecastData.map(point => ({
        x: point.date.getTime(), // Convert Date to number (timestamp)
        y: point.value
      })),
      borderColor: 'rgb(234, 88, 12)', // Orange
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 4,
      pointBackgroundColor: 'rgb(234, 88, 12)',
      pointBorderColor: 'white',
      tension: 0.3,
      fill: false
    });
    
    // If confidence bounds are provided, add range area
    const hasConfidenceBounds = forecastData.some(point => 
      point.lowerBound !== undefined && point.upperBound !== undefined
    );
    
    if (hasConfidenceBounds) {
      // Add area between upper and lower bounds
      chartData.datasets.push({
        label: 'Confidence Range',
        data: forecastData.map(point => ({
          x: point.date.getTime(), // Convert Date to number (timestamp)
          y: point.lowerBound || 0
        })),
        borderColor: 'rgba(234, 88, 12, 0)',
        pointRadius: 0,
        tension: 0.3,
        fill: false
      });
      
      chartData.datasets.push({
        label: 'Upper Bound',
        data: forecastData.map(point => ({
          x: point.date.getTime(), // Convert Date to number (timestamp)
          y: point.upperBound || 0
        })),
        borderColor: 'rgba(234, 88, 12, 0)',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        pointRadius: 0,
        tension: 0.3,
        fill: '-1' // Fill to the previous dataset (lower bound)
      });
    }
  }
  
  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'year',
          displayFormats: {
            year: 'yyyy'
          }
        },
        title: {
          display: true,
          text: 'Year'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Property Value ($)'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(Number(value), false);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#374151',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const interpolated = data[context.dataIndex]?.interpolated;
            
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            
            if (value !== null) {
              label += formatCurrency(value);
            }
            
            if (interpolated) {
              label += ' (interpolated)';
            }
            
            return label;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest'
    },
    elements: {
      line: {
        tension: 0.3 // Smoother curves
      }
    }
  };

  // Set a gradient background for the historical data series
  const gradientBg = 'rgba(59, 130, 246, 0.1)';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors duration-200"
            title="More information about chart data"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
              <span className="text-gray-500 text-sm">No data available</span>
            </div>
          ) : (
            <Line
              data={chartData as any}
              options={chartOptions as any}
              height={height}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}