import { Property } from '@shared/schema';
import { 
  calculateSpatialAutocorrelation, 
  generateValueHeatmap,
  calculateLocationScore,
  identifySpatialOutliers,
  SpatialAutocorrelationResult,
  HeatmapPoint,
  LocationScoreResult,
  SpatialOutlier
} from '../../services/spatial/spatialAnalyticsService';

// Mock properties with spatial coordinates
const mockSpatialProperties: Property[] = [
  // Cluster 1 - High value downtown properties
  {
    id: 1,
    parcelId: "SPATIAL001",
    address: "123 Downtown St",
    propertyType: "Single Family",
    squareFeet: 2500,
    yearBuilt: 2000,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 7500,
    value: "950000",
    neighborhood: "Downtown",
    latitude: 47.6062,
    longitude: -122.3321
  },
  {
    id: 2,
    parcelId: "SPATIAL002",
    address: "125 Downtown St",
    propertyType: "Single Family",
    squareFeet: 2400,
    yearBuilt: 1998,
    bedrooms: 4,
    bathrooms: 2.5,
    lotSize: 7200,
    value: "920000",
    neighborhood: "Downtown",
    latitude: 47.6064,
    longitude: -122.3323
  },
  {
    id: 3,
    parcelId: "SPATIAL003",
    address: "127 Downtown St",
    propertyType: "Single Family",
    squareFeet: 2600,
    yearBuilt: 2002,
    bedrooms: 4,
    bathrooms: 3,
    lotSize: 7800,
    value: "980000",
    neighborhood: "Downtown",
    latitude: 47.6066,
    longitude: -122.3325
  },
  
  // Cluster 2 - Mid value midtown properties
  {
    id: 4,
    parcelId: "SPATIAL004",
    address: "234 Midtown Ave",
    propertyType: "Single Family",
    squareFeet: 2100,
    yearBuilt: 1990,
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 6500,
    value: "650000",
    neighborhood: "Midtown",
    latitude: 47.6162,
    longitude: -122.3421
  },
  {
    id: 5,
    parcelId: "SPATIAL005",
    address: "236 Midtown Ave",
    propertyType: "Single Family",
    squareFeet: 2000,
    yearBuilt: 1985,
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 6200,
    value: "625000",
    neighborhood: "Midtown",
    latitude: 47.6164,
    longitude: -122.3423
  },
  {
    id: 6,
    parcelId: "SPATIAL006",
    address: "238 Midtown Ave",
    propertyType: "Single Family",
    squareFeet: 2200,
    yearBuilt: 1995,
    bedrooms: 3,
    bathrooms: 2.5,
    lotSize: 6800,
    value: "675000",
    neighborhood: "Midtown",
    latitude: 47.6166,
    longitude: -122.3425
  },
  
  // Cluster 3 - Lower value suburban properties
  {
    id: 7,
    parcelId: "SPATIAL007",
    address: "345 Suburb Ln",
    propertyType: "Single Family",
    squareFeet: 1800,
    yearBuilt: 1975,
    bedrooms: 3,
    bathrooms: 1.5,
    lotSize: 8500,
    value: "450000",
    neighborhood: "Suburbs",
    latitude: 47.6262,
    longitude: -122.3521
  },
  {
    id: 8,
    parcelId: "SPATIAL008",
    address: "347 Suburb Ln",
    propertyType: "Single Family",
    squareFeet: 1700,
    yearBuilt: 1970,
    bedrooms: 3,
    bathrooms: 1.5,
    lotSize: 8200,
    value: "435000",
    neighborhood: "Suburbs",
    latitude: 47.6264,
    longitude: -122.3523
  },
  {
    id: 9,
    parcelId: "SPATIAL009",
    address: "349 Suburb Ln",
    propertyType: "Single Family",
    squareFeet: 1900,
    yearBuilt: 1980,
    bedrooms: 3,
    bathrooms: 2,
    lotSize: 8800,
    value: "465000",
    neighborhood: "Suburbs",
    latitude: 47.6266,
    longitude: -122.3525
  },
  
  // Spatial outliers - properties with values that don't match their surroundings
  {
    id: 10,
    parcelId: "SPATIAL010",
    address: "500 Luxury Ave",
    propertyType: "Single Family",
    squareFeet: 3500,
    yearBuilt: 2015,
    bedrooms: 5,
    bathrooms: 4,
    lotSize: 9000,
    value: "1200000", // High value property in suburbs
    neighborhood: "Suburbs",
    latitude: 47.6268,
    longitude: -122.3527
  },
  {
    id: 11,
    parcelId: "SPATIAL011",
    address: "100 Bargain St",
    propertyType: "Single Family",
    squareFeet: 1500,
    yearBuilt: 1960,
    bedrooms: 2,
    bathrooms: 1,
    lotSize: 5000,
    value: "550000", // Lower value property in downtown
    neighborhood: "Downtown",
    latitude: 47.6068,
    longitude: -122.3327
  }
];

