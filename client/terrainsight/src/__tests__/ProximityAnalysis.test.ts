import { Property } from '@/shared/schema';
import { 
  calculateDistanceToAmenity, 
  generateIsochrones, 
  quantifyProximityImpact,
  ProximityAnalysisResult
} from '../services/proximityAnalysisService';

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
    propertyType: "Residential"
  },
  {
    id: 2,
    parcelId: "P002",
    address: "456 Elm St",
    latitude: 40.7228,
    longitude: -74.016,
    value: "600000",
    neighborhood: "Downtown",
    propertyType: "Residential"
  },
  {
    id: 3,
    parcelId: "P003",
    address: "789 Oak St",
    latitude: 40.7328,
    longitude: -74.026,
    value: "700000",
    neighborhood: "Midtown",
    propertyType: "Residential"
  },
  {
    id: 4,
    parcelId: "P004",
    address: "101 Pine St",
    latitude: 40.7428,
    longitude: -74.036,
    value: "800000",
    neighborhood: "Uptown",
    propertyType: "Residential",
  },
  {
    id: 5,
    parcelId: "P005",
    address: "999 Industrial Ave",
    latitude: 40.7028,
    longitude: -74.046,
    value: "1200000",
    neighborhood: "Industrial",
    propertyType: "Commercial"
  }
];

// Mock amenity data
const mockAmenities = [
  {
    id: 1,
    name: "Central Park",
    type: "Park",
    latitude: 40.7128,
    longitude: -74.0059, // Very close to property #1
  },
  {
    id: 2,
    name: "Downtown Shopping Mall",
    type: "Shopping",
    latitude: 40.7228,
    longitude: -74.017, // Near property #2
  },
  {
    id: 3,
    name: "Midtown School",
    type: "School",
    latitude: 40.7328,
    longitude: -74.030, // Near property #3
  }
];

// Mock property with missing coordinates
const propertyWithoutCoordinates: Property = {
  id: 6,
  parcelId: "P006",
  address: "Unknown Location",
  value: "550000",
  neighborhood: "Unknown",
  propertyType: "Residential"
};

