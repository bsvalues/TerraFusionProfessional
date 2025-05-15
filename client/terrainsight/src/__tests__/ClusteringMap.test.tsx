import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClusteringMap } from '../components/analysis/ClusteringMap';
import { PropertyCluster } from '../services/spatialClusteringService';
import '@testing-library/jest-dom';

// Mock the Leaflet map and related components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  LayersControl: {
    BaseLayer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="base-layer">{children}</div>
    ),
    Overlay: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="overlay">{children}</div>
    ),
  },
  CircleMarker: ({ center, radius, pathOptions, eventHandlers }: any) => (
    <div 
      data-testid="circle-marker" 
      data-lat={center?.[0]} 
      data-lng={center?.[1]}
      data-radius={radius}
      data-color={pathOptions?.fillColor}
      onClick={eventHandlers?.click}
    />
  ),
  Marker: ({ position, eventHandlers }: any) => (
    <div 
      data-testid="marker" 
      data-lat={position?.[0]} 
      data-lng={position?.[1]}
      onClick={eventHandlers?.click}
    />
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  )
}));

describe('ClusteringMap Component', () => {
  const mockClusters: PropertyCluster[] = [
    {
      id: 0,
      centroid: [40.7128, -74.006],
      properties: [
        {
          id: 1,
          parcelId: "C0001",
          address: "123 Main St",
          value: "$250000",
          latitude: 40.7128,
          longitude: -74.0060,
          propertyType: "residential",
          yearBuilt: 1980,
          squareFeet: 1500
        },
        {
          id: 2,
          parcelId: "C0002",
          address: "456 Elm St",
          value: "$350000",
          latitude: 40.7138,
          longitude: -74.0070,
          propertyType: "residential",
          yearBuilt: 1990,
          squareFeet: 2000
        }
      ],
      color: '#3366CC',
      statistics: {
        avgValue: 300000,
        medianValue: 300000,
        avgSquareFeet: 1750,
        avgYearBuilt: 1985,
        propertyCount: 2,
        valueRange: [250000, 350000],
        squareFeetRange: [1500, 2000],
        yearBuiltRange: [1980, 1990]
      }
    },
    {
      id: 1,
      centroid: [40.7148, -74.008],
      properties: [
        {
          id: 3,
          parcelId: "C0003",
          address: "789 Oak St",
          value: "$450000",
          latitude: 40.7148,
          longitude: -74.0080,
          propertyType: "residential",
          yearBuilt: 2000,
          squareFeet: 2500
        }
      ],
      color: '#DC3912',
      statistics: {
        avgValue: 450000,
        medianValue: 450000,
        avgSquareFeet: 2500,
        avgYearBuilt: 2000,
        propertyCount: 1,
        valueRange: [450000, 450000],
        squareFeetRange: [2500, 2500],
        yearBuiltRange: [2000, 2000]
      }
    }
  ];

  const mockProps = {
    clusters: mockClusters,
    onClusterSelect: jest.fn(),
    onPropertySelect: jest.fn(),
    selectedCluster: null,
    selectedProperty: null,
    className: 'test-class'
  };

  test('renders map container with correct classes', () => {
    render(<ClusteringMap {...mockProps} />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveClass('test-class');
  });

  test('renders cluster centroids on the map', () => {
    render(<ClusteringMap {...mockProps} />);
    const centroidMarkers = screen.getAllByTestId('circle-marker');
    expect(centroidMarkers).toHaveLength(2);
    
    // Check first centroid marker position and color
    expect(centroidMarkers[0]).toHaveAttribute('data-lat', '40.7128');
    expect(centroidMarkers[0]).toHaveAttribute('data-lng', '-74.006');
    expect(centroidMarkers[0]).toHaveAttribute('data-color', '#3366CC');
    
    // Check second centroid marker position and color
    expect(centroidMarkers[1]).toHaveAttribute('data-lat', '40.7148');
    expect(centroidMarkers[1]).toHaveAttribute('data-lng', '-74.008');
    expect(centroidMarkers[1]).toHaveAttribute('data-color', '#DC3912');
  });

  test('calls onClusterSelect when a cluster is clicked', () => {
    render(<ClusteringMap {...mockProps} />);
    const centroidMarkers = screen.getAllByTestId('circle-marker');
    
    // Click on the first cluster centroid
    fireEvent.click(centroidMarkers[0]);
    expect(mockProps.onClusterSelect).toHaveBeenCalledWith(mockClusters[0]);
    
    // Click on the second cluster centroid
    fireEvent.click(centroidMarkers[1]);
    expect(mockProps.onClusterSelect).toHaveBeenCalledWith(mockClusters[1]);
  });

  test('renders property markers when a cluster is selected', () => {
    const selectedClusterProps = {
      ...mockProps,
      selectedCluster: mockClusters[0]
    };
    
    render(<ClusteringMap {...selectedClusterProps} />);
    
    // Should show property markers for the selected cluster
    const propertyMarkers = screen.getAllByTestId('marker');
    expect(propertyMarkers).toHaveLength(2); // Two properties in the first cluster
    
    // Check first property marker position
    expect(propertyMarkers[0]).toHaveAttribute('data-lat', '40.7128');
    expect(propertyMarkers[0]).toHaveAttribute('data-lng', '-74.006');
    
    // Check second property marker position
    expect(propertyMarkers[1]).toHaveAttribute('data-lat', '40.7138');
    expect(propertyMarkers[1]).toHaveAttribute('data-lng', '-74.007');
  });

  test('calls onPropertySelect when a property marker is clicked', () => {
    const selectedClusterProps = {
      ...mockProps,
      selectedCluster: mockClusters[0]
    };
    
    render(<ClusteringMap {...selectedClusterProps} />);
    const propertyMarkers = screen.getAllByTestId('marker');
    
    // Click on the first property marker
    fireEvent.click(propertyMarkers[0]);
    expect(mockProps.onPropertySelect).toHaveBeenCalledWith(mockClusters[0].properties[0]);
    
    // Click on the second property marker
    fireEvent.click(propertyMarkers[1]);
    expect(mockProps.onPropertySelect).toHaveBeenCalledWith(mockClusters[0].properties[1]);
  });
});