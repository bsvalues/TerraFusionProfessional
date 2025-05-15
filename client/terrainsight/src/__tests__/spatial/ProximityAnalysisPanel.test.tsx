import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProximityAnalysisPanel } from '../../components/spatial/ProximityAnalysisPanel';
import { Property } from '@shared/schema';
import { 
  proximityAnalysisService, 
  POI, 
  POIType,
  PropertyValueImpact 
} from '../../services/spatial/proximityAnalysisService';

// Mock the proximityAnalysisService
jest.mock('../../services/spatial/proximityAnalysisService', () => ({
  POIType: {
    Park: 'park',
    School: 'school',
    Hospital: 'hospital',
    ShoppingCenter: 'shopping_center',
    PublicTransit: 'public_transit',
    Highway: 'highway',
    Restaurant: 'restaurant',
    Entertainment: 'entertainment',
    Church: 'church',
    Library: 'library'
  },
  proximityAnalysisService: {
    findNearbyPOIs: jest.fn(),
    calculatePropertyValueImpact: jest.fn(),
    getPOICategories: jest.fn(),
    getDefaultInfluenceModels: jest.fn()
  }
}));

const mockSelectedProperty: Property = {
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

const mockProperties: Property[] = [
  mockSelectedProperty,
  {
    id: 2,
    parcelId: "KE000002",
    address: "456 Sample Road",
    coordinates: [47.6162, -122.3421],
    value: "525000",
    squareFeet: 2400,
    yearBuilt: 2010,
    propertyType: "Residential",
    neighborhood: "Test Neighborhood"
  }
];

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

const mockValueImpact: PropertyValueImpact = {
  property: mockSelectedProperty,
  totalImpactPercentage: 8.7,
  totalImpactValue: 39150,
  impactBreakdown: [
    {
      poiType: POIType.Park,
      poiName: "Central Park",
      distance: 300,
      impactPercentage: 3.5,
      impactValue: 15750
    },
    {
      poiType: POIType.School,
      poiName: "Downtown Elementary",
      distance: 250,
      impactPercentage: 5.2,
      impactValue: 23400
    }
  ]
};

describe('ProximityAnalysisPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the service functions
    (proximityAnalysisService.findNearbyPOIs as jest.Mock).mockReturnValue(mockPOIs);
    (proximityAnalysisService.calculatePropertyValueImpact as jest.Mock).mockReturnValue(mockValueImpact);
    (proximityAnalysisService.getPOICategories as jest.Mock).mockReturnValue(Object.values(POIType));
    (proximityAnalysisService.getDefaultInfluenceModels as jest.Mock).mockReturnValue({});
  });

  test('renders without crashing', () => {
    render(
      <ProximityAnalysisPanel 
        selectedProperty={mockSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    expect(screen.getByText(/Proximity Value Analysis/i)).toBeInTheDocument();
  });
  
  test('displays proximity analysis results when property is selected', async () => {
    render(
      <ProximityAnalysisPanel 
        selectedProperty={mockSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    // Should show the value impact
    await waitFor(() => {
      expect(screen.getByText(/8.7%/i)).toBeInTheDocument();
      expect(screen.getByText(/\$39,150/i)).toBeInTheDocument();
    });
    
    // Should show POIs in the list
    expect(screen.getByText(/Central Park/i)).toBeInTheDocument();
    expect(screen.getByText(/Downtown Elementary/i)).toBeInTheDocument();
  });
  
  test('shows empty state when no property is selected', () => {
    render(
      <ProximityAnalysisPanel 
        selectedProperty={undefined}
        allProperties={mockProperties}
      />
    );
    
    expect(screen.getByText(/No Property Selected/i)).toBeInTheDocument();
  });
  
  test('allows filtering POIs by type', async () => {
    render(
      <ProximityAnalysisPanel 
        selectedProperty={mockSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    // Find a filter checkbox and click it
    const schoolFilter = screen.getByLabelText(/school/i);
    fireEvent.click(schoolFilter);
    
    // Should update the analysis
    await waitFor(() => {
      expect(proximityAnalysisService.calculatePropertyValueImpact).toHaveBeenCalledTimes(2);
    });
  });
  
  test('allows adjusting analysis radius', async () => {
    render(
      <ProximityAnalysisPanel 
        selectedProperty={mockSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    // Find a slider input and change it
    const radiusSlider = screen.getByLabelText(/analysis radius/i);
    fireEvent.change(radiusSlider, { target: { value: 2000 } });
    
    // Should recompute with the new radius
    await waitFor(() => {
      expect(proximityAnalysisService.findNearbyPOIs).toHaveBeenCalledWith(
        mockSelectedProperty,
        expect.anything(),
        2000
      );
    });
  });
  
  test('displays map visualization component', () => {
    render(
      <ProximityAnalysisPanel 
        selectedProperty={mockSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    expect(screen.getByTestId('proximity-map')).toBeInTheDocument();
  });
  
  test('updates when a new property is selected', async () => {
    const { rerender } = render(
      <ProximityAnalysisPanel 
        selectedProperty={mockSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    // Reset mock and update selected property
    jest.clearAllMocks();
    
    const newSelectedProperty = {
      ...mockSelectedProperty,
      id: 3,
      address: "New Property"
    };
    
    rerender(
      <ProximityAnalysisPanel 
        selectedProperty={newSelectedProperty}
        allProperties={mockProperties}
      />
    );
    
    // Should recompute with the new property
    await waitFor(() => {
      expect(proximityAnalysisService.calculatePropertyValueImpact).toHaveBeenCalledWith(
        newSelectedProperty,
        expect.anything(),
        expect.anything()
      );
    });
  });
});