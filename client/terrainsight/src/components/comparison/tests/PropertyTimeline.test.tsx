import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropertySparkline from '../PropertySparkline';
import ValuationTrendChart from '../ValuationTrendChart';
import { Property } from '@/shared/schema';
import { ValuationDataPoint } from '../ValuationTrendUtils';

// Mock the recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children, width, height }) => (
      <div data-testid="responsive-container" style={{ width, height }}>{children}</div>
    ),
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    Line: ({ dataKey, stroke, type }) => (
      <div data-testid={`line-${dataKey}`} data-stroke={stroke} data-type={type}></div>
    ),
    Area: ({ dataKey, fill, stroke }) => (
      <div data-testid={`area-${dataKey}`} data-fill={fill} data-stroke={stroke}></div>
    ),
    XAxis: ({ dataKey }) => <div data-testid={`x-axis-${dataKey}`}></div>,
    YAxis: () => <div data-testid="y-axis"></div>,
    CartesianGrid: () => <div data-testid="cartesian-grid"></div>,
    Tooltip: () => <div data-testid="tooltip"></div>,
    Legend: () => <div data-testid="legend"></div>
  };
});

// Sample data for tests
const sampleTrendData: ValuationDataPoint[] = [
  { year: '2019', value: 250000 },
  { year: '2020', value: 275000 },
  { year: '2021', value: 290000 },
  { year: '2022', value: 315000 },
  { year: '2023', value: 350000 },
];

const sampleProperty: Property = {
  id: 1,
  parcelId: 'P12345',
  address: '123 Main St',
  squareFeet: 2000,
  value: '$350,000',
  yearBuilt: 2000,
  owner: 'Test Owner',
  neighborhood: 'Test Neighborhood',
  propertyType: 'Residential'
} as Property;

describe('Property Timeline Components', () => {
  describe('PropertySparkline Component', () => {
    test('renders sparkline with correct data', () => {
      render(<PropertySparkline data={sampleTrendData} height={50} />);
      
      // Check that core components are rendered
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Check sizing
      expect(screen.getByTestId('responsive-container')).toHaveStyle('height: 50px');
    });
    
    test('renders growth indicator when specified', () => {
      render(
        <PropertySparkline 
          data={sampleTrendData} 
          height={50} 
          showGrowth={true}
        />
      );
      
      const growthIndicator = screen.getByText(`+${((350000 - 250000) / 250000 * 100).toFixed(1)}%`);
      expect(growthIndicator).toBeInTheDocument();
    });
    
    test('displays current value when specified', () => {
      render(
        <PropertySparkline 
          data={sampleTrendData} 
          height={50} 
          showCurrentValue={true}
        />
      );
      
      // Check for current value display
      expect(screen.getByText('$350,000')).toBeInTheDocument();
    });
    
    test('handles empty data gracefully', () => {
      render(<PropertySparkline data={[]} height={50} />);
      
      // Check for empty state message
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });
  });
  
  describe('ValuationTrendChart Component', () => {
    test('renders trend chart with property data', () => {
      render(<ValuationTrendChart property={sampleProperty} />);
      
      // Check that core chart components are rendered
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis-date')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
    
    test('renders historical and forecast data', () => {
      render(<ValuationTrendChart property={sampleProperty} showForecast={true} />);
      
      // Check that both historical and forecast elements exist
      expect(screen.getByTestId('area-historicalValue')).toBeInTheDocument();
      expect(screen.getByTestId('area-forecastValue')).toBeInTheDocument();
    });
    
    test('renders confidence intervals when showing forecast', () => {
      render(<ValuationTrendChart property={sampleProperty} showForecast={true} showConfidenceIntervals={true} />);
      
      // Check for confidence interval areas
      expect(screen.getByTestId('area-confidenceUpper')).toBeInTheDocument();
      expect(screen.getByTestId('area-confidenceLower')).toBeInTheDocument();
    });
    
    test('renders title and growth rate when specified', () => {
      render(
        <ValuationTrendChart 
          property={sampleProperty} 
          title="Value History" 
          showGrowthRate={true} 
        />
      );
      
      // Check for title and growth rate
      expect(screen.getByText('Value History')).toBeInTheDocument();
      expect(screen.getByText(/growth rate/i)).toBeInTheDocument();
    });
    
    test('handles property with no valuation data gracefully', () => {
      const propertyWithNoValue = { ...sampleProperty, value: undefined };
      render(<ValuationTrendChart property={propertyWithNoValue} />);
      
      // Check for empty state message
      expect(screen.getByText(/no historical data available/i)).toBeInTheDocument();
    });
    
    test('applies custom styling', () => {
      const customClass = 'custom-chart-class';
      render(<ValuationTrendChart property={sampleProperty} className={customClass} />);
      
      // Check that custom class is applied
      const container = screen.getByTestId('responsive-container').closest('div');
      expect(container).toHaveClass(customClass);
    });
  });
});