import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import { HeatmapVisualization } from '../components/analysis/HeatmapVisualization';
import { Property } from '@shared/schema';

// Mock properties for testing
const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: 'PROP001',
    address: '123 Main St',
    squareFeet: 2000,
    value: '200000',
    latitude: 47.1234,
    longitude: -122.4567,
    propertyType: 'residential'
  },
  {
    id: 2,
    parcelId: 'PROP002',
    address: '456 Oak Ave',
    squareFeet: 2500,
    value: '300000',
    latitude: 47.1235,
    longitude: -122.4568,
    propertyType: 'residential'
  },
  {
    id: 3,
    parcelId: 'PROP003',
    address: '789 Elm St',
    squareFeet: 3000,
    value: '400000',
    latitude: 47.1236,
    longitude: -122.4569,
    propertyType: 'residential'
  }
];

// Mock functions
jest.mock('leaflet.heat', () => {
  return jest.fn().mockImplementation(() => {
    return {
      addTo: jest.fn(),
      setLatLngs: jest.fn(),
      setOptions: jest.fn(),
      getLatLngs: jest.fn().mockReturnValue([]),
      redraw: jest.fn(),
      _map: {}
    };
  });
});

// Mock react-leaflet
jest.mock('react-leaflet', () => {
  const originalModule = jest.requireActual('react-leaflet');
  return {
    ...originalModule,
    useMap: jest.fn().mockReturnValue({
      addLayer: jest.fn(),
      removeLayer: jest.fn(),
      getBounds: jest.fn().mockReturnValue({
        getSouthWest: jest.fn().mockReturnValue([47.12, -122.46]),
        getNorthEast: jest.fn().mockReturnValue([47.13, -122.45])
      }),
      getCenter: jest.fn().mockReturnValue({
        lat: 47.125,
        lng: -122.455
      })
    })
  };
});

// Setup component wrapper to provide map context
const renderWithMap = (ui: React.ReactElement) => {
  return render(
    <MapContainer center={[47.125, -122.455]} zoom={12} style={{ height: '100vh' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {ui}
    </MapContainer>
  );
};

describe('HeatmapVisualization Component', () => {
  // Test rendering on map
  test('should render on the map correctly', () => {
    renderWithMap(<HeatmapVisualization properties={mockProperties} />);
    // Check if heat map controls are rendered
    expect(screen.getByText(/heat map/i)).toBeInTheDocument();
  });

  // Test intensity control
  test('should update intensity when slider is adjusted', async () => {
    renderWithMap(<HeatmapVisualization properties={mockProperties} />);
    
    // Get intensity slider
    const intensitySlider = screen.getByLabelText(/intensity/i);
    expect(intensitySlider).toBeInTheDocument();
    
    // Change intensity value
    fireEvent.change(intensitySlider, { target: { value: '0.8' } });
    
    // Component should update
    await waitFor(() => {
      expect(intensitySlider).toHaveValue('0.8');
    });
  });
  
  // Test radius control
  test('should update radius when slider is adjusted', async () => {
    renderWithMap(<HeatmapVisualization properties={mockProperties} />);
    
    // Get radius slider
    const radiusSlider = screen.getByLabelText(/radius/i);
    expect(radiusSlider).toBeInTheDocument();
    
    // Change radius value
    fireEvent.change(radiusSlider, { target: { value: '30' } });
    
    // Component should update
    await waitFor(() => {
      expect(radiusSlider).toHaveValue('30');
    });
  });
  
  // Test variable selection
  test('should change visualization variable when different option is selected', async () => {
    renderWithMap(<HeatmapVisualization properties={mockProperties} />);
    
    // Get variable selector
    const variableSelector = screen.getByLabelText(/variable/i);
    expect(variableSelector).toBeInTheDocument();
    
    // Change variable to price per sq ft
    fireEvent.change(variableSelector, { target: { value: 'pricePerSqFt' } });
    
    // Component should update
    await waitFor(() => {
      expect(variableSelector).toHaveValue('pricePerSqFt');
    });
  });
  
  // Test empty properties handling
  test('should handle empty properties array', () => {
    renderWithMap(<HeatmapVisualization properties={[]} />);
    
    // Should show a message for no data
    expect(screen.getByText(/no property data available/i)).toBeInTheDocument();
  });
  
  // Test properties with missing coordinates
  test('should handle properties with missing coordinates', () => {
    const propertiesWithMissingCoords = [
      ...mockProperties,
      {
        id: 4,
        parcelId: 'PROP004',
        address: '101 Missing Coords St',
        squareFeet: 1500,
        value: '150000',
        propertyType: 'residential'
        // Missing latitude and longitude
      }
    ];
    
    renderWithMap(<HeatmapVisualization properties={propertiesWithMissingCoords} />);
    
    // Should render without errors
    expect(screen.getByText(/heat map/i)).toBeInTheDocument();
  });
});