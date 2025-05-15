import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import spatialAnalysisService from '../spatialAnalysisService';

const { 
  calculateMoranI, 
  generateHeatmapData, 
  generateSpatialRegressionModel, 
  identifyPropertyClusters,
  getNeighborWeights
} = spatialAnalysisService;
import { Property } from '@shared/schema';

// Mock property data
const mockProperties: Property[] = [
  {
    id: 1, 
    parcelId: 'P001', 
    address: '100 Main St', 
    latitude: 46.2, 
    longitude: -119.1, 
    value: '250000', 
    yearBuilt: 1990, 
    squareFeet: 1800,
    propertyType: 'Residential',
    neighborhood: 'Downtown',
    owner: 'John Doe',
    salePrice: null,
    landValue: '80000',
    attributes: { buildingValue: '170000' },
    zoning: 'R1',
    taxAssessment: '230000',
    lotSize: 7500,
    bedrooms: 3,
    bathrooms: 2,
    stories: 1,
    parking: 'Garage',
    heatingCooling: 'Central'
  },
  {
    id: 2, 
    parcelId: 'P002', 
    address: '102 Main St', 
    latitude: 46.202, 
    longitude: -119.102, 
    value: '275000', 
    yearBuilt: 1995, 
    squareFeet: 2000,
    propertyType: 'Residential',
    neighborhood: 'Downtown',
    owner: 'Jane Smith',
    salePrice: null,
    landValue: '85000',
    attributes: { buildingValue: '190000' },
    zoning: 'R1',
    taxAssessment: '250000',
    lotSize: 8000,
    bedrooms: 3,
    bathrooms: 2,
    stories: 2,
    parking: 'Garage',
    heatingCooling: 'Central'
  },
  {
    id: 3, 
    parcelId: 'P003', 
    address: '200 Oak Ave', 
    latitude: 46.25, 
    longitude: -119.15, 
    value: '320000', 
    yearBuilt: 2000, 
    squareFeet: 2200,
    propertyType: 'Residential',
    neighborhood: 'North Side',
    owner: 'Robert Johnson',
    salePrice: null,
    landValue: '95000',
    attributes: { buildingValue: '225000' },
    zoning: 'R1',
    taxAssessment: '310000',
    lotSize: 9000,
    bedrooms: 4,
    bathrooms: 2.5,
    stories: 2,
    parking: 'Garage',
    heatingCooling: 'Central'
  },
  {
    id: 4, 
    parcelId: 'P004', 
    address: '210 Oak Ave', 
    latitude: 46.252, 
    longitude: -119.152, 
    value: '315000', 
    yearBuilt: 1998, 
    squareFeet: 2100,
    propertyType: 'Residential',
    neighborhood: 'North Side',
    owner: 'Mary Williams',
    salePrice: null,
    landValue: '92000',
    attributes: { buildingValue: '223000' },
    zoning: 'R1',
    taxAssessment: '305000',
    lotSize: 8500,
    bedrooms: 3,
    bathrooms: 2.5,
    stories: 2,
    parking: 'Garage',
    heatingCooling: 'Central'
  },
  {
    id: 5, 
    parcelId: 'P005', 
    address: '300 Pine St', 
    latitude: 46.18, 
    longitude: -119.2, 
    value: '195000', 
    yearBuilt: 1975, 
    squareFeet: 1600,
    propertyType: 'Residential',
    neighborhood: 'South Side',
    owner: 'David Brown',
    salePrice: null,
    landValue: '65000',
    attributes: { buildingValue: '130000' },
    zoning: 'R1',
    taxAssessment: '185000',
    lotSize: 7000,
    bedrooms: 3,
    bathrooms: 1.5,
    stories: 1,
    parking: 'Carport',
    heatingCooling: 'Central'
  }
];

// Mock amenities data for spatial regression
const mockAmenities = [
  { 
    id: 1, 
    name: 'Downtown Park', 
    type: 'park', 
    latitude: 46.21, 
    longitude: -119.11
  },
  { 
    id: 2, 
    name: 'Central Elementary', 
    type: 'school', 
    latitude: 46.22, 
    longitude: -119.13
  },
  { 
    id: 3, 
    name: 'Shopping Center', 
    type: 'shopping', 
    latitude: 46.20, 
    longitude: -119.12
  }
];

