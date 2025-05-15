import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Property } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController
);

interface MarketPositionScatterProps {
  baseProperty: Property;
  selectedProperties: Property[];
  allProperties: Property[];
  xAxisProperty: 'squareFeet' | 'yearBuilt' | 'lotSize';
}

export function MarketPositionScatter({
  baseProperty,
  selectedProperties,
  allProperties,
  xAxisProperty
}: MarketPositionScatterProps) {
  const chartRef = useRef(null);
  
  // Extract the appropriate property values
  const getXValue = (property: Property): number => {
    const value = property[xAxisProperty];
    return typeof value === 'number' ? value : 0;
  };
  
  const getYValue = (property: Property): number => {
    if (!property.value) return 0;
    
    return typeof property.value === 'string'
      ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
      : property.value;
  };
  
  // Convert properties to scatter plot data points
  const marketData = allProperties
    .filter(p => p.id !== baseProperty.id && !selectedProperties.some(s => s.id === p.id))
    .map(property => ({
      x: getXValue(property),
      y: getYValue(property)
    }))
    .filter(point => point.x > 0 && point.y > 0);
  
  const compareData = selectedProperties
    .filter(p => p.id !== baseProperty.id)
    .map(property => ({
      x: getXValue(property),
      y: getYValue(property)
    }))
    .filter(point => point.x > 0 && point.y > 0);
  
  const baseData = [{
    x: getXValue(baseProperty),
    y: getYValue(baseProperty)
  }].filter(point => point.x > 0 && point.y > 0);
  
  // Define scatter plot data
  const data: ChartData<'scatter'> = {
    datasets: [
      {
        label: 'Market',
        data: marketData,
        backgroundColor: 'rgba(200, 200, 200, 0.5)',
        pointRadius: 4,
      },
      {
        label: 'Similar Properties',
        data: compareData,
        backgroundColor: 'rgba(99, 132, 255, 0.6)',
        pointRadius: 6,
      },
      {
        label: 'Base Property',
        data: baseData,
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        pointRadius: 8,
        pointStyle: 'circle',
      }
    ]
  };
  
  // Configure chart options
  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisProperty === 'squareFeet' 
            ? 'Square Feet'
            : xAxisProperty === 'yearBuilt'
              ? 'Year Built'
              : 'Lot Size'
        },
        ticks: {
          callback: function(value) {
            if (xAxisProperty === 'yearBuilt') {
              return value;
            }
            
            return new Intl.NumberFormat('en-US').format(value as number);
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Property Value'
        },
        ticks: {
          callback: function(value) {
            return formatCurrency(value as number, { notation: 'compact' });
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let xLabel = '';
            
            if (xAxisProperty === 'squareFeet') {
              xLabel = `${new Intl.NumberFormat().format(context.parsed.x)} sq.ft.`;
            } else if (xAxisProperty === 'yearBuilt') {
              xLabel = `Built ${context.parsed.x}`;
            } else {
              xLabel = `Lot ${new Intl.NumberFormat().format(context.parsed.x)} sq.ft.`;
            }
            
            return `${context.dataset.label}: ${xLabel}, ${formatCurrency(context.parsed.y)}`;
          }
        }
      },
      legend: {
        position: 'top' as const,
      },
    },
  };
  
  // Determine chart title based on x-axis property
  const getChartTitle = () => {
    switch (xAxisProperty) {
      case 'squareFeet':
        return 'Value vs. Square Footage';
      case 'yearBuilt':
        return 'Value vs. Year Built';
      case 'lotSize':
        return 'Value vs. Lot Size';
      default:
        return 'Market Position';
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-medium mb-2">{getChartTitle()}</h3>
        <div style={{ height: '300px', position: 'relative' }}>
          <Scatter
            ref={chartRef}
            data={data}
            options={options}
          />
        </div>
      </CardContent>
    </Card>
  );
}