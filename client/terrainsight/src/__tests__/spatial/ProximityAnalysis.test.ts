import { Property } from '@shared/schema';
import { 
  POI, 
  POIType,
  POIInfluenceModel,
  calculateDistance,
  findNearbyPOIs,
  calculatePOIInfluence,
  calculateAggregateInfluence,
  PropertyValueImpact
} from '../../services/spatial/proximityAnalysisService';

// Sample property data for testing
const sampleProperty: Property = {
  id: 1,
  parcelId: "TEST001",
  address: "123 Test Street",
  coordinates: [47.6062, -122.3321], // Seattle coordinates
  value: "400000",
  squareFeet: 2000,
  yearBuilt: 2000,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 5000,
  propertyType: "Residential"
};

// Sample POI data for testing
const samplePOIs: POI[] = [
  {
    id: "p1",
    name: "Central Park",
    type: POIType.Park,
    coordinates: [47.6082, -122.3347], // ~300m from property
    attributes: {
      size: "Large",
      amenities: ["Playground", "Walking Trails"]
    }
  },
  {
    id: "p2",
    name: "Downtown Elementary",
    type: POIType.School,
    coordinates: [47.6042, -122.3301], // ~250m from property
    attributes: {
      type: "Public",
      grades: "K-5",
      rating: 8.5
    }
  },
  {
    id: "p3",
    name: "Metro Station",
    type: POIType.PublicTransit,
    coordinates: [47.6082, -122.3301], // ~350m from property
    attributes: {
      type: "Subway",
      lines: ["Red", "Blue"]
    }
  },
  {
    id: "p4",
    name: "Shopping Mall",
    type: POIType.ShoppingCenter,
    coordinates: [47.6162, -122.3421], // ~1200m from property
    attributes: {
      size: "Large",
      stores: 120
    }
  }
];

// Sample influence models for testing
const sampleInfluenceModels: Record<POIType, POIInfluenceModel> = {
  [POIType.Park]: {
    poiType: POIType.Park,
    maxDistance: 1000, // 1km
    maxImpact: 5, // 5% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.School]: {
    poiType: POIType.School,
    maxDistance: 1500, // 1.5km
    maxImpact: 7, // 7% positive impact
    decayFunction: 'exponential',
    decayRate: 1.5
  },
  [POIType.PublicTransit]: {
    poiType: POIType.PublicTransit,
    maxDistance: 800, // 800m
    maxImpact: 6, // 6% positive impact
    decayFunction: 'logarithmic',
    decayRate: 1.2
  },
  [POIType.ShoppingCenter]: {
    poiType: POIType.ShoppingCenter,
    maxDistance: 2000, // 2km
    maxImpact: 4, // 4% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Hospital]: {
    poiType: POIType.Hospital,
    maxDistance: 1800, // 1.8km
    maxImpact: 3, // 3% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Highway]: {
    poiType: POIType.Highway,
    maxDistance: 1000, // 1km
    maxImpact: -4, // 4% negative impact
    decayFunction: 'exponential',
    decayRate: 2
  },
  [POIType.Restaurant]: {
    poiType: POIType.Restaurant,
    maxDistance: 500, // 500m
    maxImpact: 2, // 2% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Entertainment]: {
    poiType: POIType.Entertainment,
    maxDistance: 1200, // 1.2km
    maxImpact: 3, // 3% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Church]: {
    poiType: POIType.Church,
    maxDistance: 1000, // 1km
    maxImpact: 2, // 2% positive impact
    decayFunction: 'linear',
    decayRate: 1
  },
  [POIType.Library]: {
    poiType: POIType.Library,
    maxDistance: 1200, // 1.2km
    maxImpact: 3, // 3% positive impact
    decayFunction: 'linear',
    decayRate: 1
  }
};