describe('Spatial Analysis Service', () => {
  describe('Neighbor Weight Calculation', () => {
    it('should calculate neighbor weights based on distance', () => {
      const weights = getNeighborWeights(mockProperties);
      
      // Expect 5 properties to have weight matrices
      expect(Object.keys(weights).length).toBe(5);
      
      // Each property should have weights to all other properties
      expect(Object.keys(weights['1']).length).toBe(4);
      
      // Closer properties should have higher weights
      // Properties 1 and 2 are closest to each other
      expect(weights['1']['2']).toBeGreaterThan(weights['1']['5']);
      
      // Weights should be symmetric
      expect(weights['1']['2']).toEqual(weights['2']['1']);
      
      // Weights should be between 0 and 1
      Object.values(weights).forEach(neighborWeights => {
        Object.values(neighborWeights).forEach(weight => {
          expect(weight).toBeGreaterThan(0);
          expect(weight).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('Moran\'s I Spatial Autocorrelation', () => {
    it('should calculate Moran\'s I in the range [-1, 1]', () => {
      const moranI = calculateMoranI(mockProperties, 'value');
      
      expect(moranI).not.toBeNull();
      expect(moranI.index).toBeGreaterThanOrEqual(-1);
      expect(moranI.index).toBeLessThanOrEqual(1);
      expect(moranI).toHaveProperty('pValue');
      expect(moranI).toHaveProperty('zScore');
    });

    it('should detect positive spatial autocorrelation in clustered data', () => {
      // Create clustered data with similar values close together
      const clusteredProperties = [...mockProperties];
      clusteredProperties[0].value = '300000';
      clusteredProperties[1].value = '310000';
      clusteredProperties[2].value = '180000';
      clusteredProperties[3].value = '190000';
      
      const moranI = calculateMoranI(clusteredProperties, 'value');
      
      // Positive value indicates clustering
      expect(moranI.index).toBeGreaterThan(0);
    });
    
    it('should handle different property attributes for analysis', () => {
      // Test with square feet instead of value
      const moranI = calculateMoranI(mockProperties, 'squareFeet');
      
      expect(moranI.index).toBeGreaterThanOrEqual(-1);
      expect(moranI.index).toBeLessThanOrEqual(1);
    });

    it('should throw an error for invalid properties or attributes', () => {
      expect(() => calculateMoranI([], 'value')).toThrow();
      expect(() => calculateMoranI(mockProperties, 'invalidAttribute' as any)).toThrow();
    });
  });

  describe('Heatmap Data Generation', () => {
    it('should generate valid heatmap intensity points', () => {
      const heatmapData = generateHeatmapData(mockProperties, 'value');
      
      expect(heatmapData.length).toBe(mockProperties.length);
      heatmapData.forEach(point => {
        expect(point).toHaveProperty('lat');
        expect(point).toHaveProperty('lng');
        expect(point).toHaveProperty('intensity');
        expect(typeof point.lat).toBe('number');
        expect(typeof point.lng).toBe('number');
        expect(typeof point.intensity).toBe('number');
        expect(point.intensity).toBeGreaterThan(0);
      });
    });

    it('should normalize intensity values', () => {
      const heatmapData = generateHeatmapData(mockProperties, 'value');
      
      // Find max intensity
      const maxIntensity = Math.max(...heatmapData.map(p => p.intensity));
      
      // All intensities should be normalized between 0 and 1
      heatmapData.forEach(point => {
        expect(point.intensity).toBeGreaterThanOrEqual(0);
        expect(point.intensity).toBeLessThanOrEqual(1);
      });
    });

    it('should generate different intensity values for different attributes', () => {
      const valueHeatmap = generateHeatmapData(mockProperties, 'value');
      const sqftHeatmap = generateHeatmapData(mockProperties, 'squareFeet');
      
      // The intensities should differ based on the attribute
      expect(valueHeatmap[0].intensity).not.toEqual(sqftHeatmap[0].intensity);
    });
  });

  describe('Property Cluster Identification', () => {
    it('should identify clusters of similar properties', () => {
      const clusters = identifyPropertyClusters(mockProperties, 'value', 0.1);
      
      expect(clusters.length).toBeGreaterThan(0);
      
      // Each cluster should have properties
      clusters.forEach(cluster => {
        expect(cluster.properties.length).toBeGreaterThan(0);
        expect(cluster).toHaveProperty('centroid');
        expect(cluster).toHaveProperty('averageValue');
      });
      
      // All properties should be assigned to a cluster
      const totalAssignedProperties = clusters.reduce(
        (total, cluster) => total + cluster.properties.length, 0
      );
      expect(totalAssignedProperties).toBe(mockProperties.length);
    });

    it('should adjust cluster count based on distance threshold', () => {
      // Smaller distance threshold should create more clusters
      const tightClusters = identifyPropertyClusters(mockProperties, 'value', 0.05);
      const looseClusters = identifyPropertyClusters(mockProperties, 'value', 0.2);
      
      expect(tightClusters.length).toBeGreaterThanOrEqual(looseClusters.length);
    });
  });

  describe('Spatial Regression Model', () => {
    it('should generate a regression model with distance coefficients', () => {
      const model = generateSpatialRegressionModel(mockProperties, mockAmenities);
      
      expect(model).toHaveProperty('coefficients');
      expect(model).toHaveProperty('r2');
      expect(model).toHaveProperty('adjustedR2');
      expect(model).toHaveProperty('standardError');
      
      // Model should include distance coefficients
      expect(model.coefficients).toHaveProperty('distanceToPark');
      expect(model.coefficients).toHaveProperty('distanceToSchool');
      expect(model.coefficients).toHaveProperty('distanceToShopping');
      
      // R-squared should be between 0 and 1
      expect(model.r2).toBeGreaterThanOrEqual(0);
      expect(model.r2).toBeLessThanOrEqual(1);
    });

    it('should make predictions based on the model', () => {
      const model = generateSpatialRegressionModel(mockProperties, mockAmenities);
      
      // Test property for prediction
      const testProperty = {
        latitude: 46.22,
        longitude: -119.14,
        squareFeet: 2000,
        yearBuilt: 2000
      };
      
      // Make prediction
      const prediction = model.predict(testProperty);
      
      expect(typeof prediction).toBe('number');
      expect(prediction).toBeGreaterThan(0);
    });

    it('should handle missing amenities', () => {
      const model = generateSpatialRegressionModel(mockProperties, []);
      
      // Model should still have basic coefficients, just not amenity distances
      expect(model).toHaveProperty('coefficients');
      expect(model.coefficients).toHaveProperty('squareFeet');
      expect(model.coefficients).toHaveProperty('yearBuilt');
      expect(model.coefficients).not.toHaveProperty('distanceToPark');
    });
  });
});