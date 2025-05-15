import React from 'react';
import { HeatMapSettings, MarketTrendMetric } from './HeatMapLayer';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface HeatMapLegendProps {
  settings: HeatMapSettings;
  visible: boolean;
  onClose: () => void;
}

export const HeatMapLegend: React.FC<HeatMapLegendProps> = ({
  settings,
  visible,
  onClose
}) => {
  if (!visible || !settings.showLegend) return null;
  
  // Format values for display
  const formatValue = (value: number, metric: MarketTrendMetric): string => {
    switch(metric) {
      case 'value':
        return `$${value.toLocaleString()}`;
      case 'pricePerSqFt':
        return `$${value.toLocaleString()}/sqft`;
      case 'salesVolume':
        return value.toString();
      case 'valueChange':
        return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
      case 'daysOnMarket':
        return `${value} days`;
      default:
        return value.toString();
    }
  };
  
  // Get label for metric
  const getMetricLabel = (metric: MarketTrendMetric): string => {
    switch(metric) {
      case 'value':
        return 'Property Value';
      case 'pricePerSqFt':
        return 'Price per Sq Ft';
      case 'salesVolume':
        return 'Sales Volume';
      case 'valueChange':
        return 'Value Change %';
      case 'daysOnMarket':
        return 'Days on Market';
      default:
        return 'Value';
    }
  };
  
  // Create gradient style
  const getGradientStyle = () => {
    const gradientStops = Object.entries(settings.gradient)
      .map(([stop, color]) => `${color} ${parseFloat(stop) * 100}%`)
      .join(', ');
    
    return {
      background: `linear-gradient(to right, ${gradientStops})`
    };
  };
  
  // Calculate legend ticks based on gradient
  const getLegendTicks = () => {
    // Get max value or use 100 as default
    const maxValue = settings.maxIntensity || 100;
    
    // Create ticks based on gradient stops
    return Object.keys(settings.gradient).map(stop => {
      const percentage = parseFloat(stop);
      const value = maxValue * percentage;
      return {
        position: `${percentage * 100}%`,
        value: formatValue(value, settings.metric)
      };
    });
  };
  
  const ticks = getLegendTicks();
  
  return (
    <Card className="absolute bottom-8 left-8 p-3 shadow-lg z-[1000] max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">{getMetricLabel(settings.metric)}</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close legend"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="h-4 w-full rounded-sm mb-1" style={getGradientStyle()}></div>
      
      <div className="relative h-6 w-full">
        {ticks.map((tick, index) => (
          <div 
            key={index} 
            className="absolute transform -translate-x-1/2"
            style={{ left: tick.position }}
          >
            <div className="h-2 border-l border-gray-400 w-[1px]"></div>
            <div className="text-xs whitespace-nowrap">{tick.value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default HeatMapLegend;