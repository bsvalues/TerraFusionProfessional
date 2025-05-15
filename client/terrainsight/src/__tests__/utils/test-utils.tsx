/**
 * Test Utilities
 * 
 * This file contains helper functions and components for testing.
 * It provides consistent methods for rendering components with the necessary
 * providers and mocking common services.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TourProvider } from '../../contexts/TourContext';
import { MapAccessibilityProvider } from '../../contexts/MapAccessibilityContext';
import { PropertyFilterProvider } from '../../contexts/PropertyFilterContext';

// Create a test query client with optimized settings for tests
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // previously cacheTime in v4
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Interface for custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MapAccessibilityProvider>
          <PropertyFilterProvider>
            <TourProvider>
              {children}
            </TourProvider>
          </PropertyFilterProvider>
        </MapAccessibilityProvider>
      </QueryClientProvider>
    );
  }
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Mock API response generator
 */
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
};

/**
 * Mock property data factory
 */
export const createMockProperty = (overrides = {}) => {
  return {
    id: Math.floor(Math.random() * 10000),
    parcelId: `P${Math.floor(Math.random() * 10000)}`,
    address: '123 Test Street',
    value: '450000',
    squareFeet: 2400,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2010,
    latitude: 46.2,
    longitude: -119.1,
    neighborhood: 'n1',
    owner: 'Test Owner',
    salePrice: '450000',
    saleDate: '2022-01-15',
    landValue: '120000',
    improvementValue: '330000',
    pricePerSqFt: '187.5',
    lotSize: 10000,
    zoning: 'Residential',
    taxAssessment: '440000',
    taxYear: 2022,
    lastModified: '2022-12-01',
    attributes: {},
    ...overrides,
  };
};

/**
 * Setup global fetch mock
 */
export const setupFetchMock = (responseData: any = []) => {
  global.fetch = jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData),
    })
  );
};

/**
 * Reset all mocks between tests
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  if (global.fetch && typeof global.fetch === 'function') {
    (global.fetch as jest.Mock).mockReset();
  }
};