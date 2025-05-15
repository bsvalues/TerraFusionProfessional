import { 
  calculateSimilarityScore, 
  parsePropertyValue, 
  calculateDistance, 
  normalizeWeights,
  DEFAULT_WEIGHTS
} from '../PropertyScoring';
import { Property } from '../../../shared/schema';

describe('PropertyScoring', () => {
  describe('parsePropertyValue', () => {
    it('should parse currency strings correctly', () => {
      expect(parsePropertyValue('$250,000')).toBe(250000);
      expect(parsePropertyValue('$1,000,000')).toBe(1000000);
      expect(parsePropertyValue('250000')).toBe(250000);
      expect(parsePropertyValue('$0')).toBe(0);
    });
    
    it('should handle null values', () => {
      expect(parsePropertyValue(null)).toBe(0);
    });
    
    it('should handle invalid values', () => {
      expect(parsePropertyValue('Invalid')).toBe(0);
      expect(parsePropertyValue('')).toBe(0);
    });
  });
  
  describe('calculateDistance', () => {
    it('should calculate the distance between two points', () => {
      // Approximately 1 km apart
      const distance = calculateDistance(
        47.6062, -122.3321, // Seattle coordinates
        47.6152, -122.3447 // About 1 km northwest
      );
      
      // Should be approximately 1 km with some error margin
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });
    
    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(
        47.6062, -122.3321,
        47.6062, -122.3321
      );
      
      expect(distance).toBeCloseTo(0);
    });
  });
  
  describe('normalizeWeights', () => {
    it('should normalize weights to sum to 1', () => {
      const weights = {
        value: 2,
        yearBuilt: 1,
        squareFeet: 1,
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 1,
        neighborhood: 1
      };
      
      const normalized = normalizeWeights(weights);
      
      // Sum should be 1
      const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1);
      
      // Relative weights should be maintained
      expect(normalized.value).toBeCloseTo(2/8);
      expect(normalized.yearBuilt).toBeCloseTo(1/8);
    });
    
    it('should handle zero weights by returning default weights', () => {
      const weights = {
        value: 0,
        yearBuilt: 0,
        squareFeet: 0,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: 0,
        neighborhood: 0
      };
      
      const normalized = normalizeWeights(weights);
      
      // Should return default weights
      expect(normalized).toEqual(DEFAULT_WEIGHTS);
    });
  });
  
  describe('calculateSimilarityScore', () => {
    // Define some test properties
    const property1: Partial<Property> = {
      id: 1,
      address: '123 Main St',
      value: '$300000',
      yearBuilt: 2000,
      squareFeet: 2000,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'Residential',
      neighborhood: 'Downtown'
    };
    
    const property2: Partial<Property> = {
      id: 2,
      address: '456 Oak St',
      value: '$350000',
      yearBuilt: 2005,
      squareFeet: 2200,
      bedrooms: 3,
      bathrooms: 2,
      propertyType: 'Residential',
      neighborhood: 'Downtown'
    };
    
    const property3: Partial<Property> = {
      id: 3,
      address: '789 Pine St',
      value: '$600000',
      yearBuilt: 1980,
      squareFeet: 3000,
      bedrooms: 4,
      bathrooms: 3,
      propertyType: 'Commercial',
      neighborhood: 'Suburbs'
    };
    
    it('should return a higher score for more similar properties', () => {
      const score12 = calculateSimilarityScore(property1 as Property, property2 as Property);
      const score13 = calculateSimilarityScore(property1 as Property, property3 as Property);
      
      // Property 1 and 2 should be more similar than 1 and 3
      expect(score12).toBeGreaterThan(score13);
    });
    
    it('should weight attributes according to provided weights', () => {
      // Create weights that only care about property type
      const typeOnlyWeights = {
        value: 0,
        yearBuilt: 0,
        squareFeet: 0,
        bedrooms: 0,
        bathrooms: 0,
        propertyType: 1,
        neighborhood: 0
      };
      
      // Score with default weights
      const defaultScore = calculateSimilarityScore(
        property1 as Property, 
        property3 as Property
      );
      
      // Score with type-only weights
      const typeScore = calculateSimilarityScore(
        property1 as Property, 
        property3 as Property, 
        typeOnlyWeights
      );
      
      // Since properties have different types, the type-only score should be 0
      expect(typeScore).toBe(0);
      // The default score should consider other factors
      expect(defaultScore).toBeGreaterThan(0);
    });
  });
});