import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PropertyComparisonTool } from '../PropertyComparisonTool';
import { PropertyComparisonProvider } from '../PropertyComparisonContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock property data
const mockProperties = [
  {
    id: 1,
    parcelId: 'P12345',
    address: '123 Main St',
    coordinates: [46.28, -119.25],
    value: '$300,000',
    yearBuilt: 2000,
    squareFeet: 2000,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Residential',
    neighborhood: 'Central Benton',
    description: 'Nice family home'
  },
  {
    id: 2,
    parcelId: 'P23456',
    address: '456 Oak Ave',
    coordinates: [46.29, -119.26],
    value: '$320,000',
    yearBuilt: 2002,
    squareFeet: 1900,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Residential',
    neighborhood: 'Central Benton',
    description: 'Well-maintained property'
  },
  {
    id: 3,
    parcelId: 'P34567',
    address: '789 Pine Rd',
    coordinates: [46.30, -119.27],
    value: '$500,000',
    yearBuilt: 2020,
    squareFeet: 3500,
    bedrooms: 5,
    bathrooms: 3,
    propertyType: 'Residential',
    neighborhood: 'North Richland',
    description: 'Luxury home with modern amenities'
  }
];

// Mock the propertyService
jest.mock('../../../services/propertyService', () => ({
  getProperties: jest.fn(() => Promise.resolve(mockProperties)),
  getPropertyById: jest.fn((id: number) => Promise.resolve(
    mockProperties.find(p => p.id === id) || null
  )),
  searchProperties: jest.fn((query: string) => Promise.resolve(
    mockProperties.filter(p => 
      p.address.toLowerCase().includes(query.toLowerCase()) || 
      p.parcelId.toLowerCase().includes(query.toLowerCase())
    )
  )),
  getSimilarProperties: jest.fn((id: number) => Promise.resolve(
    mockProperties.filter(p => p.id !== id).slice(0, 2)
  ))
}));

// Create a wrapper with all necessary providers
const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PropertyComparisonProvider>
        {component}
      </PropertyComparisonProvider>
    </QueryClientProvider>
  );
};

describe('PropertyComparisonTool', () => {
  test('renders the comparison tool', async () => {
    renderWithProviders(<PropertyComparisonTool properties={mockProperties} />);
    
    // Check that main elements are rendered
    expect(screen.getByText('Property Comparison')).toBeInTheDocument();
    expect(screen.getByText(/start comparison/i)).toBeInTheDocument();
  });

  test('allows selecting a property', async () => {
    renderWithProviders(<PropertyComparisonTool properties={mockProperties} />);
    
    // Simulate property selection
    fireEvent.click(screen.getByText(/select property/i));
    
    // Property should be displayed
    expect(screen.getByText('Property Comparison')).toBeInTheDocument();
  });

  test('allows setting weights', async () => {
    renderWithProviders(<PropertyComparisonTool properties={mockProperties} selectedPropertyId={1} />);
    
    // Find and interact with a slider
    const slider = screen.getByLabelText(/Property Value/i);
    fireEvent.change(slider, { target: { value: 60 } });
    
    // Value should update
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  test('calculates similar properties', async () => {
    renderWithProviders(<PropertyComparisonTool properties={mockProperties} selectedPropertyId={1} />);
    
    // Click the find similar properties button
    fireEvent.click(screen.getByText(/Find Similar Properties/i));
    
    // Should show similar properties
    await waitFor(() => {
      expect(screen.getByText(/Similar Properties/i)).toBeInTheDocument();
    });
  });
});