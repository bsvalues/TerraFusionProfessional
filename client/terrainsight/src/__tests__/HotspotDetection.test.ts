import { HotspotAnalysis } from '../services/hotspotAnalysisService';
import { Property } from '@shared/schema';

// Mock properties for testing
const mockProperties: Property[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  parcelId: `PROP${(i + 1).toString().padStart(3, '0')}`,
  address: `${i + 1} Test St`,
  squareFeet: 2000 + (i * 100),
  value: ((200000 + (i * 20000))).toString(),
  // Create a small cluster of high-value properties
  latitude: i < 5 ? 47.123 + (i * 0.001) : 47.130 + (i * 0.001),
  longitude: i < 5 ? -122.456 + (i * 0.001) : -122.470 + (i * 0.001),
  propertyType: 'residential'
}));

// Mock property with specific location
const mockPropertyWithLatLng = (lat: number, lng: number, value: string = '200000'): Property => ({
  id: 999,
  parcelId: 'TEST999',
  address: 'Test Address',
  squareFeet: 2000,
  value,
  latitude: lat,
  longitude: lng,
  propertyType: 'residential'
});

describe('HotspotAnalysis', () => {
  // Test initialization
  test('should initialize with property data', () => {
    const analysis = new HotspotAnalysis(mockProperties);
    expect(analysis).toBeDefined();
  });

  // Test Getis-Ord Gi* statistic calculation
  test('should calculate Gi* statistics for each property', () => {
    const analysis = new HotspotAnalysis(mockProperties);
    const results = analysis.calculateGiStatistics();
    
    // Each property should have a z-score
    expect(results.length).toBe(mockProperties.length);
    results.forEach(result => {
      expect(result).toHaveProperty('propertyId');
      expect(result).toHaveProperty('zScore');
      expect(result).toHaveProperty('pValue');
    });
  });

  // Test distance weight matrix calculation
  test('should generate distance weight matrix correctly', () => {
    const properties = [
      mockPropertyWithLatLng(47.0, -122.0),
      mockPropertyWithLatLng(47.0, -122.1),
      mockPropertyWithLatLng(47.1, -122.0)
    ];
    
    const analysis = new HotspotAnalysis(properties);
    const weightMatrix = analysis.generateDistanceWeightMatrix();
    
    // Matrix should be same size as properties
    expect(weightMatrix.length).toBe(properties.length);
    expect(weightMatrix[0].length).toBe(properties.length);
    
    // Diagonal elements should be 0 (no self-weight)
    expect(weightMatrix[0][0]).toBe(0);
    expect(weightMatrix[1][1]).toBe(0);
    expect(weightMatrix[2][2]).toBe(0);
    
    // Matrix should be symmetric
    expect(weightMatrix[0][1]).toBe(weightMatrix[1][0]);
    expect(weightMatrix[0][2]).toBe(weightMatrix[2][0]);
    expect(weightMatrix[1][2]).toBe(weightMatrix[2][1]);
    
    // Properties further apart should have lower weights
    // Property 0 and 1 are closer than 0 and 2
    expect(weightMatrix[0][1]).toBeGreaterThan(weightMatrix[0][2]);
  });

  // Test hotspot identification
  test('should identify hotspots with confidence levels', () => {
    // Create a cluster of high-value properties for a clear hotspot
    const highValueCluster = Array.from({ length: 5 }, (_, i) => 
      mockPropertyWithLatLng(47.0 + (i * 0.001), -122.0 + (i * 0.001), '500000')
    );
    
    // Create a cluster of low-value properties for a clear coldspot
    const lowValueCluster = Array.from({ length: 5 }, (_, i) => 
      mockPropertyWithLatLng(47.1 + (i * 0.001), -122.1 + (i * 0.001), '100000')
    );
    
    // Some random properties with mixed values
    const mixedProperties = Array.from({ length: 10 }, (_, i) => 
      mockPropertyWithLatLng(47.05 + (i * 0.01), -122.05 + (i * 0.01), ((200000 + (i * 10000))).toString())
    );
    
    const properties = [...highValueCluster, ...lowValueCluster, ...mixedProperties];
    const analysis = new HotspotAnalysis(properties);
    const hotspots = analysis.identifyHotspots();
    
    // Should have classified all properties
    expect(hotspots.length).toBe(properties.length);
    
    // Should have identified some hotspots and coldspots
    const hotTypes = hotspots.filter(h => h.type === 'hot');
    const coldTypes = hotspots.filter(h => h.type === 'cold');
    const notSignificant = hotspots.filter(h => h.type === 'not-significant');
    
    expect(hotTypes.length).toBeGreaterThan(0);
    expect(coldTypes.length).toBeGreaterThan(0);
    
    // High-value cluster properties should be hotspots
    highValueCluster.forEach(property => {
      const hotspot = hotspots.find(h => h.propertyId === property.id);
      expect(hotspot?.type).toBe('hot');
    });
    
    // Low-value cluster properties should be coldspots
    lowValueCluster.forEach(property => {
      const hotspot = hotspots.find(h => h.propertyId === property.id);
      expect(hotspot?.type).toBe('cold');
    });
    
    // Verify confidence levels
    const confidenceLevels = ['0.90', '0.95', '0.99'];
    const hotspotsWithConfidence = hotspots.filter(h => h.type !== 'not-significant');
    
    hotspotsWithConfidence.forEach(spot => {
      expect(confidenceLevels).toContain(spot.confidence);
    });
  });

  // Test handling of properties without coordinates
  test('should handle properties without coordinates', () => {
    const propertiesWithMissing = [
      ...mockProperties.slice(0, 5),
      {
        id: 100,
        parcelId: 'MISSING100',
        address: 'Missing Coords St',
        squareFeet: 2000,
        value: '200000',
        propertyType: 'residential'
        // Missing coordinates
      }
    ];
    
    const analysis = new HotspotAnalysis(propertiesWithMissing);
    const results = analysis.calculateGiStatistics();
    
    // Should only process properties with coordinates
    expect(results.length).toBe(propertiesWithMissing.length - 1);
  });

  // Test with too few properties
  test('should handle cases with too few properties', () => {
    const fewProperties = mockProperties.slice(0, 2);
    const analysis = new HotspotAnalysis(fewProperties);
    
    // Should not produce errors but might not be statistically significant
    const results = analysis.calculateGiStatistics();
    expect(results.length).toBe(fewProperties.length);
    
    const hotspots = analysis.identifyHotspots();
    expect(hotspots.length).toBe(fewProperties.length);
  });
});