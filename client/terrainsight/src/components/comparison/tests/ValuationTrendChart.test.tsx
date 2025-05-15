import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ValuationTrendChart from '../ValuationTrendChart';
import { generatePropertyValueTrend } from '../ValuationTrendUtils';
import { Property } from '@shared/schema';

// Mock the recharts component to avoid rendering issues in tests
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="area-chart">{children}</div>
    ),
    Area: () => <div data-testid="area" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ReferenceLine: () => <div data-testid="reference-line" />
  };
});

// Mock the ValuationTrendUtils module
jest.mock('../ValuationTrendUtils', () => {
  const OriginalModule = jest.requireActual('../ValuationTrendUtils');
  
  return {
    ...OriginalModule,
    generatePropertyValueTrend: jest.fn().mockImplementation(() => ({
      historical: [
        { date: new Date('2020-01-01'), value: 250000 },
        { date: new Date('2020-04-01'), value: 255000 },
        { date: new Date('2020-07-01'), value: 260000 },
        { date: new Date('2020-10-01'), value: 265000 },
        { date: new Date('2021-01-01'), value: 270000 }
      ],
      predicted: [
        { date: new Date('2021-04-01'), value: 275000, upperBound: 280000, lowerBound: 270000 },
        { date: new Date('2021-07-01'), value: 280000, upperBound: 290000, lowerBound: 270000 },
        { date: new Date('2021-10-01'), value: 285000, upperBound: 300000, lowerBound: 270000 },
        { date: new Date('2022-01-01'), value: 290000, upperBound: 310000, lowerBound: 270000 }
      ],
      property: {} as Property
    }))
  };
});

describe('ValuationTrendChart', () => {
  const mockProperty: Partial<Property> = {
    id: 1,
    address: '123 Main St',
    value: '$300000',
    yearBuilt: 2000,
    squareFeet: 2000,
    propertyType: 'Residential',
    neighborhood: 'Downtown'
  };
  
  it('renders the chart component', () => {
    render(<ValuationTrendChart property={mockProperty as Property} />);
    
    // Check for key elements
    expect(screen.getByText(/Property Value Trend/i)).toBeInTheDocument();
    expect(screen.getByText(/Historical values and future projections/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    
    // Chart should be rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
  
  it('shows and hides settings when toggle button is clicked', () => {
    render(<ValuationTrendChart property={mockProperty as Property} />);
    
    // Settings should be hidden initially
    expect(screen.queryByText(/Forecast Settings/i)).not.toBeInTheDocument();
    
    // Click the toggle button
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // Settings should be visible now
    expect(screen.getByText(/Forecast Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual Growth Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Prediction Timeframe/i)).toBeInTheDocument();
    
    // Click again to hide
    fireEvent.click(toggleButton);
    
    // Settings should be hidden again
    expect(screen.queryByText(/Forecast Settings/i)).not.toBeInTheDocument();
  });
  
  it('toggles confidence interval display', () => {
    render(<ValuationTrendChart property={mockProperty as Property} />);
    
    // Show settings
    const toggleButton = screen.getByRole('button');
    fireEvent.click(toggleButton);
    
    // The confidence interval switch should be checked by default
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
    
    // Click to turn off confidence interval
    fireEvent.click(switchElement);
    
    // Switch should now be unchecked
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });
  
  it('calls generatePropertyValueTrend with the correct property', () => {
    render(<ValuationTrendChart property={mockProperty as Property} />);
    
    // Check that generatePropertyValueTrend was called with the property
    expect(generatePropertyValueTrend).toHaveBeenCalledWith(
      mockProperty,
      expect.any(Object) // Default params
    );
  });
  
  it('renders growth statistics', () => {
    render(<ValuationTrendChart property={mockProperty as Property} />);
    
    // Should display three growth stats
    expect(screen.getByText(/Historical Growth/i)).toBeInTheDocument();
    expect(screen.getByText(/Projected Growth/i)).toBeInTheDocument();
    expect(screen.getByText(/Annual Rate/i)).toBeInTheDocument();
  });
});