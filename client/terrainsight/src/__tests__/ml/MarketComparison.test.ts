import { Property } from '@shared/schema';
import { 
  calculateAutoWeightedSimilarity, 
  identifyMarketSegments,
  calculateValueInfluenceRadius,
  analyzePriceSensitivity,
  MarketSegment,
  InfluenceRadiusResult,
  PriceSensitivityResult
} from '../../services/comparison/enhancedComparisonService';

// Mock properties for market comparison testing
const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: "MARKET001",
    address: "123 Market St",
    propertyType: "Single Family",
    squareFeet: 2500,
    yearBuilt: 2000,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 7500,
    value: "550000",
    neighborhood: "Downtown",
    latitude: 47.6062,
    longitude: -122.3321
  },
  {
    id: 2,
    parcelId: "MARKET002",
    address: "456 Segment Ave",
    propertyType: "Single Family",
    squareFeet: 2300,
    yearBuilt: 1998,
    bedrooms: 4,
    bathrooms: 2.5,
    lotSize: 7200,
    value: "535000",
    neighborhood: "Downtown",
    latitude: 47.6072,
    longitude: -122.3341
  },
  {
    id: 3,
    parcelId: "MARKET003",
    address: "789 Cluster Rd",
    propertyType: "Condo",
    squareFeet: 1200,
    yearBuilt: 2010,
    bedrooms: 2,
    bathrooms: 2,
    lotSize: 0,
    value: "380000",
    neighborhood: "Downtown",
    latitude: 47.6092,
    longitude: -122.3361
  },
  {
    id: 4,
    parcelId: "MARKET004",
    address: "101 Segment Ln",
    propertyType: "Condo",
    squareFeet: 1100,
    yearBuilt: 2008,
    bedrooms: 2,
    bathrooms: 1.5,
    lotSize: 0,
    value: "365000",
    neighborhood: "Downtown",
    latitude: 47.6082,
    longitude: -122.3371
  },
  {
    id: 5,
    parcelId: "MARKET005",
    address: "202 Rural Dr",
    propertyType: "Single Family",
    squareFeet: 2800,
    yearBuilt: 1980,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 15000,
    value: "480000",
    neighborhood: "Suburbs",
    latitude: 47.7082,
    longitude: -122.2351
  },
  {
    id: 6,
    parcelId: "MARKET006",
    address: "303 Country Pl",
    propertyType: "Single Family",
    squareFeet: 3200,
    yearBuilt: 1975,
    bedrooms: 5,
    bathrooms: 3,
    lotSize: 20000,
    value: "510000",
    neighborhood: "Suburbs",
    latitude: 47.7092,
    longitude: -122.2361
  },
  {
    id: 7,
    parcelId: "MARKET007",
    address: "404 Luxury Ct",
    propertyType: "Single Family",
    squareFeet: 4500,
    yearBuilt: 2015,
    bedrooms: 5,
    bathrooms: 4.5,
    lotSize: 12000,
    value: "1200000",
    neighborhood: "Premium Heights",
    latitude: 47.6292,
    longitude: -122.3161
  },
  {
    id: 8,
    parcelId: "MARKET008",
    address: "505 Estate Ave",
    propertyType: "Single Family",
    squareFeet: 5200,
    yearBuilt: 2010,
    bedrooms: 6,
    bathrooms: 5,
    lotSize: 25000,
    value: "1350000",
    neighborhood: "Premium Heights",
    latitude: 47.6282,
    longitude: -122.3151
  }
];

