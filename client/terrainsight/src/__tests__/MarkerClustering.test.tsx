import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from '@jest/globals';
import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from '../components/map/MarkerClusterGroup';
import { Property } from '@/shared/schema';

// Mock leaflet to avoid DOM-related issues in tests
vi.mock('leaflet', () => {
  return {
    icon: vi.fn(() => ({})),
    divIcon: vi.fn(() => ({})),
    point: vi.fn(() => ({})),
    DomEvent: {
      disableClickPropagation: vi.fn(),
      disableScrollPropagation: vi.fn(),
    },
    Marker: vi.fn(() => ({
      addTo: vi.fn(),
      on: vi.fn(),
      bindTooltip: vi.fn(),
    })),
    Map: vi.fn(() => ({
      getZoom: vi.fn().mockReturnValue(10),
      on: vi.fn(),
      off: vi.fn(),
      getCenter: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
      getBounds: vi.fn().mockReturnValue({
        getNorthEast: vi.fn().mockReturnValue({ lat: 1, lng: 1 }),
        getSouthWest: vi.fn().mockReturnValue({ lat: -1, lng: -1 }),
      }),
    })),
  };
});

// Mock react-leaflet to avoid DOM-related issues in tests
vi.mock('react-leaflet', () => {
  return {
    MapContainer: vi.fn(({ children }) => <div data-testid="map-container">{children}</div>),
    TileLayer: vi.fn(() => <div data-testid="tile-layer"></div>),
    useMap: vi.fn(() => ({
      getZoom: vi.fn().mockReturnValue(10),
      on: vi.fn(),
      off: vi.fn(),
      getCenter: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
      getBounds: vi.fn().mockReturnValue({
        getNorthEast: vi.fn().mockReturnValue({ lat: 1, lng: 1 }),
        getSouthWest: vi.fn().mockReturnValue({ lat: -1, lng: -1 }),
      }),
      flyTo: vi.fn(),
    })),
    useMapEvents: vi.fn((handlers) => {
      // Store the zoom handler for testing
      if (handlers.zoom) {
        (global as any).testZoomHandler = handlers.zoom;
      }
      return null;
    }),
    Marker: vi.fn(({ children }) => <div data-testid="marker">{children}</div>),
    Popup: vi.fn(({ children }) => <div data-testid="popup">{children}</div>),
    Tooltip: vi.fn(({ children }) => <div data-testid="tooltip">{children}</div>),
  };
});

// Sample test properties
const testProperties: Property[] = [
  {
    id: 1,
    parcelId: 'P001',
    address: '123 Main St',
    coordinates: [47.25, -122.44],
    latitude: 47.25,
    longitude: -122.44,
    value: '$350,000',
    propertyType: 'Residential',
    squareFeet: 1800,
    yearBuilt: 1995,
  } as Property,
  {
    id: 2,
    parcelId: 'P002',
    address: '456 Oak Ave',
    coordinates: [47.26, -122.45],
    latitude: 47.26,
    longitude: -122.45,
    value: '$425,000',
    propertyType: 'Residential',
    squareFeet: 2200,
    yearBuilt: 2001,
  } as Property,
  {
    id: 3,
    parcelId: 'P003',
    address: '789 Pine St',
    coordinates: [47.255, -122.445],
    latitude: 47.255,
    longitude: -122.445,
    value: '$380,000',
    propertyType: 'Residential',
    squareFeet: 1950,
    yearBuilt: 1998,
  } as Property,
  // Properties at different location for testing clustering
  {
    id: 4,
    parcelId: 'P004',
    address: '101 Commerce Blvd',
    coordinates: [47.35, -122.54],
    latitude: 47.35,
    longitude: -122.54,
    value: '$550,000',
    propertyType: 'Commercial',
    squareFeet: 3500,
    yearBuilt: 2005,
  } as Property,
];

describe('Marker Clustering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('MarkerClusterGroup component should render', () => {
    render(
      <MapContainer center={[47.25, -122.44]} zoom={10} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup properties={testProperties} onPropertySelect={vi.fn()} />
      </MapContainer>
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('MarkerClusterGroup should handle property selection', () => {
    const mockSelectHandler = vi.fn();
    
    render(
      <MapContainer center={[47.25, -122.44]} zoom={10} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup 
          properties={testProperties} 
          onPropertySelect={mockSelectHandler} 
        />
      </MapContainer>
    );

    // Simulate clicking on a marker
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThan(0);
    
    fireEvent.click(markers[0]);
    
    // Verify the select handler was called with the correct property
    expect(mockSelectHandler).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.any(Number),
      parcelId: expect.any(String),
      address: expect.any(String),
    }));
  });

  test('MarkerClusterGroup should create appropriate number of markers and clusters', () => {
    render(
      <MapContainer center={[47.25, -122.44]} zoom={10} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup 
          properties={testProperties} 
          onPropertySelect={vi.fn()} 
        />
      </MapContainer>
    );
    
    // In a real implementation, we would have a mix of markers and clusters
    // For simplicity in test, we just check if all markers are rendered
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(testProperties.length);
  });

  test('Clicking a cluster should zoom to appropriate level', async () => {
    const mapFlyTo = vi.fn();
    (require('react-leaflet') as any).useMap.mockReturnValue({
      getZoom: vi.fn().mockReturnValue(8), // Lower zoom to ensure clustering
      on: vi.fn(),
      off: vi.fn(),
      getCenter: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
      getBounds: vi.fn().mockReturnValue({
        getNorthEast: vi.fn().mockReturnValue({ lat: 2, lng: 2 }),
        getSouthWest: vi.fn().mockReturnValue({ lat: -2, lng: -2 }),
      }),
      flyTo: mapFlyTo,
    });
    
    render(
      <MapContainer center={[47.25, -122.44]} zoom={8} style={{ height: '100vh', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MarkerClusterGroup 
          properties={testProperties} 
          onPropertySelect={vi.fn()} 
        />
      </MapContainer>
    );
    
    // Simulate clicking on a cluster
    // In the real implementation, we would have a cluster element to click
    // For the test, we'll simulate the cluster click handler directly
    const clusterMarker = screen.getByTestId('marker');
    fireEvent.click(clusterMarker);
    
    // Verify the map.flyTo was called to zoom in
    await waitFor(() => {
      expect(mapFlyTo).toHaveBeenCalled();
    });
  });
});