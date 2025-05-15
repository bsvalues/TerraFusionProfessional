import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PropertySparkline from '../components/comparison/PropertySparkline';

describe('PropertySparkline Component', () => {
  // Sample test data
  const sampleTrendData = [
    { year: '2019', value: 250000 },
    { year: '2020', value: 275000 },
    { year: '2021', value: 290000 },
    { year: '2022', value: 315000 },
    { year: '2023', value: 350000 },
  ];

  test('renders without crashing', () => {
    render(<PropertySparkline data={sampleTrendData} />);
    expect(screen.getByTestId('property-sparkline')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    render(<PropertySparkline data={[]} />);
    const emptyState = screen.getByLabelText('No data available for sparkline');
    expect(emptyState).toBeInTheDocument();
  });

  test('applies custom styling', () => {
    const customClass = 'custom-sparkline-class';
    render(<PropertySparkline data={sampleTrendData} className={customClass} />);
    expect(screen.getByTestId('property-sparkline')).toHaveClass(customClass);
  });

  test('applies custom dimensions', () => {
    const customHeight = 60;
    const customWidth = 200;
    
    render(
      <PropertySparkline 
        data={sampleTrendData} 
        height={customHeight} 
        width={customWidth} 
      />
    );
    
    const sparkline = screen.getByTestId('property-sparkline');
    expect(sparkline).toHaveStyle(`height: ${customHeight}px`);
    expect(sparkline).toHaveStyle(`width: ${customWidth}px`);
  });
});