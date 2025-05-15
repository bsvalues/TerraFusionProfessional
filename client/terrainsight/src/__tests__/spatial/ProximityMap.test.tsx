import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProximityMap } from '../../components/spatial/ProximityMap';
import { Property } from '@shared/schema';
import { POI, POIType } from '../../services/spatial/proximityAnalysisService';

// Mock the Leaflet libraries
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Circle: () => <div data-testid="circle" />,
  useMap: () => ({
    setView: jest.fn()
  })
}));

const mockProperty: Property = {
  id: 1,
  parcelId: "KE000001",
  address: "123 Test Street",
  coordinates: [47.6062, -122.3321],
  value: "450000",
  squareFeet: 2200,
  yearBuilt: 2005,
  propertyType: "Residential",
  neighborhood: "Test Neighborhood"
};

const mockPOIs: POI[] = [
  {
    id: "p1",
    name: "Central Park",
    type: POIType.Park,
    coordinates: [47.6082, -122.3347],
    distance: 300,
    attributes: {
      size: "Large",
      amenities: ["Playground", "Walking Trails"]
    }
  },
  {
    id: "p2",
    name: "Downtown Elementary",
    type: POIType.School,
    coordinates: [47.6042, -122.3301],
    distance: 250,
    attributes: {
      type: "Public",
      grades: "K-5",
      rating: 8.5
    }
  }
];

describe('ProximityMap', () => {
  test('renders map container and tile layer', () => {
    render(
      <ProximityMap 
        property={mockProperty}
        pois={mockPOIs}
        radius={1000}
        className="test-class"
      />
    );
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });
  
  test('renders property marker', () => {
    render(
      <ProximityMap 
        property={mockProperty}
        pois={mockPOIs}
        radius={1000}
      />
    );
    
    // Should have at least one marker for the property
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBeGreaterThanOrEqual(1);
  });
  
  test('renders POI markers', () => {
    render(
      <ProximityMap 
        property={mockProperty}
        pois={mockPOIs}
        radius={1000}
      />
    );
    
    // Should have markers for the property and each POI
    const markers = screen.getAllByTestId('marker');
    expect(markers.length).toBe(3); // 1 property + 2 POIs
  });
  
  test('renders influence radius circle', () => {
    render(
      <ProximityMap 
        property={mockProperty}
        pois={mockPOIs}
        radius={1000}
        showRadius={true}
      />
    );
    
    // Should render an influence radius circle
    expect(screen.getByTestId('circle')).toBeInTheDocument();
  });
  
  test('handles missing coordinates gracefully', () => {
    const propertyWithoutCoords = { ...mockProperty, coordinates: undefined };
    
    expect(() => {
      render(
        <ProximityMap 
          property={propertyWithoutCoords}
          pois={mockPOIs}
          radius={1000}
        />
      );
    }).not.toThrow();
  });
  
  test('renders with empty POIs array', () => {
    render(
      <ProximityMap 
        property={mockProperty}
        pois={[]}
        radius={1000}
      />
    );
    
    // Should still render the map with just the property marker
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker').length).toBe(1);
  });
  
  test('applies provided className', () => {
    render(
      <ProximityMap 
        property={mockProperty}
        pois={mockPOIs}
        radius={1000}
        className="custom-map-class"
      />
    );
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer.className).toContain('custom-map-class');
  });
});