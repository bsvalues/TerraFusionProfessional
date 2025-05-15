import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PropertySparkline from '../PropertySparkline';
import { Property } from '../../../shared/schema';

// Mock the recharts components
jest.mock('recharts', () => {
  return {
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    Line: () => <div data-testid="recharts-line" />,
    ReferenceLine: () => <div data-testid="reference-line" />,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    )
  };
});

// Mock the ValuationTrendUtils functions
jest.mock('../ValuationTrendUtils', () => {
  return {
    generateHistoricalData: jest.fn().mockReturnValue([
      { date: new Date('2020-01-01'), value: 200000 },
      { date: new Date('2020-04-01'), value: 205000 },
      { date: new Date('2020-07-01'), value: 210000 },
      { date: new Date('2020-10-01'), value: 215000 },
      { date: new Date('2021-01-01'), value: 220000 },
      { date: new Date('2021-04-01'), value: 225000 }
    ]),
    predictFutureValues: jest.fn().mockReturnValue([
      { date: new Date('2021-07-01'), value: 230000 },
      { date: new Date('2021-10-01'), value: 235000 }
    ]),
    formatChartCurrency: jest.fn().mockImplementation((value) => `$${value.toLocaleString()}`)
  };
});

describe('PropertySparkline Component', () => {
  const mockProperty: Partial<Property> = {
    id: 1,
    address: '123 Main St',
    value: '$300000',
    yearBuilt: 2000,
    squareFeet: 2000,
    propertyType: 'Residential',
    neighborhood: 'Downtown'
  };
  
  it('renders the sparkline chart', () => {
    render(<PropertySparkline property={mockProperty as Property} />);
    
    // Check that the chart components are rendered
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-line')).toBeInTheDocument();
    expect(screen.getByTestId('reference-line')).toBeInTheDocument();
  });
  
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(
      <PropertySparkline 
        property={mockProperty as Property} 
        onClick={handleClick}
        interactive={true}
      />
    );
    
    // Find the div that would trigger the click and click it
    const clickableElement = screen.getByTestId('responsive-container').closest('div');
    if (clickableElement) {
      fireEvent.click(clickableElement);
    }
    
    // Check that the handler was called with the property
    expect(handleClick).toHaveBeenCalledWith(mockProperty);
  });
  
  it('does not call onClick when interactive is false', () => {
    const handleClick = jest.fn();
    render(
      <PropertySparkline 
        property={mockProperty as Property} 
        onClick={handleClick}
        interactive={false}
      />
    );
    
    // Find the div that would trigger the click and click it
    const clickableElement = screen.getByTestId('responsive-container').closest('div');
    if (clickableElement) {
      fireEvent.click(clickableElement);
    }
    
    // Check that the handler was not called
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('renders without predicted data when showPredicted is false', () => {
    const { generateHistoricalData, predictFutureValues } = require('../ValuationTrendUtils');
    
    render(
      <PropertySparkline 
        property={mockProperty as Property} 
        showPredicted={false}
      />
    );
    
    // Historical data should be generated
    expect(generateHistoricalData).toHaveBeenCalled();
    
    // Prediction should not be generated
    expect(predictFutureValues).not.toHaveBeenCalled();
  });
  
  it('displays trend indicator based on value change', () => {
    render(<PropertySparkline property={mockProperty as Property} />);
    
    // Should show either trending up, down, or neutral icon
    const trendIcons = screen.getAllByRole('img', { hidden: true });
    expect(trendIcons.length).toBeGreaterThan(0);
  });
});