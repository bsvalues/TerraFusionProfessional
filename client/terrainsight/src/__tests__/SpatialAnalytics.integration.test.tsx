import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import SpatialAnalyticsPanel from '../components/analysis/SpatialAnalyticsPanel';
import { Property } from '@/shared/schema';

// Mock react-query hooks
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockImplementation(({ queryKey }) => {
    if (queryKey.includes('properties')) {
      return {
        data: mockProperties,
        isLoading: false,
        error: null
      };
    }
    if (queryKey.includes('amenities')) {
      return {
        data: mockAmenities,
        isLoading: false,
        error: null
      };
    }
    return { data: null, isLoading: false, error: null };
  })
}));

// Mock leaflet as it's not available in the test environment
jest.mock('leaflet', () => ({
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  divIcon: jest.fn().mockReturnValue({}),
  heatLayer: jest.fn().mockReturnValue({
    addTo: jest.fn(),
    setLatLngs: jest.fn(),
    redraw: jest.fn(),
    removeFrom: jest.fn(),
  }),
  map: jest.fn().mockReturnValue({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    invalidateSize: jest.fn(),
  }),
}));

// Mock the react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: jest.fn().mockImplementation(({ children }) => <div data-testid="map-container">{children}</div>),
  TileLayer: jest.fn().mockImplementation(() => <div data-testid="tile-layer" />),
  LayerGroup: jest.fn().mockImplementation(({ children }) => <div data-testid="layer-group">{children}</div>),
  useMap: jest.fn().mockReturnValue({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    invalidateSize: jest.fn(),
  }),
}));

// Mock the spatial analysis services
jest.mock('../services/spatialAnalysisService', () => ({
  performSpatialClustering: jest.fn().mockImplementation(() => ({
    clusters: [
      { id: 1, propertyCount: 3, averageValue: 511666.67, centroid: { latitude: 40.7129, longitude: -74.0061 }, dominantNeighborhood: 'Downtown', dominantPropertyType: 'Residential' },
      { id: 2, propertyCount: 2, averageValue: 712500, centroid: { latitude: 40.72285, longitude: -74.01605 }, dominantNeighborhood: 'Uptown', dominantPropertyType: 'Residential' },
      { id: 3, propertyCount: 2, averageValue: 1225000, centroid: { latitude: 40.6128, longitude: -74.206 }, dominantNeighborhood: 'Industrial', dominantPropertyType: 'Commercial' }
    ],
    propertyClusterMap: new Map([
      [1, 1], [2, 1], [3, 1], // Downtown properties in cluster 1
      [4, 2], [5, 2],        // Uptown properties in cluster 2
      [6, 3], [7, 3]         // Industrial properties in cluster 3
    ]),
    metadata: {
      totalProperties: 7,
      includedProperties: 7,
      excludedProperties: 0
    }
  }))
}));

jest.mock('../services/proximityAnalysisService', () => ({
  calculateDistanceToAmenity: jest.fn().mockImplementation((property, amenity) => {
    // Return distance based on property/amenity IDs for deterministic testing
    return Math.abs((property.id as number) - (amenity.id as number)) * 0.5;
  }),
  generateIsochrones: jest.fn().mockImplementation(({ travelTimes }) => 
    travelTimes.map(time => ({
      travelTime: time,
      mode: 'walking',
      coordinates: Array(time * 10).fill(0).map((_, i) => ({ lat: 40.7 + i * 0.001, lng: -74.0 - i * 0.001 }))
    }))
  ),
  quantifyProximityImpact: jest.fn().mockImplementation(({ amenityType }) => ({
    amenityType,
    impactByDistance: [
      { distanceThreshold: 0.5, averageValue: 550000, propertyCount: 2, valueImpact: 0.15 },
      { distanceThreshold: 1, averageValue: 500000, propertyCount: 3, valueImpact: 0.05 },
      { distanceThreshold: 2, averageValue: 450000, propertyCount: 2, valueImpact: 0 }
    ],
    regressionModel: {
      r2: 0.85,
      coefficients: { intercept: 600000, distance: -75000 }
    },
    insights: [
      { description: 'Properties within 0.5km of parks show a 15% value premium', impactValue: 0.15, amenityType: 'Park' },
      { description: 'School proximity has moderate impact on residential properties', impactValue: 0.08, amenityType: 'School' }
    ],
    mostImpactfulAmenity: 'Park',
    optimalDistance: 0.5,
    excludedProperties: 0
  }))
}));

