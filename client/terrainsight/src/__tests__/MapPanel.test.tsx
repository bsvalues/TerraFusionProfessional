import React from 'react';
import { render, screen } from '@testing-library/react';
import MapPanel from '@/components/panels/MapPanel';
import { Property } from '@/shared/types';

// Mock the PropertySelectionContext
jest.mock('@/components/map/PropertySelectionContext', () => ({
  usePropertySelection: () => ({
    selectedProperties: [],
    selectProperty: jest.fn(),
    deselectProperty: jest.fn(),
    togglePropertySelection: jest.fn(),
    clearSelectedProperties: jest.fn(),
  }),
}));

// Mock components used by MapPanel
jest.mock('@/components/map/MapComponent', () => ({
  MapComponent: () => <div data-testid="map-component">Map Component</div>,
}));

jest.mock('@/components/map/PropertyInfoPanel', () => ({
  PropertyInfoPanel: ({ property }: { property: Property | null }) => (
    <div data-testid="property-info-panel">
      {property ? `Property: ${property.address}` : 'No property selected'}
    </div>
  ),
}));

// Mock API request
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
      }
    ])
  ),
}));

describe('MapPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the map component', async () => {
    render(<MapPanel />);
    
    const mapComponent = screen.getByTestId('map-component');
    expect(mapComponent).toBeInTheDocument();
  });

  test('renders the property info panel', async () => {
    render(<MapPanel />);
    
    const propertyInfoPanel = screen.getByTestId('property-info-panel');
    expect(propertyInfoPanel).toBeInTheDocument();
  });

  test('displays loading state while fetching properties', async () => {
    // Mock apiRequest to return a promise that never resolves
    jest.mock('@/lib/queryClient', () => ({
      apiRequest: jest.fn().mockImplementation(() => new Promise(() => {})),
    }));
    
    render(<MapPanel />);
    
    const loadingElement = screen.getByText(/loading map data/i);
    expect(loadingElement).toBeInTheDocument();
  });
});