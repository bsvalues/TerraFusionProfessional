import React from 'react';
import { render, screen } from '@testing-library/react';
import { NeighborhoodTrendGraph, TrendMetric } from '../components/neighborhood/NeighborhoodTrendGraph';
import { NeighborhoodTimeline } from '../services/neighborhoodComparisonReportService';

// Mock the react-chartjs-2 component
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mocked-line-chart">Mocked Line Chart</div>
}));

// Mock the chart.js registration
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}));

// Sample test data
const mockNeighborhoods: NeighborhoodTimeline[] = [
  {
    id: 'n1',
    name: 'Richland Heights',
    growthRate: 5.2,
    data: [
      { year: '2020', value: 450000, percentChange: 4.2, transactionCount: 32 },
      { year: '2021', value: 472500, percentChange: 5.0, transactionCount: 45 },
      { year: '2022', value: 498000, percentChange: 5.4, transactionCount: 38 }
    ]
  },
  {
    id: 'n2',
    name: 'West Pasco',
    growthRate: 3.8,
    data: [
      { year: '2020', value: 320000, percentChange: 3.1, transactionCount: 27 },
      { year: '2021', value: 335000, percentChange: 4.7, transactionCount: 31 },
      { year: '2022', value: 347000, percentChange: 3.6, transactionCount: 24 }
    ]
  }
];

describe('NeighborhoodTrendGraph Component', () => {
  test('renders placeholder when no neighborhoods are selected', () => {
    render(
      <NeighborhoodTrendGraph 
        neighborhoods={mockNeighborhoods}
        selectedNeighborhoods={[]}
        metric={TrendMetric.VALUE}
      />
    );
    
    // Verify placeholder message is displayed
    expect(screen.getByText(/Select neighborhoods to view trends/i)).toBeInTheDocument();
    
    // Verify chart is not rendered
    expect(screen.queryByTestId('mocked-line-chart')).not.toBeInTheDocument();
  });
  
  test('renders chart when neighborhoods are selected', () => {
    render(
      <NeighborhoodTrendGraph 
        neighborhoods={mockNeighborhoods}
        selectedNeighborhoods={['n1', 'n2']}
        metric={TrendMetric.VALUE}
      />
    );
    
    // Verify chart is rendered
    expect(screen.getByTestId('mocked-line-chart')).toBeInTheDocument();
  });
  
  test('accepts custom height prop', () => {
    const customHeight = 400;
    
    render(
      <NeighborhoodTrendGraph 
        neighborhoods={mockNeighborhoods}
        selectedNeighborhoods={['n1']}
        metric={TrendMetric.VALUE}
        height={customHeight}
      />
    );
    
    // Get the container div and check its style
    const container = screen.getByTestId('mocked-line-chart').parentElement;
    expect(container).toHaveStyle(`height: ${customHeight}px`);
  });
  
  test('applies custom className', () => {
    const customClass = 'test-custom-class';
    
    render(
      <NeighborhoodTrendGraph 
        neighborhoods={mockNeighborhoods}
        selectedNeighborhoods={['n1']}
        metric={TrendMetric.VALUE}
        className={customClass}
      />
    );
    
    // Get the container div and check if it has the custom class
    const container = screen.getByTestId('mocked-line-chart').parentElement;
    expect(container).toHaveClass(customClass);
  });
});