import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapComponent } from '../MapComponent';
import { MapLayer, Property } from '@/shared/types';

// Mock leaflet and react-leaflet to avoid DOM manipulation in tests
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    remove: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
  })),
  divIcon: jest.fn(),
  control: {
    layers: jest.fn(),
  },
}));

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: jest.fn(() => ({
    setView: jest.fn(),
    flyTo: jest.fn(),
  })),
  LayersControl: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layers-control">{children}</div>
  ),
}));

// Sample data for tests
const mockLayers: MapLayer[] = [
  { id: 'osm', name: 'OpenStreetMap', type: 'base', checked: true },
  { id: 'satellite', name: 'Satellite', type: 'base', checked: false },
  { id: 'parcels', name: 'Parcels', type: 'viewable', checked: true },
  { id: 'neighborhoods', name: 'Neighborhoods', type: 'viewable', checked: false },
];

const mockProperties: Property[] = [
  {
    id: 'prop1',
    parcelId: '12345',
    address: '123 Test Street',
    squareFeet: 2000,
    coordinates: [46.23, -119.15],
  },
  {
    id: 'prop2',
    parcelId: '67890',
    address: '456 Sample Avenue',
    squareFeet: 2500,
    coordinates: [46.24, -119.16],
  },
];

describe('MapComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders map with default layers', () => {
    render(
      <MapComponent 
        layers={mockLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12} 
      />
    );
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('layers-control')).toBeInTheDocument();
  });

  test('shows markers for properties with coordinates', () => {
    render(
      <MapComponent 
        layers={mockLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12} 
      />
    );
    
    // Each property with coordinates should create a marker
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(mockProperties.length);
  });

  test('handles property selection', () => {
    const mockOnSelectProperty = jest.fn();
    
    render(
      <MapComponent 
        layers={mockLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12}
        onSelectProperty={mockOnSelectProperty}
        selectedProperty={null}
      />
    );
    
    // Simulate clicking on a marker (implementation dependent)
    // This test would need to be adapted based on how the actual component handles selection
  });

  test('updates view when selected property changes', () => {
    const { rerender } = render(
      <MapComponent 
        layers={mockLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12}
        selectedProperty={null}
      />
    );
    
    // Re-render with a selected property
    rerender(
      <MapComponent 
        layers={mockLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12}
        selectedProperty={mockProperties[1]}
      />
    );
    
    // The useMap hook's flyTo should be called with the property's coordinates
    // This would need to be verified based on the component implementation
  });

  test('respects layer visibility settings', () => {
    // Render with all layers visible
    const { rerender } = render(
      <MapComponent 
        layers={mockLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12}
      />
    );
    
    // Re-render with updated layer visibility
    const updatedLayers = [...mockLayers];
    updatedLayers[2].checked = false; // Turn off parcels layer
    
    rerender(
      <MapComponent 
        layers={updatedLayers} 
        properties={mockProperties} 
        center={[46.23, -119.15]} 
        zoom={12}
      />
    );
    
    // This would need a specific implementation check based on how layers are managed
  });
});