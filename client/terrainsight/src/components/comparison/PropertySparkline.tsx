import React from 'react';
import { Property } from '@shared/schema';

interface ValueHistoryPoint {
  year: number;
  value: number;
}

export interface PropertySparklineProps {
  property: Property;
  data: ValueHistoryPoint[];
  width: number;
  height: number;
  showAxis?: boolean;
}

const PropertySparkline: React.FC<PropertySparklineProps> = ({
  property,
  data,
  width,
  height,
  showAxis = false
}) => {
  // If there's no data, return a placeholder
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ width, height }} 
        className="flex items-center justify-center bg-gray-50 text-gray-400 text-xs rounded"
      >
        No historical data
      </div>
    );
  }

  // Find min and max values for scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero
  
  // Find min and max years
  const years = data.map(d => d.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yearRange = maxYear - minYear || 1;
  
  // Calculate padding
  const paddingX = 25;
  const paddingY = showAxis ? 20 : 2;
  const graphWidth = width - (paddingX * 2);
  const graphHeight = height - (paddingY * 2);
  
  // Generate SVG path for the line
  const points = data.map((d, i) => {
    const x = paddingX + ((d.year - minYear) / yearRange) * graphWidth;
    const y = height - paddingY - ((d.value - minValue) / valueRange) * graphHeight;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="property-sparkline">
      {/* Line connecting data points */}
      <polyline
        points={points}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      
      {/* Data points */}
      {data.map((d, i) => {
        const x = paddingX + ((d.year - minYear) / yearRange) * graphWidth;
        const y = height - paddingY - ((d.value - minValue) / valueRange) * graphHeight;
        
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#3b82f6"
          />
        );
      })}
      
      {/* Most recent data point with highlight */}
      {data.length > 0 && (
        <circle
          cx={paddingX + ((data[data.length - 1].year - minYear) / yearRange) * graphWidth}
          cy={height - paddingY - ((data[data.length - 1].value - minValue) / valueRange) * graphHeight}
          r="4"
          fill="#2563eb"
          stroke="#ffffff"
          strokeWidth="1"
        />
      )}
      
      {/* X-axis (years) if showAxis is true */}
      {showAxis && (
        <>
          <line 
            x1={paddingX} 
            y1={height - paddingY} 
            x2={width - paddingX} 
            y2={height - paddingY} 
            stroke="#e5e7eb" 
            strokeWidth="1"
          />
          {data.map((d, i) => {
            const x = paddingX + ((d.year - minYear) / yearRange) * graphWidth;
            
            return (
              <g key={`x-${i}`}>
                <line 
                  x1={x} 
                  y1={height - paddingY} 
                  x2={x} 
                  y2={height - paddingY + 5} 
                  stroke="#9ca3af" 
                  strokeWidth="1"
                />
                <text 
                  x={x} 
                  y={height - 2} 
                  fontSize="10" 
                  textAnchor="middle" 
                  fill="#6b7280"
                >
                  {d.year}
                </text>
              </g>
            );
          })}
        </>
      )}
      
      {/* Y-axis (values) if showAxis is true */}
      {showAxis && (
        <>
          <line 
            x1={paddingX} 
            y1={paddingY} 
            x2={paddingX} 
            y2={height - paddingY} 
            stroke="#e5e7eb" 
            strokeWidth="1"
          />
          <text 
            x={5} 
            y={paddingY + 10} 
            fontSize="10" 
            textAnchor="start" 
            fill="#6b7280"
          >
            ${maxValue.toLocaleString()}
          </text>
          <text 
            x={5} 
            y={height - paddingY - 5} 
            fontSize="10" 
            textAnchor="start" 
            fill="#6b7280"
          >
            ${minValue.toLocaleString()}
          </text>
        </>
      )}
    </svg>
  );
};

export default PropertySparkline;