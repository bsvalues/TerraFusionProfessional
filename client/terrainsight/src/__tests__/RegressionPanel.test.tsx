import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, beforeEach, test, expect } from '@jest/globals';
import RegressionPanel from '@/components/panels/RegressionPanel';
import { RegressionModel, ModelVariable } from '@/shared/types';

// Mock recharts components
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    ScatterChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="scatter-chart">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Scatter: () => <div data-testid="scatter" />,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ReferenceLine: () => <div data-testid="reference-line" />,
  };
});

// Mock API requests
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation((url) => {
    if (url === '/api/regression/models') {
      return Promise.resolve([
        {
          id: 1,
          name: 'Residential Model 2024',
          r2: 0.892,
          variables: 8,
          cov: 0.124,
          samples: 523,
          lastRun: '2024-02-15',
          type: 'residential'
        },
        {
          id: 2,
          name: 'Commercial Model 2024',
          r2: 0.856,
          variables: 6,
          cov: 0.145,
          samples: 215,
          lastRun: '2024-02-10',
          type: 'commercial'
        }
      ]);
    } else if (url.startsWith('/api/regression/models/')) {
      // Variables for a specific model
      return Promise.resolve([
        {
          name: 'squareFeet',
          coefficient: 148.32,
          tValue: 12.45,
          pValue: 0.0001,
          correlation: 0.78,
          included: true
        },
        {
          name: 'yearBuilt',
          coefficient: 425.67,
          tValue: 8.32,
          pValue: 0.0003,
          correlation: 0.65,
          included: true
        },
        {
          name: 'bathrooms',
          coefficient: 15250.85,
          tValue: 5.67,
          pValue: 0.001,
          correlation: 0.53,
          included: true
        }
      ]);
    } else if (url === '/api/regression/data') {
      // Sample regression data points
      return Promise.resolve([
        { actual: 350000, predicted: 342000, id: '1' },
        { actual: 425000, predicted: 439000, id: '2' },
        { actual: 525000, predicted: 510000, id: '3' },
        { actual: 280000, predicted: 294000, id: '4' },
        { actual: 375000, predicted: 368000, id: '5' }
      ]);
    }
    return Promise.resolve([]);
  }),
}));

describe('RegressionPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders regression panel with model list', async () => {
    render(<RegressionPanel />);
    
    // Check for model selection section
    await waitFor(() => {
      expect(screen.getByText(/Residential Model 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/Commercial Model 2024/i)).toBeInTheDocument();
    });
    
    // Check for R² values
    expect(screen.getByText(/0.892/)).toBeInTheDocument();
    expect(screen.getByText(/0.856/)).toBeInTheDocument();
  });

  test('displays model details when a model is selected', async () => {
    render(<RegressionPanel />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Residential Model 2024/i)).toBeInTheDocument();
    });
    
    // Click on a model to select it
    const residentialModel = screen.getByText(/Residential Model 2024/i);
    fireEvent.click(residentialModel);
    
    // Check for model details
    await waitFor(() => {
      expect(screen.getByText(/Model Variables/i)).toBeInTheDocument();
      expect(screen.getByText(/squareFeet/i)).toBeInTheDocument();
      expect(screen.getByText(/yearBuilt/i)).toBeInTheDocument();
      expect(screen.getByText(/bathrooms/i)).toBeInTheDocument();
    });
  });

  test('displays regression charts when a model is selected', async () => {
    render(<RegressionPanel />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Residential Model 2024/i)).toBeInTheDocument();
    });
    
    // Click on a model to select it
    const residentialModel = screen.getByText(/Residential Model 2024/i);
    fireEvent.click(residentialModel);
    
    // Check for scatter plot
    await waitFor(() => {
      const scatterChart = screen.getByTestId('scatter-chart');
      expect(scatterChart).toBeInTheDocument();
    });
  });

  test('allows toggling variable inclusion in the model', async () => {
    render(<RegressionPanel />);
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText(/Residential Model 2024/i)).toBeInTheDocument();
    });
    
    // Click on a model to select it
    const residentialModel = screen.getByText(/Residential Model 2024/i);
    fireEvent.click(residentialModel);
    
    // Wait for variables to load
    await waitFor(() => {
      expect(screen.getByText(/squareFeet/i)).toBeInTheDocument();
    });
    
    // Find checkboxes for variables
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    // Toggle one variable's inclusion
    fireEvent.click(checkboxes[0]);
    
    // We would expect an API call to update the model
    // Implementation-specific validation would be needed here
  });

  test('shows loading state while fetching model data', async () => {
    // Override mock to introduce delay
    jest.spyOn(global, 'fetch').mockImplementation(() => 
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve([]),
          } as Response);
        }, 100);
      })
    );
    
    render(<RegressionPanel />);
    
    // Check for loading indicator
    expect(screen.getByText(/Loading models/i)).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading models/i)).not.toBeInTheDocument();
    });
    
    // Clean up
    (global.fetch as jest.Mock).mockRestore();
  });
});