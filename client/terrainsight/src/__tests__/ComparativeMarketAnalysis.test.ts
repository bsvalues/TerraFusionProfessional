import { Property } from '@shared/schema';
import { calculateSimilarityScore } from '../services/comparison/similarityService';
import { findComparableProperties } from '../services/comparison/comparablesService';
import { analyzePropertyValue } from '../services/comparison/valueAnalysisService';

// Sample test properties
const baseProperty: Property = {
  id: 1,
  parcelId: "P1000",
  address: "123 Test St",
  owner: "Test Owner",
  value: "500000",
  salePrice: "490000",
  squareFeet: 2000,
  yearBuilt: 2010,
  bedrooms: 3,
  bathrooms: 2,
  lotSize: 5000,
  propertyType: "residential",
  zoning: "R1",
  neighborhood: "Test Neighborhood",
  latitude: 47.6062,
  longitude: -122.3321,
  lastSaleDate: "2022-01-15",
  taxAssessment: "480000"
};

const similarProperty: Property = {
  ...baseProperty,
  id: 2,
  parcelId: "P1001",
  address: "125 Test St",
  value: "520000",
  salePrice: "510000",
  squareFeet: 2100,
  yearBuilt: 2012
};

const differentProperty: Property = {
  ...baseProperty,
  id: 3,
  parcelId: "P1002",
  address: "500 Far Away Dr",
  value: "800000",
  salePrice: "790000",
  squareFeet: 3500,
  yearBuilt: 2020,
  bedrooms: 5,
  bathrooms: 4,
  lotSize: 10000,
  neighborhood: "Luxury Heights",
  latitude: 47.6502,
  longitude: -122.3421
};

const testProperties: Property[] = [
  baseProperty,
  similarProperty,
  differentProperty,
  {
    ...baseProperty,
    id: 4,
    parcelId: "P1003",
    address: "127 Test St",
    value: "495000",
    squareFeet: 1950,
    yearBuilt: 2009
  },
  {
    ...baseProperty,
    id: 5,
    parcelId: "P1004",
    address: "130 Test St",
    value: "485000",
    squareFeet: 1900,
    yearBuilt: 2008,
    bedrooms: 3,
    bathrooms: 2
  }
];