// Mock POI data for location scoring
const mockPOIs = [
  { 
    id: 1, 
    name: "Central Park", 
    type: "park", 
    latitude: 47.6080, 
    longitude: -122.3340,
    rating: 4.8
  },
  { 
    id: 2, 
    name: "Downtown Elementary", 
    type: "school", 
    latitude: 47.6070, 
    longitude: -122.3335,
    rating: 4.2
  },
  { 
    id: 3, 
    name: "Shopping Mall", 
    type: "retail", 
    latitude: 47.6170, 
    longitude: -122.3430,
    rating: 4.5
  },
  { 
    id: 4, 
    name: "Medical Center", 
    type: "healthcare", 
    latitude: 47.6180, 
    longitude: -122.3440,
    rating: 4.6
  },
  { 
    id: 5, 
    name: "Suburb Market", 
    type: "retail", 
    latitude: 47.6270, 
    longitude: -122.3530,
    rating: 3.9
  }
];

describe('Spatial Analytics', () => {
  test('should identify value clusters correctly with spatial autocorrelation', () => {
    // Calculate spatial autocorrelation
    const autocorrelation = calculateSpatialAutocorrelation(mockSpatialProperties);
    
    // Should return a valid Moran's I value between -1 and 1
    expect(autocorrelation.moransI).toBeGreaterThan(-1);
    expect(autocorrelation.moransI).toBeLessThan(1);
    
    // Should indicate significant positive spatial autocorrelation (clustering)
    expect(autocorrelation.moransI).toBeGreaterThan(0.2);
    
    // Should have a p-value indicating significance
    expect(autocorrelation.pValue).toBeLessThan(0.05);
    
    // Should identify high-value clusters
    expect(autocorrelation.highValueClusters.length).toBeGreaterThan(0);
    
    // Downtown properties should be in high value cluster
    const downtownIds = mockSpatialProperties
      .filter(p => p.neighborhood === "Downtown" && parseFloat(p.value || "0") > 900000)
      .map(p => p.id);
    
    const highValueClusterIds = autocorrelation.highValueClusters.map(p => p.id);
    
    downtownIds.forEach(id => {
      expect(highValueClusterIds).toContain(id);
    });
    
    // Should identify low-value clusters
    expect(autocorrelation.lowValueClusters.length).toBeGreaterThan(0);
    
    // Suburb properties should be in low value cluster
    const suburbIds = mockSpatialProperties
      .filter(p => p.neighborhood === "Suburbs" && parseFloat(p.value || "0") < 500000)
      .map(p => p.id);
    
    const lowValueClusterIds = autocorrelation.lowValueClusters.map(p => p.id);
    
    suburbIds.forEach(id => {
      expect(lowValueClusterIds).toContain(id);
    });
  });

  test('should calculate appropriate heat map intensity', () => {
    // Generate heat map
    const heatmap = generateValueHeatmap(mockSpatialProperties);
    
    // Should return heat map points
    expect(heatmap.points.length).toBeGreaterThan(0);
    
    // Each point should have coordinates and intensity
    heatmap.points.forEach(point => {
      expect(point).toHaveProperty('lat');
      expect(point).toHaveProperty('lng');
      expect(point).toHaveProperty('intensity');
    });
    
    // Higher value properties should have higher intensity
    const downtown = mockSpatialProperties.filter(p => p.neighborhood === "Downtown");
    const suburbs = mockSpatialProperties.filter(p => p.neighborhood === "Suburbs");
    
    if (downtown.length > 0 && suburbs.length > 0) {
      const downtownAvgValue = downtown.reduce((sum, p) => sum + parseFloat(p.value || "0"), 0) / downtown.length;
      const suburbsAvgValue = suburbs.reduce((sum, p) => sum + parseFloat(p.value || "0"), 0) / suburbs.length;
      
      // Find intensity for these areas
      const downtownPoint = heatmap.points.find(p => 
        Math.abs(p.lat - downtown[0].latitude!) < 0.001 && 
        Math.abs(p.lng - downtown[0].longitude!) < 0.001
      );
      
      const suburbsPoint = heatmap.points.find(p => 
        Math.abs(p.lat - suburbs[0].latitude!) < 0.001 && 
        Math.abs(p.lng - suburbs[0].longitude!) < 0.001
      );
      
      if (downtownPoint && suburbsPoint && downtownAvgValue > suburbsAvgValue) {
        expect(downtownPoint.intensity).toBeGreaterThan(suburbsPoint.intensity);
      }
    }
  });

  test('should properly weight location factors in scoring', () => {
    // Calculate location scores
    const locationScores = calculateLocationScore(mockSpatialProperties, mockPOIs);
    
    // Should have scores for all properties
    expect(locationScores.length).toBe(mockSpatialProperties.length);
    
    // Properties closer to amenities should have higher scores
    const downtown = locationScores.filter(score => 
      mockSpatialProperties.find(p => p.id === score.propertyId)?.neighborhood === "Downtown"
    );
    
    const suburbs = locationScores.filter(score => 
      mockSpatialProperties.find(p => p.id === score.propertyId)?.neighborhood === "Suburbs"
    );
    
    if (downtown.length > 0 && suburbs.length > 0) {
      const downtownAvgScore = downtown.reduce((sum, s) => sum + s.totalScore, 0) / downtown.length;
      const suburbsAvgScore = suburbs.reduce((sum, s) => sum + s.totalScore, 0) / suburbs.length;
      
      // Downtown should have better location scores (more amenities nearby)
      expect(downtownAvgScore).toBeGreaterThan(suburbsAvgScore);
    }
    
    // School proximity should be a factor
    locationScores.forEach(score => {
      expect(score.factors).toContainEqual(expect.objectContaining({
        type: "school"
      }));
    });
  });

  test('should identify spatial outliers', () => {
    // Identify spatial outliers
    const outliers = identifySpatialOutliers(mockSpatialProperties);
    
    // Should identify outliers
    expect(outliers.length).toBeGreaterThan(0);
    
    // High value property in suburbs should be an outlier
    const luxuryInSuburbs = outliers.find(o => o.property.id === 10);
    expect(luxuryInSuburbs).toBeDefined();
    if (luxuryInSuburbs) {
      expect(luxuryInSuburbs.outlierType).toBe("high");
      expect(luxuryInSuburbs.zScore).toBeGreaterThan(2); // Should be significantly higher
    }
    
    // Low value property in downtown should be an outlier
    const bargainInDowntown = outliers.find(o => o.property.id === 11);
    expect(bargainInDowntown).toBeDefined();
    if (bargainInDowntown) {
      expect(bargainInDowntown.outlierType).toBe("low");
      expect(bargainInDowntown.zScore).toBeLessThan(-2); // Should be significantly lower
    }
  });
});