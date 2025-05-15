import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ValuationTrendChart from '../components/comparison/ValuationTrendChart';

describe('ValuationTrendChart Component', () => {
  // Sample test data
  const sampleTrendData = [
    { year: '2019', value: 250000 },
    { year: '2020', value: 275000 },
    { year: '2021', value: 290000 },
    { year: '2022', value: 315000 },
    { year: '2023', value: 350000 },
  ];

  const sampleCompareTrendData = [
    { year: '2019', value: 240000 },
    { year: '2020', value: 260000 },
    { year: '2021', value: 275000 },
    { year: '2022', value: 290000 },
    { year: '2023', value: 320000 },
  ];

  test('renders without crashing', () => {
    render(<ValuationTrendChart data={sampleTrendData} />);
    expect(screen.getByTestId('valuation-trend-chart')).toBeInTheDocument();
  });

  test('displays correct chart title', () => {
    render(<ValuationTrendChart 
      data={sampleTrendData} 
      title="Property Value Trends" 
    />);
    expect(screen.getByText('Property Value Trends')).toBeInTheDocument();
  });

  test('shows correct years on x-axis', () => {
    render(<ValuationTrendChart data={sampleTrendData} />);
    
    // Check that years from the sample data appear in the document
    sampleTrendData.forEach(item => {
      expect(screen.getByText(item.year)).toBeInTheDocument();
    });
  });

  test('displays comparison data when provided', () => {
    render(
      <ValuationTrendChart 
        data={sampleTrendData} 
        comparisonData={sampleCompareTrendData}
        comparisonLabel="Comparable Property"
      />
    );
    
    expect(screen.getByText('Comparable Property')).toBeInTheDocument();
  });

  test('shows trend prediction when enabled', () => {
    render(
      <ValuationTrendChart 
        data={sampleTrendData} 
        showPrediction={true}
        predictionYears={2}
      />
    );
    
    expect(screen.getByText('Predicted Value')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    render(<ValuationTrendChart data={[]} />);
    
    expect(screen.getByText('No valuation data available')).toBeInTheDocument();
  });

  test('formats currency values correctly', () => {
    render(<ValuationTrendChart data={sampleTrendData} />);
    
    // We should find at least one formatted currency value like "$250,000"
    expect(screen.getByText('$250,000')).toBeInTheDocument();
  });

  test('calculates and displays growth percentage', () => {
    render(<ValuationTrendChart data={sampleTrendData} showGrowthRate={true} />);
    
    // Based on our sample data, growth from 250000 to 350000 is 40%
    expect(screen.getByText('40% growth')).toBeInTheDocument();
  });
});