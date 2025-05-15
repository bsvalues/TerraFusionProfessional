
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import PropertyComparison from '../components/comparison/PropertyComparison';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Property Comparison Integration', () => {
  test('loads and displays property data', async () => {
    renderWithProviders(<PropertyComparison propertyIds={['1', '2']} />);
    await waitFor(() => {
      expect(screen.getByTestId('property-comparison-container')).toBeInTheDocument();
    });
  });

  test('calculates similarity scores correctly', async () => {
    renderWithProviders(<PropertyComparison propertyIds={['1', '2']} />);
    await waitFor(() => {
      const scoreElement = screen.getByTestId('similarity-score');
      expect(scoreElement).toBeInTheDocument();
      expect(parseFloat(scoreElement.textContent || '0')).toBeGreaterThanOrEqual(0);
      expect(parseFloat(scoreElement.textContent || '1')).toBeLessThanOrEqual(1);
    });
  });
});