describe('Property Similarity Scoring', () => {
  test('should calculate higher scores for similar properties', () => {
    const similarScore = calculateSimilarityScore(baseProperty, similarProperty);
    const differentScore = calculateSimilarityScore(baseProperty, differentProperty);
    
    expect(similarScore).toBeGreaterThan(differentScore);
    expect(similarScore).toBeGreaterThan(70); // Similar properties should have high scores
    expect(differentScore).toBeLessThan(50); // Different properties should have lower scores
  });
  
  test('should respect attribute weighting in calculations', () => {
    const locationWeights = { location: 1, features: 0.2, size: 0.2, age: 0.2 };
    const featureWeights = { location: 0.2, features: 1, size: 0.2, age: 0.2 };
    
    const locationScore = calculateSimilarityScore(baseProperty, similarProperty, locationWeights);
    const featureScore = calculateSimilarityScore(baseProperty, similarProperty, featureWeights);
    
    // Weights should affect the final score
    expect(Math.abs(locationScore - featureScore)).toBeGreaterThan(5);
  });
  
  test('should handle missing property attributes gracefully', () => {
    const incompleteProperty: Property = {
      id: 6,
      parcelId: "P1005",
      address: "140 Test St"
    };
    
    // Should not throw an error
    expect(() => calculateSimilarityScore(baseProperty, incompleteProperty)).not.toThrow();
    
    const score = calculateSimilarityScore(baseProperty, incompleteProperty);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
  
  test('should return scores within 0-100 range', () => {
    const score1 = calculateSimilarityScore(baseProperty, similarProperty);
    const score2 = calculateSimilarityScore(baseProperty, differentProperty);
    
    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThanOrEqual(100);
    expect(score2).toBeGreaterThanOrEqual(0);
    expect(score2).toBeLessThanOrEqual(100);
  });
});

describe('Automated Comparables Selection', () => {
  test('should find and rank similar properties', () => {
    const comparables = findComparableProperties(baseProperty, testProperties);
    
    // Should not include the base property itself
    expect(comparables.map(p => p.property.id)).not.toContain(baseProperty.id);
    
    // First result should be the most similar property
    expect(comparables[0].property.id).toBe(similarProperty.id);
    
    // Results should be ordered by similarity score (descending)
    expect(comparables[0].similarityScore).toBeGreaterThan(comparables[1].similarityScore);
  });
  
  test('should respect filter criteria when finding comparables', () => {
    const filters = {
      maxDistance: 1, // km
      sameNeighborhood: true,
      propertyType: 'residential'
    };
    
    const comparables = findComparableProperties(baseProperty, testProperties, filters);
    
    // Should only include properties from the same neighborhood
    expect(comparables.every(c => c.property.neighborhood === baseProperty.neighborhood)).toBe(true);
    
    // Should only include residential properties
    expect(comparables.every(c => c.property.propertyType === 'residential')).toBe(true);
  });
  
  test('should handle empty result sets appropriately', () => {
    // Setting impossible filter criteria
    const filters = {
      yearBuilt: { min: 2030, max: 2040 } // Future years
    };
    
    const comparables = findComparableProperties(baseProperty, testProperties, filters);
    
    // Should return an empty array, not null or undefined
    expect(Array.isArray(comparables)).toBe(true);
    expect(comparables.length).toBe(0);
  });
  
  test('should limit results to requested maximum', () => {
    const maxResults = 2;
    const comparables = findComparableProperties(baseProperty, testProperties, {}, maxResults);
    
    // Should only return at most maxResults properties
    expect(comparables.length).toBeLessThanOrEqual(maxResults);
    // But all appropriate matches should be returned if < maxResults
    expect(comparables.length).toBeGreaterThan(0);
  });
});

describe('Value Analysis', () => {
  test('should detect under/overvalued properties', () => {
    const baseValueAnalysis = analyzePropertyValue(baseProperty, testProperties);
    
    // Over-valued test property
    const overValuedProperty = {
      ...baseProperty,
      id: 7,
      value: "600000" // Significantly higher than similar properties
    };
    const overValuedAnalysis = analyzePropertyValue(overValuedProperty, testProperties);
    
    // Under-valued test property
    const underValuedProperty = {
      ...baseProperty,
      id: 8,
      value: "400000" // Significantly lower than similar properties
    };
    const underValuedAnalysis = analyzePropertyValue(underValuedProperty, testProperties);
    
    // Expect the analysis to correctly detect valuation status
    expect(overValuedAnalysis.valuationStatus).toBe('overvalued');
    expect(underValuedAnalysis.valuationStatus).toBe('undervalued');
    expect(baseValueAnalysis.valuationStatus).toBe('fair-value');
  });
  
  test('should calculate accurate price-per-square-foot metrics', () => {
    const analysis = analyzePropertyValue(baseProperty, testProperties);
    
    // Calculate expected value manually
    const expectedPricePerSqFt = parseFloat(baseProperty.value || '0') / (baseProperty.squareFeet || 1);
    
    expect(analysis.pricePerSquareFoot).toBeCloseTo(expectedPricePerSqFt, 2);
    
    // Should calculate neighborhood average properly
    expect(analysis.neighborhoodAveragePricePerSquareFoot).toBeGreaterThan(0);
  });
  
  test('should handle properties with extreme value differences', () => {
    const extremeProperty = {
      ...baseProperty,
      id: 9,
      value: "10000000" // Extremely high value
    };
    
    // Should not throw or produce NaN results
    const analysis = analyzePropertyValue(extremeProperty, testProperties);
    
    expect(analysis.valuationStatus).toBe('overvalued');
    expect(analysis.percentageDifference).not.toBeNaN();
    expect(analysis.percentageDifference).toBeGreaterThan(0);
  });
});