describe('Enhanced Market Comparison', () => {
  test('should identify truly similar properties with auto-weighting', () => {
    // Take a reference property
    const referenceProperty = mockProperties[0]; // Downtown single family
    
    // Calculate auto-weighted similarity with all properties
    const similarityResults = mockProperties.map(property => ({
      property,
      similarityScore: calculateAutoWeightedSimilarity(referenceProperty, property, mockProperties)
    }));
    
    // Sort by similarity score
    similarityResults.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Most similar property should be the reference property itself
    expect(similarityResults[0].property.id).toBe(referenceProperty.id);
    
    // Second most similar should be the other downtown single family
    expect(similarityResults[1].property.id).toBe(2);
    
    // Downtown condos should be less similar than downtown single family
    const downtownSingleFamilyRank = similarityResults.findIndex(result => 
      result.property.id === 2
    );
    
    const downtownCondoRank = similarityResults.findIndex(result => 
      result.property.id === 3
    );
    
    expect(downtownSingleFamilyRank).toBeLessThan(downtownCondoRank);
    
    // Premium properties should be least similar to downtown single family
    const premiumPropertyRanks = similarityResults
      .map((result, index) => result.property.neighborhood === "Premium Heights" ? index : -1)
      .filter(rank => rank !== -1);
    
    // Premium properties should be in the bottom half of the similarity rankings
    premiumPropertyRanks.forEach(rank => {
      expect(rank).toBeGreaterThan(mockProperties.length / 2);
    });
  });

  test('should provide different similarity results with different property types', () => {
    // Take a reference condo
    const referenceCondo = mockProperties.find(p => p.propertyType === "Condo");
    
    if (!referenceCondo) {
      throw new Error("Test data missing condo property type");
    }
    
    // Calculate auto-weighted similarity with all properties
    const similarityResults = mockProperties.map(property => ({
      property,
      similarityScore: calculateAutoWeightedSimilarity(referenceCondo, property, mockProperties)
    }));
    
    // Sort by similarity score
    similarityResults.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // After the reference property itself, the most similar should be other condos
    const topProperties = similarityResults.slice(1, 3);
    const topPropertyTypes = topProperties.map(result => result.property.propertyType);
    
    // At least one of the top 2 similar properties should be a condo
    expect(topPropertyTypes).toContain("Condo");
  });

  test('should identify distinct market segments', () => {
    // Identify market segments across all properties
    const segments = identifyMarketSegments(mockProperties);
    
    // Should identify at least 3 segments (luxury, downtown, suburban)
    expect(segments.length).toBeGreaterThanOrEqual(3);
    
    // Each segment should have properties
    segments.forEach(segment => {
      expect(segment.properties.length).toBeGreaterThan(0);
    });
    
    // Check that similar properties are grouped together
    const downtownSingleFamily = segments.find(segment => 
      segment.properties.some(p => p.id === 1) && 
      segment.properties.some(p => p.id === 2)
    );
    
    expect(downtownSingleFamily).toBeDefined();
    
    // Check that premium properties are in their own segment
    const premiumSegment = segments.find(segment => 
      segment.properties.some(p => p.neighborhood === "Premium Heights")
    );
    
    expect(premiumSegment).toBeDefined();
    if (premiumSegment) {
      // All properties in premium segment should be from Premium Heights
      premiumSegment.properties.forEach(property => {
        expect(property.neighborhood).toBe("Premium Heights");
      });
    }
  });

  test('should calculate value influence radius correctly', () => {
    // Calculate influence radius for downtown property
    const downtownProperty = mockProperties[0];
    const influenceRadius = calculateValueInfluenceRadius(downtownProperty, mockProperties);
    
    // Influence radius should be defined
    expect(influenceRadius).toBeDefined();
    
    // Should have a primary radius value in kilometers
    expect(influenceRadius.radiusKm).toBeGreaterThan(0);
    
    // Should include influence decay data
    expect(influenceRadius.decayRate).toBeGreaterThan(0);
    
    // Should have influenced properties
    expect(influenceRadius.influencedProperties.length).toBeGreaterThan(0);
    
    // Closer properties should have higher influence scores
    const sortedByDistance = [...influenceRadius.influencedProperties]
      .sort((a, b) => a.distanceKm - b.distanceKm);
    
    if (sortedByDistance.length >= 2) {
      const closerProperty = sortedByDistance[0];
      const fartherProperty = sortedByDistance[sortedByDistance.length - 1];
      
      expect(closerProperty.influenceScore).toBeGreaterThan(fartherProperty.influenceScore);
    }
  });

  test('should analyze price sensitivity relative to features', () => {
    // Analyze price sensitivity for the dataset
    const sensitivity = analyzePriceSensitivity(mockProperties);
    
    // Should identify price factors
    expect(sensitivity.factors.length).toBeGreaterThan(0);
    
    // Square footage should be a key factor
    const sqftFactor = sensitivity.factors.find(factor => 
      factor.feature === "squareFeet"
    );
    
    expect(sqftFactor).toBeDefined();
    if (sqftFactor) {
      expect(sqftFactor.impact).toBeGreaterThan(0);
    }
    
    // Should have r-squared value for model fit
    expect(sensitivity.modelFit).toBeGreaterThanOrEqual(0);
    expect(sensitivity.modelFit).toBeLessThanOrEqual(1);
    
    // Check elasticity calculation for square footage
    expect(sensitivity.elasticity).toBeDefined();
    if (sensitivity.elasticity) {
      expect(sensitivity.elasticity.squareFeet).toBeGreaterThan(0);
    }
  });
});