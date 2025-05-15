import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { NeighborhoodComparisonHeatmap } from '../components/neighborhood/NeighborhoodComparisonHeatmap';
import { Property } from '@shared/schema';

// Mock properties for testing
const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: 'PROP001',
    address: '123 Main St',
    squareFeet: 2000,
    value: '200000',
    propertyType: 'residential',
    neighborhood: 'downtown',
    latitude: 46.2835,
    longitude: -119.2803
  },
  {
    id: 2,
    parcelId: 'PROP002',
    address: '456 Oak Ave',
    squareFeet: 1800,
    value: '180000',
    propertyType: 'residential',
    neighborhood: 'south_ridge',
    latitude: 46.2735,
    longitude: -119.2903
  },
  {
    id: 3,
    parcelId: 'PROP003',
    address: '789 Pine Ln',
    squareFeet: 2200,
    value: '250000',
    propertyType: 'residential',
    neighborhood: 'west_park',
    latitude: 46.2935,
    longitude: -119.3003
  }
];

// Mock the neighborhood service
jest.mock('../services/neighborhoodTimelineService', () => {
  const originalModule = jest.requireActual('../services/neighborhoodTimelineService');
  
  return {
    ...originalModule,
    getNeighborhoodTimelines: jest.fn(() => Promise.resolve([
      {
        id: 'downtown',
        name: 'Downtown',
        data: [
          { year: '2020', value: 320000, percentChange: 0.05, transactionCount: 45 },
          { year: '2021', value: 350000, percentChange: 0.09, transactionCount: 52 },
          { year: '2022', value: 395000, percentChange: 0.13, transactionCount: 48 },
        ],
        growthRate: 0.11
      },
      {
        id: 'south_ridge',
        name: 'South Ridge',
        data: [
          { year: '2020', value: 280000, percentChange: 0.03, transactionCount: 38 },
          { year: '2021', value: 295000, percentChange: 0.05, transactionCount: 42 },
          { year: '2022', value: 325000, percentChange: 0.10, transactionCount: 39 },
        ],
        growthRate: 0.07
      },
      {
        id: 'west_park',
        name: 'West Park',
        data: [
          { year: '2020', value: 310000, percentChange: 0.04, transactionCount: 35 },
          { year: '2021', value: 330000, percentChange: 0.06, transactionCount: 40 },
          { year: '2022', value: 360000, percentChange: 0.09, transactionCount: 37 },
        ],
        growthRate: 0.08
      }
    ]))
  };
});

// Render with map container
const renderWithMap = (ui: React.ReactElement) => {
  return render(
    <MapContainer center={[46.2835, -119.2803]} zoom={10} style={{ height: '500px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {ui}
    </MapContainer>
  );
};

describe('NeighborhoodComparisonHeatmap Component', () => {
  // Test basic rendering
  test('should render the component with controls', async () => {
    renderWithMap(<NeighborhoodComparisonHeatmap properties={mockProperties} />);
    
    // Check if the component title is in the document
    await waitFor(() => {
      expect(screen.getByText(/Neighborhood Comparison Heatmap/i)).toBeInTheDocument();
    });
    
    // Check if controls are rendered
    expect(screen.getByText(/Current Values/i)).toBeInTheDocument();
    expect(screen.getByText(/Growth Rates/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparison/i)).toBeInTheDocument();
  });
  
  // Test loading state
  test('should show loading state while fetching data', () => {
    renderWithMap(<NeighborhoodComparisonHeatmap properties={mockProperties} />);
    
    // Check if loading indicator is shown
    expect(screen.getByText(/Loading neighborhood data/i)).toBeInTheDocument();
  });
  
  // Test neighborhood selection
  test('should allow selecting neighborhoods', async () => {
    renderWithMap(<NeighborhoodComparisonHeatmap properties={mockProperties} />);
    
    // Wait for neighborhoods to load
    await waitFor(() => {
      expect(screen.getByText(/Selected Neighborhoods/i)).toBeInTheDocument();
    });
    
    // Check if neighborhood buttons are rendered
    await waitFor(() => {
      expect(screen.getByText('Downtown')).toBeInTheDocument();
      expect(screen.getByText('South Ridge')).toBeInTheDocument();
      expect(screen.getByText('West Park')).toBeInTheDocument();
    });
  });
  
  // Test year selection
  test('should allow selecting different years', async () => {
    renderWithMap(<NeighborhoodComparisonHeatmap properties={mockProperties} />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/Year:/i)).toBeInTheDocument();
    });
    
    // Test will check that the year selector exists
    expect(screen.getByLabelText(/Year:/i)).toBeInTheDocument();
  });
  
  // Test neighborhood metrics display
  test('should display neighborhood metrics', async () => {
    renderWithMap(<NeighborhoodComparisonHeatmap properties={mockProperties} />);
    
    // Wait for the component to load data
    await waitFor(() => {
      expect(screen.getByText(/Selected Neighborhoods/i)).toBeInTheDocument();
    });
    
    // Check for metrics labels
    await waitFor(() => {
      expect(screen.getAllByText(/Avg\. Value/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Growth Rate/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Transactions/i)[0]).toBeInTheDocument();
    });
  });
});