jest.mock('../services/outlierDetectionService', () => ({
  detectOutliers: jest.fn().mockImplementation((properties, { attributes }) => ({
    outliers: [
      {
        propertyId: 4,
        deviationScores: { value: 3.2, squareFeet: 0.5 },
        primaryAttribute: 'value',
        neighborhood: 'Downtown'
      },
      {
        propertyId: 7,
        deviationScores: { value: -2.8, yearBuilt: -2.3 },
        primaryAttribute: 'value',
        neighborhood: 'Uptown'
      }
    ],
    metadata: {
      totalProperties: properties.length,
      outlierPercentage: (2 / properties.length) * 100,
      excludedProperties: 0
    },
    neighborhoodStatistics: {
      'Downtown': { count: 4, mean: 621250, standardDeviation: 205000, outlierCount: 1 },
      'Uptown': { count: 3, mean: 591666.67, standardDeviation: 180000, outlierCount: 1 },
      'Industrial': { count: 2, mean: 1225000, standardDeviation: 25000, outlierCount: 0 }
    }
  })),
  generateOutlierExplanation: jest.fn().mockImplementation((outlier) => ({
    summary: `Property ${outlier.propertyId} is a statistical outlier with ${outlier.deviationScores[outlier.primaryAttribute]} standard deviations from the mean`,
    factors: ['value is significantly different from neighborhood average'],
    primaryFactor: outlier.primaryAttribute,
    secondaryFactors: Object.keys(outlier.deviationScores).filter(k => k !== outlier.primaryAttribute),
    zScore: outlier.deviationScores[outlier.primaryAttribute],
    neighborhoodComparison: `${Math.abs(outlier.deviationScores[outlier.primaryAttribute]) * 25}% ${outlier.deviationScores[outlier.primaryAttribute] > 0 ? 'above' : 'below'} the neighborhood average`,
    anomalyDirection: outlier.deviationScores[outlier.primaryAttribute] > 0 ? 'above' : 'below'
  }))
}));

// Mock property data
const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: "P001",
    address: "123 Main St",
    latitude: 40.7128,
    longitude: -74.006,
    value: "500000",
    neighborhood: "Downtown",
    propertyType: "Residential",
    squareFeet: 1800,
    yearBuilt: 2000,
    bedrooms: 3,
    bathrooms: 2
  },
  {
    id: 2,
    parcelId: "P002",
    address: "456 Elm St",
    latitude: 40.7228,
    longitude: -74.016,
    value: "600000",
    neighborhood: "Downtown",
    propertyType: "Residential",
    squareFeet: 2200,
    yearBuilt: 2005,
    bedrooms: 3,
    bathrooms: 2
  },
  {
    id: 3,
    parcelId: "P003",
    address: "789 Oak St",
    latitude: 40.7328,
    longitude: -74.026,
    value: "700000",
    neighborhood: "Uptown",
    propertyType: "Residential",
    squareFeet: 2500,
    yearBuilt: 2010,
    bedrooms: 4,
    bathrooms: 3
  }
];

// Mock amenity data
const mockAmenities = [
  {
    id: 1,
    name: "Central Park",
    type: "Park",
    latitude: 40.7128,
    longitude: -74.0059
  },
  {
    id: 2,
    name: "Downtown Elementary",
    type: "School",
    latitude: 40.7228,
    longitude: -74.017
  }
];

