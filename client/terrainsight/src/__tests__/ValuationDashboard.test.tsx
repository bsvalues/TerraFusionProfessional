import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import ValuationDashboard from '@/components/valuation/ValuationDashboard';
import { Property } from '@/shared/types';

// Mock recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    ComposedChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="composed-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    Line: () => <div data-testid="line" />,
    Pie: () => <div data-testid="pie" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    Cell: () => <div data-testid="cell" />,
  };
});

// Mock API calls
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation(() => 
    Promise.resolve([
      {
        id: '1',
        parcelId: 'P123456',
        address: '123 Main St, Kennewick, WA',
        owner: 'John Doe',
        value: '350000',
        squareFeet: 2200,
        yearBuilt: 2005,
        landValue: '100000',
        coordinates: [46.2, -119.1]
      },
      {
        id: '2',
        parcelId: 'P234567',
        address: '456 Oak Ave, Richland, WA',
        owner: 'Jane Smith',
        value: '425000',
        squareFeet: 2600,
        yearBuilt: 2010,
        landValue: '120000',
        coordinates: [46.25, -119.15]
      }
    ])
  ),
}));

// Mock formatCurrency utility
jest.mock('@/lib/utils', () => ({
  formatCurrency: jest.fn().mockImplementation((value) => `$${value}`),
}));

describe('ValuationDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the dashboard with filter controls', async () => {
    render(<ValuationDashboard />);
    
    // Check for filter section
    expect(screen.getByText(/dashboard filters/i)).toBeInTheDocument();
    
    // Check for main components
    expect(screen.getByText(/total property value/i)).toBeInTheDocument();
    expect(screen.getByText(/property count/i)).toBeInTheDocument();
  });

  test('renders charts for data visualization', async () => {
    render(<ValuationDashboard />);
    
    // Check for charts
    const charts = screen.getAllByTestId(/chart/i);
    expect(charts.length).toBeGreaterThan(0);
  });

  test('updates filters when user selects new values', async () => {
    render(<ValuationDashboard />);
    
    // Find the neighborhood filter
    const neighborhoodSelect = screen.getByLabelText(/neighborhood/i);
    fireEvent.change(neighborhoodSelect, { target: { value: 'downtown' } });
    
    // Find the property type filter
    const propertyTypeSelect = screen.getByLabelText(/property type/i);
    fireEvent.change(propertyTypeSelect, { target: { value: 'residential' } });
    
    // The results should update based on filters
    // We would expect some API calls or state updates here
    // This is implementation-specific and would need to be adjusted
  });

  test('displays loading state while fetching data', async () => {
    // Mock a slow API response
    jest.mock('@/lib/queryClient', () => ({
      apiRequest: jest.fn().mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => resolve([]), 500);
      })),
    }));
    
    render(<ValuationDashboard />);
    
    // Look for loading indicators
    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('handles empty data state gracefully', async () => {
    // Mock an empty response
    jest.mock('@/lib/queryClient', () => ({
      apiRequest: jest.fn().mockResolvedValue([]),
    }));
    
    render(<ValuationDashboard />);
    
    // Check for "no data" messages
    const noDataElements = screen.getAllByText(/no data available/i);
    expect(noDataElements.length).toBeGreaterThan(0);
  });
});