describe('Proximity Analysis', () => {
  test('should calculate distance from property to amenities', () => {
    // Calculate distance from property 1 to Central Park
    const distance = calculateDistanceToAmenity(
      mockProperties[0], 
      mockAmenities[0]
    );
    
    // Central Park is very close to property 1
    expect(distance).toBeLessThan(0.1); // Less than 0.1 km
    
    // Calculate distance from property 4 to Central Park
    const farDistance = calculateDistanceToAmenity(
      mockProperties[3], 
      mockAmenities[0]
    );
    
    // Property 4 is further away
    expect(farDistance).toBeGreaterThan(3); // More than 3 km
    
    // Compare distances
    expect(distance).toBeLessThan(farDistance);
  });
  
  test('should generate isochrone boundaries correctly', () => {
    // Generate 5, 10, and 15 minute walking distances from Central Park
    const isochrones = generateIsochrones({
      latitude: mockAmenities[0].latitude,
      longitude: mockAmenities[0].longitude,
      travelTimes: [5, 10, 15],
      mode: 'walking'
    });
    
    // Verify the structure of the result
    expect(isochrones.length).toBe(3); // One for each travel time
    
    // Each isochrone should have a set of coordinates forming a polygon
    for (const isochrone of isochrones) {
      expect(isochrone.travelTime).toBeDefined();
      expect(isochrone.coordinates.length).toBeGreaterThan(0);
      expect(isochrone.mode).toBe('walking');
    }
    
    // Verify the isochrones are in order of increasing travel time
    expect(isochrones[0].travelTime).toBe(5);
    expect(isochrones[1].travelTime).toBe(10);
    expect(isochrones[2].travelTime).toBe(15);
    
    // The polygon for 15 minutes should encompass more area than the one for 5 minutes
    expect(isochrones[2].coordinates.length).toBeGreaterThanOrEqual(isochrones[0].coordinates.length);
  });
  
  test('should quantify value impact from proximity factors', () => {
    // Configure analysis parameters
    const analysisParams = {
      amenityType: 'Park',
      distanceThresholds: [0.5, 1, 2], // km
      properties: mockProperties,
      amenities: mockAmenities.filter(a => a.type === 'Park')
    };
    
    // Run the analysis
    const result = quantifyProximityImpact(analysisParams);
    
    // Verify the impact values are calculated
    expect(result.impactByDistance.length).toBe(3); // One for each threshold
    
    // Verify the structure of each impact value
    for (const impact of result.impactByDistance) {
      expect(impact.distanceThreshold).toBeDefined();
      expect(impact.averageValue).toBeDefined();
      expect(impact.propertyCount).toBeGreaterThan(0);
      expect(impact.valueImpact).toBeDefined();
    }
    
    // Properties closer to parks should have a higher value impact
    expect(result.impactByDistance[0].valueImpact)
      .toBeGreaterThanOrEqual(result.impactByDistance[2].valueImpact);
    
    // Verify the regression statistics are present
    expect(result.regressionModel).toBeDefined();
    expect(result.regressionModel?.r2).toBeGreaterThan(0);
    expect(result.regressionModel?.coefficients).toBeDefined();
    
    // The coefficient for distance should be negative (values decrease with distance)
    expect(result.regressionModel?.coefficients.distance).toBeLessThan(0);
  });
  
  test('should handle different amenity types', () => {
    // Analyze impact of schools
    const schoolAnalysis = quantifyProximityImpact({
      amenityType: 'School',
      distanceThresholds: [0.5, 1, 2],
      properties: mockProperties,
      amenities: mockAmenities.filter(a => a.type === 'School')
    });
    
    // Analyze impact of shopping
    const shoppingAnalysis = quantifyProximityImpact({
      amenityType: 'Shopping',
      distanceThresholds: [0.5, 1, 2],
      properties: mockProperties,
      amenities: mockAmenities.filter(a => a.type === 'Shopping')
    });
    
    // Verify both analyses produced results
    expect(schoolAnalysis.impactByDistance.length).toBe(3);
    expect(shoppingAnalysis.impactByDistance.length).toBe(3);
    
    // Verify the amenity types are recorded correctly
    expect(schoolAnalysis.amenityType).toBe('School');
    expect(shoppingAnalysis.amenityType).toBe('Shopping');
    
    // Different amenities should produce different impacts
    expect(schoolAnalysis.regressionModel?.coefficients.distance)
      .not.toBe(shoppingAnalysis.regressionModel?.coefficients.distance);
  });
  
  test('should handle properties with missing coordinate data', () => {
    // Add a property without coordinates to the analysis
    const propertiesWithMissing = [...mockProperties, propertyWithoutCoordinates];
    
    // Run the analysis
    const result = quantifyProximityImpact({
      amenityType: 'Park',
      distanceThresholds: [0.5, 1, 2],
      properties: propertiesWithMissing,
      amenities: mockAmenities.filter(a => a.type === 'Park')
    });
    
    // Verify the property count in the analysis matches the valid properties
    const totalPropertiesInAnalysis = result.impactByDistance.reduce(
      (sum, impact) => sum + impact.propertyCount, 0
    );
    
    // Should not include the property without coordinates
    expect(totalPropertiesInAnalysis).toBeLessThan(propertiesWithMissing.length);
    expect(result.excludedProperties).toBe(1);
    
    // Attempting to calculate distance to a property without coordinates should throw an error
    expect(() => {
      calculateDistanceToAmenity(propertyWithoutCoordinates, mockAmenities[0]);
    }).toThrow();
  });
  
  test('should provide actionable insights', () => {
    // Run a comprehensive analysis with all amenity types
    const result = quantifyProximityImpact({
      amenityType: 'All',
      distanceThresholds: [0.5, 1, 2],
      properties: mockProperties,
      amenities: mockAmenities
    });
    
    // Check for actionable insights in the result
    expect(result.insights.length).toBeGreaterThan(0);
    
    // Each insight should have a meaningful description and impact value
    for (const insight of result.insights) {
      expect(insight.description).toBeDefined();
      expect(insight.description.length).toBeGreaterThan(0);
      expect(insight.impactValue).toBeDefined();
      expect(insight.amenityType).toBeDefined();
    }
    
    // Should identify the most impactful amenity
    expect(result.mostImpactfulAmenity).toBeDefined();
    expect(mockAmenities.some(a => a.type === result.mostImpactfulAmenity)).toBe(true);
    
    // Should provide optimal distance thresholds
    expect(result.optimalDistance).toBeDefined();
    expect(result.optimalDistance).toBeGreaterThan(0);
  });
});