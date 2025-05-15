import { Property } from '../shared/schema';
import { 
  createPropertyClusters, 
  calculateClusterStatistics, 
  generateClusterColors
} from '../services/spatialClusteringService';

describe('Spatial Clustering', () => {
  // Sample properties for testing
  const sampleProperties: Property[] = [
    {
      id: 1,
      parcelId: "C0001",
      address: "123 Main St",
      value: "$250000",
      latitude: 40.7128,
      longitude: -74.0060,
      propertyType: "residential",
      yearBuilt: 1980,
      squareFeet: 1500
    },
    {
      id: 2,
      parcelId: "C0002",
      address: "456 Elm St",
      value: "$350000",
      latitude: 40.7138,
      longitude: -74.0070,
      propertyType: "residential",
      yearBuilt: 1990,
      squareFeet: 2000
    },
    {
      id: 3,
      parcelId: "C0003",
      address: "789 Oak St",
      value: "$450000",
      latitude: 40.7148,
      longitude: -74.0080,
      propertyType: "residential",
      yearBuilt: 2000,
      squareFeet: 2500
    },
    {
      id: 4,
      parcelId: "C0004",
      address: "321 Pine St",
      value: "$550000",
      latitude: 40.7158,
      longitude: -74.0090,
      propertyType: "residential",
      yearBuilt: 2010,
      squareFeet: 3000
    },
    {
      id: 5,
      parcelId: "C0005",
      address: "654 Maple St",
      value: "$650000",
      latitude: 40.7168,
      longitude: -74.0100,
      propertyType: "residential",
      yearBuilt: 2020,
      squareFeet: 3500
    }
  ];

  // Test cluster creation with valid properties
  test('should successfully create clusters with valid property data', () => {
    const clusters = createPropertyClusters(sampleProperties, 2);
    expect(clusters.length).toBe(2);
    expect(clusters.every(cluster => cluster.properties.length > 0)).toBe(true);
    expect(clusters[0].properties.length + clusters[1].properties.length).toBe(sampleProperties.length);
  });
  
  // Test with empty property set
  test('should handle empty property set gracefully', () => {
    const clusters = createPropertyClusters([], 3);
    expect(clusters.length).toBe(0);
  });
  
  // Test with properties missing coordinates
  test('should filter out properties without coordinates', () => {
    const propertiesWithMissingCoordinates = [
      ...sampleProperties,
      {
        id: 6,
        parcelId: "C0006",
        address: "987 Cedar St",
        value: "$550000",
        latitude: undefined,
        longitude: -74.0110,
        propertyType: "residential",
        yearBuilt: 2015,
        squareFeet: 3200
      },
      {
        id: 7,
        parcelId: "C0007",
        address: "753 Birch St",
        value: "$600000",
        latitude: 40.7188,
        longitude: undefined,
        propertyType: "residential",
        yearBuilt: 2018,
        squareFeet: 3300
      }
    ];
    
    const clusters = createPropertyClusters(propertiesWithMissingCoordinates, 2);
    const totalPropertiesInClusters = clusters.reduce(
      (sum, cluster) => sum + cluster.properties.length, 
      0
    );
    
    expect(totalPropertiesInClusters).toBe(sampleProperties.length);
  });
  
  // Test cluster statistics calculation
  test('should calculate correct statistics for each cluster', () => {
    const clusters = createPropertyClusters(sampleProperties, 2);
    const stats = calculateClusterStatistics(clusters[0]);
    
    expect(stats).toHaveProperty('avgValue');
    expect(stats).toHaveProperty('medianValue');
    expect(stats).toHaveProperty('avgSquareFeet');
    expect(stats).toHaveProperty('avgYearBuilt');
    expect(typeof stats.avgValue).toBe('number');
    expect(typeof stats.medianValue).toBe('number');
    expect(stats.avgValue).toBeGreaterThan(0);
  });
  
  // Test cluster color generation
  test('should generate distinct colors for clusters', () => {
    const clusterCount = 5;
    const colors = generateClusterColors(clusterCount);
    
    expect(colors.length).toBe(clusterCount);
    // Check that colors are unique
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(clusterCount);
    // Check color format (hex color code #RRGGBB)
    expect(colors[0]).toMatch(/^#[0-9A-F]{6}$/i);
  });
});