describe('Spatial Analytics Integration', () => {
  test('should render all analytics tabs', async () => {
    render(
      <BrowserRouter>
        <SpatialAnalyticsPanel />
      </BrowserRouter>
    );
    
    // Verify all tabs are rendered
    expect(screen.getByText('Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Clustering')).toBeInTheDocument();
    expect(screen.getByText('Proximity')).toBeInTheDocument();
    expect(screen.getByText('Outliers')).toBeInTheDocument();
    
    // Default tab should be active
    expect(screen.getByTestId('heatmap-tab')).toHaveAttribute('aria-selected', 'true');
  });
  
  test('should update all visualizations when filter changes', async () => {
    render(
      <BrowserRouter>
        <SpatialAnalyticsPanel />
      </BrowserRouter>
    );
    
    // Find and interact with the property type filter
    const propertyTypeFilter = screen.getByLabelText('Property Type');
    expect(propertyTypeFilter).toBeInTheDocument();
    
    // Change filter to Residential
    fireEvent.change(propertyTypeFilter, { target: { value: 'Residential' } });
    
    // Verify filter indicator is updated
    await waitFor(() => {
      expect(screen.getByTestId('active-filters-count')).toHaveTextContent('1');
    });
    
    // Change tab to Clustering
    fireEvent.click(screen.getByText('Clustering'));
    
    // Verify clustering tab is now active and reflects the filter
    expect(screen.getByTestId('clustering-tab')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('property-count-indicator')).toHaveTextContent(/Residential/i);
  });
  
  test('should maintain consistent property selection across different analysis views', async () => {
    render(
      <BrowserRouter>
        <SpatialAnalyticsPanel />
      </BrowserRouter>
    );
    
    // Select a property in the heatmap view
    const propertyMarker = screen.getByTestId('property-marker-1'); // First property
    fireEvent.click(propertyMarker);
    
    // Verify property info is displayed
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    
    // Switch to Proximity tab
    fireEvent.click(screen.getByText('Proximity'));
    
    // Verify the same property remains selected
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    
    // Switch to Outliers tab
    fireEvent.click(screen.getByText('Outliers'));
    
    // Verify the property selection is maintained
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });
  
  test('should correctly serialize and restore analysis state from URL parameters', async () => {
    // Mock window.location and history
    const originalLocation = window.location;
    
    // @ts-ignore - partial implementation for testing
    delete window.location;
    window.location = { 
      ...originalLocation,
      search: '?tab=outliers&propertyType=Residential&minValue=400000&maxValue=800000'
    };
    
    render(
      <BrowserRouter>
        <SpatialAnalyticsPanel />
      </BrowserRouter>
    );
    
    // Verify URL parameters are applied
    expect(screen.getByTestId('outliers-tab')).toHaveAttribute('aria-selected', 'true');
    
    // Verify filters are applied from URL
    expect(screen.getByLabelText('Property Type')).toHaveValue('Residential');
    
    // Value range should be set according to URL params
    const minValueSlider = screen.getByTestId('min-value-slider');
    const maxValueSlider = screen.getByTestId('max-value-slider');
    
    expect(minValueSlider).toHaveValue('400000');
    expect(maxValueSlider).toHaveValue('800000');
    
    // Change a filter and verify URL is updated
    fireEvent.change(screen.getByLabelText('Property Type'), { target: { value: 'Commercial' } });
    
    // URL should be updated (actual navigation won't happen in test)
    expect(screen.getByTestId('url-state-indicator')).toHaveAttribute(
      'data-current-url', 
      expect.stringContaining('propertyType=Commercial')
    );
    
    // Reset to original location
    window.location = originalLocation;
  });
  
  test('should export analysis results across all visualization types', async () => {
    render(
      <BrowserRouter>
        <SpatialAnalyticsPanel />
      </BrowserRouter>
    );
    
    // Open export dialog
    fireEvent.click(screen.getByText('Export Results'));
    
    // Verify export options for different visualizations
    expect(screen.getByText('Heatmap Data')).toBeInTheDocument();
    expect(screen.getByText('Clustering Analysis')).toBeInTheDocument();
    expect(screen.getByText('Proximity Impact Report')).toBeInTheDocument();
    expect(screen.getByText('Outlier Detection Results')).toBeInTheDocument();
    
    // Select export format
    fireEvent.click(screen.getByLabelText('Excel (.xlsx)'));
    
    // Start export
    fireEvent.click(screen.getByText('Export Selected'));
    
    // Verify export confirmation
    await waitFor(() => {
      expect(screen.getByText('Export Successful')).toBeInTheDocument();
    });
  });
});