describe('Proximity Analysis Service', () => {
  describe('Distance Calculation', () => {
    test('should calculate correct distance between two points', () => {
      const point1: [number, number] = [47.6062, -122.3321]; // Seattle coordinates
      const point2: [number, number] = [47.6152, -122.3447]; // ~1km away
      
      const distance = calculateDistance(point1, point2);
      
      // Distance should be approximately 1.1-1.3km (allowing for slight variation in calculation methods)
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(1400);
    });
    
    test('should return 0 for identical points', () => {
      const point: [number, number] = [47.6062, -122.3321];
      
      const distance = calculateDistance(point, point);
      
      expect(distance).toBe(0);
    });
    
    test('should handle coordinate conversions correctly', () => {
      // Test with explicitly different format
      const latLong1: [number, number] = [47.6062, -122.3321]; // lat, long format
      const longLat1: [number, number] = [-122.3321, 47.6062]; // long, lat format
      
      // The service should normalize these correctly if formats are different
      const distance = calculateDistance(latLong1, longLat1);
      
      // The distance should not be 0 if different formats are used without normalization
      expect(distance).toBeGreaterThan(0);
    });
  });
  
  describe('POI Finding', () => {
    test('should find POIs within the specified radius', () => {
      const property = sampleProperty;
      const radius = 500; // 500m radius
      
      const nearbyPOIs = findNearbyPOIs(property, samplePOIs, radius);
      
      // Should find 3 POIs within 500m
      expect(nearbyPOIs.length).toBe(3);
      expect(nearbyPOIs.map(poi => poi.id)).toContain('p1');
      expect(nearbyPOIs.map(poi => poi.id)).toContain('p2');
      expect(nearbyPOIs.map(poi => poi.id)).toContain('p3');
    });
    
    test('should include distance in returned POIs', () => {
      const property = sampleProperty;
      const radius = 1000; // 1km radius
      
      const nearbyPOIs = findNearbyPOIs(property, samplePOIs, radius);
      
      // Each POI should have a distance property
      nearbyPOIs.forEach(poi => {
        expect(poi).toHaveProperty('distance');
        expect(typeof poi.distance).toBe('number');
      });
    });
    
    test('should sort POIs by distance', () => {
      const property = sampleProperty;
      const radius = 2000; // 2km radius
      
      const nearbyPOIs = findNearbyPOIs(property, samplePOIs, radius);
      
      // POIs should be sorted by distance (ascending)
      for (let i = 1; i < nearbyPOIs.length; i++) {
        expect(nearbyPOIs[i-1].distance).toBeLessThanOrEqual(nearbyPOIs[i].distance);
      }
    });
    
    test('should return empty array if no POIs within radius', () => {
      const property = sampleProperty;
      const radius = 100; // 100m radius (too small to include any sample POIs)
      
      const nearbyPOIs = findNearbyPOIs(property, samplePOIs, radius);
      
      expect(nearbyPOIs).toHaveLength(0);
    });
    
    test('should handle property without coordinates gracefully', () => {
      const propertyWithoutCoords: Property = {
        ...sampleProperty,
        coordinates: undefined
      };
      
      const radius = 1000; // 1km radius
      
      // Should return empty array or throw an appropriate error
      expect(() => {
        const nearbyPOIs = findNearbyPOIs(propertyWithoutCoords, samplePOIs, radius);
        expect(nearbyPOIs).toHaveLength(0);
      }).not.toThrow();
    });
  });
  
  describe('POI Influence Calculation', () => {
    test('should calculate correct influence for linear decay model', () => {
      const poi = {
        ...samplePOIs[0], // Park
        distance: 300 // 300m away
      };
      
      const model = sampleInfluenceModels[POIType.Park]; // Linear decay
      
      const influence = calculatePOIInfluence(poi, model);
      
      // Linear decay: influence = maxImpact * (1 - distance/maxDistance)
      // 5% * (1 - 300/1000) = 5% * 0.7 = 3.5%
      expect(influence).toBeCloseTo(3.5, 1);
    });
    
    test('should calculate correct influence for exponential decay model', () => {
      const poi = {
        ...samplePOIs[1], // School
        distance: 250 // 250m away
      };
      
      const model = sampleInfluenceModels[POIType.School]; // Exponential decay
      
      const influence = calculatePOIInfluence(poi, model);
      
      // Exponential decay: influence = maxImpact * Math.exp(-decayRate * distance/maxDistance)
      // 7% * Math.exp(-1.5 * 250/1500) = 7% * Math.exp(-0.25) ≈ 7% * 0.779 ≈ 5.45%
      expect(influence).toBeCloseTo(5.45, 1);
    });
    
    test('should calculate correct influence for logarithmic decay model', () => {
      const poi = {
        ...samplePOIs[2], // Transit
        distance: 350 // 350m away
      };
      
      const model = sampleInfluenceModels[POIType.PublicTransit]; // Logarithmic decay
      
      const influence = calculatePOIInfluence(poi, model);
      
      // Logarithmic decay: influence = maxImpact * (1 - Math.log(1 + distance/maxDistance * decayRate))
      // 6% * (1 - Math.log(1 + 350/800 * 1.2)) ≈ 6% * (1 - Math.log(1.525)) ≈ 6% * (1 - 0.422) ≈ 6% * 0.578 ≈ 3.47%
      expect(influence).toBeGreaterThan(3);
      expect(influence).toBeLessThan(4);
    });
    
    test('should return 0 influence for POIs beyond max distance', () => {
      const poi = {
        ...samplePOIs[3], // Shopping Mall
        distance: 2500 // 2.5km away, beyond max distance of 2km
      };
      
      const model = sampleInfluenceModels[POIType.ShoppingCenter];
      
      const influence = calculatePOIInfluence(poi, model);
      
      expect(influence).toBe(0);
    });
    
    test('should return max influence for POIs at distance 0', () => {
      const poi = {
        ...samplePOIs[0], // Park
        distance: 0 // 0m away (directly at the location)
      };
      
      const model = sampleInfluenceModels[POIType.Park];
      
      const influence = calculatePOIInfluence(poi, model);
      
      expect(influence).toBe(model.maxImpact);
    });
    
    test('should handle negative impact correctly', () => {
      // Create a negative impact POI (Highway)
      const poiWithNegativeImpact = {
        id: "n1",
        name: "Highway",
        type: POIType.Highway,
        coordinates: [47.6082, -122.3361], // Close to property
        distance: 200 // 200m away
      };
      
      const model = sampleInfluenceModels[POIType.Highway]; // Negative impact
      
      const influence = calculatePOIInfluence(poiWithNegativeImpact, model);
      
      // Negative impacts should remain negative after decay calculations
      expect(influence).toBeLessThan(0);
      
      // Exponential decay: influence = maxImpact * Math.exp(-decayRate * distance/maxDistance)
      // -4% * Math.exp(-2 * 200/1000) = -4% * Math.exp(-0.4) ≈ -4% * 0.67 ≈ -2.68%
      expect(influence).toBeCloseTo(-2.68, 1);
    });
  });
  
  describe('Aggregate Influence Calculation', () => {
    test('should calculate correct aggregate influence from multiple POIs', () => {
      const property = sampleProperty;
      const poiWithDistances = [
        { ...samplePOIs[0], distance: 300 }, // Park, 300m
        { ...samplePOIs[1], distance: 250 }, // School, 250m
        { ...samplePOIs[2], distance: 350 }  // Transit, 350m
      ];
      
      const valueImpact = calculateAggregateInfluence(
        property, 
        poiWithDistances,
        sampleInfluenceModels
      );
      
      // Expected influences:
      // Park: ~3.5%
      // School: ~5.45%
      // Transit: ~3.47%
      
      // Value impact should have these influences
      expect(valueImpact.totalImpactPercentage).toBeGreaterThan(10);
      expect(valueImpact.totalImpactPercentage).toBeLessThan(14);
      
      // Breakdown should match individual influence calculations
      expect(valueImpact.impactBreakdown).toHaveLength(3);
      
      // Should calculate impact value based on property value
      const propertyValue = parseFloat(property.value.toString().replace(/[^0-9.-]+/g, ''));
      const expectedImpactValue = propertyValue * (valueImpact.totalImpactPercentage / 100);
      expect(valueImpact.totalImpactValue).toBeCloseTo(expectedImpactValue, 0);
    });
    
    test('should handle property without value gracefully', () => {
      const propertyWithoutValue: Property = {
        ...sampleProperty,
        value: undefined
      };
      
      const poiWithDistances = [
        { ...samplePOIs[0], distance: 300 }, // Park, 300m
      ];
      
      const valueImpact = calculateAggregateInfluence(
        propertyWithoutValue, 
        poiWithDistances,
        sampleInfluenceModels
      );
      
      // Should still calculate percentage impact
      expect(valueImpact.totalImpactPercentage).toBeGreaterThan(0);
      
      // Value impact should be 0 or undefined
      expect(valueImpact.totalImpactValue).toBe(0);
    });
    
    test('should return zero impact when no POIs are provided', () => {
      const property = sampleProperty;
      const emptyPOIs: (POI & { distance: number })[] = [];
      
      const valueImpact = calculateAggregateInfluence(
        property, 
        emptyPOIs,
        sampleInfluenceModels
      );
      
      expect(valueImpact.totalImpactPercentage).toBe(0);
      expect(valueImpact.totalImpactValue).toBe(0);
      expect(valueImpact.impactBreakdown).toHaveLength(0);
    });
  });
});